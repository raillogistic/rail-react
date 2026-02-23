import { useCallback } from "react";
import {
  useLazyQuery,
  useMutation,
  type ApolloError,
} from "@apollo/client";
import {
  CREATE_MODEL_IMPORT_BATCH_MUTATION,
  DELETE_MODEL_IMPORT_BATCH_MUTATION,
  MODEL_IMPORT_BATCH_QUERY,
  UPDATE_MODEL_IMPORT_BATCH_MUTATION,
} from "@/shared/api/graphql/legacy/importing";
import type {
  CreateModelImportBatchInput,
  CreateModelImportBatchPayload,
  DeleteModelImportBatchInput,
  DeleteModelImportBatchPayload,
  ModelImportBatch,
  UpdateModelImportBatchInput,
  UpdateModelImportBatchPayload,
} from "../types";

interface ModelImportBatchQueryData {
  modelImportBatch: ModelImportBatch | null;
}

interface ModelImportBatchQueryVariables {
  batchId: string;
}

interface CreateModelImportBatchMutationData {
  createModelImportBatch: CreateModelImportBatchPayload;
}

interface UpdateModelImportBatchMutationData {
  updateModelImportBatch: UpdateModelImportBatchPayload;
}

interface DeleteModelImportBatchMutationData {
  deleteModelImportBatch: DeleteModelImportBatchPayload;
}

export interface UseImportBatchResult {
  batch: ModelImportBatch | null;
  loading: boolean;
  error?: ApolloError;
  fetchBatch: (batchId: string) => Promise<unknown>;
  createBatch: (input: CreateModelImportBatchInput) => Promise<CreateModelImportBatchPayload>;
  updateBatch: (input: UpdateModelImportBatchInput) => Promise<UpdateModelImportBatchPayload>;
  deleteBatch: (input: DeleteModelImportBatchInput) => Promise<DeleteModelImportBatchPayload>;
}

export function useImportBatch(): UseImportBatchResult {
  const [fetchBatchQuery, fetchBatchState] = useLazyQuery<
    ModelImportBatchQueryData,
    ModelImportBatchQueryVariables
  >(MODEL_IMPORT_BATCH_QUERY, {
    fetchPolicy: "network-only",
  });

  const [createBatchMutation, createBatchState] = useMutation<
    CreateModelImportBatchMutationData,
    { input: CreateModelImportBatchInput }
  >(CREATE_MODEL_IMPORT_BATCH_MUTATION);

  const [updateBatchMutation, updateBatchState] = useMutation<
    UpdateModelImportBatchMutationData,
    { input: UpdateModelImportBatchInput }
  >(UPDATE_MODEL_IMPORT_BATCH_MUTATION);

  const [deleteBatchMutation, deleteBatchState] = useMutation<
    DeleteModelImportBatchMutationData,
    { input: DeleteModelImportBatchInput }
  >(DELETE_MODEL_IMPORT_BATCH_MUTATION);

  const fetchBatch = useCallback(
    (batchId: string) => fetchBatchQuery({ variables: { batchId } }),
    [fetchBatchQuery],
  );

  const createBatch = useCallback(
    async (input: CreateModelImportBatchInput): Promise<CreateModelImportBatchPayload> => {
      const result = await createBatchMutation({ variables: { input } });
      return (
        result.data?.createModelImportBatch ?? {
          ok: false,
          issues: [],
        }
      );
    },
    [createBatchMutation],
  );

  const updateBatch = useCallback(
    async (input: UpdateModelImportBatchInput): Promise<UpdateModelImportBatchPayload> => {
      const result = await updateBatchMutation({ variables: { input } });
      return (
        result.data?.updateModelImportBatch ?? {
          ok: false,
          rows: [],
          issues: [],
        }
      );
    },
    [updateBatchMutation],
  );

  const deleteBatch = useCallback(
    async (input: DeleteModelImportBatchInput): Promise<DeleteModelImportBatchPayload> => {
      const result = await deleteBatchMutation({ variables: { input } });
      return (
        result.data?.deleteModelImportBatch ?? {
          ok: false,
          deletedBatchId: null,
        }
      );
    },
    [deleteBatchMutation],
  );

  return {
    batch: fetchBatchState.data?.modelImportBatch ?? null,
    loading:
      fetchBatchState.loading ||
      createBatchState.loading ||
      updateBatchState.loading ||
      deleteBatchState.loading,
    error:
      fetchBatchState.error ??
      createBatchState.error ??
      updateBatchState.error ??
      deleteBatchState.error,
    fetchBatch,
    createBatch,
    updateBatch,
    deleteBatch,
  };
}
