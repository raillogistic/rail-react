import { useEffect, useMemo } from "react";
import { useModelQueryMetadata } from "@/shared/api/graphql/graphql";
import { ModelSchema } from "../types";
import { toGraphqlFieldName } from "../utils";
import {
  persistTableMetadata,
  readPersistedTableMetadata,
  recordModelUsage,
} from "@/shared/api/graphql/graphql/metadata/persisted-cache";

export interface UseTableMetadataResult {
  metadata?: ModelSchema;
  loading: boolean;
  error?: Error;
}

/**
 * Resolve table metadata through generated GraphQL metadata hooks with
 * persisted-cache fallback for offline/boot hydration scenarios.
 */
export function useTableMetadata(
  app: string,
  model: string,
): UseTableMetadataResult {
  const metadataQueryOptions = useMemo(
    () => ({
      fetchPolicy: "network-only" as const,
    }),
    [],
  );

  const { metadata: queryMetadata, loading, error } = useModelQueryMetadata({
    app,
    model,
    profile: "table",
    skip: !app || !model,
    queryOptions: metadataQueryOptions,
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
    const activeMetadata = queryMetadata as ModelSchema | null;
    if (!activeMetadata) return;
    persistTableMetadata(app, model, { modelSchema: activeMetadata });
  }, [queryMetadata, app, model]);

  const metadata = useMemo(() => {
    const activeMetadata = queryMetadata as ModelSchema | null;
    const base = (activeMetadata ?? persistedMetadata) as ModelSchema | null;
    if (!base) return undefined;

    // Standardize all field and relationship names to camelCase.
    const standardized = {
      ...base,
      fields: base.fields.map((field) => ({
        ...field,
        name: toGraphqlFieldName(field.name),
        fieldName: field.fieldName
          ? toGraphqlFieldName(field.fieldName)
          : field.fieldName,
      })),
      relationships: base.relationships.map((relation) => ({
        ...relation,
        name: toGraphqlFieldName(relation.name),
        fieldName: relation.fieldName
          ? toGraphqlFieldName(relation.fieldName)
          : relation.fieldName,
      })),
    };

    const serverMutations = activeMetadata?.mutations;

    return {
      ...standardized,
      // Mutations can be permission-sensitive; only trust the live server response.
      mutations: serverMutations ?? [],
    };
  }, [queryMetadata, persistedMetadata]);

  return {
    metadata,
    loading,
    error: error as Error | undefined,
  };
}
