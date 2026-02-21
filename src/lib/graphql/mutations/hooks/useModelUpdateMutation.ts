import { useMemo } from "react";
import { buildModelMutationDocument } from "../mutationBuilder";
import { buildModelUpdateMutationVariables } from "../variables";
import {
  resolveContractBoundMutationName,
  resolveModelMutationOptions,
} from "./shared";
import { useModelMutationModelForm } from "./useModelMutationModelForm";
import { useModelMutationBase } from "./useModelMutationBase";
import type {
  UseModelMutationResult,
  UseModelUpdateMutationOptions,
} from "../types";

/**
 * Executes a generated update mutation with normalized defaults.
 */
export function useModelUpdateMutation(
  options: UseModelUpdateMutationOptions,
): UseModelMutationResult {
  const resolved = resolveModelMutationOptions(options);
  const modelForm = useModelMutationModelForm({
    mode: "update",
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

  const contractMutationName =
    resolved.preferContractBindings === false
      ? undefined
      : resolveContractBoundMutationName("update", modelForm.mutationBindings);
  const mutationName = resolved.mutationName || contractMutationName;

  const builtDocument = useMemo(
    () =>
      buildModelMutationDocument({
        mode: "update",
        model: resolved.model,
        app: resolved.app,
        selection: resolved.selection,
        operationName: resolved.operationName,
        mutationName,
        responseAlias: resolved.responseAlias,
        identifierVariableName: resolved.identifierVariableName,
        identifierArgumentName: resolved.identifierArgumentName,
        identifierType: resolved.identifierType,
        inputTypeName: resolved.inputTypeName,
        customArgumentDefinitions: resolved.customArgumentDefinitions,
        customArgumentAssignments: resolved.customArgumentAssignments,
      }),
    [
      resolved.app,
      resolved.customArgumentAssignments,
      resolved.customArgumentDefinitions,
      resolved.identifierArgumentName,
      resolved.identifierType,
      resolved.identifierVariableName,
      resolved.inputTypeName,
      mutationName,
      resolved.model,
      resolved.operationName,
      resolved.responseAlias,
      resolved.selection,
    ],
  );

  const variables = useMemo(
    () =>
      buildModelUpdateMutationVariables(options.variables, {
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
