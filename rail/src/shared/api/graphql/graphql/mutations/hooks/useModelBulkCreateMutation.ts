import { useCallback, useMemo } from "react";
import { buildModelMutationDocument } from "../mutationBuilder";
import { buildModelBulkCreateMutationVariables } from "../variables";
import {
  resolveContractBoundMutationName,
  resolveModelMutationOptions,
} from "./shared";
import { useModelMutationModelForm } from "./useModelMutationModelForm";
import { useModelMutationBase } from "./useModelMutationBase";
import type {
  UseModelBulkCreateMutationOptions,
  UseModelBulkCreateMutationResult,
} from "../types";

/**
 * Executes a generated bulk-create mutation with execute-time variables.
 */
export function useModelBulkCreateMutation(
  options: UseModelBulkCreateMutationOptions,
): UseModelBulkCreateMutationResult {
  const resolved = resolveModelMutationOptions(options);
  const modelForm = useModelMutationModelForm({
    mode: "bulkCreate",
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
      : resolveContractBoundMutationName(
          "bulkCreate",
          modelForm.mutationBindings,
        );
  const mutationName = resolved.mutationName || contractMutationName;

  const builtDocument = useMemo(
    () =>
      buildModelMutationDocument({
        mode: "bulkCreate",
        model: resolved.model,
        app: resolved.app,
        selection: resolved.selection,
        operationName: resolved.operationName,
        mutationName,
        responseAlias: resolved.responseAlias,
        inputTypeName: resolved.inputTypeName,
        customArgumentDefinitions: resolved.customArgumentDefinitions,
        customArgumentAssignments: resolved.customArgumentAssignments,
      }),
    [
      resolved.app,
      resolved.customArgumentAssignments,
      resolved.customArgumentDefinitions,
      resolved.inputTypeName,
      mutationName,
      resolved.model,
      resolved.operationName,
      resolved.responseAlias,
      resolved.selection,
    ],
  );

  const normalizeVariables = useCallback(
    buildModelBulkCreateMutationVariables,
    [],
  );

  return useModelMutationBase({
    builtDocument,
    normalizeVariables,
    modelForm,
    apollo: options.apollo,
  });
}
