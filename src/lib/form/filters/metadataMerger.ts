/**
 * Dynamic Filters - Metadata Merger
 * 
 * Combines modelSchema, filterSchema, and savedFilters into a unified schema.
 */

import type { 
  UnifiedFilterSchema, 
  FilterableField, 
  FilterPreset, 
  DistinctField,
  RelationFilter,
  FieldGroup,
  FilterBaseType,
  FilterUIHints,
  FilterOperator,
} from "./types";

interface ModelSchemaResponse {
  modelSchema: {
    app: string;
    model: string;
    verboseName: string;
    verboseNamePlural: string;
    fields: any[];
    relationships: any[];
    filterConfig: any;
    relationFilters: any[];
    fieldGroups: any[];
  };
}

interface FilterSchemaResponse {
  filterSchema: Array<{
    fieldName: string;
    fieldLabel: string;
    baseType: string;
    isNested: boolean;
    relatedModel?: string;
    filterInputType: string;
    availableOperators: string[];
    options: any[];
  }>;
}

interface SavedFiltersResponse {
  savedFilters: Array<{
    id: string;
    name: string;
    description?: string;
    filterJson: string;
    isShared: boolean;
    createdBy?: { id: string; username: string };
    useCount: number;
    lastUsedAt?: string;
  }>;
}

/**
 * Merge metadata from modelSchema, filterSchema, and savedFilters
 * into a unified schema for the filter UI.
 */
export function mergeFilterMetadata(
  modelSchemaData: ModelSchemaResponse,
  filterSchemaData: FilterSchemaResponse,
  savedFiltersData: SavedFiltersResponse | null,
  options: { maxDepth?: number } = {}
): UnifiedFilterSchema {
  const { modelSchema } = modelSchemaData;
  const { filterSchema } = filterSchemaData;
  const savedFilters = savedFiltersData?.savedFilters ?? [];

  // Build field lookup from modelSchema for enrichment
  const fieldLookup = new Map(
    modelSchema.fields.map((f) => [f.name, f])
  );
  const relationLookup = new Map(
    modelSchema.relationships.map((r) => [r.name, r])
  );

  // Merge filter fields with model field details
  const fields: FilterableField[] = filterSchema.map((filter) => {
    const modelField = fieldLookup.get(filter.fieldName);
    const relation = relationLookup.get(filter.fieldName);

    return {
      fieldName: filter.fieldName,
      fieldLabel: filter.fieldLabel,
      helpText: modelField?.helpText,
      baseType: normalizeBaseType(filter.baseType),
      graphqlType: modelField?.graphqlType ?? filter.baseType,
      filterInputType: filter.filterInputType,
      operators: filter.options.map((opt) => ({
        name: opt.name,
        label: opt.label,
        helpText: opt.helpText,
        graphqlType: opt.graphqlType,
        isList: opt.isList ?? false,
        choices: opt.choices,
      })),
      defaultOperator: selectDefaultOperator(filter.baseType, filter.options),
      choices: modelField?.choices,
      isRelation: filter.isNested,
      relationConfig: relation ? {
        relatedApp: relation.relatedApp,
        relatedModel: relation.relatedModel,
        lookupField: relation.lookupField,
        searchFields: relation.searchFields ?? [],
      } : undefined,
      uiHints: buildUIHints(filter, modelField),
      group: findFieldGroup(filter.fieldName, modelSchema.fieldGroups),
    };
  });

  // Build relation filters with nested schema support
  const relationFilters: RelationFilter[] = modelSchema.relationFilters.map((rf: any) => {
    const relation = relationLookup.get(rf.relationName);
    return {
      fieldName: rf.relationName,
      fieldLabel: relation?.verboseName ?? rf.relationName,
      relationType: rf.relationType,
      relatedApp: relation?.relatedApp ?? "",
      relatedModel: relation?.relatedModel ?? "",
      nestedFilterType: rf.nestedFilterType,
      supportsDirectFilter: rf.relationType === "FOREIGN_KEY" || rf.relationType === "ONE_TO_ONE",
      supportsSome: rf.supportsSome,
      supportsEvery: rf.supportsEvery,
      supportsNone: rf.supportsNone,
      supportsCount: rf.supportsCount,
      supportsIsNull: rf.relationType === "FOREIGN_KEY",
      nestedSchema: undefined, // Populated by recursive fetch if needed
    };
  });

  // Combine all presets
  const presets: FilterPreset[] = [
    // Static presets from model definition
    ...(modelSchema.filterConfig?.presets ?? []).map((p: any) => ({
      id: `static_${p.name}`,
      name: p.name,
      description: p.description,
      filterJson: typeof p.filterJson === "string" ? JSON.parse(p.filterJson) : p.filterJson,
      source: "static" as const,
    })),
    // User's saved filters
    ...savedFilters.map((sf) => ({
      id: sf.id,
      name: sf.name,
      description: sf.description,
      filterJson: typeof sf.filterJson === "string" ? JSON.parse(sf.filterJson) : sf.filterJson,
      source: sf.isShared ? "shared" as const : "saved" as const,
      createdBy: sf.createdBy,
      isShared: sf.isShared,
      useCount: sf.useCount,
      lastUsedAt: sf.lastUsedAt,
    })),
  ];

  // Build distinct fields (orderable fields are typically distinct-able)
  const distinctFields: DistinctField[] = modelSchema.fields
    .filter((f: any) => !f.isRelation && !f.isJson && (f.isIndexed || f.name === "id"))
    .map((f: any) => ({
      fieldName: f.name,
      fieldLabel: f.verboseName,
      fieldType: f.graphqlType,
      requiresOrderBy: true, // PostgreSQL DISTINCT ON requires matching ORDER BY prefix
    }));

  return {
    app: modelSchema.app,
    model: modelSchema.model,
    verboseName: modelSchema.verboseName,
    verboseNamePlural: modelSchema.verboseNamePlural,
    config: {
      inputTypeName: modelSchema.filterConfig?.inputTypeName ?? `${modelSchema.model}WhereInput`,
      supportsAnd: modelSchema.filterConfig?.supportsAnd ?? true,
      supportsOr: modelSchema.filterConfig?.supportsOr ?? true,
      supportsNot: modelSchema.filterConfig?.supportsNot ?? true,
      supportsFts: modelSchema.filterConfig?.supportsFts ?? false,
      supportsAggregation: modelSchema.filterConfig?.supportsAggregation ?? false,
      supportsDistinct: distinctFields.length > 0,
    },
    fields,
    relationFilters,
    presets,
    distinctFields,
    fieldGroups: modelSchema.fieldGroups ?? [],
  };
}

