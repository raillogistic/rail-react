import { useQuery } from "@apollo/client";
import { GET_MODEL_SCHEMA } from "../queries";
import { ModelSchema } from "../types";

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

  return {
    metadata: data?.modelSchema as ModelSchema | undefined,
    loading,
    error,
  };
}
