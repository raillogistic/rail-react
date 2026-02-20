import { gql, useQuery } from "@apollo/client";
import { useEffect, useMemo } from "react";
import { useMetadata } from "../context/MetadataContext";
import { useTable } from "../context/TableContext";
import { useDebouncedValue } from "./useDebouncedValue";
import {
  buildDynamicQuery,
  buildQueryVariables,
  createOrderByNormalizer,
  type TableDataConfig,
} from "./data";
import { buildModelQueryField } from "../utils";
import type { QueryPageData } from "../types";

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

  const normalizeOrderByValue = useMemo(
    () => createOrderByNormalizer(metadata),
    [metadata],
  );

  const query = useMemo(() => {
    if (!metadata) return null;
    return buildDynamicQuery(
      app,
      model,
      metadata.fields,
      metadata.relationships,
      metadata.filterConfig,
      config,
    );
  }, [app, model, metadata, config]);

  const variables = useMemo(
    () =>
      buildQueryVariables({
        page: pagination.page,
        perPage: pagination.perPage,
        debouncedQuickSearch,
        supportsQuick: !!metadata?.filterConfig?.supportsQuick,
        filterVariables,
        skipCount: config?.skipCount ?? false,
        normalizeOrderByValue,
      }),
    [
      config?.skipCount,
      debouncedQuickSearch,
      filterVariables,
      metadata?.filterConfig?.supportsQuick,
      normalizeOrderByValue,
      pagination.page,
      pagination.perPage,
    ],
  );

  const { data, loading, error, refetch } = useQuery(
    query ||
      gql`
        query Skip {
          __typename
        }
      `,
    {
      skip: !query,
      variables,
      fetchPolicy: "cache-and-network",
      nextFetchPolicy: "cache-first",
      returnPartialData: true,
      notifyOnNetworkStatusChange: true,
    },
  );

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
    if (data) {
      const queryName = buildModelQueryField(
        model,
        "page",
        config?.queryManager,
      );
      const result = data[queryName];
      if (result) {
        _setQueryPage(result as QueryPageData);
        const nextItems = Array.isArray(result.items) ? result.items : [];
        const shouldAppend =
          config?.dataMode === "infinite" && pagination.page > 1;
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
      } else {
        _setQueryPage(null);
        // Some GraphQL permission failures return `{ modelPage: null }` with errors.
        // Keep the error in table state so the UI can render a user-facing message.
        if (error) {
          _setData([], false, error);
        }
      }
    } else if (error) {
      _setQueryPage(null);
      _setData([], false, error);
    }
    if (loading && !data && !currentTableLoading) {
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
    model,
    pagination.page,
    _setData,
    _setPageInfo,
    _setQueryPage,
  ]);

  useEffect(() => {
    if (!query || !refetch || refreshKey === 0) return;
    refetch(variables);
  }, [refreshKey, query, refetch, variables]);

  return { refetch };
}
