/**
 * useRelationSchema - Lazy loading hook for relation schemas.
 *
 * Fetches nested relation schemas on-demand when navigating into relationships.
 */

import { useCallback, useRef, useState } from "react";
import { gql, useApolloClient } from "@apollo/client";
import type { UnifiedFilterSchema, RelationFilter } from "../types";
import { mergeFilterMetadata } from "../metadataMerger";

/**
 * Query for fetching a relation's schema.
 */
const RELATION_SCHEMA_QUERY = gql`
  query RelationSchema($app: String!, $model: String!) {
    modelSchema(app: $app, model: $model) {
      app
      model
      verboseName
      verboseNamePlural
      fields {
        name
        fieldName
        verboseName
        helpText
        fieldType
        graphqlType
        required
        nullable
        choices { value label group }
        minValue
        maxValue
        isRelation
        isNumeric
        isDate
        isDatetime
        isBoolean
        isText
        isJson
        isIndexed
      }
      relationships {
        name
        fieldName
        verboseName
        relatedApp
        relatedModel
        relationType
        isToMany
        lookupField
        searchFields
      }
      filterConfig {
        style
        argumentName
        inputTypeName
        supportsAnd
        supportsOr
        supportsNot
        supportsFts
        supportsAggregation
        presets {
          name
          presetName
          description
          filterJson
        }
        computedFilters {
          name
          fieldName
          filterType
          description
        }
      }
      relationFilters {
        name
        fieldName
        relationType
        supportsSome
        supportsEvery
        supportsNone
        supportsCount
        nestedFilterType
      }
      fieldGroups {
        key
        label
        description
        fields
      }
    }
    filterSchema(app: $app, model: $model) {
      name
      fieldName
      fieldLabel
      baseType
      isNested
      relatedModel
      filterInputType
      availableOperators
      defaultOperator
      preferredOperators
      datePresets {
        key
        label
        days
        startOfPeriod
      }
      showInQuickFilter
      priority
      options {
        name
        lookup
        label
        helpText
        choices { value label }
        graphqlType
        isList
      }
    }
  }
`;

export interface RelationSchemaState {
  schema: UnifiedFilterSchema | null;
  loading: boolean;
  error: Error | null;
}

export interface UseRelationSchemaOptions {
  /** Maximum depth for fetching nested schemas */
  maxDepth?: number;
  /** Whether to automatically fetch on mount */
  autoFetch?: boolean;
}

export interface UseRelationSchemaReturn {
  /** Load schema for a specific relation */
  loadRelationSchema: (
    relation: RelationFilter,
    parentSchema: UnifiedFilterSchema
  ) => Promise<UnifiedFilterSchema | null>;
  /** Get current state for a relation */
  getRelationState: (relationKey: string) => RelationSchemaState;
  /** Check if a relation schema is loaded */
  isLoaded: (relationKey: string) => boolean;
  /** Check if a relation schema is loading */
  isLoading: (relationKey: string) => boolean;
  /** Prefetch multiple relation schemas */
  prefetchRelations: (
    relations: RelationFilter[],
    parentSchema: UnifiedFilterSchema
  ) => Promise<void>;
  /** Clear cached schemas */
  clearCache: () => void;
}

/**
 * Generate a cache key for a relation.
 */
function getRelationKey(app: string, model: string): string {
  return `${app}.${model}`;
}

/**
 * Hook for lazy loading relation schemas.
 */
