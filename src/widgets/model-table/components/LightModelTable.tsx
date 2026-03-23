import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { useQuery } from "@apollo/client";
import { GripVertical, RotateCw } from "lucide-react";
import type {
  ColumnSizingState,
  ExpandedState,
  PaginationState as DynamicPaginationState,
  RowSelectionState,
  VisibilityState,
} from "@tanstack/react-table";
import { createInitialFilterState } from "@/widgets/model-table/filtering/state";
import { Button } from "@/shared/ui/kit/button";
import { cn } from "@/shared/utils";
import { buildModelQueryDocument } from "@/shared/api/graphql/graphql/queries/queryBuilder";
import {
  ColumnsMenu,
  GroupingMenu,
  QuickSearch,
  ViewOptionsMenu,
} from "./toolbar";
import {
  DynamicTable,
  DYNAMIC_TABLE_SELECTION_COLUMN_ID,
  type DynamicTableColumnInput,
  type DynamicTableFeatureFlags,
} from "../dynamic-table";
import { TableProvider, useTable } from "../context/TableContext";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import { useTablePersistence } from "../hooks/useTablePersistence";
import { TablePagination } from "./TablePagination";
import { ModelTableDataErrorDisplay } from "./content/ModelTableFeedback";
import { ModelTableSurface } from "./content/ModelTableSurface";
import {
  mergeBaseModelTableFields,
  mergeModelTableQueryVariables,
  normalizeBaseModelTableFieldsInput,
  resolveColumnVisibility,
  resolveGroupingKey,
  toCamelCase,
  toGraphqlFieldName,
  toSnakeCase,
} from "../utils";
import { buildAccessorPath, resolveValueOptimized } from "../utils/valueResolution";
import type {
  BaseModelTableColumnDef,
  BaseModelTableColumnOrderingConfig,
  BaseModelTableFieldsInput,
  BaseModelTableRefetch,
  BaseModelTableRelationConfig,
  DynamicModelTableRow,
  ModelTableAccessorPath,
  ModelTableRelationKey,
  PaginationState,
  TableDensity,
} from "../types";
import type {
  DynamicModelTableInitVariables,
  ModelTableV2ExpandConfig,
  ModelTableV2PerformanceOptions,
  ModelTableV2TableConfig,
  ModelTableV2ViewOptions,
} from "../config/types";
import {
  areBooleanMapsEqual,
  areNumberMapsEqual,
  areStringArraysEqual,
  formatFallbackCellValue,
  getSelectedRowIds,
  isExpandedStateEqual,
  isPaginationStateEqual,
  isRecord,
  resolveRowId,
} from "./DynamicModelTable.shared";

type SelectionTreeNode = {
  [key: string]: SelectionTreeNode | true;
};

type ResolvedInitialTableState = {
  page: number;
  perPage: number;
  filterVariables: Record<string, unknown>;
  advancedFilters: ReturnType<typeof createInitialFilterState>;
};

type LightColumnBuildResult = {
  columnDefs: BaseModelTableColumnDef[];
  selection: string;
};

export interface LightModelTableSnapshot<
  TSource extends object = Record<string, unknown>,
> {
  data: DynamicModelTableRow<TSource>[];
  selectedRows: DynamicModelTableRow<TSource>[];
  rowSelection: Record<string, boolean>;
  loading: boolean;
  dataError: Error | null;
  pagination: PaginationState | null;
}

export interface LightModelTableHandle<
  TSource extends object = Record<string, unknown>,
> {
  refetch: BaseModelTableRefetch;
  getSnapshot: () => LightModelTableSnapshot<TSource>;
  readonly data: DynamicModelTableRow<TSource>[];
  readonly selectedRows: DynamicModelTableRow<TSource>[];
  readonly rowSelection: Record<string, boolean>;
  readonly loading: boolean;
  readonly dataError: Error | null;
  readonly pagination: PaginationState | null;
}

export interface LightModelTableProps<
  TSource extends object = Record<string, unknown>,
> {
  app: string;
  model: string;
  className?: string;
  persistenceKey?: string;
  fields: BaseModelTableFieldsInput<TSource>;
  quickSearch?: boolean;
  supportsQuickSearch?: boolean;
  primaryKey?: ModelTableAccessorPath<TSource> | string;
  whereTypeName?: string;
  relations?: Partial<
    Record<ModelTableRelationKey<TSource>, BaseModelTableRelationConfig<TSource>>
  >;
  tableConfig?: ModelTableV2TableConfig;
  view?: ModelTableV2ViewOptions;
  performance?: ModelTableV2PerformanceOptions;
  queryManager?: string;
  displayToolbar?: boolean;
  columnOrdering?: BaseModelTableColumnOrderingConfig<ModelTableAccessorPath<TSource>>;
  skipCount?: boolean;
  disableSorting?: boolean;
  enableSelection?: boolean;
  expand?: ModelTableV2ExpandConfig;
  initVariables?: DynamicModelTableInitVariables;
}

const DEFAULT_BACKEND_ORDER_BY = ["-id"] as const;

function toPositiveInteger(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    return null;
  }
  return Math.floor(value);
}

