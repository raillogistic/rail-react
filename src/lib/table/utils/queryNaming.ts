import { toGraphqlFieldName } from "./caseConversion";

function toPascalCaseToken(value: string): string {
  const normalized = String(value || "").trim();
  if (!normalized) return "";
  return normalized
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .map((segment) =>
      segment.charAt(0).toUpperCase() + segment.slice(1).toLowerCase(),
    )
    .join("");
}

function toCamelCaseToken(value: string): string {
  const normalized = toPascalCaseToken(value);
  if (!normalized) return "";
  return normalized.charAt(0).toLowerCase() + normalized.slice(1);
}

export function buildManagerQuerySuffix(managerName?: string): string {
  const normalized = String(managerName || "").trim();
  if (!normalized || normalized === "objects") return "";
  const managerToken = toPascalCaseToken(normalized);
  return managerToken ? `By${managerToken}` : "";
}

export function buildModelQueryField(
  modelName: string,
  operation: "single" | "list" | "group" | "page",
  managerName?: string,
): string {
  const modelToken =
    toGraphqlFieldName(modelName) || toCamelCaseToken(modelName) || "";
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
