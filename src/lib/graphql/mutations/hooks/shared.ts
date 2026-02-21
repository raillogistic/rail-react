import type { UseModelMutationBaseOptions } from "../types";

/**
 * Normalized mutation options consumed by generated mutation hooks.
 */
export interface ResolvedModelMutationOptions {
  app: string;
  model: string;
  selection?: string;
  resultSelection?: string;
  operationName?: string;
  mutationName?: string;
  responseAlias?: string;
  identifierVariableName?: string;
  identifierArgumentName?: string;
  identifierType?: string;
  inputTypeName?: string;
  bulkInputTypeName?: string;
  methodName?: string;
  methodFieldName?: string;
  includeInput?: boolean;
  customArgumentDefinitions?: string[];
  customArgumentAssignments?: string[];
}

/**
 * Resolves grouped mutation options with backward-compatible flat fallback.
 */
export function resolveModelMutationOptions(
  options: UseModelMutationBaseOptions,
): ResolvedModelMutationOptions {
  const identity = options.identity || {};
  const selectionOptions = options.selectionOptions || {};
  const executionOptions = options.executionOptions || {};

  return {
    app: identity.app ?? options.app ?? "",
    model: identity.model ?? options.model ?? "",
    selection: selectionOptions.selection ?? options.selection,
    resultSelection: selectionOptions.resultSelection ?? options.resultSelection,
    operationName: executionOptions.operationName ?? options.operationName,
    mutationName: executionOptions.mutationName ?? options.mutationName,
    responseAlias: executionOptions.responseAlias ?? options.responseAlias,
    identifierVariableName:
      executionOptions.identifierVariableName ?? options.identifierVariableName,
    identifierArgumentName:
      executionOptions.identifierArgumentName ?? options.identifierArgumentName,
    identifierType: executionOptions.identifierType ?? options.identifierType,
    inputTypeName: executionOptions.inputTypeName ?? options.inputTypeName,
    bulkInputTypeName:
      executionOptions.bulkInputTypeName ?? options.bulkInputTypeName,
    methodName: executionOptions.methodName ?? options.methodName,
    methodFieldName:
      executionOptions.methodFieldName ?? options.methodFieldName,
    includeInput: executionOptions.includeInput ?? options.includeInput,
    customArgumentDefinitions:
      executionOptions.customArgumentDefinitions ??
      options.customArgumentDefinitions,
    customArgumentAssignments:
      executionOptions.customArgumentAssignments ??
      options.customArgumentAssignments,
  };
}