function toStringEntries(value: unknown): string[] {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed ? [trimmed] : [];
  }
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .filter((entry): entry is string => typeof entry === "string")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function resolveInitialTableState(
  initVariables?: DynamicModelTableInitVariables,
): ResolvedInitialTableState {
  const filterVariables = isRecord(initVariables) ? { ...initVariables } : {};
  const page = toPositiveInteger(filterVariables.page) ?? 1;
  const perPage =
    toPositiveInteger(filterVariables.perPage ?? filterVariables.per_page) ?? 10;

  delete filterVariables.page;
  delete filterVariables.perPage;
  delete filterVariables.per_page;

  const presets = (() => {
    const explicit = toStringEntries(filterVariables.presets);
    if (explicit.length > 0) {
      return explicit;
    }
    return toStringEntries(filterVariables.preset);
  })();
  delete filterVariables.preset;
  if (presets.length > 0) {
    filterVariables.presets = presets;
  } else {
    delete filterVariables.presets;
  }

  const distinctOn = toStringEntries(filterVariables.distinctOn);
  if (distinctOn.length > 0) {
    filterVariables.distinctOn = distinctOn;
  } else {
    delete filterVariables.distinctOn;
  }

  const orderBy = resolveOrderByWithFallback(
    filterVariables.orderBy ?? filterVariables.order_by,
  );
  delete filterVariables.order_by;
  filterVariables.orderBy = orderBy;

  const advancedFilters = createInitialFilterState();
  advancedFilters.selectedPresets = presets;
  advancedFilters.distinctOn = distinctOn;
  advancedFilters.orderBy = orderBy;

  return {
    page,
    perPage,
    filterVariables,
    advancedFilters,
  };
}

function normalizeAccessor(accessor: string): string {
  return String(accessor || "")
    .replace(/__/g, ".")
    .split(".")
    .filter(Boolean)
    .map((segment) => toGraphqlFieldName(segment))
    .filter(Boolean)
    .join(".");
}

function normalizeOrderByEntry(entry: string): string | null {
  const trimmed = String(entry || "").trim();
  if (!trimmed) {
    return null;
  }
  const desc = trimmed.startsWith("-");
  const normalized = normalizeAccessor(desc ? trimmed.slice(1) : trimmed);
  if (!normalized) {
    return null;
  }
  const sortKey = normalized.replace(/\./g, "__");
  return desc ? `-${sortKey}` : sortKey;
}

function resolveOrderByWithFallback(value: unknown): string[] {
  const normalized = toStringEntries(value)
    .map((entry) => normalizeOrderByEntry(entry))
    .filter((entry): entry is string => Boolean(entry));
  if (normalized.length > 0) {
    return normalized;
  }
  return [...DEFAULT_BACKEND_ORDER_BY];
}

function prettifyAccessorLabel(accessor: string): string {
  const lastSegment = accessor.split(".").filter(Boolean).pop() ?? accessor;
  const withSpaces = lastSegment
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/_/g, " ");
  return withSpaces.charAt(0).toUpperCase() + withSpaces.slice(1);
}

function buildColumnAliases(value: string): string[] {
  const trimmed = String(value || "").trim();
  if (!trimmed) {
    return [];
  }
  const normalizedPath = trimmed.replace(/__/g, ".");
  const segments = normalizedPath.split(".").filter(Boolean);
  if (segments.length === 0) {
    return [trimmed];
  }

  const graphqlSegments = segments.map((segment) => toGraphqlFieldName(segment));
  const snakeSegments = graphqlSegments.map((segment) => toSnakeCase(segment));
  const camelSegments = graphqlSegments.map((segment) => toCamelCase(segment));

  return Array.from(
    new Set([
      trimmed,
      normalizedPath,
      graphqlSegments.join("."),
      graphqlSegments.join("__"),
      snakeSegments.join("."),
      snakeSegments.join("__"),
      camelSegments.join("."),
      camelSegments.join("__"),
    ]),
  );
}

function normalizeColumnOrderEntries(
  entries: string[],
  availableIds: string[],
): string[] {
  const aliasMap = new Map<string, string>();
  availableIds.forEach((availableId) => {
    buildColumnAliases(availableId).forEach((alias) => {
      if (!aliasMap.has(alias)) {
        aliasMap.set(alias, availableId);
      }
    });
  });

  const ordered: string[] = [];
  const seen = new Set<string>();
  entries.forEach((entry) => {
    const resolved = buildColumnAliases(entry)
      .map((alias) => aliasMap.get(alias))
      .find((candidate): candidate is string => Boolean(candidate));
    if (!resolved || seen.has(resolved)) {
      return;
    }
    seen.add(resolved);
    ordered.push(resolved);
  });
  return ordered;
}

function ensureNode(tree: SelectionTreeNode, key: string): SelectionTreeNode {
  if (!tree[key] || tree[key] === true) {
    tree[key] = {};
  }
  return tree[key] as SelectionTreeNode;
}

function addPath(tree: SelectionTreeNode, accessor: string): void {
  const parts = accessor.split(".").filter(Boolean);
  if (parts.length === 0) {
    return;
  }
  let cursor = tree;
  parts.forEach((part, index) => {
    if (index === parts.length - 1) {
      cursor[part] = true;
      return;
    }
    cursor = ensureNode(cursor, part);
  });
}

function serializeTree(tree: SelectionTreeNode): string {
  return Object.keys(tree)
    .sort()
    .map((key) => {
      const child = tree[key];
      if (child === true) {
        return key;
      }
      return `${key} {\n        ${serializeTree(child)}\n      }`;
    })
    .join("\n      ");
}

function resolveRelationConfig(
  relationRoot: string,
  relations?: Record<string, BaseModelTableRelationConfig>,
): BaseModelTableRelationConfig | undefined {
  if (!relations) {
    return undefined;
  }
  const candidates = [
    relationRoot,
    toSnakeCase(relationRoot),
    toCamelCase(relationRoot),
    toGraphqlFieldName(relationRoot),
  ];
  return candidates
    .map((candidate) => relations[candidate])
    .find((config): config is BaseModelTableRelationConfig => Boolean(config));
}

