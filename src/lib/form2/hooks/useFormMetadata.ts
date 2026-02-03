import * as React from "react";
import type { ApolloError, QueryHookOptions } from "@apollo/client";
import { useApolloClient } from "@apollo/client";
import { GET_MODEL_FORM_SCHEMA } from "../queries";
import {
  buildMetadataScopeKey,
  isCacheEntryFresh,
  METADATA_CACHE_TTL_MS,
  readMetadataCacheEntry,
  stableSerialize,
  useMetadataCacheEntry,
  writeMetadataCacheEntry,
} from "@/lib/metadata/cache";
import type { FormMetadata, UseFormMetadataOptions, UseFormMetadataResult } from "../types";

const DEFAULT_FETCH_POLICY: QueryHookOptions["fetchPolicy"] = "network-only";
const EMPTY_STRING_ARRAY: string[] = [];
const EMPTY_NESTED_TARGETS: Array<{ name: string; app: string; model: string }> = [];

function normalizeStringArray(value?: string[]) {
  if (!value || value.length === 0) {
    return EMPTY_STRING_ARRAY;
  }
  const filtered = value.filter(Boolean);
  return filtered.length ? filtered : EMPTY_STRING_ARRAY;
}

function resolveNestedTargets(metadata: FormMetadata | null, nestedFields: string[]) {
  if (!metadata || nestedFields.length === 0) {
    return [] as Array<{ name: string; app: string; model: string }>;
  }
  return nestedFields
    .map((fieldName) => {
      const relation = metadata.relationships.find(
        (rel) => rel.name === fieldName || rel.fieldName === fieldName,
      );
      if (!relation) return null;
      return {
        name: fieldName,
        app: relation.relatedApp,
        model: relation.relatedModel,
      };
    })
    .filter(
      (value): value is { name: string; app: string; model: string } =>
        Boolean(value),
    );
}

