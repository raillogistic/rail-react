import { format } from "date-fns";
import { Check, X } from "lucide-react";
import {
  BaseModelTableField,
  BaseModelTableFieldAdd,
  BaseModelTableFieldRenderMap,
  BaseModelTableFieldsInput,
  FieldSchema,
  ModelSchema,
  MutationSchema,
  RelationshipSchema,
} from "./types";

type SyntheticRelationCountMetadata = {
  synthetic?: string;
  relation?: string;
};

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
      if (!rendered.length) return "-";
      return (
        <span className="inline-flex flex-wrap items-center gap-1">
          {rendered.map((item, index) => (
            <span
              key={`${String(item)}-${index}`}
              className="inline-flex items-center rounded-md border border-border/60 bg-muted px-1.5 py-0 text-[11px] leading-4 text-foreground"
            >
              {String(item)}
            </span>
          ))}
        </span>
      );
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
      if (typeof value === "string") {
        if (field.isDate) {
          const dateOnly = value.match(/^(\d{4}-\d{2}-\d{2})/);
          if (dateOnly?.[1]) return dateOnly[1];
        }
        if (field.isDatetime) {
          const dateTime = value.match(
            /^(\d{4}-\d{2}-\d{2})[T\s](\d{2}):(\d{2})/,
          );
          if (dateTime) {
            return `${dateTime[1]} ${dateTime[2]}:${dateTime[3]}`;
          }
        }
      }

      return format(
        new Date(value),
        field.isDatetime ? "yyyy-MM-dd HH:mm" : "yyyy-MM-dd",
      );
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

function parseJsonObject(value?: string): Record<string, unknown> | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return null;
    }
    return parsed as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function getSyntheticRelationCountSource(
  field: Pick<FieldSchema, "customMetadata">,
): string | undefined {
  const metadata = parseJsonObject(
    field.customMetadata,
  ) as SyntheticRelationCountMetadata | null;
  if (!metadata) return undefined;
  if (metadata.synthetic !== "relation_count") return undefined;
  return metadata.relation;
}

function toCamelCase(value: string): string {
  return value.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase());
}

function toSnakeCase(value: string): string {
  return value
    .replace(/([A-Z])/g, "_$1")
    .toLowerCase()
    .replace(/^_/, "");
}

function toGraphqlFieldName(value: string): string {
  const camel = toCamelCase(value || "");
  if (!camel) return "";
  return camel.charAt(0).toLowerCase() + camel.slice(1);
}

function resolveRelationCountSource(
  accessor: string,
  field: FieldSchema,
  relationLookup: Map<string, RelationshipSchema>,
): string | null {
  const syntheticSource = getSyntheticRelationCountSource(field);
  if (syntheticSource) return syntheticSource;
  const stripped = accessor.replace(/count$/i, "");
  if (!stripped || stripped === accessor) return null;
  const candidates = new Set<string>([
    stripped,
    toCamelCase(stripped),
    toSnakeCase(stripped),
  ]);
  for (const candidate of candidates) {
    if (relationLookup.has(candidate)) return candidate;
  }
  return null;
}

export function getDefaultHiddenColumnIds(
  metadata?: ModelSchema | null,
): Set<string> {
  const hidden = new Set<string>();
  if (!metadata?.fields) return hidden;

  const relationLookup = new Map<string, RelationshipSchema>();
  metadata.relationships?.forEach((relation) => {
    if (relation.name) relationLookup.set(relation.name, relation);
    if (relation.fieldName) relationLookup.set(relation.fieldName, relation);
  });

  const normalizeKey = (value: string) => value.replace(/[_-]/g, "").toLowerCase();

  metadata.fields.forEach((field) => {
    const accessor = field.name || field.fieldName;
    const normalized = normalizeKey(accessor);
    const relation =
      relationLookup.get(field.name) ??
      relationLookup.get(field.fieldName || "");
    const relationType = relation?.relationType?.toLowerCase() || "";
    const isRelationCount = !!resolveRelationCountSource(
      accessor,
      field,
      relationLookup,
    );
    const isTimestamp =
      normalized === "createdat" ||
      normalized === "updatedat" ||
      normalized === "updateat";
    const hideByDefault =
      field.isPrimaryKey ||
      normalized === "id" ||
      field.isJson ||
      field.fieldType === "TextField" ||
      isTimestamp ||
      isRelationCount ||
      (!!relation &&
        (relation.isToMany ||
          relation.isReverse ||
          relationType.includes("many_to_many") ||
          relationType.includes("manytomany") ||
          relationType.includes("reverse_fk")));

    if (!hideByDefault) return;
    hidden.add(accessor);
    hidden.add(field.name);
    if (field.fieldName) hidden.add(field.fieldName);
    hidden.add(toGraphqlFieldName(accessor));
    hidden.add(toGraphqlFieldName(field.name));
    if (field.fieldName) hidden.add(toGraphqlFieldName(field.fieldName));
  });

  return hidden;
}