function addRelationDefaults(
  tree: SelectionTreeNode,
  relationPath: string,
  relationConfig?: BaseModelTableRelationConfig,
): void {
  const displayField = toGraphqlFieldName(relationConfig?.display ?? "desc");
  const extraFields = (relationConfig?.fields ?? [])
    .map((field) => toGraphqlFieldName(String(field)))
    .filter(Boolean);
  ["id", displayField, ...extraFields].forEach((field) => {
    addPath(tree, `${relationPath}.${field}`);
  });
}

function buildLightColumnDefinitions(
  fields: BaseModelTableFieldsInput,
  relations?: Record<string, BaseModelTableRelationConfig>,
  primaryKey?: string,
): LightColumnBuildResult {
  const normalizedFieldsConfig = normalizeBaseModelTableFieldsInput(fields);
  const mergedFields = mergeBaseModelTableFields({
    include: normalizedFieldsConfig.include,
    defaults: [],
    add: normalizedFieldsConfig.add,
    excludedAccessors: new Set(normalizedFieldsConfig.exclude),
  });

  const columnDefs: BaseModelTableColumnDef[] = [];
  const accessors: string[] = [];

  mergedFields.forEach((entry) => {
    const sourceAccessor = typeof entry === "string" ? entry : entry.accessor;
    const accessor = normalizeAccessor(sourceAccessor);
    if (!accessor) {
      return;
    }

    accessors.push(accessor);
    const root = accessor.split(".")[0];
    const relationConfig = resolveRelationConfig(root, relations);
    const displayAccessor =
      accessor.includes(".") || !relationConfig
        ? accessor
        : `${accessor}.${toGraphqlFieldName(relationConfig.display ?? "desc")}`;
    const renderOverride =
      typeof entry === "string"
        ? normalizedFieldsConfig.render[accessor] ??
          normalizedFieldsConfig.render[toSnakeCase(accessor)] ??
          normalizedFieldsConfig.render[root]
        : normalizedFieldsConfig.render[entry.accessor] ??
          normalizedFieldsConfig.render[accessor] ??
          normalizedFieldsConfig.render[toSnakeCase(accessor)] ??
          normalizedFieldsConfig.render[root];

    columnDefs.push({
      id: accessor,
      accessor: displayAccessor,
      title:
        (typeof entry === "object" && entry.title) ||
        prettifyAccessorLabel(accessor),
      render:
        typeof entry === "object" && entry.render
          ? entry.render
          : renderOverride
            ? (value, row, context) =>
                renderOverride(value, row, context.data, context.refetch)
            : undefined,
    });
  });

  const tree: SelectionTreeNode = {};
  const normalizedPrimaryKey = normalizeAccessor(primaryKey || "id") || "id";
  addPath(tree, normalizedPrimaryKey);

  accessors.forEach((accessor) => {
    const parts = accessor.split(".").filter(Boolean);
    if (parts.length === 0) {
      return;
    }

    const rootRelationConfig = resolveRelationConfig(parts[0], relations);
    if (parts.length === 1 && rootRelationConfig) {
      addRelationDefaults(tree, parts[0], rootRelationConfig);
      return;
    }

    if (parts.length > 1) {
      for (let depth = 1; depth < parts.length; depth += 1) {
        const relationPath = parts.slice(0, depth).join(".");
        addRelationDefaults(
          tree,
          relationPath,
          depth === 1 ? rootRelationConfig : undefined,
        );
      }
    }

    addPath(tree, accessor);
  });

  return {
    columnDefs,
    selection: serializeTree(tree),
  };
}

function resolveTableDensity(value?: TableDensity): TableDensity {
  if (
    value === "compact" ||
    value === "comfortable" ||
    value === "spacious"
  ) {
    return value;
  }
  return "compact";
}

function LightModelTableContent<
  TSource extends object = Record<string, unknown>,
