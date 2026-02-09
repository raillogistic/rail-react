import { useQuery, gql } from "@apollo/client";
import { useMemo, useEffect } from "react";
import { useTable } from "../context/TableContext";
import { useMetadata } from "../context/MetadataContext";
import { useDebouncedValue } from "./useDebouncedValue";
import type {
  BaseModelTableField,
  BaseModelTableFieldsInput,
  BaseModelTableRelationConfig,
  FieldSchema,
  FilterConfig,
  RelationshipSchema,
} from "../types";
import {
  getSyntheticRelationCountSource,
  mergeBaseModelTableFields,
  normalizeBaseModelTableFieldsInput,
} from "../utils";

function toCamelCase(value: string): string {
  return value.replace(/_([a-z])/g, (_, letter: string) =>
    letter.toUpperCase(),
  );
}

function toSnakeCase(value: string): string {
  return value
    .replace(/([A-Z])/g, "_$1")
    .toLowerCase()
    .replace(/^_/, "");
}

function toGraphqlFieldName(value: string): string {
  const camel = toCamelCase(value || "");
  if (!camel) return "";
  return camel.charAt(0).toLowerCase() + camel.slice(1);
}

// Helper to construct the dynamic query
function buildDynamicQuery(
  _app: string,
  model: string,
  fields: FieldSchema[],
  relationships: RelationshipSchema[] | undefined,
  filterConfig?: FilterConfig,
  fieldConfig?: {
    fields?: BaseModelTableFieldsInput;
    relations?: Record<string, BaseModelTableRelationConfig>;
    skipCount?: boolean;
  },
) {
  // Convert PascalCase model name to camelCase for the query name
  // e.g. User -> userPages
  const lowerCaseModel = model.charAt(0).toLowerCase() + model.slice(1);
  const queryName = `${lowerCaseModel}Pages`;

  const relationLookup = new Map<string, RelationshipSchema>();
  const relationCanonicalByKey = new Map<string, string>();
  const relationByCanonical = new Map<string, RelationshipSchema>();
  relationships?.forEach((relation) => {
    const canonicalName = toGraphqlFieldName(
      relation.name || relation.fieldName,
    );
    if (!canonicalName) return;
    relationByCanonical.set(canonicalName, relation);
    [
      relation.name,
      relation.fieldName,
      canonicalName,
      toSnakeCase(canonicalName),
      toCamelCase(canonicalName),
    ]
      .filter((entry): entry is string => !!entry)
      .forEach((entry) => {
        relationLookup.set(entry, relation);
        relationCanonicalByKey.set(entry, canonicalName);
      });
  });
  const fieldCanonicalByKey = new Map<string, string>();
  fields.forEach((field) => {
    const canonicalName = toGraphqlFieldName(field.name || field.fieldName);
    if (!canonicalName) return;
    [
      field.name,
      field.fieldName,
      canonicalName,
      toSnakeCase(canonicalName),
      toCamelCase(canonicalName),
    ]
      .filter((entry): entry is string => !!entry)
      .forEach((entry) => fieldCanonicalByKey.set(entry, canonicalName));
  });
  const canonicalizeRoot = (root: string) =>
    relationCanonicalByKey.get(root) ??
    fieldCanonicalByKey.get(root) ??
    toGraphqlFieldName(root);
  const canonicalizeAccessor = (accessor: string) => {
    const parts = accessor.replace(/__/g, ".").split(".").filter(Boolean);
    if (parts.length === 0) return "";
    const [root, ...rest] = parts;
    const normalizedRoot = canonicalizeRoot(root);
    if (!normalizedRoot) return "";
    const normalizedRest = rest.map((segment) => toGraphqlFieldName(segment));
    return [normalizedRoot, ...normalizedRest.filter(Boolean)].join(".");
  };

  const relationCountSourceLookup = new Map<string, string>();
  fields.forEach((field) => {
    const source = getSyntheticRelationCountSource(field);
    if (!source) return;
    const canonicalSource =
      relationCanonicalByKey.get(source) ?? toGraphqlFieldName(source);
    if (!canonicalSource) return;
    [
      field.name,
      field.fieldName,
      toGraphqlFieldName(field.name || field.fieldName),
    ]
      .filter((entry): entry is string => !!entry)
      .forEach((entry) => relationCountSourceLookup.set(entry, canonicalSource));
  });

  const relationConfig = fieldConfig?.relations ?? {};
  const normalizedFieldsConfig = normalizeBaseModelTableFieldsInput(
    fieldConfig?.fields,
  );
  const excludedAccessors = new Set<string>();
  normalizedFieldsConfig.exclude.forEach((entry) => {
    if (!entry) return;
    excludedAccessors.add(entry);
    excludedAccessors.add(toGraphqlFieldName(entry));
    excludedAccessors.add(toSnakeCase(entry));
    excludedAccessors.add(toCamelCase(entry));
    const root = entry.split(".")[0]?.split("__")[0];
    if (!root) return;
    excludedAccessors.add(root);
    excludedAccessors.add(toGraphqlFieldName(root));
    excludedAccessors.add(toSnakeCase(root));
    excludedAccessors.add(toCamelCase(root));
  });

  const resolveRelationNameForCountAccessor = (accessor: string) => {
    const explicit =
      relationCountSourceLookup.get(accessor) ??
      relationCountSourceLookup.get(canonicalizeRoot(accessor));
    if (explicit) return explicit;
    const stripped = accessor.replace(/count$/i, "");
    if (!stripped || stripped === accessor) return null;
    const candidates = new Set<string>([
      stripped,
      stripped.charAt(0).toLowerCase() + stripped.slice(1),
      stripped.charAt(0).toUpperCase() + stripped.slice(1),
      stripped
        .replace(/([A-Z])/g, "_$1")
        .toLowerCase()
        .replace(/^_/, ""),
      stripped.replace(/_([a-z])/g, (_, letter: string) =>
        letter.toUpperCase(),
      ),
    ]);
    for (const candidate of candidates) {
      const canonical = relationCanonicalByKey.get(candidate);
      if (canonical) return canonical;
    }
    return null;
  };

  const isRelationField = (name: string) => {
    const canonical = canonicalizeRoot(name);
    if (!canonical) return false;
    if (relationByCanonical.has(canonical)) return true;
    return fields.some((field) => {
      if (!field.isRelation) return false;
      const fieldCanonical = toGraphqlFieldName(field.name || field.fieldName);
      return fieldCanonical === canonical;
    });
  };

  const resolveRelationConfig = (
    canonicalName: string,
    relation?: RelationshipSchema,
  ) => {
    const candidates = [
      canonicalName,
      relation?.name,
      relation?.fieldName,
      toSnakeCase(canonicalName),
      toCamelCase(canonicalName),
    ].filter((entry): entry is string => !!entry);
    for (const candidate of candidates) {
      if (relationConfig[candidate]) return relationConfig[candidate];
    }
    return undefined;
  };

  const buildRelationSelection = (relationNameRaw: string) => {
    const relationName =
      relationCanonicalByKey.get(relationNameRaw) ??
      toGraphqlFieldName(relationNameRaw);
    const relation =
      relationByCanonical.get(relationName) ??
      relationLookup.get(relationNameRaw);
    const config = resolveRelationConfig(relationName, relation);
    const selections = new Set<string>(
      (config?.fields ?? []).map((entry) => toGraphqlFieldName(entry)),
    );
    selections.add("id");
    selections.add("desc");
    if (config?.display) {
      selections.add(toGraphqlFieldName(config.display));
    }
    if (
      relation?.lookupField &&
      relation.lookupField !== "id" &&
      relation.lookupField !== "__str__"
    ) {
      selections.add(toGraphqlFieldName(relation.lookupField));
    }
    const renderedSelections = Array.from(selections).filter(Boolean);
    return `${relationName} {\n        ${renderedSelections.join("\n        ")}\n      }`;
  };

  const defaultDisplayFields: BaseModelTableField[] = fields
    .filter((field) => field.visibility !== "hidden")
    .map((field) => toGraphqlFieldName(field.name || field.fieldName))
    .filter(Boolean);

  const resolvedIncludeFields = mergeBaseModelTableFields({
    include: normalizedFieldsConfig.include,
    defaults: defaultDisplayFields,
    add: normalizedFieldsConfig.add,
    excludedAccessors,
  });

  const fieldSelection = (() => {
    interface SelectionTree {
      [key: string]: SelectionTree | true;
    }
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
      defaults.add("desc");
      if (config?.display) {
        defaults.add(config.display);
      }
      if (
        relation?.lookupField &&
        relation.lookupField !== "id" &&
        relation.lookupField !== "__str__"
      ) {
        defaults.add(relation.lookupField);
      }
      defaults.forEach((field) => addPathToTree(relationNode, [field]));
    };

    resolvedIncludeFields.forEach((entry) => {
      const rawAccessor = typeof entry === "string" ? entry : entry.accessor;
      if (!rawAccessor) return;
      const accessor = canonicalizeAccessor(rawAccessor);
      if (!accessor) return;
      const parts = accessor.split(".");
      const [root, ...rest] = parts;
      if (!root) return;

      if (rest.length === 0) {
        const countSource = resolveRelationNameForCountAccessor(root);
        if (countSource) {
          addRelationDefaults(countSource);
          return;
        }
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

    const serializeTree = (node: SelectionTree): string =>
      Object.entries(node)
        .map(([key, value]) =>
          value === true ? key : `${key} {\n        ${serializeTree(value)}\n      }`,
        )
        .join("\n      ");

    return serializeTree(tree);
  })();

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
  fields?: BaseModelTableFieldsInput;
  relations?: Record<string, BaseModelTableRelationConfig>;
  skipCount?: boolean;
  dataMode?: "pagination" | "infinite";
}) {
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
  } = useTable();
  const debouncedQuickSearch = useDebouncedValue(quickSearch, 300);

  const normalizeOrderByValue = useMemo(() => {
    const rootCanonicalByKey = new Map<string, string>();
    const register = (key: string | undefined, canonical: string) => {
      if (!key) return;
      rootCanonicalByKey.set(key, canonical);
      rootCanonicalByKey.set(toGraphqlFieldName(key), canonical);
      rootCanonicalByKey.set(toSnakeCase(key), canonical);
      rootCanonicalByKey.set(toCamelCase(key), canonical);
    };

    metadata?.fields.forEach((field) => {
      const canonical = toGraphqlFieldName(field.name || field.fieldName);
      if (!canonical) return;
      register(field.name, canonical);
      register(field.fieldName, canonical);
      register(canonical, canonical);
    });

    metadata?.relationships?.forEach((relation) => {
      const canonical = toGraphqlFieldName(relation.name || relation.fieldName);
      if (!canonical) return;
      register(relation.name, canonical);
      register(relation.fieldName, canonical);
      register(canonical, canonical);
    });

    return (value: string): string | null => {
      if (!value) return null;
      const isDesc = value.startsWith("-");
      const normalized = isDesc ? value.slice(1) : value;
      const separator = normalized.includes("__")
        ? "__"
        : normalized.includes(".")
          ? "."
          : null;
      const segments = separator
        ? normalized.split(separator).filter(Boolean)
        : [normalized];
      if (segments.length === 0) return null;
      const [root, ...rest] = segments;
      const canonicalRoot = rootCanonicalByKey.get(root);
      if (!canonicalRoot) return null;
      const canonicalRest = rest.map((segment) => toGraphqlFieldName(segment));
      const rebuilt = [canonicalRoot, ...canonicalRest.filter(Boolean)].join(
        separator ?? "__",
      );
      if (!rebuilt) return null;
      return isDesc ? `-${rebuilt}` : rebuilt;
    };
  }, [metadata?.fields, metadata?.relationships]);

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
    // Merge filter variables if present
    const where = filterVariables?.where;
    const presetsRaw = filterVariables?.presets;
    const distinctOnRaw = filterVariables?.distinctOn;
    const orderByRaw = filterVariables?.orderBy;
    const presets = Array.isArray(presetsRaw)
      ? presetsRaw.filter((entry): entry is string => typeof entry === "string")
      : undefined;
    const distinctOn = Array.isArray(distinctOnRaw)
      ? distinctOnRaw.filter(
          (entry): entry is string => typeof entry === "string",
        )
      : undefined;
    const orderBy = Array.isArray(orderByRaw)
      ? orderByRaw.filter((entry): entry is string => typeof entry === "string")
      : undefined;
    const sanitizedOrderBy = orderBy
      ?.map((entry) => normalizeOrderByValue(entry))
      .filter((entry): entry is string => !!entry);
    // orderBy is driven by advanced filters (if provided).

    const supportsQuick = !!metadata?.filterConfig?.supportsQuick;

    return {
      page: pagination.page,
      perPage: pagination.perPage,
      orderBy:
        sanitizedOrderBy && sanitizedOrderBy.length > 0
          ? sanitizedOrderBy
          : undefined,
      ...(supportsQuick ? { quick: debouncedQuickSearch || undefined } : {}),
      where,
      presets,
      distinctOn,
      skipCount: config?.skipCount ?? false,
    };
  }, [
    pagination.page,
    pagination.perPage,
    debouncedQuickSearch,
    filterVariables,
    normalizeOrderByValue,
    metadata?.filterConfig?.supportsQuick,
    config?.skipCount,
  ]);

  // 3. Execute Query
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
      fetchPolicy: "network-only", // Ensure fresh data for tables usually
      notifyOnNetworkStatusChange: true,
    },
  );
  const mergeUniqueRows = useMemo(
    () =>
      (
        existing: Record<string, unknown>[],
        incoming: Record<string, unknown>[],
      ) => {
        const merged = [...existing];
        const seen = new Set<string>();
        existing.forEach((row) => {
          if (row?.id !== undefined && row?.id !== null) {
            seen.add(String(row.id));
          }
        });
        incoming.forEach((row) => {
          const rowId = row?.id;
          if (rowId === undefined || rowId === null) {
            merged.push(row);
            return;
          }
          const key = String(rowId);
          if (seen.has(key)) return;
          seen.add(key);
          merged.push(row);
        });
        return merged;
      },
    [],
  );

  // 4. Sync to Context
  useEffect(() => {
    if (data) {
      const lowerCaseModel = model.charAt(0).toLowerCase() + model.slice(1);
      const queryName = `${lowerCaseModel}Pages`;
      const result = data[queryName];
      if (result) {
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
      }
    } else if (error) {
      _setData([], false, error);
    }
    if (loading && !data && !currentTableLoading) {
      // Mark table as loading immediately while keeping current rows (if any)
      // so we don't flash an empty state before the response arrives.
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
  ]);

  useEffect(() => {
    if (!query) return;
    if (!refetch) return;
    if (refreshKey === 0) return;
    refetch(variables);
  }, [refreshKey, query, refetch, variables]);

  return { refetch };
}

