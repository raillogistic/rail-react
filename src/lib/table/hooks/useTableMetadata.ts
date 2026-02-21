import { useQuery } from "@apollo/client";
import { useEffect, useMemo } from "react";
import { GET_MODEL_SCHEMA } from "../queries";
import { ModelSchema } from "../types";
import { toGraphqlFieldName } from "../utils";
import { useMetadata } from "@/lib/graphql/metadata/gateway";
import {
  persistTableMetadata,
  readPersistedTableMetadata,
  recordModelUsage,
} from "@/lib/graphql/metadata/persisted-cache";

export interface UseTableMetadataResult {
  metadata?: ModelSchema;
  loading: boolean;
  error?: Error;
}

export function useTableMetadata(
  app: string,
  model: string,
): UseTableMetadataResult {
  const gatewayEnabled = import.meta.env.VITE_METADATA_GATEWAY_TABLE !== "0";
  const gatewayQueryOptions = useMemo(
    () => ({
      fetchPolicy: "network-only" as const,
    }),
    [],
  );

  const {
    metadata: gatewayMetadata,
    loading: gatewayLoading,
    error: gatewayError,
  } = useMetadata({
    app,
    model,
    profile: "table",
    skip: !gatewayEnabled || !app || !model,
    queryOptions: gatewayQueryOptions,
  });

  const { data, loading, error } = useQuery(GET_MODEL_SCHEMA, {
    variables: { app, model },
    skip: gatewayEnabled || !app || !model,
    fetchPolicy: "network-only",
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
    const activeMetadata = gatewayEnabled
      ? (gatewayMetadata as ModelSchema | null)
      : ((data?.modelSchema as ModelSchema | undefined) ?? null);

    if (!activeMetadata) return;
    persistTableMetadata(app, model, { modelSchema: activeMetadata });
  }, [gatewayEnabled, gatewayMetadata, data, app, model]);

  const metadata = useMemo(() => {
    const activeMetadata = gatewayEnabled
      ? (gatewayMetadata as ModelSchema | null)
      : ((data?.modelSchema as ModelSchema | undefined) ?? null);

    const base = (activeMetadata ?? persistedMetadata) as ModelSchema | null;
    if (!base) return undefined;
    
    // Standardize all field and relationship names to camelCase
    const standardized = {
      ...base,
      fields: base.fields.map((f) => ({
        ...f,
        name: toGraphqlFieldName(f.name),
        fieldName: f.fieldName ? toGraphqlFieldName(f.fieldName) : f.fieldName,
      })),
      relationships: base.relationships.map((r) => ({
        ...r,
        name: toGraphqlFieldName(r.name),
        fieldName: r.fieldName ? toGraphqlFieldName(r.fieldName) : r.fieldName,
      })),
    };

    const serverMutations = activeMetadata?.mutations;

    return {
      ...standardized,
      // Mutations can be permission-sensitive; only trust the server response.
      mutations: serverMutations ?? [],
    };
  }, [gatewayEnabled, gatewayMetadata, data, persistedMetadata]);

  const activeLoading = gatewayEnabled ? gatewayLoading : loading;
  const activeError = gatewayEnabled
    ? (gatewayError as Error | undefined)
    : (error as Error | undefined);

  return {
    metadata,
    loading: activeLoading,
    error: activeError,
  };
}

