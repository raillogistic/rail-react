import { useMemo } from "react";
import { buildModelMutationDocument } from "../mutationBuilder";
import { buildModelBulkDeleteMutationVariables } from "../variables";
import { resolveModelMutationOptions } from "./shared";
import { useModelMutationBase } from "./useModelMutationBase";
import type {
  UseModelBulkDeleteMutationOptions,
  UseModelMutationResult,
} from "../types";

/**
 * Executes a generated bulk-delete mutation with normalized defaults.
 */
export function useModelBulkDeleteMutation(
  options: UseModelBulkDeleteMutationOptions,
): UseModelMutationResult {
  const resolved = resolveModelMutationOptions(options);

  const builtDocument = useMemo(
    () =>
      buildModelMutationDocument({
        mode: "bulkDelete",
        model: resolved.model,
        app: resolved.app,
        selection: resolved.selection,
        operationName: resolved.operationName,
        mutationName: resolved.mutationName,
        responseAlias: resolved.responseAlias,
        customArgumentDefinitions: resolved.customArgumentDefinitions,
        customArgumentAssignments: resolved.customArgumentAssignments,
      }),
    [
      resolved.app,
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
    () => buildModelBulkDeleteMutationVariables(options.variables),
    [options.variables],
  );

  return useModelMutationBase({
    builtDocument,
    defaultVariables: variables,
    apollo: options.apollo,
  });
}
