import { useMemo } from "react";
import { buildModelMutationDocument } from "../mutationBuilder";
import { buildModelBulkUpdateMutationVariables } from "../variables";
import { resolveModelMutationOptions } from "./shared";
import { useModelMutationBase } from "./useModelMutationBase";
import type {
  UseModelBulkUpdateMutationOptions,
  UseModelMutationResult,
} from "../types";

/**
 * Executes a generated bulk-update mutation with normalized defaults.
 */
export function useModelBulkUpdateMutation(
  options: UseModelBulkUpdateMutationOptions,
): UseModelMutationResult {
  const resolved = resolveModelMutationOptions(options);

  const builtDocument = useMemo(
    () =>
      buildModelMutationDocument({
        mode: "bulkUpdate",
        model: resolved.model,
        app: resolved.app,
        selection: resolved.selection,
        operationName: resolved.operationName,
        mutationName: resolved.mutationName,
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
      resolved.model,
      resolved.mutationName,
      resolved.operationName,
      resolved.responseAlias,
      resolved.selection,
    ],
  );

  const variables = useMemo(
    () => buildModelBulkUpdateMutationVariables(options.variables),
    [options.variables],
  );

  return useModelMutationBase({
    builtDocument,
    defaultVariables: variables,
    apollo: options.apollo,
  });
}
