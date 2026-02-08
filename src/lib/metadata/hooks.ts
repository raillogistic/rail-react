import { useMetadata } from "./gateway";
import type { ModelMetadata } from "./types";

export function useModelMetadataQuery(
  appName: string,
  modelName: string,
  options?: { skip?: boolean }
) {
  const { metadata, loading, error, refetch } = useMetadata({
    app: appName,
    model: modelName,
    profile: "table",
    skip: options?.skip ?? false,
  });

  return {
    metadata: metadata as ModelMetadata | null,
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
  return useModelMetadataQuery(
    appName,
    modelName,
    options,
  );
}
