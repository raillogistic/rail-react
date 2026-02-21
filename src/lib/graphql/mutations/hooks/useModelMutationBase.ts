import { useCallback } from "react";
import {
  useMutation,
  type MutationFunctionOptions,
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
export interface UseModelMutationBaseHookOptions {
  /**
   * Built mutation document metadata.
   */
  builtDocument: BuiltModelMutationDocument;
  /**
   * Default variables merged into each execution call.
   */
  defaultVariables: Record<string, unknown>;
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
export function useModelMutationBase(
  options: UseModelMutationBaseHookOptions,
): UseModelMutationResult {
  const [mutate, mutationState] = useMutation<
    Record<string, unknown>,
    OperationVariables
  >(options.builtDocument.mutationDocument, options.apollo);

  const execute = useCallback(
    (
      variables?: Record<string, unknown>,
      executeOptions: ExecuteModelMutationOptions = {},
    ) => {
      const { variables: optionVariables, ...restOptions } = executeOptions;
      const mergedVariables = {
        ...(options.defaultVariables || {}),
        ...((optionVariables as Record<string, unknown> | undefined) || {}),
        ...(variables || {}),
      };
      const hasVariables = Object.keys(mergedVariables).length > 0;

      return mutate({
        ...restOptions,
        ...(hasVariables ? { variables: mergedVariables } : {}),
      } as MutationFunctionOptions<Record<string, unknown>, OperationVariables>);
    },
    [mutate, options.defaultVariables],
  );

  const rawData = mutationState.data as Record<string, unknown> | undefined;
  const data = rawData?.[options.builtDocument.responseAlias] ?? null;

  return {
    data,
    rawData,
    loading: mutationState.loading,
    error: mutationState.error,
    called: mutationState.called,
    reset: mutationState.reset,
    execute,
    mutationDocument: options.builtDocument.mutationDocument,
    mutationName: options.builtDocument.mutationName,
    operationName: options.builtDocument.operationName,
    modelForm: options.modelForm,
  };
}
