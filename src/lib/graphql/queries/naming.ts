/**
 * Converts snake_case tokens to camelCase.
 */
export function toCamelCase(value: string): string {
  return String(value || "").replace(/_([a-z])/g, (_, letter: string) =>
    letter.toUpperCase(),
  );
}

/**
 * Converts camelCase or PascalCase tokens to snake_case.
 */
export function toSnakeCase(value: string): string {
  return String(value || "")
    .replace(/([A-Z])/g, "_$1")
    .toLowerCase()
    .replace(/^_/, "");
}

/**
 * Normalizes a field token to GraphQL camelCase naming.
 */
export function toGraphqlFieldName(value: string): string {
  const camel = toCamelCase(value || "");
  if (!camel) return "";
  return camel.charAt(0).toLowerCase() + camel.slice(1);
}

/**
 * Converts a token to PascalCase with separator normalization.
 */
export function toPascalCaseToken(value: string): string {
  const normalized = String(value || "").trim();
  if (!normalized) return "";
  return normalized
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .map(
      (segment) =>
        segment.charAt(0).toUpperCase() + segment.slice(1).toLowerCase(),
    )
    .join("");
}

/**
 * Builds manager suffix used by backend-generated query names.
 */
export function buildManagerQuerySuffix(managerName?: string): string {
  const normalized = String(managerName || "").trim();
  if (!normalized || normalized === "objects") return "";
  const managerToken = toPascalCaseToken(normalized);
  return managerToken ? `By${managerToken}` : "";
}

/**
 * Builds backend-compatible model query field names.
 */
export function buildModelQueryField(
  modelName: string,
  operation: "single" | "list" | "group" | "page",
  managerName?: string,
): string {
  const modelToken =
    toGraphqlFieldName(modelName) || toPascalCaseToken(modelName) || "";
  const managerSuffix = buildManagerQuerySuffix(managerName);
  if (operation === "single") {
    return `${modelToken}${managerSuffix}`;
  }

  const opSuffix =
    operation === "list"
      ? "List"
      : operation === "group"
        ? "Group"
        : "Page";
  return `${modelToken}${opSuffix}${managerSuffix}`;
}
