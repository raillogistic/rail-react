import { format } from "date-fns";
import { Check, X } from "lucide-react";
import {
  BaseModelTableField,
  BaseModelTableFieldRenderMap,
  BaseModelTableFieldsInput,
  FieldSchema,
  ModelSchema,
  MutationSchema,
  RelationshipSchema,
} from "./types";

// Helper to format cell value
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function formatCellValue(value: any, field: FieldSchema) {
  if (value === null || value === undefined) return "-";

  if (Array.isArray(value)) {
    if (field.isRelation) {
      const relKey = field.relationLookupField;
      const rendered = value
        .map((item) => {
          if (!item || typeof item !== "object") return item;
          if (item.desc !== undefined && item.desc !== null) return item.desc;
          if (relKey && item[relKey] !== undefined && item[relKey] !== null) {
            return item[relKey];
          }
          return item.name ?? item.id ?? JSON.stringify(item);
        })
        .filter((item) => item !== undefined && item !== null && item !== "");
      return rendered.length ? rendered.join(", ") : "-";
    }
    return JSON.stringify(value);
  }

  if (field.isBoolean) {
    return value ? (
      <Check className="h-4 w-4 text-green-500" />
    ) : (
      <X className="h-4 w-4 text-red-500" />
    );
  }

  if (field.isDate || field.isDatetime) {
    try {
      return format(new Date(value), field.isDatetime ? "PP p" : "PP");
    } catch {
      return String(value);
    }
  }

  if (field.choices) {
    const choice = field.choices.find((c) => c.value === value);
    return choice ? choice.label : value;
  }

  if (typeof value === "object") {
    if (field.isRelation) {
      const relKey = field.relationLookupField;
      if (value.desc !== undefined && value.desc !== null) {
        return value.desc;
      }
      if (relKey && value[relKey] !== undefined && value[relKey] !== null) {
        return value[relKey];
      }
      return value.name ?? value.id ?? JSON.stringify(value);
    }
    // Basic handling for relations if fetched as objects
    return value.name || value.id || JSON.stringify(value);
  }

  return String(value);
}

function buildRelationshipField(relation: RelationshipSchema): FieldSchema {
  const name = relation.name || relation.fieldName;
  const fieldName = relation.fieldName || relation.name;
  const lookupField =
    relation.lookupField && relation.lookupField !== "__str__"
      ? relation.lookupField
      : undefined;
  return {
    name,
    fieldName,
    verboseName: relation.verboseName || name,
    helpText: relation.helpText,
    fieldType: "Relationship",
    graphqlType: "Relationship",
    required: relation.required,
    nullable: relation.nullable,
    blank: !relation.required,
    editable: relation.editable,
    unique: false,
    hasDefault: false,
    autoNow: false,
    autoNowAdd: false,
    readable: relation.readable,
    writable: relation.writable,
    visibility: relation.readable ? "list" : "hidden",
    isPrimaryKey: false,
    isIndexed: false,
    isRelation: true,
    isComputed: false,
    isFile: false,
    isImage: false,
    isJson: false,
    isDate: false,
    isDatetime: false,
    isNumeric: false,
    isBoolean: false,
    isText: false,
    isRichText: false,
    isFsmField: false,
    relationLookupField: lookupField,
  };
}

export function mergeModelSchemaWithRelationships(
  metadata?: ModelSchema | null,
): ModelSchema | undefined {
  if (!metadata) return undefined;
  const relationships = metadata.relationships ?? [];
  if (relationships.length === 0) {
    return metadata;
  }

  const relationLookup = new Map<string, RelationshipSchema>();
  relationships.forEach((relation) => {
    if (relation.name) relationLookup.set(relation.name, relation);
    if (relation.fieldName) relationLookup.set(relation.fieldName, relation);
  });

  const mergedFields = metadata.fields.map((field) => {
    if (!field.isRelation) return field;
    const relation =
      relationLookup.get(field.name) ?? relationLookup.get(field.fieldName);
    if (!relation) return field;
    const lookupField =
      relation.lookupField && relation.lookupField !== "__str__"
        ? relation.lookupField
        : undefined;
    if (field.relationLookupField === lookupField) return field;
    return { ...field, relationLookupField: lookupField };
  });

  const existingKeys = new Set<string>();
  mergedFields.forEach((field) => {
    if (field.name) existingKeys.add(field.name);
    if (field.fieldName) existingKeys.add(field.fieldName);
  });

  const relationshipFields = relationships
    .filter((relation) => {
      const name = relation.name || relation.fieldName;
      const fieldName = relation.fieldName || relation.name;
      return !existingKeys.has(name) && !existingKeys.has(fieldName);
    })
    .map(buildRelationshipField);

  if (relationshipFields.length === 0) {
    return { ...metadata, fields: mergedFields };
  }

  return {
    ...metadata,
    fields: [...mergedFields, ...relationshipFields],
  };
}

