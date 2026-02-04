import { useQuery, gql } from "@apollo/client";
import { useMemo, useEffect } from "react";
import { useTable } from "../context/TableContext";
import { useMetadata } from "../context/MetadataContext";
import { useDebouncedValue } from "./useDebouncedValue";
import type {
  BaseModelTableField,
  BaseModelTableRelationConfig,
  FieldSchema,
  RelationshipSchema,
} from "../types";

// Helper to construct the dynamic query
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildDynamicQuery(
  _app: string,
  model: string,
  fields: FieldSchema[],
  relationships: RelationshipSchema[] | undefined,
  filterConfig?: any,
  fieldConfig?: {
    fields?: BaseModelTableField[];
    relations?: Record<string, BaseModelTableRelationConfig>;
    ordering?: {
      allow?: string[];
      map?: Record<string, string | { id: string }>;
    };
    skipCount?: boolean;
  },
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

  const relationConfig = fieldConfig?.relations ?? {};

  const isRelationField = (name: string) =>
    fields.some(
      (field) =>
        (field.name === name || field.fieldName === name) && field.isRelation,
    ) ||
    relationLookup.has(name);

  const buildRelationSelection = (relationName: string) => {
    const relation =
      relationLookup.get(relationName) ?? relationLookup.get(relationName);
    const config = relationConfig[relationName];
    const selections = new Set<string>(config?.fields ?? []);
    selections.add("id");
    if (config?.display) {
      selections.add(config.display);
    } else {
      selections.add("desc");
    }
    if (
      relation?.lookupField &&
      relation.lookupField !== "id" &&
      relation.lookupField !== "__str__"
    ) {
      selections.add(relation.lookupField);
    }
    return `${relationName} {\n        ${Array.from(selections).join("\n        ")}\n      }`;
  };

  const buildDefaultFieldSelection = () =>
    fields
      .filter((f) => f.visibility !== "hidden")
      .map((field) => {
        if (!field.isRelation) {
          return field.name;
        }
        return buildRelationSelection(field.name);
      })
      .join("\n      ");

  const fieldSelection =
    fieldConfig?.fields && fieldConfig.fields.length > 0
      ? (() => {
          type SelectionTree = Record<string, SelectionTree | true>;
          const tree: SelectionTree = {};

          const ensureObject = (node: SelectionTree, key: string) => {
            if (!node[key] || node[key] === true) {
              node[key] = {};
            }
            return node[key] as SelectionTree;
          };

          const addPathToTree = (node: SelectionTree, parts: string[]) => {
            const [head, ...rest] = parts;
            if (!head) return;
            if (rest.length === 0) {
              node[head] = true;
              return;
            }
            const child = ensureObject(node, head);
            addPathToTree(child, rest);
          };

          const addRelationDefaults = (relationName: string) => {
            const relation = relationLookup.get(relationName);
            const relationNode = ensureObject(tree, relationName);
            const config = relationConfig[relationName];
            const defaults = new Set<string>(config?.fields ?? []);
            defaults.add("id");
            defaults.add(config?.display ?? "desc");
            if (
              relation?.lookupField &&
              relation.lookupField !== "id" &&
              relation.lookupField !== "__str__"
            ) {
              defaults.add(relation.lookupField);
            }
            defaults.forEach((field) => addPathToTree(relationNode, [field]));
          };

          fieldConfig.fields.forEach((entry) => {
            const accessor =
              typeof entry === "string" ? entry : entry.accessor;
            if (!accessor) return;
            const parts = accessor.split(".");
            const [root, ...rest] = parts;
            if (!root) return;

            if (rest.length === 0) {
              if (isRelationField(root)) {
                addRelationDefaults(root);
              } else {
                addPathToTree(tree, [root]);
              }
              return;
            }

            addRelationDefaults(root);
            const relationNode = ensureObject(tree, root);
            addPathToTree(relationNode, rest);
          });

          const serializeTree = (node: SelectionTree) =>
            Object.entries(node)
              .map(([key, value]) =>
                value === true
                  ? key
                  : `${key} {\n        ${serializeTree(value)}\n      }`,
              )
              .join("\n      ");

          return serializeTree(tree);
        })()
      : buildDefaultFieldSelection();

  const rowPermissionsSelection = `
      rowPermissions {
        canUpdate
        canDelete
        updateReason
        deleteReason
      }`;

  const finalFieldSelection = [fieldSelection, rowPermissionsSelection]
    .map((selection) => selection?.trim())
    .filter((selection) => selection)
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
      $skipCount: Boolean
    ) {
      ${queryName}(
        page: $page
        perPage: $perPage
        orderBy: $orderBy
        ${supportsQuick ? "quick: $quick" : ""}
        where: $where
        presets: $presets
        distinctOn: $distinctOn
        skipCount: $skipCount
      ) {
        pageInfo {
          totalCount
          pageCount
          hasNextPage
          hasPreviousPage
        }
        items {
          id
          ${finalFieldSelection}
        }
      }
    }
  `;
}

export function useTableData(config?: {
  fields?: BaseModelTableField[];
  relations?: Record<string, BaseModelTableRelationConfig>;
  ordering?: {
    allow?: string[];
    map?: Record<string, string | { id: string }>;
  };
  skipCount?: boolean;
}) {
  const { app, model, metadata } = useMetadata();
  const {
    pagination,
    sorting,
    quickSearch,
    filterVariables,
    refreshKey,
    _setData,
    _setPageInfo
  } = useTable();
  const debouncedQuickSearch = useDebouncedValue(quickSearch, 300);

  // 1. Construct Query
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

  // 2. Prepare Variables
  const variables = useMemo(() => {
    const allow = config?.ordering?.allow;
    const map = config?.ordering?.map;
    const normalizedSorting = sorting
      .map((entry) => {
        const mapped = map?.[entry.id];
        const id =
          typeof mapped === "string"
            ? mapped
            : mapped?.id ?? entry.id;
        return { ...entry, id };
      })
      .filter((entry) => !allow || allow.includes(entry.id));
    const orderBy = normalizedSorting.map((s) => (s.desc ? `-${s.id}` : s.id));

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
      ...(supportsQuick ? { quick: debouncedQuickSearch || undefined } : {}),
      where,
      presets,
      distinctOn,
      skipCount: config?.skipCount ?? false,
    };
  }, [
    pagination.page,
    pagination.perPage,
    sorting,
    debouncedQuickSearch,
    filterVariables,
    metadata?.filterConfig?.supportsQuick,
    config?.skipCount,
    config?.ordering?.allow,
    config?.ordering?.map,
  ]);

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
        _setPageInfo({
          totalCount: result.pageInfo?.totalCount ?? null,
          pageCount: result.pageInfo?.pageCount ?? null,
          hasNextPage: result.pageInfo?.hasNextPage ?? null,
          hasPreviousPage: result.pageInfo?.hasPreviousPage ?? null,
        });
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
  }, [data, loading, error, model, _setData, _setPageInfo]);

  useEffect(() => {
    if (!query) return;
    if (!refetch) return;
    if (refreshKey === 0) return;
    refetch(variables);
  }, [refreshKey, query, refetch, variables]);

  return { refetch };
}
