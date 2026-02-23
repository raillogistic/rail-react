import { useCallback, useMemo } from "react";
import { buildModelMutationDocument } from "../mutationBuilder";
import { buildModelDeleteMutationVariables } from "../variables";
import { resolveModelMutationOptions } from "./shared";
import { useModelMutationModelForm } from "./useModelMutationModelForm";
import { useModelMutationBase } from "./useModelMutationBase";
import type {
  UseModelDeleteMutationOptions,
  UseModelDeleteMutationResult,
} from "../types";

/**
 * Executes a generated delete mutation with execute-time variables.
 */
export function useModelDeleteMutation(
  options: UseModelDeleteMutationOptions,
): UseModelDeleteMutationResult {
  const resolved = resolveModelMutationOptions(options);
  const modelForm = useModelMutationModelForm({
    mode: "delete",
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
        mode: "delete",
        model: resolved.model,
        app: resolved.app,
        selection: resolved.selection,
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
      resolved.model,
      resolved.mutationName,
      resolved.operationName,
      resolved.responseAlias,
      resolved.selection,
    ],
  );

  const normalizeVariables = useCallback(
    (variables: Parameters<typeof buildModelDeleteMutationVariables>[0]) =>
      buildModelDeleteMutationVariables(variables, {
        identifierVariableName: resolved.identifierVariableName,
      }),
    [resolved.identifierVariableName],
  );

  return useModelMutationBase({
    builtDocument,
    normalizeVariables,
    modelForm,
    apollo: options.apollo,
  });
}