function normalizeBaseType(baseType: string): FilterBaseType {
  const mapping: Record<string, FilterBaseType> = {
    "String": "String",
    "Number": "Number",
    "Int": "Number",
    "Float": "Number",
    "Boolean": "Boolean",
    "Date": "Date",
    "DateTime": "DateTime",
    "Relationship": "Relationship",
    "JSON": "JSON",
  };
  return mapping[baseType] ?? "String";
}

function selectDefaultOperator(baseType: string, options: any[]): string {
  const preferred: Record<string, string[]> = {
    String: ["icontains", "contains", "eq"],
    Number: ["eq", "gte", "lte"],
    Boolean: ["eq"],
    Date: ["eq", "gte", "between"],
    DateTime: ["gte", "eq", "between"],
    Relationship: ["eq"],
    JSON: ["hasKey", "contains"],
  };
  const prefs = preferred[baseType] ?? ["eq"];
  const available = options.map((o) => o.name);
  return prefs.find((p) => available.includes(p)) ?? available[0] ?? "eq";
}

function buildUIHints(filter: any, modelField: any): FilterUIHints {
  const baseType = filter.baseType;
  const hints: FilterUIHints = {
    widget: "text",
    allowClear: true,
  };

  if (modelField?.choices?.length > 0) {
    hints.widget = "select";
  } else if (baseType === "Number" || baseType === "Int" || baseType === "Float") {
    hints.widget = "number";
    if (modelField?.minValue != null) hints.minValue = modelField.minValue;
    if (modelField?.maxValue != null) hints.maxValue = modelField.maxValue;
  } else if (baseType === "Boolean") {
    hints.widget = "checkbox";
  } else if (baseType === "Date") {
    hints.widget = "date";
    hints.dateFormat = "yyyy-MM-dd";
  } else if (baseType === "DateTime") {
    hints.widget = "datetime";
    hints.dateFormat = "yyyy-MM-dd HH:mm";
  } else if (baseType === "Relationship") {
    hints.widget = "combobox";
  } else if (baseType === "JSON") {
    hints.widget = "json";
  }

  return hints;
}

function findFieldGroup(fieldName: string, groups: any[]): string | undefined {
  for (const group of groups ?? []) {
    if (group.fields?.includes(fieldName)) {
      return group.key;
    }
  }
  return undefined;
}
