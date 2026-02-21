import { useMemo } from "react";
import { buildModelMutationDocument } from "../mutationBuilder";
import { buildModelMethodMutationVariables } from "../variables";
import { resolveModelMutationOptions } from "./shared";
import { useModelMutationModelForm } from "./useModelMutationModelForm";
import { useModelMutationBase } from "./useModelMutationBase";
import type {
  UseModelMethodMutationOptions,
  UseModelMutationResult,
} from "../types";

/**
 * Executes a generated custom method mutation with normalized defaults.
 */
export function useModelMethodMutation(
  options: UseModelMethodMutationOptions,
): UseModelMutationResult {
  const resolved = resolveModelMutationOptions(options);
  const modelForm = useModelMutationModelForm({
    mode: "method",
    app: resolved.app,
    model: resolved.model,
    contract: resolved.contract,
    initialData: resolved.initialData,
    contractMode: resolved.contractMode,
    includeNested: resolved.includeNested,
    objectId: resolved.objectId,
    initialDataNestedFields: resolved.initialDataNestedFields,
    runtimeOverrides: resolved.runtimeOverrides,
    skipModelForm: resolved.skipModelForm,
    skipInitialData: resolved.skipInitialData,
    contractQueryOptions:
      resolved.contractQueryOptions as Record<string, unknown>,
    initialDataQueryOptions:
      resolved.initialDataQueryOptions as Record<string, unknown>,
  });

  const builtDocument = useMemo(
    () =>
      buildModelMutationDocument({
        mode: "method",
        model: resolved.model,
        app: resolved.app,
        methodName: resolved.methodName,
        methodFieldName: resolved.methodFieldName,
        includeInput: resolved.includeInput,
        inputTypeName: resolved.inputTypeName,
        resultSelection: resolved.resultSelection,
        operationName: resolved.operationName,
        mutationName: resolved.mutationName,
        responseAlias: resolved.responseAlias,
        identifierVariableName: resolved.identifierVariableName,
        customArgumentDefinitions: resolved.customArgumentDefinitions,
        customArgumentAssignments: resolved.customArgumentAssignments,
      }),
    [
      resolved.app,
      resolved.customArgumentAssignments,
      resolved.customArgumentDefinitions,
      resolved.identifierVariableName,
      resolved.includeInput,
      resolved.inputTypeName,
      resolved.methodFieldName,
      resolved.methodName,
      resolved.model,
      resolved.mutationName,
      resolved.operationName,
      resolved.responseAlias,
      resolved.resultSelection,
    ],
  );

  const variables = useMemo(
    () =>
      buildModelMethodMutationVariables(options.variables, {
        identifierVariableName: resolved.identifierVariableName,
      }),
    [options.variables, resolved.identifierVariableName],
  );

  return useModelMutationBase({
    builtDocument,
    defaultVariables: variables,
    modelForm,
    apollo: options.apollo,
  });
}