export function useFormMetadata({
  appName,
  modelName,
  objectId,
  nestedFields = [],
  exclude = [],
  only = [],
  excludeRelationships = [],
  onlyRelationships = [],
  skip = false,
  queryOptions,
}: UseFormMetadataOptions): UseFormMetadataResult {
  const client = useApolloClient();
  const nestedSignature = React.useMemo(
    () => stableSerialize(nestedFields ?? EMPTY_STRING_ARRAY),
    [nestedFields],
  );
  const excludeSignature = React.useMemo(
    () => stableSerialize(exclude ?? EMPTY_STRING_ARRAY),
    [exclude],
  );
  const onlySignature = React.useMemo(
    () => stableSerialize(only ?? EMPTY_STRING_ARRAY),
    [only],
  );
  const excludeRelSignature = React.useMemo(
    () => stableSerialize(excludeRelationships ?? EMPTY_STRING_ARRAY),
    [excludeRelationships],
  );
  const onlyRelSignature = React.useMemo(
    () => stableSerialize(onlyRelationships ?? EMPTY_STRING_ARRAY),
    [onlyRelationships],
  );

  const resolvedNestedFields = React.useMemo(
    () => normalizeStringArray(nestedFields),
    [nestedSignature],
  );
  const resolvedExclude = React.useMemo(
    () => normalizeStringArray(exclude),
    [excludeSignature],
  );
  const resolvedOnly = React.useMemo(
    () => normalizeStringArray(only),
    [onlySignature],
  );
  const resolvedExcludeRelationships = React.useMemo(
    () => normalizeStringArray(excludeRelationships),
    [excludeRelSignature],
  );
  const resolvedOnlyRelationships = React.useMemo(
    () => normalizeStringArray(onlyRelationships),
    [onlyRelSignature],
  );
  const signature = React.useMemo(
    () =>
      stableSerialize({
        objectId: objectId ?? null,
      }),
    [objectId],
  );
  const scopeKey = React.useMemo(
    () => buildMetadataScopeKey(appName, modelName, signature),
    [appName, modelName, signature],
  );
  const cachedEntry = useMetadataCacheEntry<FormMetadata>("form", scopeKey);
  const variables = React.useMemo(
    () => ({
      app: appName,
      model: modelName,
      objectId: objectId ?? undefined,
    }),
    [appName, modelName, objectId],
  );
  const metadataQueryOptions = React.useMemo(
    () => ({
      fetchPolicy: queryOptions?.fetchPolicy ?? DEFAULT_FETCH_POLICY,
      errorPolicy: queryOptions?.errorPolicy,
      context: queryOptions?.context,
    }),
    [queryOptions?.context, queryOptions?.errorPolicy, queryOptions?.fetchPolicy],
  );

  const [networkState, setNetworkState] = React.useState<{
    loading: boolean;
    error: ApolloError | undefined;
  }>({
    loading: false,
    error: undefined,
  });

  const shouldFetch =
    !skip && !isCacheEntryFresh(cachedEntry, METADATA_CACHE_TTL_MS);

  const executeMetadataQuery = React.useCallback(async () => {
    const result = await client.query({
      query: GET_MODEL_FORM_SCHEMA,
      variables,
      fetchPolicy: metadataQueryOptions.fetchPolicy,
      errorPolicy: metadataQueryOptions.errorPolicy,
      context: metadataQueryOptions.context,
    });
    const payload = result.data?.modelSchema ?? null;
    if (payload) {
      writeMetadataCacheEntry(
        "form",
        scopeKey,
        payload.metadataVersion,
        payload,
      );
    }
    return payload as FormMetadata | null;
  }, [client, variables, metadataQueryOptions, scopeKey]);

  React.useEffect(() => {
    if (!shouldFetch) return;
    let ignore = false;
    setNetworkState({ loading: true, error: undefined });
    executeMetadataQuery()
      .then(() => {
        if (!ignore) {
          setNetworkState({ loading: false, error: undefined });
        }
      })
      .catch((error) => {
        if (!ignore) {
          setNetworkState({ loading: false, error: error as ApolloError });
        }
      });
    return () => {
      ignore = true;
    };
  }, [shouldFetch, executeMetadataQuery]);

  const refetch = React.useCallback(() => {
    if (skip) {
      return Promise.resolve(null);
    }
    setNetworkState({ loading: true, error: undefined });
    return executeMetadataQuery()
      .then((payload) => {
        setNetworkState({ loading: false, error: undefined });
        return payload;
      })
      .catch((error) => {
        setNetworkState({ loading: false, error: error as ApolloError });
        throw error;
      });
  }, [executeMetadataQuery, skip]);

  const rawMetadata = skip ? null : cachedEntry?.data ?? null;
  const hasFilters =
    resolvedExclude.length > 0 ||
    resolvedOnly.length > 0 ||
    resolvedExcludeRelationships.length > 0 ||
    resolvedOnlyRelationships.length > 0;
  const metadata = React.useMemo(() => {
    if (!rawMetadata) return null;
    if (!hasFilters) return rawMetadata;
    return applyMetadataFilters(rawMetadata, {
      exclude: resolvedExclude,
      only: resolvedOnly,
      excludeRelationships: resolvedExcludeRelationships,
      onlyRelationships: resolvedOnlyRelationships,
    });
  }, [
    rawMetadata,
    hasFilters,
    resolvedExclude,
    resolvedOnly,
    resolvedExcludeRelationships,
    resolvedOnlyRelationships,
  ]);

  const baseLoading =
    !skip && !rawMetadata && (networkState.loading || shouldFetch);

  const [nestedMetadata, setNestedMetadata] = React.useState<
    Record<string, FormMetadata>
  >({});
  const [nestedLoading, setNestedLoading] = React.useState(false);
  const [nestedError, setNestedError] = React.useState<ApolloError | undefined>(
    undefined,
  );

  const nestedTargets = React.useMemo(() => {
    if (!metadata || resolvedNestedFields.length === 0) {
      return EMPTY_NESTED_TARGETS;
    }
    return resolveNestedTargets(metadata, resolvedNestedFields);
  }, [metadata, resolvedNestedFields]);

  React.useEffect(() => {
    if (nestedTargets.length === 0) {
      if (
        nestedLoading ||
        nestedError ||
        Object.keys(nestedMetadata).length > 0
      ) {
        setNestedMetadata({});
        setNestedLoading(false);
        setNestedError(undefined);
      }
      return;
    }

    let cancelled = false;
    setNestedLoading(true);
    setNestedError(undefined);

    const loadNested = async () => {
      const results: Record<string, FormMetadata> = {};
      for (const target of nestedTargets) {
        const nestedSignature = stableSerialize({ objectId: null });
        const nestedScopeKey = buildMetadataScopeKey(
          target.app,
          target.model,
          nestedSignature,
        );
        const cached = readMetadataCacheEntry<FormMetadata>(
          "form",
          nestedScopeKey,
        );
        if (isCacheEntryFresh(cached, METADATA_CACHE_TTL_MS)) {
          if (cached?.data) {
            results[target.name] = cached.data;
          }
          continue;
        }
        const response = await client.query({
          query: GET_MODEL_FORM_SCHEMA,
          variables: { app: target.app, model: target.model },
          fetchPolicy: metadataQueryOptions.fetchPolicy,
          errorPolicy: metadataQueryOptions.errorPolicy,
          context: metadataQueryOptions.context,
        });
        const payload = response.data?.modelSchema ?? null;
        if (payload) {
          writeMetadataCacheEntry(
            "form",
            nestedScopeKey,
            payload.metadataVersion,
            payload,
          );
          results[target.name] = payload as FormMetadata;
        }
      }
      return results;
    };

    loadNested()
      .then((results) => {
        if (!cancelled) {
          setNestedMetadata(results ?? {});
          setNestedLoading(false);
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setNestedError(error as ApolloError);
          setNestedLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [
    client,
    metadataQueryOptions.context,
    metadataQueryOptions.errorPolicy,
    metadataQueryOptions.fetchPolicy,
    nestedTargets,
  ]);

  return {
    metadata,
    nestedMetadata,
    loading: baseLoading || nestedLoading,
    error: networkState.error ?? nestedError,
    refetch,
  };
}

function applyMetadataFilters(
  metadata: FormMetadata,
  filters: {
    exclude: string[];
    only: string[];
    excludeRelationships: string[];
    onlyRelationships: string[];
  },
): FormMetadata {
  const excludeSet = new Set(filters.exclude);
  const onlySet = new Set(filters.only);
  const excludeRelSet = new Set(filters.excludeRelationships);
  const onlyRelSet = new Set(filters.onlyRelationships);

  const filterFields = metadata.fields.filter((field) => {
    if (excludeSet.has(field.name) || excludeSet.has(field.fieldName)) {
      return false;
    }
    if (onlySet.size > 0) {
      return onlySet.has(field.name) || onlySet.has(field.fieldName);
    }
    return true;
  });

  const filterRelationships = metadata.relationships.filter((relation) => {
    if (excludeRelSet.has(relation.name) || excludeRelSet.has(relation.fieldName)) {
      return false;
    }
    if (onlyRelSet.size > 0) {
      return onlyRelSet.has(relation.name) || onlyRelSet.has(relation.fieldName);
    }
    return true;
  });

  return {
    ...metadata,
    fields: filterFields,
    relationships: filterRelationships,
  };
}
