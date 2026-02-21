import type {
  BuildModelMutationVariablesOptions,
  ModelBulkCreateMutationVariablesInput,
  ModelBulkDeleteMutationVariablesInput,
  ModelBulkUpdateMutationVariablesInput,
  ModelCreateMutationVariablesInput,
  ModelDeleteMutationVariablesInput,
  ModelMethodMutationVariablesInput,
  ModelUpdateMutationVariablesInput,
} from "./types";

/**
 * Returns `true` when value should be emitted in normalized variable payload.
 */
function hasValue(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value !== "string") return true;
  return value.trim().length > 0;
}

/**
 * Returns identifier variable key with `id` fallback.
 */
function resolveIdentifierVariableName(
  options?: BuildModelMutationVariablesOptions,
): string {
  return options?.identifierVariableName?.trim() || "id";
}

/**
 * Builds normalized variables for create mutations.
 */
export function buildModelCreateMutationVariables(
  variables: ModelCreateMutationVariablesInput,
): Record<string, unknown> {
  return {
    ...(variables?.input !== undefined ? { input: variables.input } : {}),
    ...(variables?.extra || {}),
  };
}

/**
 * Builds normalized variables for update mutations.
 */
export function buildModelUpdateMutationVariables(
  variables: ModelUpdateMutationVariablesInput,
  options: BuildModelMutationVariablesOptions = {},
): Record<string, unknown> {
  const identifierVariableName = resolveIdentifierVariableName(options);
  const identifierValue = variables.id;

  return {
    ...(hasValue(identifierValue)
      ? { [identifierVariableName]: identifierValue }
      : {}),
    ...(variables.input !== undefined ? { input: variables.input } : {}),
    ...(variables.extra || {}),
  };
}

/**
 * Builds normalized variables for delete mutations.
 */
export function buildModelDeleteMutationVariables(
  variables: ModelDeleteMutationVariablesInput,
  options: BuildModelMutationVariablesOptions = {},
): Record<string, unknown> {
  const identifierVariableName = resolveIdentifierVariableName(options);
  const identifierValue = variables.id;

  return {
    ...(hasValue(identifierValue)
      ? { [identifierVariableName]: identifierValue }
      : {}),
    ...(variables.extra || {}),
  };
}

/**
 * Builds normalized variables for bulk-create mutations.
 */
export function buildModelBulkCreateMutationVariables(
  variables: ModelBulkCreateMutationVariablesInput,
): Record<string, unknown> {
  return {
    ...(Array.isArray(variables?.inputs) ? { inputs: variables.inputs } : {}),
    ...(variables?.extra || {}),
  };
}

/**
 * Builds normalized variables for bulk-update mutations.
 */
export function buildModelBulkUpdateMutationVariables(
  variables: ModelBulkUpdateMutationVariablesInput,
): Record<string, unknown> {
  return {
    ...(Array.isArray(variables?.inputs) ? { inputs: variables.inputs } : {}),
    ...(variables?.extra || {}),
  };
}

/**
 * Builds normalized variables for bulk-delete mutations.
 */
export function buildModelBulkDeleteMutationVariables(
  variables: ModelBulkDeleteMutationVariablesInput,
): Record<string, unknown> {
  return {
    ...(Array.isArray(variables?.ids) ? { ids: variables.ids } : {}),
    ...(variables?.extra || {}),
  };
}

/**
 * Builds normalized variables for method mutations.
 */
export function buildModelMethodMutationVariables(
  variables: ModelMethodMutationVariablesInput,
  options: BuildModelMutationVariablesOptions = {},
): Record<string, unknown> {
  const identifierVariableName = resolveIdentifierVariableName(options);
  const identifierValue = variables.id;

  return {
    ...(hasValue(identifierValue)
      ? { [identifierVariableName]: identifierValue }
      : {}),
    ...(variables.input !== undefined ? { input: variables.input } : {}),
    ...(variables.extra || {}),
  };
}