function buildRelationshipField(relation: RelationshipSchema): FieldSchema {
  const name = relation.name || relation.fieldName;
  const fieldName = relation.name || relation.fieldName;
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

function buildRelationshipCountField(relation: RelationshipSchema): FieldSchema {
  const relationName = relation.name || relation.fieldName;
  const countAccessor = `${relationName}Count`;
  return {
    name: countAccessor,
    fieldName: countAccessor,
    verboseName: `${relation.verboseName || relationName} Count`,
    helpText: `Nombre d'elements lies pour ${relation.verboseName || relationName}`,
    fieldType: "Integer",
    graphqlType: "Int",
    required: false,
    nullable: true,
    blank: true,
    editable: false,
    unique: false,
    hasDefault: false,
    autoNow: false,
    autoNowAdd: false,
    readable: relation.readable,
    writable: false,
    visibility: relation.readable ? "list" : "hidden",
    isPrimaryKey: false,
    isIndexed: false,
    isRelation: false,
    isComputed: true,
    isFile: false,
    isImage: false,
    isJson: false,
    isDate: false,
    isDatetime: false,
    isNumeric: true,
    isBoolean: false,
    isText: false,
    isRichText: false,
    isFsmField: false,
    customMetadata: JSON.stringify({
      synthetic: "relation_count",
      relation: relationName,
    }),
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
      const fieldName = relation.name || relation.fieldName;
      return !existingKeys.has(name) && !existingKeys.has(fieldName);
    })
    .map(buildRelationshipField);

  const countFields = relationships
    .filter((relation) => relation.isToMany && relation.readable)
    .map(buildRelationshipCountField)
    .filter((field) => {
      const name = field.name || field.fieldName;
      const fieldName = field.name || field.fieldName;
      return !existingKeys.has(name) && !existingKeys.has(fieldName);
    });

  if (relationshipFields.length === 0 && countFields.length === 0) {
    return { ...metadata, fields: mergedFields };
  }

  return {
    ...metadata,
    fields: [...mergedFields, ...relationshipFields, ...countFields],
  };
}

export function normalizeModelSchemaAccessors(
  metadata?: ModelSchema | null,
): ModelSchema | undefined {
  if (!metadata) return undefined;

  const normalizedFields = (metadata.fields ?? []).map((field) => {
    const rawFieldName = field.fieldName || field.name;
    const canonicalName = toGraphqlFieldName(field.name || field.fieldName);
    return {
      ...field,
      name: canonicalName || field.name || rawFieldName,
      fieldName: rawFieldName,
    };
  });

  const normalizedRelationships = (metadata.relationships ?? []).map(
    (relation) => {
      const rawRelationFieldName = relation.fieldName || relation.name;
      const canonicalName = toGraphqlFieldName(
        relation.name || relation.fieldName,
      );
      return {
        ...relation,
        name: canonicalName || relation.name || rawRelationFieldName,
        fieldName: rawRelationFieldName,
      };
    },
  );

  return {
    ...metadata,
    fields: normalizedFields,
    relationships: normalizedRelationships,
  };
}

export type ResolvedBaseModelTableFieldsConfig = {
  include?: BaseModelTableField[];
  add: BaseModelTableFieldAdd[];
  exclude: string[];
  render: BaseModelTableFieldRenderMap;
};