export type ResolvedBaseModelTableFieldsConfig = {
  display?: BaseModelTableField[];
  exclude: string[];
  render: BaseModelTableFieldRenderMap;
};

export function normalizeBaseModelTableFieldsInput(
  input?: BaseModelTableFieldsInput,
): ResolvedBaseModelTableFieldsConfig {
  if (!input) {
    return {
      display: undefined,
      exclude: [],
      render: {},
    };
  }

  if (Array.isArray(input)) {
    return {
      display: input,
      exclude: [],
      render: {},
    };
  }

  return {
    display: input.display ?? input.include,
    exclude: (input.exclude ?? []).map((entry) => entry.trim()).filter(Boolean),
    render: input.render ?? {},
  };
}

export function isAccessorExcluded(
  accessor: string,
  excludedAccessors: Set<string>,
): boolean {
  if (!accessor) return false;
  if (excludedAccessors.has(accessor)) return true;

  const dotRoot = accessor.split(".")[0];
  const dunderRoot = accessor.split("__")[0];

  return excludedAccessors.has(dotRoot) || excludedAccessors.has(dunderRoot);
}

export function resolveGroupingValue(
  row: Record<string, unknown>,
  groupingField: string,
): unknown {
  if (!groupingField) return undefined;
  const path = groupingField.includes("__")
    ? groupingField.split("__")
    : groupingField.split(".");
  return path.reduce<unknown>((acc, segment) => {
    if (acc === null || acc === undefined) return undefined;
    if (typeof acc !== "object") return undefined;
    return (acc as Record<string, unknown>)[segment];
  }, row);
}

export function resolveGroupingKey(
  row: Record<string, unknown>,
  groupingField: string,
): string {
  const value = resolveGroupingValue(row, groupingField);
  if (value === null || value === undefined || value === "") return "__EMPTY__";

  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    if (record.id !== undefined && record.id !== null) return String(record.id);
    if (record.pk !== undefined && record.pk !== null) return String(record.pk);
    if (record.code !== undefined && record.code !== null) return String(record.code);
    if (record.name !== undefined && record.name !== null) return String(record.name);
    if (record.title !== undefined && record.title !== null) return String(record.title);
    if (record.desc !== undefined && record.desc !== null) return String(record.desc);
  }

  return String(value);
}

export function resolveGroupingLabel(
  row: Record<string, unknown>,
  groupingField: string,
): string {
  const key = resolveGroupingKey(row, groupingField);
  if (key === "__EMPTY__") return "Non renseigne";

  const value = resolveGroupingValue(row, groupingField);
  if (typeof value === "object" && value !== null) {
    const record = value as Record<string, unknown>;
    if (record.desc !== undefined && record.desc !== null) {
      return String(record.desc);
    }
    if (record.name !== undefined && record.name !== null) {
      return String(record.name);
    }
    if (record.title !== undefined && record.title !== null) {
      return String(record.title);
    }
  }

  return key;
}

export function normalizeMutationType(mutation: MutationSchema): string {
  return String(mutation.mutationType || mutation.operation || "").toLowerCase();
}

export function findMutation(
  mutations: MutationSchema[] | undefined,
  type: string,
): MutationSchema | undefined {
  const normalized = type.toLowerCase();
  return mutations?.find(
    (mutation) => normalizeMutationType(mutation) === normalized,
  );
}
