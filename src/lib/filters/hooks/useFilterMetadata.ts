/**
 * Dynamic Filters - useFilterMetadata Hook
 *
 * Fetches and merges metadata from modelSchema, filterSchema, and savedFilters.
 * Supports lazy loading of nested relation schemas.
 */

import { useQuery, gql, useApolloClient } from "@apollo/client";
import { useMemo, useCallback, useRef, useState, useEffect } from "react";
import { mergeFilterMetadata } from "../metadataMerger";
import type { UnifiedFilterSchema, RelationFilter } from "../types";
import { FILTER_METADATA_QUERY } from "../queries";
import {
  persistFilterMetadata,
  readPersistedFilterMetadata,
  recordModelUsage,
} from "@/lib/graphql/metadata/persisted-cache";

const SAVED_FILTERS_QUERY = gql`
  query SavedFilters($modelName: String!) {
    savedFilters: savedFilterList(
      where: { modelName: { eq: $modelName } }
      orderBy: ["-updated_at"]
      limit: 50
    ) {
      id
      name
      description
      filterJson
      isShared
      createdBy {
        id
        username
      }
      useCount
      lastUsedAt
    }
  }
`;

export interface UseFilterMetadataOptions {
  app: string;
  model: string;
  maxDepth?: number;
  includeSavedFilters?: boolean;
  skip?: boolean;
  /** Enable lazy loading of relation schemas */
  enableLazyLoading?: boolean;
}

export interface RelationLoadingState {
  loading: boolean;
  error: Error | null;
}

export interface UseFilterMetadataResult {
  schema: UnifiedFilterSchema | null;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
  refetchSavedFilters: () => void;
  /** Load schema for a specific relation on-demand */
  loadRelationSchema: (
    relationName: string,
  ) => Promise<UnifiedFilterSchema | null>;
  /** Check if a relation schema is loaded */
  isRelationLoaded: (relationName: string) => boolean;
  /** Get loading state for a relation */
  getRelationLoadingState: (relationName: string) => RelationLoadingState;
  /** Prefetch schemas for visible relations */
  prefetchRelations: (relationNames: string[]) => Promise<void>;
  /** Load schema for a relation (by related app/model) */
  loadSchemaForRelation: (
    relation: RelationFilter,
  ) => Promise<UnifiedFilterSchema | null>;
  /** Get cached schema for a relation */
  getSchemaForRelation: (
    relation: RelationFilter,
  ) => UnifiedFilterSchema | null;
}

