import type { ApolloError } from "@apollo/client";
import { useMetadata } from "./gateway";
import type { ModelMetadata } from "./types";

/**
 * Options for metadata hook helpers.
 */
export interface UseModelMetadataOptions {
  /** Skips the metadata request when true. */
  skip?: boolean;
}

/**
 * Fetches table-oriented model metadata for a model.
 */
export function useModelMetadataQuery(
  appName: string,
  modelName: string,
  options?: UseModelMetadataOptions,
): {
  metadata: ModelMetadata | null;
  loading: boolean;
  error: ApolloError | Error | undefined;
  refetch: () => Promise<ModelMetadata | null>;
} {
  const { metadata, loading, error, refetch } = useMetadata({
    app: appName,
    model: modelName,
    profile: "table",
    skip: options?.skip ?? false,
  });

  return {
    metadata,
    loading,
    error,
    refetch,
  };
}

/**
 * Alias for `useModelMetadataQuery` retained for backwards compatibility.
 */
export function useModelMetadata(
  appName: string,
  modelName: string,
  options?: UseModelMetadataOptions,
) {
  return useModelMetadataQuery(appName, modelName, options);
}