export function useRelationSchema(
  options: UseRelationSchemaOptions = {}
): UseRelationSchemaReturn {
  const { maxDepth = 3 } = options;
  const client = useApolloClient();

  // State for tracking loading/error states per relation
  const [states, setStates] = useState<Map<string, RelationSchemaState>>(
    () => new Map()
  );

  // Cache for loaded schemas (ref to avoid re-renders)
  const schemaCache = useRef<Map<string, UnifiedFilterSchema>>(new Map());

  // In-flight requests to prevent duplicate fetches
  const inFlight = useRef<Map<string, Promise<UnifiedFilterSchema | null>>>(
    new Map()
  );

  const loadRelationSchema = useCallback(
    async (
      relation: RelationFilter,
      parentSchema: UnifiedFilterSchema
    ): Promise<UnifiedFilterSchema | null> => {
      const key = getRelationKey(relation.relatedApp, relation.relatedModel);

      // Check cache first
      const cached = schemaCache.current.get(key);
      if (cached) {
        return cached;
      }

      // Check if already loading
      const existing = inFlight.current.get(key);
      if (existing) {
        return existing;
      }

      // Update state to loading
      setStates((prev) => {
        const next = new Map(prev);
        next.set(key, { schema: null, loading: true, error: null });
        return next;
      });

      // Create the fetch promise
      const fetchPromise = (async (): Promise<UnifiedFilterSchema | null> => {
        try {
          const { data } = await client.query({
            query: RELATION_SCHEMA_QUERY,
            variables: {
              app: relation.relatedApp,
              model: relation.relatedModel,
            },
            fetchPolicy: "cache-first",
          });

          if (!data?.modelSchema || !data?.filterSchema) {
            throw new Error("Failed to load relation schema");
          }

          // Merge the metadata
          const schema = mergeFilterMetadata(data, data, null, { maxDepth });

          // Cache the result
          schemaCache.current.set(key, schema);

          // Update state
          setStates((prev) => {
            const next = new Map(prev);
            next.set(key, { schema, loading: false, error: null });
            return next;
          });

          return schema;
        } catch (error) {
          const err = error instanceof Error ? error : new Error(String(error));

          setStates((prev) => {
            const next = new Map(prev);
            next.set(key, { schema: null, loading: false, error: err });
            return next;
          });

          return null;
        } finally {
          inFlight.current.delete(key);
        }
      })();

      inFlight.current.set(key, fetchPromise);
      return fetchPromise;
    },
    [client, maxDepth]
  );

  const getRelationState = useCallback(
    (relationKey: string): RelationSchemaState => {
      return (
        states.get(relationKey) ?? {
          schema: schemaCache.current.get(relationKey) ?? null,
          loading: false,
          error: null,
        }
      );
    },
    [states]
  );

  const isLoaded = useCallback(
    (relationKey: string): boolean => {
      return schemaCache.current.has(relationKey);
    },
    []
  );

  const isLoading = useCallback(
    (relationKey: string): boolean => {
      return states.get(relationKey)?.loading ?? false;
    },
    [states]
  );

  const prefetchRelations = useCallback(
    async (
      relations: RelationFilter[],
      parentSchema: UnifiedFilterSchema
    ): Promise<void> => {
      const promises = relations.map((relation) => {
        const key = getRelationKey(relation.relatedApp, relation.relatedModel);
        if (!schemaCache.current.has(key) && !inFlight.current.has(key)) {
          return loadRelationSchema(relation, parentSchema);
        }
        return Promise.resolve(null);
      });

      await Promise.all(promises);
    },
    [loadRelationSchema]
  );

  const clearCache = useCallback(() => {
    schemaCache.current.clear();
    inFlight.current.clear();
    setStates(new Map());
  }, []);

  return {
    loadRelationSchema,
    getRelationState,
    isLoaded,
    isLoading,
    prefetchRelations,
    clearCache,
  };
}

/**
 * Hook for consuming a specific relation's schema.
 */
export function useLoadedRelationSchema(
  relation: RelationFilter | null,
  parentSchema: UnifiedFilterSchema | null,
  options: UseRelationSchemaOptions = {}
): RelationSchemaState & { load: () => Promise<void> } {
  const { loadRelationSchema, getRelationState } = useRelationSchema(options);

  const key = relation
    ? getRelationKey(relation.relatedApp, relation.relatedModel)
    : "";

  const state = getRelationState(key);

  const load = useCallback(async () => {
    if (relation && parentSchema) {
      await loadRelationSchema(relation, parentSchema);
    }
  }, [relation, parentSchema, loadRelationSchema]);

  return {
    ...state,
    load,
  };
}

export default useRelationSchema;
