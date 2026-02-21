import { useCallback, useMemo } from "react";
import { buildModelMutationDocument } from "../mutationBuilder";
import { buildModelBulkUpdateMutationVariables } from "../variables";
import {
  resolveContractBoundMutationName,
  resolveModelMutationOptions,
} from "./shared";
import { useModelMutationModelForm } from "./useModelMutationModelForm";
import { useModelMutationBase } from "./useModelMutationBase";
import type {
  UseModelBulkUpdateMutationOptions,
  UseModelBulkUpdateMutationResult,
} from "../types";

/**
 * Executes a generated bulk-update mutation with execute-time variables.
 */
export function useModelBulkUpdateMutation(
  options: UseModelBulkUpdateMutationOptions,
): UseModelBulkUpdateMutationResult {
  const resolved = resolveModelMutationOptions(options);
  const modelForm = useModelMutationModelForm({
    mode: "bulkUpdate",
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
          "bulkUpdate",
          modelForm.mutationBindings,
        );
  const mutationName = resolved.mutationName || contractMutationName;

  const builtDocument = useMemo(
    () =>
      buildModelMutationDocument({
        mode: "bulkUpdate",
        model: resolved.model,
        app: resolved.app,
        selection: resolved.selection,
        operationName: resolved.operationName,
        mutationName,
        responseAlias: resolved.responseAlias,
        bulkInputTypeName: resolved.bulkInputTypeName,
        customArgumentDefinitions: resolved.customArgumentDefinitions,
        customArgumentAssignments: resolved.customArgumentAssignments,
      }),
    [
      resolved.app,
      resolved.bulkInputTypeName,
      resolved.customArgumentAssignments,
      resolved.customArgumentDefinitions,
      mutationName,
      resolved.model,
      resolved.operationName,
      resolved.responseAlias,
      resolved.selection,
    ],
  );

  const normalizeVariables = useCallback(
    buildModelBulkUpdateMutationVariables,
    [],
  );

  return useModelMutationBase({
    builtDocument,
    normalizeVariables,
    modelForm,
    apollo: options.apollo,
  });
}
