import type {
  FieldSchema,
  FilterSchema,
  ModelSchema,
  RelationshipSchema,
} from "../types";
import type {
  FilterBaseType,
  FilterCondition,
  FilterGroup,
  FilterOperator,
  FilterableField,
} from "@/widgets/model-table/filtering/types";
import { translateLookupLabelFr } from "./filtering/operatorLabels";

export type ResolvedModelTableFilterField = {
  filterMeta: FilterSchema;
  resolvedField?: FieldSchema;
  relationSchema?: RelationshipSchema;
  filterableField: FilterableField;
  fieldPath: string[];
  fieldName: string;
  label: string;
};

function normalizeFilterPath(value: string): string {
  return value.replace(/__/g, ".").split(".").filter(Boolean).join(".");
}

function splitFilterPath(value: string): string[] {
  return normalizeFilterPath(value).split(".").filter(Boolean);
}

function normalizeBaseType(baseType: string | undefined): FilterBaseType {
  const raw = String(baseType ?? "").trim();
  if (!raw) return "String";

  const exactMapping: Record<string, FilterBaseType> = {
    String: "String",
    Number: "Number",
    Int: "Number",
    Integer: "Number",
    Float: "Number",
    Decimal: "Number",
    Boolean: "Boolean",
    Bool: "Boolean",
    Date: "Date",
    DateTime: "DateTime",
    Datetime: "DateTime",
    Relationship: "Relationship",
    ID: "String",
    Json: "JSON",
    JSON: "JSON",
  };
  if (exactMapping[raw]) return exactMapping[raw];

  const normalized = raw.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (["string", "char", "text", "id"].includes(normalized)) return "String";
  if (
    ["number", "int", "integer", "float", "decimal", "bigint", "smallint"].includes(
      normalized,
    )
  ) {
    return "Number";
  }
  if (["boolean", "bool"].includes(normalized)) return "Boolean";
  if (normalized === "date") return "Date";
  if (["datetime", "timestamp"].includes(normalized)) return "DateTime";
  if (
    ["relationship", "relation", "foreignkey", "fk", "manytomany", "onetoone"].includes(
      normalized,
    )
  ) {
    return "Relationship";
  }
  if (["json", "jsonfield"].includes(normalized)) return "JSON";
  if (normalized.includes("boolean") || normalized.includes("bool")) {
    return "Boolean";
  }
  if (normalized.includes("datetime") || normalized.includes("timestamp")) {
    return "DateTime";
  }
  if (normalized.includes("date")) return "Date";
  if (
    normalized.includes("relation") ||
    normalized.includes("foreignkey") ||
    normalized.includes("manytomany") ||
    normalized.includes("onetoone")
  ) {
    return "Relationship";
  }
  if (
    normalized.includes("number") ||
    normalized.includes("integer") ||
    normalized.includes("decimal") ||
    normalized.includes("float")
  ) {
    return "Number";
  }
  return "String";
}

function resolveFieldBaseType(
  resolvedField: FieldSchema | undefined,
  filterMeta: FilterSchema,
  fieldPath: string[],
  relationSchema?: RelationshipSchema,
): FilterBaseType {
  if (resolvedField) {
    if (resolvedField.isNumeric) return "Number";
    if (resolvedField.isDate) return "Date";
    if (resolvedField.isDatetime) return "DateTime";
    if (resolvedField.isBoolean) return "Boolean";
    if (resolvedField.isJson) return "JSON";
    if (resolvedField.isRelation) return "Relationship";
  }

  if (relationSchema && fieldPath.length === 1) {
    return "Relationship";
  }

  return normalizeBaseType(filterMeta.baseType);
}

function resolveLookupOperator(option: {
  name?: string;
  lookup?: string;
  lookup_expr?: string;
}): string {
  if (typeof option.lookup === "string" && option.lookup.trim().length > 0) {
    return option.lookup.trim();
  }
  if (
    typeof option.lookup_expr === "string" &&
    option.lookup_expr.trim().length > 0
  ) {
    return option.lookup_expr.trim();
  }
  const rawName = typeof option.name === "string" ? option.name : "";
  const match = rawName.match(/__([a-zA-Z0-9_]+)$/);
  if (match?.[1]) return match[1];
  return rawName || "exact";
}

function buildOperators(filterMeta: FilterSchema): FilterOperator[] {
  return filterMeta.options.map((option) => {
    const lookup = resolveLookupOperator(
      option as { name?: string; lookup?: string; lookup_expr?: string },
    );
    return {
      name: lookup,
      label: translateLookupLabelFr(lookup, option.label),
      helpText: option.helpText,
      graphqlType: option.graphqlType || "String",
      isList:
        Boolean(option.isList) ||
        lookup === "in" ||
        lookup === "not_in" ||
        lookup === "hasKeys" ||
        lookup === "hasAnyKeys",
      choices: option.choices,
    };
  });
}

