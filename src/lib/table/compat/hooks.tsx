// useGraphQLModelTable.tsx
import { useState, useMemo, useEffect } from "react";
import {
  gql,
  useQuery,
} from "@apollo/client";
import {
  useReactTable,
  getCoreRowModel,
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  PaginationState,
  VisibilityState,
} from "@tanstack/react-table";
import {
  TableFieldMetadataType,
  ComplexFilterInput,
  type ModelTableFiltersOptions,
  ModelTableMetadataV2,
} from "./types";
import { useModelMetadata } from "@/lib/metadata/hooks";
import type { ModelMetadata } from "@/lib/metadata/types";
import { DEFAULT_PAGINATION_ORDERING } from "@/graphql/queries";
import type {
  FilterBaseType,
  FilterableField,
  FilterPreset,
  UnifiedFilterSchema,
  DistinctField,
  RelationFilter,
  FieldGroup,
} from "@/lib/filters/types";

/* ----------------------------
   ⚡ Complete V2 Metadata Query
   ---------------------------- */
// Replaced by @/lib/metadata/hooks

/**
 * Convert V2 metadata to ModelTableMetadataV2 format
 */
function normalizeBaseType(baseType: string): FilterBaseType {
  const normalized = baseType.toLowerCase();
  if (normalized.includes("string") || normalized.includes("char") || normalized.includes("text")) {
    return "String";
  }
  if (normalized.includes("int") || normalized.includes("float") || normalized.includes("decimal")) {
    return "Number";
  }
  if (normalized.includes("bool")) {
    return "Boolean";
  }
  if (normalized.includes("date") && !normalized.includes("time")) {
    return "Date";
  }
  if (normalized.includes("datetime") || normalized.includes("time")) {
    return "DateTime";
  }
  if (normalized.includes("json")) {
    return "JSON";
  }
  return "Relationship";
}