>({
  app,
  model,
  persistenceKey,
  fields,
  relations,
  tableConfig,
  view,
  performance,
  queryManager,
  displayToolbar = true,
  columnOrdering,
  skipCount = true,
  disableSorting,
  enableSelection,
  expand,
  primaryKey = "id",
  whereTypeName,
  supportsQuickSearch = true,
  quickSearch = true,
  onRefetchResolved,
  onSnapshotResolved,
}: LightModelTableProps<TSource> & {
  onRefetchResolved?: (refetch?: BaseModelTableRefetch) => void;
  onSnapshotResolved?: (snapshot: LightModelTableSnapshot<TSource>) => void;
}) {
  const {
    data,
    loading: tableLoading,
    error: dataError,
    pagination,
    quickSearch: quickSearchTerm,
    filterVariables,
    advancedFilters,
    rowSelection,
    columnVisibility,
    columnWidths,
    columnOrder,
    groupingField,
    groupCollapsed,
    dragModeEnabled,
    density,
    wrapCells,
    refreshKey,
    setQuickSearch,
    setAdvancedFilters,
    setColumnOrder,
    setColumnVisibility,
    setColumnWidths,
    setRowSelection,
    setGroupingField,
    setGroupCollapsed,
    setDragModeEnabled,
    setDensity,
    setWrapCells,
    setPage,
    setPerPage,
    _setData,
    _setPageInfo,
    _setQueryPage,
  } = useTable();

  const [searchFocused, setSearchFocused] = useState(false);
  const [columnSearch, setColumnSearch] = useState("");
  const [dynamicExpanded, setDynamicExpanded] = useState<ExpandedState>({});
  const debouncedQuickSearch = useDebouncedValue(quickSearchTerm, 300);
  const relationConfigMap =
    relations as unknown as Record<string, BaseModelTableRelationConfig> | undefined;

  const effectiveKey = useMemo(() => {
    if (persistenceKey) {
      return persistenceKey;
    }
    const locationPath =
      typeof window !== "undefined" ? window.location.pathname : "";
    return `${app}-${model}-${locationPath}`;
  }, [app, model, persistenceKey]);

  const { columnDefs, selection } = useMemo(
    () =>
      buildLightColumnDefinitions(
        fields as BaseModelTableFieldsInput,
        relationConfigMap,
        String(primaryKey),
      ),
    [fields, primaryKey, relationConfigMap],
  );

  const { hydrated: persistenceHydrated } = useTablePersistence(effectiveKey, {
    hydrateColumnOrder: true,
  });

  const availableColumnIds = useMemo(
    () => columnDefs.map((column) => column.id),
    [columnDefs],
  );

  const orderedColumns = useMemo(() => {
    const baseColumns = columnDefs.map((column) => {
      const rootKey = column.id.split(".")[0];
      return {
        id: column.id,
        label: String(column.title || column.id),
        visibilityKeys: Array.from(
          new Set(
            [column.id, column.accessor, rootKey].filter(
              (entry): entry is string => Boolean(entry),
            ),
          ),
        ),
      };
    });

    if (columnOrder.length === 0) {
      return baseColumns;
    }

    const byId = new Map(baseColumns.map((column) => [column.id, column]));
    const seen = new Set<string>();
    const ordered: typeof baseColumns = [];

    columnOrder.forEach((id) => {
      const column = byId.get(id);
      if (!column || seen.has(column.id)) {
        return;
      }
      ordered.push(column);
      seen.add(column.id);
    });

    baseColumns.forEach((column) => {
      if (seen.has(column.id)) {
        return;
      }
      ordered.push(column);
      seen.add(column.id);
    });

    return ordered;
  }, [columnDefs, columnOrder]);

  const visibleColumns = useMemo(
    () =>
      orderedColumns.filter((column) =>
        column.label.toLowerCase().includes(columnSearch.toLowerCase()),
      ),
    [columnSearch, orderedColumns],
  );

  const allColumnsVisible = useMemo(
    () =>
      orderedColumns.length > 0 &&
      orderedColumns.every((column) =>
        resolveColumnVisibility(columnVisibility, column.visibilityKeys),
      ),
    [columnVisibility, orderedColumns],
  );

  const groupableFields = useMemo(
    () =>
      columnDefs.map((column) => ({
        value: column.id,
        label: String(column.title || column.id),
      })),
    [columnDefs],
  );

  useEffect(() => {
    if (!persistenceHydrated || availableColumnIds.length === 0) {
      return;
    }

    const baseOrder =
      columnOrder.length > 0 ? columnOrder : columnOrdering?.order ?? [];
    const normalizedBaseOrder = normalizeColumnOrderEntries(
      baseOrder,
      availableColumnIds,
    );
    const missing = availableColumnIds.filter(
      (columnId) => !normalizedBaseOrder.includes(columnId),
    );
    const resolvedOrder =
      (columnOrdering?.append ?? "end") === "start"
        ? [...missing, ...normalizedBaseOrder]
        : [...normalizedBaseOrder, ...missing];

    if (!areStringArraysEqual(resolvedOrder, columnOrder)) {
      setColumnOrder(resolvedOrder);
    }

    const nextVisibility: Record<string, boolean> = { ...columnVisibility };
    let changed = false;
    availableColumnIds.forEach((columnId) => {
      if (typeof nextVisibility[columnId] !== "boolean") {
        nextVisibility[columnId] = true;
        changed = true;
      }
    });
    if (changed) {
      setColumnVisibility(nextVisibility);
    }
  }, [
    availableColumnIds,
    columnOrder,
    columnOrdering?.append,
    columnOrdering?.order,
    columnVisibility,
    persistenceHydrated,
    setColumnOrder,
    setColumnVisibility,
  ]);

  const toggleColumn = useCallback(
    (
      column: { visibilityKeys: string[] },
      checked: boolean,
    ) => {
      const nextVisibility = { ...columnVisibility };
      column.visibilityKeys.forEach((key) => {
        nextVisibility[key] = checked;
      });
      setColumnVisibility(nextVisibility);
    },
    [columnVisibility, setColumnVisibility],
  );

  const orderBy = useMemo(() => {
    const variableOrderBy = isRecord(filterVariables)
      ? resolveOrderByWithFallback(filterVariables.orderBy)
      : [];
    if (variableOrderBy.length > 0) {
      return variableOrderBy;
    }
    return resolveOrderByWithFallback(advancedFilters.orderBy);
  }, [advancedFilters.orderBy, filterVariables]);

  const queryVariables = useMemo(() => {
    const merged = mergeModelTableQueryVariables(
      filterVariables,
      quickSearch ? { quick: debouncedQuickSearch || undefined } : undefined,
    );
    return {
      page: pagination.page,
      perPage: pagination.perPage,
      quick:
        quickSearch && supportsQuickSearch
          ? debouncedQuickSearch || undefined
          : undefined,
      where: merged.where,
      presets: toStringEntries(merged.presets),
      distinctOn: toStringEntries(merged.distinctOn),
      orderBy: resolveOrderByWithFallback(merged.orderBy),
      skipCount,
    };
  }, [
    debouncedQuickSearch,
    filterVariables,
    pagination.page,
    pagination.perPage,
    quickSearch,
    skipCount,
    supportsQuickSearch,
  ]);

  const builtDocument = useMemo(
    () =>
      buildModelQueryDocument({
        mode: "page",
        model,
        managerName: queryManager,
        selection,
        whereTypeName: whereTypeName || `${model}WhereInput`,
        supportsQuick: supportsQuickSearch,
        includeRowPermissions: false,
      }),
    [model, queryManager, selection, supportsQuickSearch, whereTypeName],
  );

  const {
    data: rawQueryData,
    loading,
    error,
    refetch: apolloRefetch,
  } = useQuery<Record<string, unknown>>(builtDocument.queryDocument, {
    variables: queryVariables,
    skip: !persistenceHydrated || !selection,
    fetchPolicy: "cache-and-network",
    nextFetchPolicy: "cache-first",
    returnPartialData: true,
    notifyOnNetworkStatusChange: false,
  });

  const isInfiniteMode = (performance?.dataMode ?? "pagination") === "infinite";
  const queryResult = rawQueryData?.[builtDocument.queryName] as
    | {
        items?: Record<string, unknown>[] | null;
        pageInfo?: {
          totalCount?: number | null;
          pageCount?: number | null;
          hasNextPage?: boolean | null;
          hasPreviousPage?: boolean | null;
        } | null;
      }
    | null
    | undefined;

  const mergeUniqueRows = useCallback(
    (
      currentRows: Record<string, unknown>[],
      nextRows: Record<string, unknown>[],
    ) => {
      if (nextRows.length === 0) {
        return currentRows;
      }
      const seen = new Set(
        currentRows.map((row, index) => resolveRowId(row, index, String(primaryKey))),
      );
      const mergedRows = [...currentRows];
      nextRows.forEach((row, index) => {
        const rowId = resolveRowId(row, index, String(primaryKey));
        if (seen.has(rowId)) {
          return;
        }
        seen.add(rowId);
        mergedRows.push(row);
      });
      return mergedRows;
    },
    [primaryKey],
  );

  useEffect(() => {
    if (queryResult) {
      const nextRows = Array.isArray(queryResult.items) ? queryResult.items : [];
      const shouldAppend = isInfiniteMode && pagination.page > 1;
      const syncedRows = shouldAppend ? mergeUniqueRows(data, nextRows) : nextRows;
      _setQueryPage(queryResult as Record<string, unknown>);
      _setData(syncedRows, loading, error as Error | undefined);
      _setPageInfo({
        totalCount: queryResult.pageInfo?.totalCount ?? null,
        pageCount: queryResult.pageInfo?.pageCount ?? null,
        hasNextPage: queryResult.pageInfo?.hasNextPage ?? null,
        hasPreviousPage: queryResult.pageInfo?.hasPreviousPage ?? null,
      });
      return;
    }

    if (error) {
      _setQueryPage(null);
      _setData([], false, error);
    } else if (loading) {
      _setData(data, true);
    }
  }, [
    _setData,
    _setPageInfo,
    _setQueryPage,
    data,
    error,
    isInfiniteMode,
    loading,
    mergeUniqueRows,
    pagination.page,
    queryResult,
  ]);

  useEffect(() => {
    if (!apolloRefetch || refreshKey === 0 || !persistenceHydrated) {
      return;
    }
    void apolloRefetch(queryVariables);
  }, [apolloRefetch, persistenceHydrated, queryVariables, refreshKey]);

  const refetch = useCallback<BaseModelTableRefetch>(
    (overrides?: Record<string, unknown>) => {
      const nextVariables = {
        ...queryVariables,
        ...(overrides ?? {}),
      };
      return apolloRefetch(nextVariables);
    },
    [apolloRefetch, queryVariables],
  );

  useEffect(() => {
    onRefetchResolved?.(refetch);
    return () => {
      onRefetchResolved?.(undefined);
    };
  }, [onRefetchResolved, refetch]);

  const selectedRowIds = useMemo(() => getSelectedRowIds(rowSelection), [rowSelection]);
  const selectedRowsCacheRef = useRef<Record<string, DynamicModelTableRow<TSource>>>(
    {},
  );
  const selectedRows = useMemo(() => {
    if (selectedRowIds.length === 0) {
      selectedRowsCacheRef.current = {};
      return [];
    }

    const selectedRowIdSet = new Set(selectedRowIds);
    const nextCache = { ...selectedRowsCacheRef.current };
    Object.keys(nextCache).forEach((rowId) => {
      if (!selectedRowIdSet.has(rowId)) {
        delete nextCache[rowId];
      }
    });

    (data as DynamicModelTableRow<TSource>[]).forEach((row, index) => {
      const rowId = resolveRowId(row, index, String(primaryKey));
      if (selectedRowIdSet.has(rowId)) {
        nextCache[rowId] = row;
      }
    });
    selectedRowsCacheRef.current = nextCache;

    return selectedRowIds
      .map((rowId) => nextCache[rowId])
      .filter((row): row is DynamicModelTableRow<TSource> => row !== undefined);
  }, [data, primaryKey, selectedRowIds]);

  useEffect(() => {
    onSnapshotResolved?.({
      data: data as DynamicModelTableRow<TSource>[],
      selectedRows,
      rowSelection,
      loading: tableLoading,
      dataError: (dataError as Error | null) ?? null,
      pagination,
    });
  }, [
    data,
    dataError,
    onSnapshotResolved,
    pagination,
    rowSelection,
    selectedRows,
    tableLoading,
  ]);

  const accessorPathLookup = useMemo(() => {
    const lookup = new Map<string, string[]>();
    columnDefs.forEach((column) => {
      lookup.set(column.accessor, buildAccessorPath(column.accessor));
    });
    return lookup;
  }, [columnDefs]);

  const dynamicColumns = useMemo<DynamicTableColumnInput<Record<string, unknown>>[]>(
    () =>
      columnDefs.map((column) => {
        const accessorPath =
          accessorPathLookup.get(column.accessor) ?? buildAccessorPath(column.accessor);
        return {
          id: column.id,
          title: column.title,
          accessorFn: (row) => resolveValueOptimized(row, accessorPath),
          sortKey: column.id.replace(/\./g, "__"),
          enableSorting: disableSorting ? false : true,
          size: columnWidths[column.id],
          cell: ({ row, value }) =>
            column.render
              ? column.render(value, row, {
                  accessor: column.accessor,
                  columnId: column.id,
                  data,
                  refetch,
                })
              : formatFallbackCellValue(value),
        };
      }),
    [accessorPathLookup, columnDefs, columnWidths, data, disableSorting, refetch],
  );

  const selectedPaginationState = useMemo<DynamicPaginationState>(
    () => ({
      pageIndex: Math.max(0, pagination.page - 1),
      pageSize: pagination.perPage,
    }),
    [pagination.page, pagination.perPage],
  );

  const features = useMemo<DynamicTableFeatureFlags>(
    () => ({
      enableSelection: enableSelection ?? true,
      enableColumnOrdering: columnOrdering?.draggable !== false,
      enableColumnResizing: true,
      enableColumnHiding: true,
      enableGrouping: true,
      enableVirtualization: performance?.enableVirtualization ?? true,
      virtualizeThreshold: performance?.virtualizeThreshold ?? 50,
      overscan: performance?.overscan ?? 10,
      dataMode: isInfiniteMode ? "infinite" : "pagination",
      enablePagination: false,
      infiniteScrollThresholdPx: performance?.infiniteScrollThresholdPx ?? 200,
      lockedColumnIds: Array.from(columnOrdering?.locked ?? []),
    }),
    [
      columnOrdering?.draggable,
      columnOrdering?.locked,
      enableSelection,
      isInfiniteMode,
      performance?.enableVirtualization,
      performance?.infiniteScrollThresholdPx,
      performance?.overscan,
      performance?.virtualizeThreshold,
    ],
  );

  const handleOrderByChange = useCallback(
    (nextOrderBy: string[]) => {
      const normalizedNextOrderBy = resolveOrderByWithFallback(nextOrderBy);
      const currentVariablesOrderBy = resolveOrderByWithFallback(
        isRecord(filterVariables) ? filterVariables.orderBy : undefined,
      );
      if (
        areStringArraysEqual(normalizedNextOrderBy, advancedFilters.orderBy) &&
        areStringArraysEqual(normalizedNextOrderBy, currentVariablesOrderBy)
      ) {
        return;
      }

      const nextVariables = isRecord(filterVariables) ? { ...filterVariables } : {};
      nextVariables.orderBy = normalizedNextOrderBy;
      setAdvancedFilters(
        {
          ...advancedFilters,
          orderBy: normalizedNextOrderBy,
        },
        nextVariables,
      );
    },
    [advancedFilters, filterVariables, setAdvancedFilters],
  );

  const handleStateChange = useCallback(
    (nextState: {
      orderBy: string[];
      columnOrder: string[];
      columnVisibility: VisibilityState;
      columnSizing: ColumnSizingState;
      rowSelection: RowSelectionState;
      grouping: string[];
      expanded: ExpandedState;
      pagination: DynamicPaginationState;
      dragModeEnabled: boolean;
      density: TableDensity;
      wrapCells: boolean;
    }) => {
      if (!areStringArraysEqual(nextState.columnOrder, columnOrder)) {
        setColumnOrder(nextState.columnOrder);
      }
      if (!areBooleanMapsEqual(nextState.columnVisibility, columnVisibility)) {
        setColumnVisibility(nextState.columnVisibility);
      }
      if (!areNumberMapsEqual(nextState.columnSizing, columnWidths)) {
        setColumnWidths(nextState.columnSizing);
      }
      if (!areBooleanMapsEqual(nextState.rowSelection, rowSelection)) {
        setRowSelection(nextState.rowSelection);
      }
      if (!isPaginationStateEqual(nextState.pagination, selectedPaginationState)) {
        if (nextState.pagination.pageSize !== pagination.perPage) {
          setPerPage(nextState.pagination.pageSize);
        }
        const nextPage = nextState.pagination.pageIndex + 1;
        if (nextPage !== pagination.page) {
          setPage(nextPage);
        }
      }

      const nextGroupingField = nextState.grouping[0] ?? null;
      if (nextGroupingField !== groupingField) {
        setGroupingField(nextGroupingField);
      }
      if (nextState.dragModeEnabled !== dragModeEnabled) {
        setDragModeEnabled(nextState.dragModeEnabled);
      }
      if (nextState.density !== density) {
        setDensity(nextState.density);
      }
      if (nextState.wrapCells !== wrapCells) {
        setWrapCells(nextState.wrapCells);
      }
      if (!isExpandedStateEqual(nextState.expanded, dynamicExpanded)) {
        setDynamicExpanded(nextState.expanded);
      }
    },
    [
      columnOrder,
      columnVisibility,
      columnWidths,
      density,
      dragModeEnabled,
      dynamicExpanded,
      groupingField,
      pagination.page,
      pagination.perPage,
      rowSelection,
      selectedPaginationState,
      setColumnOrder,
      setColumnVisibility,
      setColumnWidths,
      setDensity,
      setDragModeEnabled,
      setGroupingField,
      setPage,
      setPerPage,
      setRowSelection,
      setWrapCells,
      wrapCells,
    ],
  );

  const handleRowSelectionChange = useCallback(
    (nextSelection: RowSelectionState) => {
      if (!areBooleanMapsEqual(nextSelection, rowSelection)) {
        setRowSelection(nextSelection);
      }
    },
    [rowSelection, setRowSelection],
  );

  const handlePaginationChange = useCallback(
    (nextPagination: DynamicPaginationState) => {
      if (nextPagination.pageSize !== pagination.perPage) {
        setPerPage(nextPagination.pageSize);
      }
      const nextPage = nextPagination.pageIndex + 1;
      if (nextPage !== pagination.page) {
        setPage(nextPage);
      }
    },
    [pagination.page, pagination.perPage, setPage, setPerPage],
  );

  const dynamicState = useMemo(
    () => ({
      orderBy,
      columnOrder:
        (enableSelection ?? true) === true
          ? [
              DYNAMIC_TABLE_SELECTION_COLUMN_ID,
              ...columnOrder.filter(
                (columnId) => columnId !== DYNAMIC_TABLE_SELECTION_COLUMN_ID,
              ),
            ]
          : columnOrder,
      columnVisibility,
      columnSizing: columnWidths,
      rowSelection,
      grouping: groupingField ? [groupingField] : [],
      expanded: dynamicExpanded,
      pagination: selectedPaginationState,
      dragModeEnabled,
      density,
      wrapCells,
    }),
    [
      columnOrder,
      columnVisibility,
      columnWidths,
      density,
      dragModeEnabled,
      dynamicExpanded,
      enableSelection,
      groupingField,
      orderBy,
      rowSelection,
      selectedPaginationState,
      wrapCells,
    ],
  );

  useEffect(() => {
    if (!groupingField) {
      return;
    }
    if (!groupCollapsed || Object.keys(groupCollapsed).length === 0) {
      setDynamicExpanded(true);
      return;
    }
    const collapsedValues = Object.values(groupCollapsed);
    if (collapsedValues.every((value) => value === true)) {
      setDynamicExpanded({});
      return;
    }
    if (collapsedValues.every((value) => value === false)) {
      setDynamicExpanded(true);
    }
  }, [groupCollapsed, groupingField]);

  const handleExpandAllGroups = useCallback(() => {
    if (!groupingField) {
      return;
    }
    const nextCollapsed: Record<string, boolean> = {};
    const keys = new Set<string>();
    data.forEach((row) => keys.add(resolveGroupingKey(row, groupingField)));
    keys.forEach((key) => {
      nextCollapsed[key] = false;
    });
    setDynamicExpanded(true);
    setGroupCollapsed(nextCollapsed);
  }, [data, groupingField]);

  const handleCollapseAllGroups = useCallback(() => {
    if (!groupingField) {
      return;
    }
    const nextCollapsed: Record<string, boolean> = {};
    const keys = new Set<string>();
    data.forEach((row) => keys.add(resolveGroupingKey(row, groupingField)));
    keys.forEach((key) => {
      nextCollapsed[key] = true;
    });
    setDynamicExpanded({});
    setGroupCollapsed(nextCollapsed);
  }, [data, groupingField]);

  const topContent = displayToolbar ? (
    <div className="flex flex-col gap-3 px-4 py-3">
      <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
        <div className="flex w-full flex-1 flex-wrap items-start gap-3 sm:w-auto">
          {quickSearch ? (
            <QuickSearch
              value={quickSearchTerm}
              onChange={setQuickSearch}
              placeholder={tableConfig?.searchPlaceholder ?? "Quick search"}
              expanded={searchFocused || Boolean(quickSearchTerm)}
              onFocusChange={setSearchFocused}
            />
          ) : null}
        </div>

        <div className="flex w-full items-center justify-end gap-1.5 sm:w-auto">
          <div className="flex items-center gap-0.5 bg-muted/20 p-1">
            <ViewOptionsMenu
              density={density}
              onDensityChange={setDensity}
              wrapCells={wrapCells}
              onWrapChange={setWrapCells}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setDragModeEnabled(!dragModeEnabled)}
              className={cn(
                "h-8 w-8 transition-all",
                dragModeEnabled
                  ? "bg-primary/20 text-primary shadow-inner"
                  : "text-muted-foreground hover:bg-background hover:text-foreground",
              )}
            >
              <GripVertical className="h-4 w-4" />
            </Button>
            <ColumnsMenu
              columnSearch={columnSearch}
              onColumnSearchChange={setColumnSearch}
              visibleColumns={visibleColumns}
              columnVisibility={columnVisibility}
              allColumnsVisible={allColumnsVisible}
              onToggleColumn={toggleColumn}
              onSetAllColumnsVisibility={(checked) => {
                const nextVisibility = { ...columnVisibility };
                orderedColumns.forEach((column) => {
                  column.visibilityKeys.forEach((key) => {
                    nextVisibility[key] = checked;
                  });
                });
                setColumnVisibility(nextVisibility);
              }}
              onApplyDefaultColumnsVisibility={() => {
                const nextVisibility = { ...columnVisibility };
                orderedColumns.forEach((column) => {
                  column.visibilityKeys.forEach((key) => {
                    nextVisibility[key] = true;
                  });
                });
                setColumnVisibility(nextVisibility);
              }}
            />
            <GroupingMenu
              groupingField={groupingField}
              hasGroupedRows={Boolean(groupingField)}
              groupableFields={groupableFields}
              onSetGroupingField={setGroupingField}
              onResetCollapsed={() => setGroupCollapsed({})}
              onExpandAll={handleExpandAllGroups}
              onCollapseAll={handleCollapseAllGroups}
            />
          </div>

          <div className="flex items-center gap-0.5 bg-muted/20 p-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground transition-all hover:bg-background hover:text-primary active:scale-90"
              onClick={() => void refetch()}
              disabled={tableLoading}
            >
              <RotateCw
                className={cn("h-4 w-4", tableLoading && "animate-spin")}
              />
            </Button>
          </div>
        </div>
      </div>
    </div>
  ) : null;

  if (columnDefs.length === 0) {
    return (
      <div className="flex h-full items-center justify-center border border-dashed border-border/50 bg-muted/20 px-6 text-sm text-muted-foreground">
        `LightModelTable` requires explicit `fields` accessors.
      </div>
    );
  }

  return (
    <ModelTableSurface
      persistenceKey={effectiveKey}
      topContent={topContent}
      desktopContent={
        <div className="min-h-0 h-full flex-1">
          <DynamicTable
            className="h-full border-none [&_.table-header]:border-b-border/40"
            rows={data}
            columns={dynamicColumns}
            getRowId={(row, index) => resolveRowId(row, index, String(primaryKey))}
            loading={tableLoading}
            loadingText={tableConfig?.loadingText}
            emptyState={tableConfig?.emptyState ?? "No results."}
            state={dynamicState}
            onStateChange={handleStateChange}
            onOrderByChange={handleOrderByChange}
            onRowSelectionChange={handleRowSelectionChange}
            onPaginationChange={handlePaginationChange}
            expand={expand}
            sortMode="server"
            paginationMode="server"
            features={features}
            layout={{
              density: resolveTableDensity(view?.defaultDensity),
              wrapCells: view?.defaultWrapCells ?? false,
              containerClassName:
                "group/frame relative flex h-full flex-col overflow-hidden bg-transparent",
            }}
            totalRows={pagination.totalKnown ? pagination.total : undefined}
            pageCount={pagination.totalKnown ? pagination.numPages : undefined}
            hasNextPage={pagination.hasNextPage}
            hasPreviousPage={pagination.hasPreviousPage}
            onLoadMore={() => {
              if (!isInfiniteMode || tableLoading || !pagination.hasNextPage) {
                return;
              }
              setPage(pagination.page + 1);
            }}
          />
        </div>
      }
      paginationContent={
        !isInfiniteMode ? (
          <TablePagination enableSelection={enableSelection ?? true} />
        ) : null
      }
      dataErrorContent={
        dataError ? <ModelTableDataErrorDisplay error={dataError} /> : null
      }
    />
  );
}

