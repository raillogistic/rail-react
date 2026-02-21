import { useCallback } from "react";
import {
  useMutation,
  type MutationHookOptions,
  type OperationVariables,
} from "@apollo/client";
import type {
  BuiltModelMutationDocument,
  ExecuteModelMutationOptions,
  UseModelMutationModelFormResult,
  UseModelMutationResult,
} from "../types";

/**
 * Input options for shared generated mutation hook execution.
 */
export interface UseModelMutationBaseHookOptions<TVariables> {
  /**
   * Built mutation document metadata.
   */
  builtDocument: BuiltModelMutationDocument;
  /**
   * Variable normalizer used before execute-time mutation calls.
   */
  normalizeVariables: (variables: TVariables) => Record<string, unknown>;
  /**
   * Resolved model-form context returned with mutation state.
   */
  modelForm: UseModelMutationModelFormResult;
  /**
   * Apollo options forwarded to `useMutation`.
   */
  apollo?: MutationHookOptions<Record<string, unknown>, OperationVariables>;
}

/**
 * Executes generated model mutations with consistent response extraction.
 */
export function useModelMutationBase<TVariables>(
  options: UseModelMutationBaseHookOptions<TVariables>,
): UseModelMutationResult<TVariables> {
  const builtDocument = options.builtDocument;
  const modelForm = options.modelForm;
  const normalizeVariables = options.normalizeVariables;

  const [mutate, mutationState] = useMutation<
    Record<string, unknown>,
    OperationVariables
  >(builtDocument.mutationDocument, options.apollo);

  const execute = useCallback(
    (
      variables: TVariables,
      executeOptions: ExecuteModelMutationOptions = {},
    ) => {
      const normalizedVariables = normalizeVariables(variables);
      const hasVariables = Object.keys(normalizedVariables).length > 0;

      return mutate({
        ...executeOptions,
        ...(hasVariables ? { variables: normalizedVariables } : {}),
      });
    },
    [mutate, normalizeVariables],
  );

  const rawData = mutationState.data as Record<string, unknown> | undefined;
  const data = rawData?.[builtDocument.responseAlias] ?? null;

  return {
    ...modelForm,
    data,
    rawData,
    loading: mutationState.loading,
    error: mutationState.error,
    called: mutationState.called,
    reset: mutationState.reset,
    execute,
    mutationDocument: builtDocument.mutationDocument,
    mutationName: builtDocument.mutationName,
    operationName: builtDocument.operationName,
  };
}