function findResolvedField(
  metadata: ModelSchema,
  candidates: string[],
  rootSegment: string,
  allowRootFallback: boolean,
): FieldSchema | undefined {
  return metadata.fields.find((field) => {
    const values = [
      field.name,
      field.fieldName,
      normalizeFilterPath(field.name),
      normalizeFilterPath(field.fieldName),
    ].filter(Boolean) as string[];

    return (
      values.some((value) => candidates.includes(value)) ||
      (allowRootFallback && values.includes(rootSegment))
    );
  });
}

function findRelationSchema(
  metadata: ModelSchema,
  candidates: string[],
  rootSegment: string,
): RelationshipSchema | undefined {
  return metadata.relationships.find((relation) => {
    const values = [
      relation.name,
      relation.fieldName,
      normalizeFilterPath(relation.name),
      normalizeFilterPath(relation.fieldName),
    ].filter(Boolean) as string[];

    return (
      values.some((value) => candidates.includes(value)) ||
      values.includes(rootSegment)
    );
  });
}

export function resolveModelTableFilterField(
  metadata: ModelSchema | null | undefined,
  filterKey: string,
): ResolvedModelTableFilterField | null {
  if (!metadata) return null;

  const requestedKey = String(filterKey || "").trim();
  if (!requestedKey) return null;

  const normalizedRequested = normalizeFilterPath(requestedKey);
  const filterMeta =
    metadata.filters.find((filter) => {
      const names = [
        filter.name,
        filter.fieldName,
        normalizeFilterPath(filter.name),
        normalizeFilterPath(filter.fieldName),
      ].filter(Boolean) as string[];
      return names.includes(normalizedRequested);
    }) ?? null;

  if (!filterMeta) {
    return null;
  }

  const canonicalPathSource = filterMeta.name || filterMeta.fieldName || normalizedRequested;
  const fieldPath = splitFilterPath(canonicalPathSource);
  const fieldName = fieldPath[fieldPath.length - 1] || normalizedRequested;
  const rootSegment = fieldPath[0] || normalizedRequested;
  const candidates = Array.from(
    new Set(
      [
        requestedKey,
        normalizedRequested,
        filterMeta.name,
        filterMeta.fieldName,
      ].filter(Boolean) as string[],
    ),
  );

  const resolvedField = findResolvedField(
    metadata,
    candidates,
    rootSegment,
    fieldPath.length === 1,
  );
  const relationSchema = findRelationSchema(metadata, candidates, rootSegment);
  const baseType = resolveFieldBaseType(
    resolvedField,
    filterMeta,
    fieldPath,
    relationSchema,
  );
  const operators = buildOperators(filterMeta);
  const relatedModelRaw =
    relationSchema?.relatedModel ?? filterMeta.relatedModel ?? "";
  const [relatedAppFromMeta, relatedModelFromMeta] = relatedModelRaw.includes(".")
    ? relatedModelRaw.split(".", 2)
    : ["", relatedModelRaw];

  return {
    filterMeta,
    resolvedField,
    relationSchema,
    fieldPath,
    fieldName,
    label: resolvedField?.verboseName || filterMeta.fieldLabel || fieldName,
    filterableField: {
      name: filterMeta.name || resolvedField?.name || fieldName,
      fieldName: filterMeta.fieldName || resolvedField?.fieldName || fieldName,
      fieldLabel: resolvedField?.verboseName || filterMeta.fieldLabel || fieldName,
      helpText: resolvedField?.helpText,
      baseType,
      graphqlType: resolvedField?.graphqlType || filterMeta.baseType || "String",
      filterInputType: filterMeta.filterInputType || "String",
      operators,
      defaultOperator:
        filterMeta.defaultOperator ||
        operators[0]?.name ||
        (filterMeta.options[0]
          ? resolveLookupOperator(
              filterMeta.options[0] as {
                name?: string;
                lookup?: string;
                lookup_expr?: string;
              },
            )
          : "exact"),
      choices: resolvedField?.choices ?? undefined,
      isRelation: baseType === "Relationship",
      relationConfig:
        baseType === "Relationship"
          ? {
              relatedApp: relationSchema?.relatedApp || relatedAppFromMeta || "",
              relatedModel:
                relationSchema?.relatedModel || relatedModelFromMeta || "",
              lookupField:
                relationSchema?.lookupField ||
                resolvedField?.relationLookupField ||
                "id",
              searchFields:
                relationSchema?.searchFields &&
                relationSchema.searchFields.length > 0
                  ? relationSchema.searchFields
                  : ["name"],
            }
          : undefined,
      uiHints: {
        widget: "text",
      },
    },
  };
}

export function findModelTableFilterCondition(
  root: FilterGroup,
  fieldPath: string[],
): FilterCondition | null {
  const targetPath = fieldPath.join(".");

  for (const entry of root.conditions) {
    if (entry.type === "condition") {
      const conditionPath = Array.isArray(entry.fieldPath)
        ? entry.fieldPath.join(".")
        : "";
      if (conditionPath === targetPath) {
        return entry;
      }
      continue;
    }

    const nested = findModelTableFilterCondition(entry, fieldPath);
    if (nested) {
      return nested;
    }
  }

  return null;
}