export function normalizeBaseModelTableFieldsInput(
  input?: BaseModelTableFieldsInput,
): ResolvedBaseModelTableFieldsConfig {
  if (!input) {
    return {
      include: undefined,
      add: [],
      exclude: [],
      render: {},
    };
  }

  if (Array.isArray(input)) {
    return {
      include: input,
      add: [],
      exclude: [],
      render: {},
    };
  }

  const add = (input.add ?? [])
    .map((entry) => ({
      ...entry,
      accessor: entry.accessor.trim(),
    }))
    .filter((entry) => Boolean(entry.accessor));

  return {
    include: input.include,
    add,
    exclude: (input.exclude ?? []).map((entry) => entry.trim()).filter(Boolean),
    render: input.render ?? {},
  };
}

function getFieldAccessor(field: BaseModelTableField): string {
  return typeof field === "string" ? field : field.accessor;
}

function withFieldTitle(
  field: BaseModelTableField,
  title: string,
): BaseModelTableField {
  if (typeof field === "string") {
    return {
      accessor: field,
      title,
    };
  }
  return {
    ...field,
    title,
  };
}

function findFieldIndexByAccessor(
  fields: BaseModelTableField[],
  accessor: string,
): number {
  return fields.findIndex((field) => getFieldAccessor(field) === accessor);
}

function resolveInsertIndex(
  fields: BaseModelTableField[],
  order: BaseModelTableFieldAdd["order"],
): number {
  if (typeof order === "number") {
    return Math.min(Math.max(order, 0), fields.length);
  }
  if (!order) return fields.length;

  if (order.before) {
    const beforeIndex = findFieldIndexByAccessor(fields, order.before);
    if (beforeIndex >= 0) return beforeIndex;
  }
  if (order.after) {
    const afterIndex = findFieldIndexByAccessor(fields, order.after);
    if (afterIndex >= 0) return afterIndex + 1;
  }

  return fields.length;
}

export function mergeBaseModelTableFields(
  options: {
    include?: BaseModelTableField[];
    defaults: BaseModelTableField[];
    add?: BaseModelTableFieldAdd[];
    excludedAccessors?: Set<string>;
  },
): BaseModelTableField[] {
  const baseFields = options.include ?? options.defaults;
  const excludedAccessors = options.excludedAccessors;
  const merged: BaseModelTableField[] = [];
  const existingAccessors = new Set<string>();

  const appendBaseField = (field: BaseModelTableField) => {
    const accessor = getFieldAccessor(field);
    if (!accessor) return;
    if (excludedAccessors && isAccessorExcluded(accessor, excludedAccessors)) {
      return;
    }
    if (existingAccessors.has(accessor)) return;
    merged.push(field);
    existingAccessors.add(accessor);
  };

  baseFields.forEach(appendBaseField);

  (options.add ?? []).forEach((fieldToAdd) => {
    const accessor = fieldToAdd.accessor;
    if (!accessor) return;
    if (excludedAccessors && isAccessorExcluded(accessor, excludedAccessors)) {
      return;
    }

    const existingIndex = findFieldIndexByAccessor(merged, accessor);
    const title = fieldToAdd.title?.trim();

    if (existingIndex >= 0) {
      let nextField = merged[existingIndex];
      if (title) {
        nextField = withFieldTitle(nextField, title);
      }

      const shouldMove = fieldToAdd.order !== undefined;
      if (!shouldMove) {
        merged[existingIndex] = nextField;
        return;
      }

      merged.splice(existingIndex, 1);
      const insertIndex = resolveInsertIndex(merged, fieldToAdd.order);
      merged.splice(insertIndex, 0, nextField);
      return;
    }

    const newField: BaseModelTableField = title
      ? { accessor, title }
      : accessor;
    const insertIndex = resolveInsertIndex(merged, fieldToAdd.order);
    merged.splice(insertIndex, 0, newField);
    existingAccessors.add(accessor);
  });

  return merged;
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

export function resolveFieldValue(
  row: Record<string, unknown>,
  field: Pick<FieldSchema, "name" | "fieldName">,
): unknown {
  const candidates = new Set<string>();
  const addCandidate = (candidate?: string) => {
    if (!candidate) return;
    candidates.add(candidate);
    candidates.add(toCamelCase(candidate));
    candidates.add(toSnakeCase(candidate));
  };

  addCandidate(field.name);
  addCandidate(field.fieldName);

  for (const key of candidates) {
    if (Object.prototype.hasOwnProperty.call(row, key)) {
      return row[key];
    }
  }

  return undefined;
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

