import { useMemo } from "react";
import { buildModelMutationDocument } from "../mutationBuilder";
import { buildModelCreateMutationVariables } from "../variables";
import { resolveModelMutationOptions } from "./shared";
import { useModelMutationBase } from "./useModelMutationBase";
import type {
  UseModelCreateMutationOptions,
  UseModelMutationResult,
} from "../types";

/**
 * Executes a generated create mutation with normalized defaults.
 */
export function useModelCreateMutation(
  options: UseModelCreateMutationOptions,
): UseModelMutationResult {
  const resolved = resolveModelMutationOptions(options);

  const builtDocument = useMemo(
    () =>
      buildModelMutationDocument({
        mode: "create",
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
    () => buildModelCreateMutationVariables(options.variables),
    [options.variables],
  );

  return useModelMutationBase({
    builtDocument,
    defaultVariables: variables,
    apollo: options.apollo,
  });
}