function safeParseUnknown(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

/**
 * Map V2 metadata response to ModelTableMetadataV2 type
 * Maps camelCase API response to internal types (which may use snake_case keys like field_type)
 */
export function mapV2MetadataToTableMetadata(
  modelSchema: ModelMetadata
): ModelTableMetadataV2 {
  // modelSchema is now the direct ModelMetadata object, not { modelSchema, filterSchema } response
  // We need to extract filterSchema from modelSchema.filters

  return {
    metadataVersion: "v2",
    app: modelSchema.app,
    model: modelSchema.model,
    verboseName: modelSchema.verboseName,
    verboseNamePlural: modelSchema.verboseNamePlural,
    tableName: `${modelSchema.app}_${modelSchema.model.toLowerCase()}`,
    primaryKey: modelSchema.primaryKey ?? "id",
    ordering: modelSchema.ordering ?? [],
    defaultOrdering:
      modelSchema.ordering && modelSchema.ordering.length > 0
        ? modelSchema.ordering
        : [...DEFAULT_PAGINATION_ORDERING],
    managers: [],
    managed: true,
    fields: modelSchema.fields.map((f) => ({
      name: f.name,
      accessor: f.name,
      display: f.name,
      editable: f.editable,
      field_type: f.fieldType as any,
      filterable: true,
      sortable: true,
      title: f.verboseName,
      helpText: f.helpText ?? "",
      is_property: !f.isRelation,
      is_related: f.isRelation,
      permissions: {
        can_read: modelSchema.permissions.canList ?? true, // Fallback/Check logic
        can_write: modelSchema.permissions.canUpdate,
        visibility: f.visibility as any,
        access_level: "full",
      },
    })),
    relationships: modelSchema.relationships.map(r => ({
       name: r.name,
       verboseName: r.verboseName,
       relatedApp: r.relatedApp,
       relatedModel: r.relatedModel,
       relationType: r.relationType,
       isToMany: r.isToMany,
       lookupField: r.lookupField,
       searchFields: r.searchFields ?? [],
    })),
    mutations: modelSchema.mutations.map((m) => ({
      name: m.name,
      method_name: m.methodName,
      description: m.description,
      input_fields: m.inputFields.map((input) => ({
        name: input.name,
        field_type: input.fieldType,
        required: input.required,
        default_value: input.defaultValue,
        description: input.description,
        choices: (input.choices ?? []).map((choice) => ({
          ...(choice as unknown as Record<string, unknown>),
        })),
        validation_rules: input.validationRules,
        widget_type: input.widgetType,
        placeholder: input.placeholder,
        help_text: input.helpText,
        min_length: input.minLength,
        max_length: input.maxLength,
        min_value: input.minValue,
        max_value: input.maxValue,
        pattern: input.pattern,
        related_model: input.relatedModel,
        multiple: input.multiple,
      })),
      requires_authentication: m.requiresAuthentication ?? false,
      required_permissions: m.requiredPermissions ?? [],
      mutation_type: m.mutationType ?? "custom",
      model_name: m.modelName,
      form_config:
        typeof m.formConfig === "string"
          ? (safeParseUnknown(m.formConfig) as Record<string, unknown> | null)
          : ((m.formConfig as Record<string, unknown> | null | undefined) ??
            null),
      validation_schema: null,
      success_message: m.successMessage,
      error_messages: m.errorMessages ?? null,
      action:
        typeof m.action === "string"
          ? (safeParseUnknown(m.action) as Record<string, unknown> | null)
          : ((m.action as Record<string, unknown> | null | undefined) ?? null),
    })),
    templates: (modelSchema.templates ?? []).map((t) => ({
      key: t.key,
      methodName: t.key.split(":").pop() ?? "",
      title: t.title,
      endpoint: t.endpoint,
      urlPath: t.urlPath ?? "",
      guard: t.guard,
      requireAuthentication: t.requireAuthentication ?? false,
      roles: t.roles ?? [],
      permissions: t.permissions ?? [],
      allowed: t.allowed ?? false,
      denialReason: t.denialReason,
      allowClientData: t.allowClientData,
      clientDataFields: t.clientDataFields,
      clientDataSchema:
        typeof t.clientDataSchema === "string"
          ? ((safeParseUnknown(t.clientDataSchema) as Array<{
              name: string;
              type?: string | null;
            }> | null) ?? null)
          : ((t.clientDataSchema as Array<{
              name: string;
              type?: string | null;
            }> | null | undefined) ?? null),
    })),
    permissions: {
      can_create: modelSchema.permissions.canCreate,
      can_update: modelSchema.permissions.canUpdate,
      can_delete: modelSchema.permissions.canDelete,
      can_read: modelSchema.permissions.canRetrieve,
      can_list: modelSchema.permissions.canList,
      can_history: modelSchema.permissions.canHistory ?? false,
      reasons: typeof modelSchema.permissions.denialReasons === "string" 
        ? JSON.parse(modelSchema.permissions.denialReasons) 
        : modelSchema.permissions.denialReasons,
    },
    filterConfig: modelSchema.filterConfig as any, // Cast due to strict type matching if needed
    relationFilters: (modelSchema.relationFilters ?? []).map(rf => ({
        relationName: rf.relationName ?? rf.name ?? rf.fieldName ?? "",
        relationType: rf.relationType,
        supportsSome: rf.supportsSome,
        supportsEvery: rf.supportsEvery,
        supportsNone: rf.supportsNone,
        supportsCount: rf.supportsCount,
        nestedFilterType: rf.nestedFilterType ?? "",
    })),
    fieldGroups: (modelSchema.fieldGroups ?? []).map(fg => ({
        key: fg.key,
        label: fg.label,
        description: fg.description,
        fields: fg.fields,
        collapsed: fg.collapsed
    })),
    filterSchema: modelSchema.filters.map(f => ({
        fieldName: f.fieldName,
        fieldLabel: f.fieldLabel,
        baseType: f.baseType ?? "String",
        isNested: f.isNested,
        relatedModel: f.relatedModel,
        filterInputType: f.filterInputType ?? "",
        availableOperators: f.availableOperators ?? [],
        options: f.options.map(o => ({
            name: o.name,
            lookup: o.lookup,
            label: o.label,
            helpText: o.helpText,
            choices: o.choices?.map(c => ({ value: c.value, label: c.label })),
            graphqlType: o.graphqlType ?? "String",
            isList: o.isList ?? false
        }))
    })),
    // Map to legacy filters format
    filters: modelSchema.filters.map(f => ({
        field_name: f.fieldName,
        field_label: f.fieldLabel,
        is_nested: f.isNested,
        related_model: f.relatedModel,
        is_custom: false, // Default
        options: f.options.map(o => ({
            name: o.name,
            lookup_expr: o.lookup as any, // Cast to specific string literal if needed
            help_text: o.helpText ?? "",
            filter_type: "CharFilter", // Approximate/Default
            choices: o.choices?.map(c => ({ value: c.value, label: c.label }))
        }))
    })),
    // Map to legacy pdfTemplates
    pdfTemplates: (modelSchema.templates ?? []).map((t) => ({
      key: t.key,
      methodName: t.key.split(":").pop() ?? "",
      title: t.title,
      endpoint: t.endpoint,
      urlPath: t.urlPath ?? "",
      guard: t.guard,
      requireAuthentication: t.requireAuthentication ?? false,
      roles: t.roles ?? [],
      permissions: t.permissions ?? [],
      allowed: t.allowed ?? false,
      denialReason: t.denialReason,
      allowClientData: t.allowClientData,
      clientDataFields: t.clientDataFields,
      clientDataSchema:
        typeof t.clientDataSchema === "string"
          ? ((safeParseUnknown(t.clientDataSchema) as Array<{
              name: string;
              type?: string | null;
            }> | null) ?? null)
          : ((t.clientDataSchema as Array<{
              name: string;
              type?: string | null;
            }> | null | undefined) ?? null),
    })),
  };
}

/**
 * Map table metadata to UnifiedFilterSchema for FilterPanel
 */
export function mapTableMetadataToFilterSchema(
  metadata: ModelTableMetadataV2 | null
): UnifiedFilterSchema | null {
  if (!metadata) return null;
  const filterConfig = metadata.filterConfig ?? {
    inputTypeName: "",
    supportsAnd: true,
    supportsOr: true,
    supportsNot: true,
    supportsFts: false,
    supportsAggregation: false,
  };

  const filterableFields: FilterableField[] = metadata.filterSchema.map(
    (field) => ({
      name: field.fieldName,
      fieldName: field.fieldName,
      fieldLabel: field.fieldLabel,
      helpText: undefined,
      baseType: normalizeBaseType(field.baseType),
      graphqlType: field.options[0]?.graphqlType ?? "String",
      filterInputType: field.filterInputType,
      operators: field.availableOperators.map((op) => ({
        name: op,
        label: op,
        helpText: undefined,
        graphqlType: field.options[0]?.graphqlType ?? "String",
        isList: field.options[0]?.isList ?? false,
        choices: field.options[0]?.choices?.map((c) => ({
          value: c.value,
          label: c.label,
        })),
      })),
      defaultOperator: field.availableOperators[0] ?? "eq",
      choices: field.options[0]?.choices?.map((c) => ({
        value: c.value,
        label: c.label,
      })),
      isRelation: field.isNested,
      relationConfig: field.isNested && field.relatedModel ? {
        relatedApp: "",
        relatedModel: field.relatedModel,
        lookupField: "id",
        searchFields: [],
      } : undefined,
      uiHints: {
        widget: field.baseType.toLowerCase(),
      },
      group: undefined,
    })
  );

  const presets: FilterPreset[] = metadata.filterConfig.presets?.map((p) => ({
    id: p.name,
    name: p.name,
    description: p.description,
    filterJson: p.filterJson,
    source: "static",
  })) ?? [];

  // Map distinct fields based on filterable fields
  // In a real implementation, this might be filtered by specific criteria (e.g. isIndexed)
  const distinctFields: DistinctField[] = filterableFields.map(field => ({
    name: field.name,
    fieldName: field.fieldName,
    fieldLabel: field.fieldLabel,
    fieldType: field.baseType,
    requiresOrderBy: false
  }));

  const relationFilters: RelationFilter[] = metadata.relationFilters.map((rf) => {
    const relationRecord = rf as any;
    const relationName =
      relationRecord.relationName ?? relationRecord.name ?? relationRecord.fieldName ?? "";
    return {
    name: relationName,
    fieldName: relationName,
    fieldLabel: relationName,
    relationType: rf.relationType as "FOREIGN_KEY" | "MANY_TO_MANY" | "REVERSE_FK" | "ONE_TO_ONE",
    relatedApp: "",
    relatedModel: "",
    nestedFilterType: rf.nestedFilterType,
    supportsDirectFilter: false,
    supportsSome: rf.supportsSome,
    supportsEvery: rf.supportsEvery,
    supportsNone: rf.supportsNone,
    supportsCount: rf.supportsCount,
    supportsIsNull: false,
  };
  });

  const fieldGroups: FieldGroup[] = metadata.fieldGroups;

  return {
    app: metadata.app,
    model: metadata.model,
    verboseName: metadata.verboseName,
    verboseNamePlural: metadata.verboseNamePlural,
    config: {
      inputTypeName: filterConfig.inputTypeName,
      supportsAnd: filterConfig.supportsAnd,
      supportsOr: filterConfig.supportsOr,
      supportsNot: filterConfig.supportsNot,
      supportsFts: filterConfig.supportsFts,
      supportsAggregation: filterConfig.supportsAggregation,
      supportsDistinct: false,
    },
    fields: filterableFields,
    presets,
    distinctFields,
    relationFilters,
    fieldGroups,
  };
}

/**
 * Loads table metadata using V2 API.
 * Replaces the legacy multi-stage loader.
 */
export function useModelTableMetadata(
  appName: string,
  modelName: string,
  filtersOptions?: ModelTableFiltersOptions,
  options?: { skip?: boolean }
) {
  void filtersOptions;
  // Use the new hook from @/lib/metadata/hooks
  const { metadata, loading, error, refetch } = useModelMetadata(
    appName,
    modelName,
    options
  );

  const mappedMetadata = useMemo(() => {
    if (!metadata) return null;
    return mapV2MetadataToTableMetadata(metadata);
  }, [metadata]);

  const mappedRefetch = useMemo(
    () => async () => {
      const refreshed = await refetch();
      if (!refreshed) return null;
      return mapV2MetadataToTableMetadata(refreshed);
    },
    [refetch],
  );

  return {
    metadata: mappedMetadata,
    loading,
    error,
    refetch: mappedRefetch,
    loadingFilters: false,
    loadingMutations: false,
    loadingPdfTemplates: false,
  };
}

type DataQueryOptions = {
  fieldName?: string;
  includeQuickArgument?: boolean;
  filterTypeName?: string;
};

type SelectionBuilderArgs = {
  fields: TableFieldMetadataType[];
  excludeColumns: string[];
  filters: any[];
  additionalSelectionFields?: string[];
};

const buildSelectionSet = ({
  fields,
  excludeColumns,
  filters,
  additionalSelectionFields = [],
}: SelectionBuilderArgs): string => {
  const choiceFields = new Set<string>();
  filters.forEach((filter) => {
    if (
      filter.options?.some((opt: any) => opt.choices && opt.choices.length > 0)
    ) {
      choiceFields.add(filter.field_name);
    }
  });

  const isChoiceFieldType = (typeName?: string) => {
    if (!typeName) return false;
    const normalized = typeName.toLowerCase();
    return (
      normalized.includes("choice") ||
      normalized.includes("enum") ||
      normalized.includes("fsm")
    );
  };

  const filteredFields = fields.filter((f) => !excludeColumns.includes(f.name));
  const fieldSelections = filteredFields.map((f) => {
    if (f.is_related) {
      return `${f.name} { id desc }`;
    }
    const needsChoiceDescription =
      choiceFields.has(f.name) || isChoiceFieldType(f.field_type);
    if (needsChoiceDescription) {
      return `${f.name}\n${f.name}_desc`;
    }
    return f.name;
  });

  return ["id", "desc", ...fieldSelections, ...additionalSelectionFields].join(
    "\n"
  );
};

/**
 * Normalizes ordering payloads into a trimmed string array.
 */
const normalizeOrderingInput = (
  ordering?: string | string[]
): string[] => {
  if (Array.isArray(ordering)) {
    return ordering
      .map((entry) => (typeof entry === "string" ? entry.trim() : ""))
      .filter((entry): entry is string => Boolean(entry));
  }
  if (typeof ordering === "string") {
    const trimmed = ordering.trim();
    return trimmed ? [trimmed] : [];
  }
  return [];
};

/**
 * Guarantees a non-empty ordering payload, defaulting to newest-first.
 */
const resolveOrderingWithDefault = (
  ordering?: string | string[]
): string[] => {
  const normalized = normalizeOrderingInput(ordering);
  if (normalized.length > 0) return normalized;
  return [...DEFAULT_PAGINATION_ORDERING];
};

/* ----------------------------
   ⚙️ Helper: Build Data Query
----------------------------- */
function buildAutoDataQuery(
  modelName: string,
  fields: TableFieldMetadataType[],
  excludeColumns: string[],
  filters: any[] = [],
  customSelection?: string,
  additionalSelectionFields: string[] = [],
  options?: DataQueryOptions
) {
  // Use camelCase convention for field name (e.g. Products -> products)
  // rail-django auto_camelcase converts models to snake_case first, then camelCase.
  // BUT the root query field usually matches the model name in plural.
  // If model is "Product", query is "products".
  // If fieldName override is provided, use it.
  // We assume default query name is `camelCase(plural(modelName))`.
  // The backend might expose `products` or `products_pages`.
  // Since pagination is standard, `products` (list) with pagination args is expected if Relay is off?
  // The provided context says "Fixed issue where root query fields were PascalCase... instead of camelCase".
  // So query name should be camelCase.
  // We construct it roughly.
  
  const defaultQueryName = options?.fieldName ?? (() => {
    // Basic pluralization
    const lower = modelName.toLowerCase();
    const plural = lower.endsWith("s") ? lower : `${lower}s`;
    return plural;
  })();
  
  const queryName = defaultQueryName.replace(/[^a-zA-Z0-9_]/g, "_");
  const fieldName = defaultQueryName;
  const includeQuick = options?.includeQuickArgument ?? true;

  const typeName = 
    options?.filterTypeName ??
    `${modelName.charAt(0).toUpperCase() + modelName.slice(1)}ComplexFilter`;

  const selection = 
    customSelection ??
    buildSelectionSet({
      fields,
      excludeColumns,
      filters,
      additionalSelectionFields,
    });

  const quickVariable = includeQuick ? ", $quick:String" : "";
  const quickArgument = includeQuick ? ",quick:$quick" : "";

  return gql`
    query ${queryName}($filters: ${typeName}, $ordering: [String], $page: Int, $perPage: Int${quickVariable}, $presets: [String], $distinctOn: [String]) {
      ${fieldName}(filters: $filters, orderBy: $ordering, page: $page, perPage: $perPage${quickArgument}, presets: $presets, distinctOn: $distinctOn) {
        pageInfo {
          totalCount
          pageCount
          currentPage
          perPage
          hasNextPage
          hasPreviousPage
        }
        items {
          ${selection}
        }
      }
    }
  `;
}

const buildInitialSortingState = (
  orderBy?: string | string[]
): SortingState => {
  const entries = normalizeOrderingInput(orderBy);
  if (entries.length === 0) return [];
  return entries
    .map((entry) => {
      const isDesc = entry.startsWith("-");
      const id = isDesc ? entry.slice(1) : entry;
      return { id, desc: isDesc };
    })
    .filter((entry) => Boolean(entry.id));
};

/* ----------------------------
   ⚡ Hook: useGraphQLModelTable
---------------------------- */
export function useGraphQLModelTable({
  appName,
  modelName,
  filtersOptions,
  excludeColumns = [],
  overrideColumns = {},
  appendColumns = [],
  customItems = null,
  initVariables = {},
  initialPageSize = 12,
  onQueryBuilt,
  customSelection,
  additionalSelectionFields = [],
  queryOptions,
  skip = false,
}: {
  appName: string;
  modelName: string;
  filtersOptions?: ModelTableFiltersOptions;
  excludeColumns?: string[];
  overrideColumns?: Record<string, Partial<ColumnDef<any>>>;
  appendColumns?: ColumnDef<any>[];
  customItems?: any[] | null;
  initVariables?: {
    filters?: Record<string, any>;
    per_page?: number;
    page?: number;
    order_by?: string | string[];
  };
  initialPageSize?: number;
  customSelection?: string;
  onQueryBuilt?: (query: string) => void;
  additionalSelectionFields?: string[];
  queryOptions?: DataQueryOptions & { responseKey?: string };
  skip?: boolean;
}) {
  /* --- 1. Fetch metadata --- */
  const {
    metadata: modelMeta,
    loading: metaLoading,
    error: metaError,
    loadingFilters: metaFiltersLoading,
    loadingMutations: metaMutationsLoading,
    loadingPdfTemplates: metaTemplatesLoading,
  } = useModelTableMetadata(appName, modelName, filtersOptions, { skip });
  
  const fields = useMemo(() => modelMeta?.fields ?? [], [modelMeta]);
  const filters = useMemo(() => modelMeta?.filters ?? [], [modelMeta]);
  
  const metadataLoadingState = useMemo(
    () => ({
      base: metaLoading,
      filters: metaFiltersLoading,
      mutations: metaMutationsLoading,
      pdfTemplates: metaTemplatesLoading,
    }),
    [
      metaFiltersLoading,
      metaLoading,
      metaMutationsLoading,
      metaTemplatesLoading,
    ]
  );

  /* --- 2. Table state --- */
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const initialOrdering = useMemo(
    () => resolveOrderingWithDefault(initVariables?.order_by),
    [initVariables?.order_by]
  );
  const [sorting, setSorting] = useState<SortingState>(() =>
    buildInitialSortingState(initialOrdering)
  );
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [quick, setQuick] = useState<string>("");
  const [advancedFilters,
    setAdvancedFilters] = useState<ComplexFilterInput<string> | null>(null);
  const [presets, setPresets] = useState<string[]>([]);
  const [distinctOn, setDistinctOn] = useState<string[]>([]);

  useEffect(() => {
    if (!fields.length) return;
    setColumnVisibility((prev) => {
      let changed = false;
      const next: VisibilityState = { ...prev };
      const hideByDefault = new Set(["DateTimeField", "TextField"]);
      fields.forEach((field) => {
        if (
          hideByDefault.has(field.field_type ?? "") &&
          next[field.name] === undefined
        ) {
          next[field.name] = false;
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, [fields]);

  /* --- 3. Build GraphQL Query --- */
  const includeQuickArgument = queryOptions?.includeQuickArgument ?? true;
  const responseKey = 
    queryOptions?.responseKey ??
    queryOptions?.fieldName ??
    (function autoResolveKey() {
      // Logic duplicated from buildAutoDataQuery for consistency
      const lower = modelName.toLowerCase();
      return lower.endsWith("s") ? lower : `${lower}s`;
    })();

  const dataQuery = useMemo(() => {
    if (!fields.length) return null;
    const q = buildAutoDataQuery(
      modelName,
      fields,
      excludeColumns,
      filters,
      customSelection,
      additionalSelectionFields,
      queryOptions
    );
    if (onQueryBuilt) onQueryBuilt(q.loc?.source.body ?? "");
    return q;
  }, [
    fields,
    modelName,
    excludeColumns,
    filters,
    customSelection,
    additionalSelectionFields,
    queryOptions,
    onQueryBuilt,
  ]);

  /* --- 4. Filters Payload --- */
  const filtersPayload = useMemo(() => {
    // Build an array of per-column filters (as the API expects)
    const and = columnFilters
      .filter((f: any) => f.value)
      .map((f: any) => {
        // Support "field__lookup" syntax
        const [field, lookup] = f.id.split("__");
        // Field name is likely already camelCase if metadata is camelCase
        return {
          [field]: { [lookup || "icontains"]: f.value },
        } as ComplexFilterInput<string>;
      });

    const parts: ComplexFilterInput<string>[] = [];

    // Include advanced (manually constructed) filters when present
    if (advancedFilters) {
      parts.push(advancedFilters);
    }

    // Include column filters when present
    if (and.length) {
      const columnFiltersPayload =
        and.length === 1
          ? and[0]
          : ({ AND: and } as ComplexFilterInput<string>);
      parts.push(columnFiltersPayload);
    }

    // If no parts built from UI state, fallback to initVariables.filters
    if (parts.length === 0) {
      return (
        initVariables?.filters ??
        null
      ) as ComplexFilterInput<string> | null;
    }

    // If only one part, return it directly; otherwise combine with AND
    if (parts.length === 1) {
      if (initVariables?.filters) {
        return {
          AND: [parts[0], initVariables.filters],
        } as ComplexFilterInput<string>;
      }
      return parts[0];
    }

    if (initVariables?.filters) {
      parts.push(initVariables.filters as ComplexFilterInput<string>);
    }
    return { AND: parts } as ComplexFilterInput<string>;
  }, [columnFilters, initVariables, advancedFilters]);

  /* --- 5. Ordering Payload --- */
  const orderingPayload = useMemo(() => {
    if (sorting.length === 0) return initialOrdering;
    return sorting.map((s) => (s.desc ? `-${s.id}` : s.id));
  }, [sorting, initialOrdering]);

  /* --- 6. Fetch Data (or use custom items) --- */
  const {
    data: tableData,
    loading: tableLoading,
    error: tableError,
    refetch,
  } = useQuery(
    dataQuery ??
      gql`
        query {
          dummy
        }
      `,
    {
      skip: skip || !dataQuery || !!customItems,
      initialFetchPolicy: "cache-and-network",
      variables: {
        ...initVariables,
        filters: filtersPayload,
        ordering: orderingPayload,
        page: pageIndex + 1,
        perPage: pageSize, // camelCase
        presets,
        distinctOn, // camelCase
        ...(includeQuickArgument ? { quick } : {}),
      },
      // Prefer cache-first to avoid unnecessary network calls that can cause latency
      fetchPolicy: "cache-first",
      nextFetchPolicy: "cache-first",
      // Reduce re-renders during background fetches
      notifyOnNetworkStatusChange: false,
      returnPartialData: true,
    }
  );

  const rawPageInfo = tableData?.[responseKey]?.pageInfo;
  
  const pageInfo = customItems
    ? {
        total_count: customItems.length,
        page_count: 1,
        current_page: 1,
        per_page: customItems.length,
        has_next_page: false,
        has_previous_page: false,
      }
    : (rawPageInfo ? {
        total_count: rawPageInfo.totalCount,
        page_count: rawPageInfo.pageCount,
        current_page: rawPageInfo.currentPage,
        per_page: rawPageInfo.perPage,
        has_next_page: rawPageInfo.hasNextPage,
        has_previous_page: rawPageInfo.hasPreviousPage
      } : undefined);

  const items = customItems ?? tableData?.[responseKey]?.items ?? [];

  /* --- 7. Build Columns --- */
  const columns = useMemo<ColumnDef<any>[]>(() => {
    const padNumber = (value: number) => value.toString().padStart(2, "0");
    const toDate = (value: unknown): Date | null => {
      if (value === null || value === undefined) return null;
      const parsed = value instanceof Date ? value : new Date(value as string);
      return Number.isNaN(parsed.getTime()) ? null : parsed;
    };
    const formatDate = (date: Date) =>
      `${padNumber(date.getDate())}-${padNumber(
        date.getMonth() + 1
      )}-${date.getFullYear()}`;
    const formatDateValue = (value: unknown, type: string | undefined) => {
      const date = toDate(value);
      if (!date) return "";
      if (type === "DateTimeField") {
        return `${formatDate(date)} ${padNumber(date.getHours())}:${padNumber(
          date.getMinutes()
        )}`;
      }
      if (type === "DateField") {
        return formatDate(date);
      }
      return value;
    };
    const numericFieldTypes = new Map<string, { maxFractionDigits: number }>([
      ["IntegerField", { maxFractionDigits: 0 }],
      ["PositiveIntegerField", { maxFractionDigits: 0 }],
      ["PositiveSmallIntegerField", { maxFractionDigits: 0 }],
      ["SmallIntegerField", { maxFractionDigits: 0 }],
      ["BigIntegerField", { maxFractionDigits: 0 }],
      ["DecimalField", { maxFractionDigits: 2 }],
      ["FloatField", { maxFractionDigits: 2 }],
    ]);
    const isNumericField = (type?: string) => numericFieldTypes.has(type ?? "");
    const formatNumber = (value: unknown, type?: string) => {
      const numericConfig = type ? numericFieldTypes.get(type) : undefined;
      if (numericConfig) {
        const numeric = typeof value === "number" ? value : Number(value);
        if (!Number.isNaN(numeric)) {
          const formatter = new Intl.NumberFormat("fr-FR", {
            maximumFractionDigits: numericConfig.maxFractionDigits,
            minimumFractionDigits: 0,
          });
          return formatter.format(numeric);
        }
      }
      return value;
    };
    const baseCols = fields
      .filter((f) => !excludeColumns.includes(f.name))
      .map((f) => ({
        id: f.name,

        header: f.title ?? f.name,
        accessorFn: (row: any) => {
          if (f.is_related) {
            return row?.[f.name]?.desc ?? "";
          }
          // Prefer the description field if available (for choice fields)
          return row?.[`${f.name}_desc`] ?? row?.[f.name];
        },
        enableSorting: f.sortable,
        enableColumnFilter: f.filterable,
        // Provide metadata used by BaseTable to build ordering payloads
        // "display" corresponds to the backend-recognized field/path for sorting
        meta: { display: f.display?.replace(".", "__") ?? f.name },
        cell: (info: any) => {
          const val = info.getValue();
          if (f.field_type === "BooleanField") return val ? "✅" : "❌";
          if (
            f.field_type === "DateField" ||
            f.field_type === "DateTimeField"
          ) {
            return formatDateValue(val, f.field_type);
          }
          if (
            isNumericField(f.field_type) &&
            val !== undefined &&
            val !== null &&
            val !== ""
          ) {
            return formatNumber(val, f.field_type);
          }
          return val ?? "";
        },
        ...overrideColumns[f.name],
      }));

    return [...baseCols, ...appendColumns];
  }, [fields, excludeColumns, overrideColumns, appendColumns]);

  /* --- 8. Build Table --- */
  const table = useReactTable({
    data: items,
    columns,
    pageCount: pageInfo?.page_count ?? -1,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
    enableMultiSort: true,
    maxMultiSortColCount: 10,
    state: {
      pagination: { pageIndex, pageSize } as PaginationState,
      sorting,
      columnFilters,
      columnVisibility,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: (updater) => {
      if (typeof updater === "function") return;
      setPageIndex(updater.pageIndex);
      setPageSize(updater.pageSize);
    },
  });

  /* --- 9. Combined Loading & Error --- */
  const loading = skip ? false : metaLoading || tableLoading;
  const error = metaError || tableError;

  const setters = useMemo(
    () => ({
      nextPage: () => setPageIndex(pageIndex + 1),
      previousPage: () => setPageIndex(pageIndex - 1),
      firstPage: () => setPageIndex(0),
      lastPage: () => setPageIndex(pageInfo?.page_count ?? -1),
      setPageIndex,
      setPageSize,
      setSorting,
      setColumnFilters,
      setColumnVisibility,
      setQuick,
      setAdvancedFilters,
      setPresets,
      setDistinctOn,
    }),
    [pageIndex, pageInfo?.page_count]
  );

  return {
    meta: modelMeta,
    fields,
    items,
    pageInfo,
    table,
    loading,
    error,
    refetch,
    state: {
      pageIndex,
      pageSize,
      sorting,
      columnFilters,
      columnVisibility,
      quick,
      advancedFilters,
      presets,
      distinctOn,
    },
    payloads: {
      filters: filtersPayload,
      ordering: orderingPayload,
      quick,
      presets,
      distinctOn,
    },
    setters,
    metadataLoading: metadataLoadingState,
    supportsQuickSearch: includeQuickArgument,
  };
}
