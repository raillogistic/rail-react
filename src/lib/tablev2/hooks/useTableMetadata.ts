import { useQuery } from "@apollo/client";
import { useEffect, useMemo } from "react";
import { GET_MODEL_SCHEMA } from "../queries";
import { ModelSchema } from "../types";
import {
  persistTableMetadata,
  readPersistedTableMetadata,
  recordModelUsage,
} from "@/lib/metadata/persisted-cache";

export interface UseTableMetadataResult {
  metadata?: ModelSchema;
  loading: boolean;
  error?: Error;
}

export function useTableMetadata(app: string, model: string): UseTableMetadataResult {
  const { data, loading, error } = useQuery(GET_MODEL_SCHEMA, {
    variables: { app, model },
    skip: !app || !model,
  });

  const persistedMetadata = useMemo(
    () => readPersistedTableMetadata(app, model) as ModelSchema | null,
    [app, model],
  );

  useEffect(() => {
    if (!app || !model) return;
    recordModelUsage(app, model);
  }, [app, model]);

  useEffect(() => {
    if (!data?.modelSchema) return;
    persistTableMetadata(app, model, { modelSchema: data.modelSchema });
  }, [data, app, model]);

  return {
    metadata: (data?.modelSchema ?? persistedMetadata) as ModelSchema | undefined,
    loading,
    error,
  };
}