const LightModelTableInner = <
  TSource extends object = Record<string, unknown>,
>(
  props: LightModelTableProps<TSource>,
  ref: React.ForwardedRef<LightModelTableHandle<TSource>>,
) => {
  const initialTableState = useMemo(
    () => resolveInitialTableState(props.initVariables),
    [props.initVariables],
  );
  const refetchRef = useRef<BaseModelTableRefetch | undefined>(undefined);
  const snapshotRef = useRef<LightModelTableSnapshot<TSource>>({
    data: [],
    selectedRows: [],
    rowSelection: {},
    loading: false,
    dataError: null,
    pagination: null,
  });

  const handleRefetchResolved = useCallback(
    (nextRefetch?: BaseModelTableRefetch) => {
      refetchRef.current = nextRefetch;
    },
    [],
  );

  const handleSnapshotResolved = useCallback(
    (nextSnapshot: LightModelTableSnapshot<TSource>) => {
      snapshotRef.current = nextSnapshot;
    },
    [],
  );

  useImperativeHandle(
    ref,
    () => ({
      refetch: (variables?: Record<string, unknown>) => {
        if (!refetchRef.current) {
          return Promise.resolve(undefined);
        }
        return refetchRef.current(variables);
      },
      getSnapshot: () => snapshotRef.current,
      get data() {
        return snapshotRef.current.data;
      },
      get selectedRows() {
        return snapshotRef.current.selectedRows;
      },
      get rowSelection() {
        return snapshotRef.current.rowSelection;
      },
      get loading() {
        return snapshotRef.current.loading;
      },
      get dataError() {
        return snapshotRef.current.dataError;
      },
      get pagination() {
        return snapshotRef.current.pagination;
      },
    }),
    [],
  );

  return (
    <div
      data-slot="light-model-table"
      className={props.className ? `h-full w-full ${props.className}` : "h-full w-full"}
    >
      <TableProvider
        initialState={{
          density: props.view?.defaultDensity ?? "compact",
          wrapCells: props.view?.defaultWrapCells ?? false,
          pagination: {
            page: initialTableState.page,
            perPage: initialTableState.perPage,
            total: 0,
            numPages: 0,
            totalKnown: true,
            hasNextPage: false,
            hasPreviousPage: false,
          },
          advancedFilters: initialTableState.advancedFilters,
          filterVariables: initialTableState.filterVariables,
        }}
      >
        <LightModelTableContent<TSource>
          {...props}
          onRefetchResolved={handleRefetchResolved}
          onSnapshotResolved={handleSnapshotResolved}
        />
      </TableProvider>
    </div>
  );
};

export const LightModelTable = forwardRef(LightModelTableInner) as <
  TSource extends object = Record<string, unknown>,
>(
  props: LightModelTableProps<TSource> &
    React.RefAttributes<LightModelTableHandle<TSource>>,
) => React.ReactElement | null;

(LightModelTable as { displayName?: string }).displayName = "LightModelTable";
