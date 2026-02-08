import * as React from "react";
import type { ApolloError, QueryHookOptions } from "@apollo/client";
import { useApolloClient } from "@apollo/client";
import {
  fetchMetadataSnapshot,
  normalizeMetadataError,
  useMetadata,
} from "@/lib/metadata/gateway";
import {
  stableSerialize,
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
  const metadataQueryOptions = React.useMemo(
    () => ({
      fetchPolicy: queryOptions?.fetchPolicy ?? DEFAULT_FETCH_POLICY,
      errorPolicy: queryOptions?.errorPolicy,
      context: queryOptions?.context,
    }),
    [queryOptions?.context, queryOptions?.errorPolicy, queryOptions?.fetchPolicy],
  );

  const {
    metadata: rawMetadata,
    loading: gatewayLoading,
    error: gatewayError,
    refetch,
  } = useMetadata({
    app: appName,
    model: modelName,
    profile: "form",
    objectId,
    skip,
    queryOptions: metadataQueryOptions,
  });

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

  const baseLoading = !skip && !rawMetadata && gatewayLoading;

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
        const payload = await fetchMetadataSnapshot(
          client,
          {
            app: target.app,
            model: target.model,
            profile: "form",
            objectId: null,
            skip: false,
            queryOptions: metadataQueryOptions,
          },
          { forceNetwork: false, queryOptions: metadataQueryOptions },
        );
        if (payload) {
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
          setNestedError(normalizeMetadataError(error) as ApolloError);
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
    error: (gatewayError as ApolloError | undefined) ?? nestedError,
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
