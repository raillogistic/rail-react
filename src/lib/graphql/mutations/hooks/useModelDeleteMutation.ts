import { useMemo } from "react";
import { buildModelMutationDocument } from "../mutationBuilder";
import { buildModelDeleteMutationVariables } from "../variables";
import { resolveModelMutationOptions } from "./shared";
import { useModelMutationBase } from "./useModelMutationBase";
import type {
  UseModelDeleteMutationOptions,
  UseModelMutationResult,
} from "../types";

/**
 * Executes a generated delete mutation with normalized defaults.
 */
export function useModelDeleteMutation(
  options: UseModelDeleteMutationOptions,
): UseModelMutationResult {
  const resolved = resolveModelMutationOptions(options);

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

  const variables = useMemo(
    () =>
      buildModelDeleteMutationVariables(options.variables, {
        identifierVariableName: resolved.identifierVariableName,
      }),
    [options.variables, resolved.identifierVariableName],
  );

  return useModelMutationBase({
    builtDocument,
    defaultVariables: variables,
    apollo: options.apollo,
  });
}