export function useFilterMetadata({
  app,
  model,
  maxDepth = 3,
  includeSavedFilters = true,
  skip = false,
  enableLazyLoading = true,
}: UseFilterMetadataOptions): UseFilterMetadataResult {
  const client = useApolloClient();

  // Track loaded relation schemas
  const [relationSchemas, setRelationSchemas] = useState<
    Map<string, UnifiedFilterSchema>
  >(() => new Map());

  // Cache schemas by app/model for nested relations
  const [modelSchemas, setModelSchemas] = useState<
    Map<string, UnifiedFilterSchema>
  >(() => new Map());

  // Track loading states
  const [relationLoadingStates, setRelationLoadingStates] = useState<
    Map<string, RelationLoadingState>
  >(() => new Map());

  const [, setModelLoadingStates] = useState<Map<string, RelationLoadingState>>(
    () => new Map(),
  );

  // In-flight requests
  const inFlightRequests = useRef<
    Map<string, Promise<UnifiedFilterSchema | null>>
  >(new Map());
  const modelRequests = useRef<
    Map<string, Promise<UnifiedFilterSchema | null>>
  >(new Map());

  const getModelKey = useCallback((appName: string, modelName: string) => {
    return `${appName}::${modelName}`;
  }, []);

  // Fetch model and filter schema
  const {
    data: metadataData,
    loading: metadataLoading,
    error: metadataError,
    refetch: refetchMetadata,
  } = useQuery(FILTER_METADATA_QUERY, {
    variables: { app, model },
    skip,
    fetchPolicy: "cache-first",
  });

  // Fetch saved filters
  const {
    data: savedFiltersData,
    loading: savedFiltersLoading,
    refetch: refetchSavedFilters,
  } = useQuery(SAVED_FILTERS_QUERY, {
    variables: { modelName: model },
    skip: skip || !includeSavedFilters,
    fetchPolicy: "cache-and-network",
  });

  const persistedMetadata = useMemo(
    () => readPersistedFilterMetadata(app, model) as typeof metadataData | null,
    [app, model],
  );

  const effectiveMetadata = useMemo(
    () => metadataData ?? persistedMetadata,
    [metadataData, persistedMetadata],
  );

  useEffect(() => {
    if (skip || !app || !model) return;
    recordModelUsage(app, model);
  }, [app, model, skip]);

  useEffect(() => {
    if (!metadataData?.modelSchema || !metadataData?.filterSchema) return;
    persistFilterMetadata(app, model, {
      modelSchema: metadataData.modelSchema,
      filterSchema: metadataData.filterSchema,
    });
  }, [metadataData, app, model]);

  // Merge all metadata sources with loaded relation schemas
  const schema = useMemo(() => {
    if (skip) return null;
    if (!effectiveMetadata?.modelSchema || !effectiveMetadata?.filterSchema) {
      return null;
    }

    const baseSchema = mergeFilterMetadata(
      effectiveMetadata,
      effectiveMetadata,
      includeSavedFilters ? savedFiltersData : null,
      { maxDepth },
    );

    // Inject loaded relation schemas
    if (relationSchemas.size > 0) {
      const updatedRelationFilters = baseSchema.relationFilters.map((rf) => {
        const loadedSchema = relationSchemas.get(rf.name);
        if (loadedSchema) {
          return { ...rf, nestedSchema: loadedSchema };
        }
        return rf;
      });

      return {
        ...baseSchema,
        relationFilters: updatedRelationFilters,
      };
    }

    return baseSchema;
  }, [
    effectiveMetadata,
    savedFiltersData,
    includeSavedFilters,
    maxDepth,
    relationSchemas,
    skip,
  ]);

  const loadSchemaByModel = useCallback(
    async (
      appName: string,
      modelName: string,
    ): Promise<UnifiedFilterSchema | null> => {
      if (!enableLazyLoading) return null;

      const key = getModelKey(appName, modelName);

      if (modelSchemas.has(key)) {
        return modelSchemas.get(key)!;
      }

      const inFlight = modelRequests.current.get(key);
      if (inFlight) {
        return inFlight;
      }

      setModelLoadingStates((prev) => {
        const next = new Map(prev);
        next.set(key, { loading: true, error: null });
        return next;
      });

      const fetchPromise = (async (): Promise<UnifiedFilterSchema | null> => {
        try {
          const { data } = await client.query({
            query: FILTER_METADATA_QUERY,
            variables: {
              app: appName,
              model: modelName,
            },
            fetchPolicy: "cache-first",
          });

          if (!data?.modelSchema || !data?.filterSchema) {
            throw new Error("Failed to load relation schema");
          }

          const nestedSchema = mergeFilterMetadata(data, data, null, {
            maxDepth: maxDepth - 1,
          });

          setModelSchemas((prev) => {
            const next = new Map(prev);
            next.set(key, nestedSchema);
            return next;
          });

          setModelLoadingStates((prev) => {
            const next = new Map(prev);
            next.set(key, { loading: false, error: null });
            return next;
          });

          return nestedSchema;
        } catch (error) {
          const err = error instanceof Error ? error : new Error(String(error));
          setModelLoadingStates((prev) => {
            const next = new Map(prev);
            next.set(key, { loading: false, error: err });
            return next;
          });
          return null;
        } finally {
          modelRequests.current.delete(key);
        }
      })();

      modelRequests.current.set(key, fetchPromise);
      return fetchPromise;
    },
    [client, enableLazyLoading, getModelKey, maxDepth, modelSchemas],
  );

  const loadSchemaForRelation = useCallback(
    async (relation: RelationFilter): Promise<UnifiedFilterSchema | null> => {
      if (!relation.relatedApp || !relation.relatedModel) {
        return null;
      }
      return loadSchemaByModel(relation.relatedApp, relation.relatedModel);
    },
    [loadSchemaByModel],
  );

  const getSchemaForRelation = useCallback(
    (relation: RelationFilter): UnifiedFilterSchema | null => {
      if (relation.nestedSchema) return relation.nestedSchema;
      if (!relation.relatedApp || !relation.relatedModel) return null;
      const key = getModelKey(relation.relatedApp, relation.relatedModel);
      return modelSchemas.get(key) ?? null;
    },
    [getModelKey, modelSchemas],
  );

  // Load a relation schema on demand
  const loadRelationSchema = useCallback(
    async (relationName: string): Promise<UnifiedFilterSchema | null> => {
      if (!schema || !enableLazyLoading) return null;

      // Check if already loaded
      if (relationSchemas.has(relationName)) {
        return relationSchemas.get(relationName)!;
      }

      // Check if already loading
      const inFlight = inFlightRequests.current.get(relationName);
      if (inFlight) {
        return inFlight;
      }

      // Find the relation
      const relation = schema.relationFilters.find(
        (rf) => rf.name === relationName || rf.fieldName === relationName,
      );

      if (!relation) {
        return null;
      }

      // Set loading state
      setRelationLoadingStates((prev) => {
        const next = new Map(prev);
        next.set(relationName, { loading: true, error: null });
        return next;
      });

      const fetchPromise = (async (): Promise<UnifiedFilterSchema | null> => {
        try {
          const nestedSchema = await loadSchemaForRelation(relation);
          if (!nestedSchema) {
            throw new Error("Failed to load relation schema");
          }

          // Store the loaded schema for top-level injection
          setRelationSchemas((prev) => {
            const next = new Map(prev);
            next.set(relationName, nestedSchema);
            return next;
          });

          // Clear loading state
          setRelationLoadingStates((prev) => {
            const next = new Map(prev);
            next.set(relationName, { loading: false, error: null });
            return next;
          });

          return nestedSchema;
        } catch (error) {
          const err = error instanceof Error ? error : new Error(String(error));

          setRelationLoadingStates((prev) => {
            const next = new Map(prev);
            next.set(relationName, { loading: false, error: err });
            return next;
          });

          return null;
        } finally {
          inFlightRequests.current.delete(relationName);
        }
      })();

      inFlightRequests.current.set(relationName, fetchPromise);
      return fetchPromise;
    },
    [schema, enableLazyLoading, relationSchemas, loadSchemaForRelation],
  );

  const isRelationLoaded = useCallback(
    (relationName: string): boolean => {
      return relationSchemas.has(relationName);
    },
    [relationSchemas],
  );

  const getRelationLoadingState = useCallback(
    (relationName: string): RelationLoadingState => {
      return (
        relationLoadingStates.get(relationName) ?? {
          loading: false,
          error: null,
        }
      );
    },
    [relationLoadingStates],
  );

  const prefetchRelations = useCallback(
    async (relationNames: string[]): Promise<void> => {
      await Promise.all(
        relationNames.map((name) => {
          if (
            !relationSchemas.has(name) &&
            !inFlightRequests.current.has(name)
          ) {
            return loadRelationSchema(name);
          }
          return Promise.resolve(null);
        }),
      );
    },
    [relationSchemas, loadRelationSchema],
  );

  const refetch = useCallback(() => {
    refetchMetadata();
    if (includeSavedFilters) {
      refetchSavedFilters();
    }
    // Clear loaded relation schemas on refetch
    setRelationSchemas(new Map());
    setRelationLoadingStates(new Map());
    inFlightRequests.current.clear();
    setModelSchemas(new Map());
    setModelLoadingStates(new Map());
    modelRequests.current.clear();
  }, [refetchMetadata, refetchSavedFilters, includeSavedFilters]);

  return {
    schema,
    loading: metadataLoading || (includeSavedFilters && savedFiltersLoading),
    error: metadataError ?? null,
    refetch,
    refetchSavedFilters,
    loadRelationSchema,
    isRelationLoaded,
    getRelationLoadingState,
    prefetchRelations,
    loadSchemaForRelation,
    getSchemaForRelation,
  };
}

