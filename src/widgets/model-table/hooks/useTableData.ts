import { useEffect, useMemo } from "react";
import {
  useModelPageQuery,
  type ModelPageQueryVariablesInput,
  type ModelMetadata,
} from "@/shared/api/graphql/graphql";
import { useMetadata } from "../context/MetadataContext";
import { useTable } from "../context/TableContext";
import { useDebouncedValue } from "./useDebouncedValue";
import type {
  BaseModelTableFieldsInput,
  BaseModelTableRelationConfig,
  QueryPageData,
} from "../types";

export type TableDataConfig = {
  fields?: BaseModelTableFieldsInput;
  relations?: Record<string, BaseModelTableRelationConfig>;
  queryManager?: string;
  skipCount?: boolean;
  dataMode?: "pagination" | "infinite";
  visibleAccessors?: string[];
  requiredAccessors?: string[];
};

type FilterVariablesInput = {
  where?: unknown;
  presets?: unknown;
  distinctOn?: unknown;
  orderBy?: unknown;
} | null | undefined;

/**
 * Default backend ordering when no explicit order is provided.
 * Keeps newest records first.
 */
const DEFAULT_BACKEND_ORDER_BY = ["-id"] as const;

/**
 * Normalize unknown values to a non-empty string array.
 */
function toStringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const entries = value
    .filter((entry): entry is string => typeof entry === "string")
    .map((entry) => entry.trim())
    .filter(Boolean);
  return entries.length > 0 ? entries : undefined;
}

/**
 * Resolve orderBy query input with a deterministic descending-id fallback.
 */
function resolveOrderBy(value: unknown): string[] {
  return toStringArray(value) ?? [...DEFAULT_BACKEND_ORDER_BY];
}

/**
 * Build deterministic field accessors passed to generated query selection.
 */
function resolveSelectionFields(
  visibleAccessors?: string[],
  requiredAccessors?: string[],
): string[] | undefined {
  const seen = new Set<string>();
  const resolved: string[] = [];

  [...(visibleAccessors ?? []), ...(requiredAccessors ?? [])].forEach(
    (entry) => {
      const accessor = String(entry || "").trim();
      if (!accessor || seen.has(accessor)) return;
      seen.add(accessor);
      resolved.push(accessor);
    },
  );

  return resolved.length > 0 ? resolved : undefined;
}

/**
 * Fetch table rows using generated model-page query hooks.
 */
export function useTableData(config?: TableDataConfig) {
  const { app, model, metadata } = useMetadata();
  const {
    pagination,
    data: currentData,
    loading: currentTableLoading,
    quickSearch,
    filterVariables,
    refreshKey,
    _setData,
    _setPageInfo,
    _setQueryPage,
  } = useTable();
  const debouncedQuickSearch = useDebouncedValue(quickSearch, 300);

  const selectionFields = useMemo(
    () =>
      resolveSelectionFields(config?.visibleAccessors, config?.requiredAccessors),
    [config?.requiredAccessors, config?.visibleAccessors],
  );

  const variables = useMemo<ModelPageQueryVariablesInput>(() => {
    const filters = filterVariables as FilterVariablesInput;
    const supportsQuick = !!metadata?.filterConfig?.supportsQuick;

    return {
      page: pagination.page,
      perPage: pagination.perPage,
      quick: supportsQuick ? debouncedQuickSearch || undefined : undefined,
      where: filters?.where,
      presets: toStringArray(filters?.presets),
      distinctOn: toStringArray(filters?.distinctOn),
      orderBy: resolveOrderBy(filters?.orderBy),
      skipCount: config?.skipCount ?? false,
    };
  }, [
    config?.skipCount,
    debouncedQuickSearch,
    filterVariables,
    metadata?.filterConfig?.supportsQuick,
    pagination.page,
    pagination.perPage,
  ]);

  const { data, loading, error, refetch } = useModelPageQuery({
    identity: {
      app,
      model,
      managerName: config?.queryManager,
    },
    metadataOptions: {
      metadata: (metadata as unknown as ModelMetadata | null) ?? null,
      metadataProfile: "table",
      skipMetadata: true,
      metadataQueryOptions: {
        fetchPolicy: "network-only",
      },
    },
    selectionOptions: {
      fields: selectionFields,
      relations: config?.relations,
    },
    variables,
    apollo: {
      skip: !app || !model || !metadata,
      fetchPolicy: "cache-and-network",
      nextFetchPolicy: "cache-first",
      returnPartialData: true,
      notifyOnNetworkStatusChange: true,
    },
  });

  const primaryKey = metadata?.primaryKey || "id";

  const mergeUniqueRows = useMemo(
    () =>
      (
        existing: Record<string, unknown>[],
        incoming: Record<string, unknown>[],
      ) => {
        if (incoming.length === 0) return existing;
        const seen = new Set(existing.map((row) => String(row[primaryKey])));
        const newRows = incoming.filter((row) => {
          const key = row[primaryKey];
          if (key === undefined || key === null) return true;
          const strKey = String(key);
          if (seen.has(strKey)) return false;
          seen.add(strKey);
          return true;
        });
        return [...existing, ...newRows];
      },
    [primaryKey],
  );

  useEffect(() => {
    const result = data as QueryPageData | null;

    if (result) {
      _setQueryPage(result);
      const nextItems = Array.isArray(result.items) ? result.items : [];
      const shouldAppend = config?.dataMode === "infinite" && pagination.page > 1;
      const syncedItems = shouldAppend
        ? mergeUniqueRows(currentData, nextItems)
        : nextItems;
      _setData(syncedItems, loading, error);
      _setPageInfo({
        totalCount: result.pageInfo?.totalCount ?? null,
        pageCount: result.pageInfo?.pageCount ?? null,
        hasNextPage: result.pageInfo?.hasNextPage ?? null,
        hasPreviousPage: result.pageInfo?.hasPreviousPage ?? null,
      });
    } else if (error) {
      _setQueryPage(null);
      _setData([], false, error);
    }

    if (loading && !result && !currentTableLoading) {
      _setData(currentData, true);
    }
  }, [
    config?.dataMode,
    currentData,
    currentTableLoading,
    data,
    error,
    loading,
    mergeUniqueRows,
    pagination.page,
    _setData,
    _setPageInfo,
    _setQueryPage,
  ]);

  useEffect(() => {
    if (!refetch || refreshKey === 0 || !metadata) return;
    refetch(variables as Record<string, unknown>);
  }, [metadata, refreshKey, refetch, variables]);

  return { refetch };
}
