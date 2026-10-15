import { toGraphqlFieldName, toPascalCaseToken } from "../naming";
import type { ModelCrudMutationMode } from "./types";

/**
 * Resolves a model token used by generated mutation naming.
 */
function resolveModelToken(modelName: string): string {
  return toPascalCaseToken(modelName) || toGraphqlFieldName(modelName) || "";
}

/**
 * Resolves a method token used by generated method mutation naming.
 */
function resolveMethodToken(methodName: string): string {
  const normalized =
    toGraphqlFieldName(methodName) || toPascalCaseToken(methodName) || "";
  if (!normalized) return "";
  return normalized.charAt(0).toLowerCase() + normalized.slice(1);
}

/**
 * Builds backend-compatible model mutation field names.
 */
export function buildModelMutationField(
  modelName: string,
  mode: ModelCrudMutationMode,
): string {
  const modelToken = resolveModelToken(modelName);
  if (!modelToken) return mode;

  if (mode === "create") return `create${modelToken}`;
  if (mode === "update") return `update${modelToken}`;
  if (mode === "delete") return `delete${modelToken}`;
  if (mode === "bulkCreate") return `bulkCreate${modelToken}`;
  if (mode === "bulkUpdate") return `bulkUpdate${modelToken}`;
  return `bulkDelete${modelToken}`;
}

/**
 * Builds backend-compatible model method mutation field names.
 */
export function buildModelMethodMutationField(
  modelName: string,
  methodName: string,
): string {
  const methodToken = resolveMethodToken(methodName);
  const modelToken = resolveModelToken(modelName);

  if (!methodToken && !modelToken) return "";
  if (!methodToken) return modelToken;
  if (!modelToken) return methodToken;
  return `${methodToken}${modelToken}`;
}

/**
 * Builds default input type names for create/update mutations.
 */
export function buildModelMutationInputType(
  modelName: string,
  mode: "create" | "update",
): string {
  const modelToken = resolveModelToken(modelName);
  const prefix = mode === "create" ? "Create" : "Update";
  return `${prefix}${modelToken}Input`;
}

/**
 * Builds default input type name for method mutations.
 */
export function buildModelMethodInputType(
  modelName: string,
  methodName: string,
): string {
  const modelToken = resolveModelToken(modelName);
  const methodToken = toPascalCaseToken(methodName);
  return `${modelToken}${methodToken}Input`;
}
