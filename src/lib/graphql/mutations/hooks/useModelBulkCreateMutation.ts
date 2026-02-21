import { useMemo } from "react";
import { buildModelMutationDocument } from "../mutationBuilder";
import { buildModelBulkCreateMutationVariables } from "../variables";
import { resolveModelMutationOptions } from "./shared";
import { useModelMutationBase } from "./useModelMutationBase";
import type {
  UseModelBulkCreateMutationOptions,
  UseModelMutationResult,
} from "../types";

/**
 * Executes a generated bulk-create mutation with normalized defaults.
 */
export function useModelBulkCreateMutation(
  options: UseModelBulkCreateMutationOptions,
): UseModelMutationResult {
  const resolved = resolveModelMutationOptions(options);

  const builtDocument = useMemo(
    () =>
      buildModelMutationDocument({
        mode: "bulkCreate",
        model: resolved.model,
        app: resolved.app,
        selection: resolved.selection,
        operationName: resolved.operationName,
        mutationName: resolved.mutationName,
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
      resolved.model,
      resolved.mutationName,
      resolved.operationName,
      resolved.responseAlias,
      resolved.selection,
    ],
  );

  const variables = useMemo(
    () => buildModelBulkCreateMutationVariables(options.variables),
    [options.variables],
  );

  return useModelMutationBase({
    builtDocument,
    defaultVariables: variables,
    apollo: options.apollo,
  });
}
