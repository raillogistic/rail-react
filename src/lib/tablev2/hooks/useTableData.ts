import { useQuery, gql } from "@apollo/client";
import { useMemo, useEffect } from "react";
import { useTable } from "../context/TableContext";
import { useMetadata } from "../context/MetadataContext";
import { FieldSchema, RelationshipSchema } from "../types";

// Helper to construct the dynamic query
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildDynamicQuery(
  _app: string,
  model: string,
  fields: FieldSchema[],
  relationships: RelationshipSchema[] | undefined,
  filterConfig?: any,
) {
  // Convert PascalCase model name to camelCase for the query name
  // e.g. User -> userPages
  const lowerCaseModel = model.charAt(0).toLowerCase() + model.slice(1);
  const queryName = `${lowerCaseModel}Pages`;

  const relationLookup = new Map<string, RelationshipSchema>();
  relationships?.forEach((relation) => {
    if (relation.name) relationLookup.set(relation.name, relation);
    if (relation.fieldName) relationLookup.set(relation.fieldName, relation);
  });

  // Simple field selection for now.
  // In a real app, this might handle nested relations if defined in metadata.
  const fieldSelection = fields
    .filter((f) => f.visibility !== "hidden") // Assume we filter visible fields
    .map((field) => {
      if (!field.isRelation) {
        return field.name;
      }
      const relation =
        relationLookup.get(field.name) ?? relationLookup.get(field.fieldName);
      const selections = new Set<string>(["id", "desc"]);
      if (
        relation?.lookupField &&
        relation.lookupField !== "id" &&
        relation.lookupField !== "__str__"
      ) {
        selections.add(relation.lookupField);
      }
      return `${field.name} {\n        ${Array.from(selections).join("\n        ")}\n      }`;
    })
    .join("\n      ");

  const whereType = filterConfig?.inputTypeName || `${model}WhereInput`;
  const supportsQuick = !!filterConfig?.supportsQuick;

  return gql`
    query ${queryName}(
      $page: Int
      $perPage: Int
      $orderBy: [String]
      ${supportsQuick ? "$quick: String" : ""}
      $where: ${whereType}
      $presets: [String]
      $distinctOn: [String]
    ) {
      ${queryName}(
        page: $page
        perPage: $perPage
        orderBy: $orderBy
        ${supportsQuick ? "quick: $quick" : ""}
        where: $where
        presets: $presets
        distinctOn: $distinctOn
      ) {
        pageInfo {
          totalCount
          pageCount
          hasNextPage
          hasPreviousPage
        }
        items {
          id
          ${fieldSelection}
        }
      }
    }
  `;
}

export function useTableData() {
  const { app, model, metadata } = useMetadata();
  const {
    pagination,
    sorting,
    quickSearch,
    filterVariables,
    refreshKey,
    _setData,
    _setTotal
  } = useTable();

  // 1. Construct Query
  const query = useMemo(() => {
    if (!metadata) return null;
    return buildDynamicQuery(
      app,
      model,
      metadata.fields,
      metadata.relationships,
      metadata.filterConfig,
    );
  }, [app, model, metadata]);

  // 2. Prepare Variables
  const variables = useMemo(() => {
    const orderBy = sorting.map(s => s.desc ? `-${s.id}` : s.id);

    // Merge filter variables if present
    const where = filterVariables?.where;
    const presets = filterVariables?.presets;
    const distinctOn = filterVariables?.distinctOn;
    // Note: filterVariables might also have orderBy, but we prioritize table sorting or merge?
    // Usually table sorting overrides filter sorting or appends.
    // Here we let table sorting take precedence or just use table sorting.
    // Let's stick to table sorting for now as the source of truth for the grid.

    const supportsQuick = !!metadata?.filterConfig?.supportsQuick;

    return {
      page: pagination.page,
      perPage: pagination.perPage,
      orderBy: orderBy.length > 0 ? orderBy : undefined,
      ...(supportsQuick ? { quick: quickSearch || undefined } : {}),
      where,
      presets,
      distinctOn,
    };
  }, [pagination.page, pagination.perPage, sorting, quickSearch, filterVariables, metadata?.filterConfig?.supportsQuick]);

  // 3. Execute Query
  const { data, loading, error, refetch } = useQuery(query || gql`query Skip { __typename }`, {
    skip: !query,
    variables,
    fetchPolicy: "network-only", // Ensure fresh data for tables usually
    notifyOnNetworkStatusChange: true,
  });

  // 4. Sync to Context
  useEffect(() => {
    if (data) {
      const lowerCaseModel = model.charAt(0).toLowerCase() + model.slice(1);
      const queryName = `${lowerCaseModel}Pages`;
      const result = data[queryName];
      if (result) {
        _setData(result.items, loading, error);
        _setTotal(result.pageInfo?.totalCount || 0);
      }
    } else if (error) {
       _setData([], false, error);
    }
     // If loading is true and we have previous data, we might keep it or show loading overlay
     // But strictly syncing loading state:
     if (loading && !data) {
         // _setData([], true, undefined); // Optional: clear data on load? Or keep stale?
         // Usually better to keep stale data and show loading indicator
     }
  }, [data, loading, error, model, _setData, _setTotal]);

  useEffect(() => {
    if (!query) return;
    if (!refetch) return;
    if (refreshKey === 0) return;
    refetch(variables);
  }, [refreshKey, query, refetch, variables]);

  return { refetch };
}
