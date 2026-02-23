import { toSnakeCase } from "../../utils";

export function isScalarFilterInputType(typeName: string): boolean {
  if (!typeName || !typeName.includes("FilterInput")) return false;
  if (typeName.includes("WhereInput")) return false;
  if (typeName.includes("AggregationFilterInput")) return false;
  if (typeName.includes("ConditionalAggregationFilterInput")) return false;
  return true;
}

export function operatorOptionsForGraphqlType(typeName: string): string[] {
  const normalized = (typeName || "").toLowerCase();
  if (normalized.includes("boolean")) {
    return ["eq", "isNull"];
  }
  if (
    normalized.includes("int") ||
    normalized.includes("float") ||
    normalized.includes("decimal") ||
    normalized.includes("count") ||
    normalized.includes("date") ||
    normalized.includes("datetime")
  ) {
    return ["eq", "neq", "gt", "gte", "lt", "lte", "isNull"];
  }
  return [
    "eq",
    "neq",
    "icontains",
    "contains",
    "startsWith",
    "endsWith",
    "isNull",
  ];
}

export function parseScalarValue(
  rawValue: string,
  graphqlType: string,
  operator: string,
): unknown {
  if (operator === "isNull") {
    return rawValue === "" ? true : rawValue === "true";
  }

  const normalized = (graphqlType || "").toLowerCase();
  if (
    normalized.includes("int") ||
    normalized.includes("float") ||
    normalized.includes("decimal") ||
    normalized.includes("count")
  ) {
    const parsed = Number(rawValue);
    if (Number.isNaN(parsed)) return undefined;
    return parsed;
  }

  if (normalized.includes("boolean")) {
    return rawValue === "true";
  }

  return rawValue;
}

export function resolveFilterSchemaByName(
  metadataFilters: Array<{ name: string; fieldName: string }>,
  name?: string,
) {
  if (!name) return undefined;
  const snakeName = toSnakeCase(name);
  return metadataFilters.find(
    (f) =>
      f.name === name ||
      f.fieldName === name ||
      f.name === snakeName ||
      f.fieldName === snakeName,
  );
}
