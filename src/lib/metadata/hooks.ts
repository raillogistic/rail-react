import { useCallback, useEffect, useMemo, useState } from "react";
import {
  useApolloClient,
  type ApolloError,
  type FetchPolicy,
} from "@apollo/client";
import { MODEL_METADATA_QUERY } from "./queries";
import type { ModelMetadata } from "./types";
import {
  buildMetadataScopeKey,
  useMetadataCacheEntry,
} from "./cache";

interface ModelMetadataResponse {
  modelSchema: ModelMetadata;
}

export function useModelMetadataQuery(
  appName: string,
  modelName: string,
  options?: { skip?: boolean }
) {
  const client = useApolloClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApolloError | undefined>(undefined);
  const [metadata, setMetadata] = useState<ModelMetadata | null>(null);

  const fetchMetadata = useCallback(
    async (fetchPolicy: FetchPolicy = "cache-first") => {
      setLoading(true);
      setError(undefined);

      try {
        const result = await client.query<ModelMetadataResponse>({
          query: MODEL_METADATA_QUERY,
          variables: { app: appName, model: modelName },
          fetchPolicy,
        });
        setMetadata(result.data.modelSchema);
        return result.data.modelSchema;
      } catch (err) {
        setError(err as ApolloError);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [appName, modelName, client]
  );

  useEffect(() => {
    if (options?.skip) return;
    fetchMetadata("cache-first").catch(() => undefined);
  }, [options?.skip, fetchMetadata]);

  const refetch = useCallback(() => {
    return fetchMetadata("network-only");
  }, [fetchMetadata]);

  return {
    metadata,
    loading,
    error,
    refetch,
  };
}

export function useModelMetadata(
  appName: string,
  modelName: string,
  options?: { skip?: boolean }
) {
  const scopeKey = useMemo(
    () => buildMetadataScopeKey(appName, modelName, "v2"),
    [appName, modelName]
  );

  const cachedEntry = useMetadataCacheEntry<ModelMetadata>("table", scopeKey);

  const { metadata, loading, error, refetch } = useModelMetadataQuery(
    appName,
    modelName,
    options
  );

  const effectiveMetadata = metadata ?? cachedEntry?.data ?? null;

  return {
    metadata: effectiveMetadata,
    loading,
    error,
    refetch,
  };
}
