import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import type {
  ColumnSizingState,
  ExpandedState,
  PaginationState as DynamicPaginationState,
  RowSelectionState,
  VisibilityState,
} from "@tanstack/react-table";
import {
  DynamicTable,
  DYNAMIC_TABLE_SELECTION_COLUMN_ID,
  type DynamicTableColumnInput,
} from "../dynamic-table";
import type { DynamicTableFeatureFlags } from "../dynamic-table";
import { MetadataProvider, useMetadata } from "../context/MetadataContext";
import { TableProvider, useTable } from "../context/TableContext";
import type {
  BaseModelTableColumnActionsInput,
  BaseModelTableColumnDef,
  BaseModelTableColumnOrderingConfig,
  BaseModelTableFieldsInput,
  BaseModelTableRefetch,
  BaseModelTableRelationConfig,
  BaseModelTableRelationStatsConfig,
  DynamicModelTableRow,
  FieldSchema,
  ModelTableAccessorPath,
  ModelTableRelationKey,
  RowMutationPermissions,
} from "../types";
import type {
  DynamicModelTableHandle,
  DynamicModelTableProps,
  DynamicModelTableSnapshot,
  ModelTableCreateConfig,
  ModelTableDetailConfig,
  ModelTableFilterPanelProps,
  ModelTableNavFiltersConfig,
  ModelTableUpdateConfig,
  ModelTableV2ExpandConfig,
  ModelTableV2TopActionsInput,
  ModelTableV2PerformanceOptions,
  ModelTableV2TableConfig,
  ModelTableV2ViewOptions,
} from "../config/types";
import {
  getNormalizedTablePersistenceKeys,
  loadPersistedTableState,
  markPendingTablePersistenceReset,
  type PersistedTableState,
  useTablePersistence,
} from "../hooks/useTablePersistence";
import {
  clearPersistedMetadataStore,
  getActiveMetadataUserKey,
} from "@/shared/api/graphql/graphql/metadata/persisted-cache";
import { useModelTableDevtools } from "../hooks/useModelTableDevtools";
import { useModelTablePdfPreview } from "../hooks/useModelTablePdfPreview";
import { useTableColumns } from "../hooks/useTableColumns";
import { useTableData } from "../hooks/useTableData";
import { useTableLayout } from "../hooks/useTableLayout";
import { useTableQueryConfig } from "../hooks/useTableQueryConfig";
import { useTableFilters } from "../hooks/useTableFilters";
import { ColumnFilter } from "./ColumnFilter";
import { ProtectedFileCell } from "./ProtectedFileCell";
import { RowActions } from "./row/RowActions";
import {
  useModelTableContentController,
  type UseModelTableContentControllerInput,
} from "./content/useModelTableContentController";
import { ModelTableBulkActionsBar } from "./content/ModelTableBulkActionsBar";
import {
  ModelTableDataErrorDisplay,
  ModelTableLoadingSkeleton,
  ModelTableMetadataErrorState,
} from "./content/ModelTableFeedback";
import { ModelTableDialogs } from "./content/ModelTableDialogs";
import { ModelTableDevtoolsPanel } from "./content/ModelTableDevtoolsPanel";
import { ModelTableFooter } from "./content/ModelTableFooter";
import { ModelTableHeader } from "./content/ModelTableHeader";
import { ModelTablePdfPreviewDialog } from "./content/ModelTablePdfPreviewDialog";
import { ModelTableSurface } from "./content/ModelTableSurface";
import { ModelTableToolbarSection } from "./content/ModelTableToolbarSection";
import { ModelTableTopActions } from "./content/ModelTableTopActions";
import type {
  ModelTableBulkActionsBarSlotProps,
  ModelTableContentConfig,
  ModelTableDialogsSlotProps,
  ModelTableFooterSlotProps,
  ModelTableHeaderSlotProps,
  ModelTableTopActionsSlotProps,
  ModelTableToolbarSlotProps,
} from "./content/types";
import {
  RelationStatsHover,
  type StatsRelationMeta,
} from "./row/RelationStatsHover";
import { TableColumnMenu } from "./TableColumnMenu";
import { TableMobileCard } from "./TableMobileCard";
import { TablePagination } from "./TablePagination";
import {
  areBooleanMapsEqual,
  areNumberMapsEqual,
  areStringArraysEqual,
  buildPersistedStateFromBootstrap,
  collectExplicitFieldAccessors,
  collectIncludedFieldAccessors,
  extractMissingGraphqlField,
  formatFallbackCellValue,
  getSelectedRowIds,
  hasRecoverableTableBadRequest,
  isExpandedStateEqual,
  isPaginationStateEqual,
  isPersistedTableStateEqual,
  isRecord,
  mergeManagedFieldExclusions,
  normalizePdfUrl,
  resolveDevtoolsEnabled,
  resolveInitialTableState,
  resolveOrderByWithFallback,
  resolveRowId,
  resolveSectionVisibility,
  toOrderByEntries,
} from "./DynamicModelTable.shared";
import {
  formatCellValue,
  getDefaultHiddenColumnIds,
  getImplicitModelTableFieldExclusions,
  getSyntheticRelationCountSource,
  normalizeBaseModelTableFieldsInput,
  mergeModelTableQueryVariables,
  resolveInitialNavFilterSelections,
  resolveNavFilterVariables,
  toGraphqlFieldName,
} from "../utils";
import {
  buildAccessorPath,
  resolveValueOptimized,
} from "../utils/valueResolution";

/**
 * Internal props used by the dynamic-table powered content implementation.
 */
type DynamicBaseTableContentProps<
  TSource extends object = Record<string, unknown>,
> = {
  persistenceKey?: string;
  navFilters?: ModelTableNavFiltersConfig;
  filterPanel?: ModelTableFilterPanelProps;
  create?: ModelTableCreateConfig<TSource>;
  update?: ModelTableUpdateConfig<TSource>;
  detail?: ModelTableDetailConfig<TSource>;
  tableConfig?: ModelTableV2TableConfig;
  view?: ModelTableV2ViewOptions;
  performance?: ModelTableV2PerformanceOptions;
  quickSearch?: boolean;
  quickFilters?: string[];
  topActions?: ModelTableV2TopActionsInput<TSource>;
  content?: ModelTableContentConfig<TSource>;
  hideTableOnMobile?: boolean;
  fields?: BaseModelTableFieldsInput<TSource>;
  showReversed?: boolean;
  showCount?: boolean;
  relations?: Partial<
    Record<ModelTableRelationKey<TSource>, BaseModelTableRelationConfig<TSource>>
  >;
  relationStats?: BaseModelTableRelationStatsConfig<TSource>;
  queryManager?: string;
  columnOrdering?: BaseModelTableColumnOrderingConfig<ModelTableAccessorPath<TSource>>;
  hydratePersistedColumnOrder?: boolean;
  skipCount?: boolean;
  disableSorting?: boolean;
  enableSelection?: boolean;
  expand?: ModelTableV2ExpandConfig;
  columnActions?: BaseModelTableColumnActionsInput<DynamicModelTableRow<TSource>>;
  devtoolsEnabled?: boolean;
  /**
   * Emits the current query refetch function to the parent wrapper.
   */
  onRefetchResolved?: (refetch?: BaseModelTableRefetch) => void;
  /**
   * Emits a runtime snapshot whenever table state changes.
   */
  onSnapshotResolved?: (snapshot: DynamicModelTableSnapshot<TSource>) => void;
};

const SCHEMA_DRIFT_RECOVERY_PREFIX = "rail-table-schema-drift";

/**
 * Dynamic, feature-parity table content implemented with DynamicTable as the desktop grid.
 */
function DynamicBaseTableContent<
  TSource extends object = Record<string, unknown>,
>({
  persistenceKey,
  navFilters,
  filterPanel,
  create,
  update,
  detail,
  tableConfig,
  quickSearch,
  quickFilters,
  topActions,
  content,
  performance,
  hideTableOnMobile,
  fields,
  showReversed = false,
  showCount = false,
  relations,
  relationStats,
  queryManager,
  columnOrdering,
  hydratePersistedColumnOrder = true,
  skipCount,
  disableSorting,
  enableSelection,
  expand,
  columnActions,
  devtoolsEnabled = false,
  onRefetchResolved,
  onSnapshotResolved,
}: DynamicBaseTableContentProps<TSource>) {
  const {
    metadata,
    bootstrapInitialState,
    bootstrapStateLoading,
    loading: metadataLoading,
    error: metadataError,
    app,
    model,
    actionDetailsLoading,
    actionDetailsLoaded,
    scheduleCapabilitiesPrefetch,
  } = useMetadata();
  const relationConfigMap =
    relations as unknown as Record<string, BaseModelTableRelationConfig> | undefined;
  const relationStatsConfig =
    relationStats as BaseModelTableRelationStatsConfig<TSource> | undefined;
  const {
    columnVisibility,
    columnWidths,
    columnOrder,
    rowSelection,
    groupingField,
    groupCollapsed,
    dragModeEnabled,
    density,
    wrapCells,
    setColumnVisibility,
    setColumnWidths,
    setColumnOrder,
    setRowSelection,
    setPage,
    setPerPage,
    setDragModeEnabled,
    setDensity,
    setWrapCells,
    loading: tableLoading,
    data,
    pagination,
    error: dataError,
    navFilterSelections,
  } = useTable();
  const { advancedFilters, filterVariables, setAdvancedFilters } =
    useTableFilters();

  const [dynamicExpanded, setDynamicExpanded] = useState<ExpandedState>({});
  const tableScrollRef = useRef<HTMLDivElement>(null);
  const pdfPreviewConfig = tableConfig?.pdfPreview;
  const isInfiniteMode = performance?.dataMode === "infinite";
  const {
    pdfPreviewEnabled,
    pdfPreviewUrl,
    pdfPreviewTitle,
    pdfPreviewSrc,
    pdfPreviewRefreshing,
    openPdfPreview,
    closePdfPreview,
    refreshPdfPreview,
    handleTemplatePdfPreview,
  } = useModelTablePdfPreview(pdfPreviewConfig);
  const { timings } = useModelTableDevtools({
    enabled: devtoolsEnabled,
    app,
    model,
    metadataLoading,
    metadata,
    metadataError,
    tableLoading,
  });

  const locationPath =
    typeof window !== "undefined" ? window.location.pathname : "";
  const effectiveKey = persistenceKey || `${app}-${model}-${locationPath}`;
  const fallbackPersistedState = useMemo(
    () =>
      loadPersistedTableState(effectiveKey, null, {
        allowLocalFallback: true,
      }),
    [effectiveKey],
  );
  const persistedStateRef = useRef<PersistedTableState | null>(null);
  const rawPersistedState = useMemo(
    () =>
      buildPersistedStateFromBootstrap(
        bootstrapInitialState,
        fallbackPersistedState,
      ),
    [bootstrapInitialState, fallbackPersistedState],
  );
  const persistedState = useMemo(() => {
    if (
      isPersistedTableStateEqual(rawPersistedState, persistedStateRef.current)
    ) {
      return persistedStateRef.current;
    }
    persistedStateRef.current = rawPersistedState;
    return rawPersistedState;
  }, [rawPersistedState]);
  const layoutPersistedState = useMemo(() => {
    if (hydratePersistedColumnOrder || !persistedState) {
      return persistedState;
    }
    return {
      ...persistedState,
      columnOrder: [],
    };
  }, [hydratePersistedColumnOrder, persistedState]);
  const bootstrapPersistenceState = useMemo(
    () =>
      bootstrapInitialState
        ? {
            columnOrder: bootstrapInitialState.columnOrder,
            columnVisibility: bootstrapInitialState.columnVisibility,
            columnWidths: bootstrapInitialState.columnWidths,
            perPage: bootstrapInitialState.pageSize,
            density: bootstrapInitialState.density,
            wrapCells: bootstrapInitialState.wrapCells,
            visibilityVersion: bootstrapInitialState.visibilityVersion,
          }
        : null,
    [bootstrapInitialState],
  );
  const { hydrated: persistenceHydrated } = useTablePersistence(effectiveKey, {
    bootstrapState: bootstrapPersistenceState,
    bootstrapStateReady: !bootstrapStateLoading,
    hydrateColumnOrder: hydratePersistedColumnOrder,
  });

  const requestedFieldsConfig = useMemo(
    () => normalizeBaseModelTableFieldsInput(fields),
    [fields],
  );
  const explicitFieldAccessors = useMemo(
    () => collectExplicitFieldAccessors(requestedFieldsConfig),
    [requestedFieldsConfig],
  );
  const managedFieldExclusions = useMemo(
    () =>
      getImplicitModelTableFieldExclusions(metadata, {
        showReversed,
        showCount,
        explicitAccessors: explicitFieldAccessors,
      }),
    [explicitFieldAccessors, metadata, showCount, showReversed],
  );
  const effectiveFields = useMemo(
    () => mergeManagedFieldExclusions(fields, managedFieldExclusions),
    [fields, managedFieldExclusions],
  );

  const { columnDefs, normalizedFieldsConfig, excludedAccessors } =
    useTableColumns({
      metadata,
      fields: effectiveFields as BaseModelTableFieldsInput,
      relations: relationConfigMap,
      columnVisibility,
      persistedVisibility: persistedState?.columnVisibility,
    });

  const defaultHiddenColumnIds = useMemo(() => {
    if (normalizedFieldsConfig.include !== undefined) {
      return new Set<string>();
    }
    const hidden = getDefaultHiddenColumnIds(metadata, {
      showReversed,
      showCount,
    });
    normalizedFieldsConfig.add.forEach((entry: { accessor: string }) => {
      const root = entry.accessor.split(".")[0].split("__")[0];
      hidden.delete(root);
      hidden.delete(entry.accessor);
    });
    return hidden;
  }, [metadata, normalizedFieldsConfig, showCount, showReversed]);

  const { queryConfig } = useTableQueryConfig({
    fields: effectiveFields as BaseModelTableFieldsInput,
    relations: relationConfigMap,
    queryManager,
    skipCount,
    performance,
    normalizedFieldsConfig,
    excludedAccessors,
    defaultHiddenColumnIds,
    persistedVisibility: persistedState?.columnVisibility,
  });
  const resolvedNavFilterVariables = useMemo(
    () => resolveNavFilterVariables(navFilters, navFilterSelections),
    [navFilterSelections, navFilters],
  );
  const mergedFilterVariables = useMemo(
    () =>
      mergeModelTableQueryVariables(filterVariables, resolvedNavFilterVariables),
    [filterVariables, resolvedNavFilterVariables],
  );

  const dataConfig = useMemo(
    () => ({
      ...queryConfig,
      enabled: persistenceHydrated,
      navFilterVariables: resolvedNavFilterVariables,
    }),
    [persistenceHydrated, queryConfig, resolvedNavFilterVariables],
  );
  const { refetch } = useTableData(dataConfig);
  useEffect(() => {
    onRefetchResolved?.(refetch as BaseModelTableRefetch | undefined);
    return () => {
      onRefetchResolved?.(undefined);
    };
  }, [onRefetchResolved, refetch]);

  useEffect(() => {
    const missingField = extractMissingGraphqlField(dataError);
    const shouldRecover = Boolean(missingField) || hasRecoverableTableBadRequest(dataError);
    if (!shouldRecover || typeof window === "undefined") {
      return;
    }

    const recoveryKey =
      `${SCHEMA_DRIFT_RECOVERY_PREFIX}:${effectiveKey}:${missingField ?? "http-400"}`;
    if (window.sessionStorage.getItem(recoveryKey) === "1") {
      return;
    }

    window.sessionStorage.setItem(recoveryKey, "1");
    markPendingTablePersistenceReset(effectiveKey);

    getNormalizedTablePersistenceKeys(effectiveKey).forEach((candidateKey) => {
      try {
        window.localStorage.removeItem(`rail-table-v2:${candidateKey}`);
      } catch {
        // Ignore storage errors during schema-drift recovery.
      }
    });

    const metadataUserKey = getActiveMetadataUserKey();
    if (metadataUserKey) {
      clearPersistedMetadataStore(metadataUserKey);
    }

    window.location.reload();
  }, [dataError, effectiveKey]);

  useEffect(() => {
    if (dataError || typeof window === "undefined") {
      return;
    }

    const markerPrefix = `${SCHEMA_DRIFT_RECOVERY_PREFIX}:${effectiveKey}:`;
    const keysToRemove: string[] = [];
    for (let index = 0; index < window.sessionStorage.length; index += 1) {
      const key = window.sessionStorage.key(index);
      if (key?.startsWith(markerPrefix)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((key) => window.sessionStorage.removeItem(key));
  }, [dataError, effectiveKey]);

  const hasScheduledCapabilitiesRef = useRef(false);
  useEffect(() => {
    if (hasScheduledCapabilitiesRef.current) {
      return;
    }
    if (!persistenceHydrated || metadataLoading || !metadata) {
      return;
    }
    if (actionDetailsLoaded || actionDetailsLoading) {
      hasScheduledCapabilitiesRef.current = true;
      return;
    }

    // Prefetch action details in idle time so first paint/data query are not
    // contending with heavier mutation/template metadata work.
    hasScheduledCapabilitiesRef.current = true;
    scheduleCapabilitiesPrefetch();
  }, [
    actionDetailsLoaded,
    actionDetailsLoading,
    metadata,
    metadataLoading,
    persistenceHydrated,
    scheduleCapabilitiesPrefetch,
  ]);

  const { allowColumnDrag, lockedColumns } = useTableLayout({
    columnDefs,
    columnOrdering,
    defaultHiddenColumnIds,
    persistedState: layoutPersistedState,
  });

  const resolvedEnableSelection = useMemo(() => {
    // Keep selection behavior deterministic to avoid late UI column toggles.
    if (typeof enableSelection === "boolean") {
      return enableSelection;
    }
    return true;
  }, [enableSelection]);
  const rowDetailExpandEnabled = useMemo(() => {
    const requested = expand?.enabled ?? Boolean(expand?.renderRow);
    return requested && Boolean(expand?.renderRow);
  }, [expand]);

  const primaryKey = metadata?.primaryKey || "id";
  const selectedRowsCacheRef = useRef<
    Record<string, DynamicModelTableRow<TSource>>
  >({});
  const selectedRowIds = useMemo(
    () => getSelectedRowIds(rowSelection),
    [rowSelection],
  );
  const selectedRows = useMemo(() => {
    if (selectedRowIds.length === 0) {
      selectedRowsCacheRef.current = {};
      return [];
    }

    // Preserve selected row payloads across page changes so bulk actions and
    // imperative snapshots stay aligned with the persisted selection map.
    const selectedRowIdSet = new Set(selectedRowIds);
    const nextCache = { ...selectedRowsCacheRef.current };

    Object.keys(nextCache).forEach((rowId) => {
      if (!selectedRowIdSet.has(rowId)) {
        delete nextCache[rowId];
      }
    });

    (data as DynamicModelTableRow<TSource>[]).forEach((row, index) => {
      const rowId = resolveRowId(row, index, primaryKey);
      if (selectedRowIdSet.has(rowId)) {
        nextCache[rowId] = row;
      }
    });

    selectedRowsCacheRef.current = nextCache;

    return selectedRowIds
      .map((rowId) => nextCache[rowId])
      .filter(
        (row): row is DynamicModelTableRow<TSource> => row !== undefined,
      );
  }, [data, primaryKey, selectedRowIds]);
  const whereType =
    metadata?.filterConfig?.inputTypeName ||
    `${metadata?.model || "Model"}WhereInput`;

  useEffect(() => {
    if (!onSnapshotResolved) {
      return;
    }
    onSnapshotResolved({
      data: data as DynamicModelTableRow<TSource>[],
      selectedRows: selectedRows as DynamicModelTableRow<TSource>[],
      rowSelection,
      loading: tableLoading,
      metadataLoading,
      dataError: dataError ?? null,
      metadataError: metadataError ?? null,
      metadata: metadata ?? null,
      pagination,
    });
  }, [
    data,
    dataError,
    metadata,
    metadataError,
    metadataLoading,
    onSnapshotResolved,
    pagination,
    rowSelection,
    selectedRows,
    tableLoading,
  ]);

  const orderBy = useMemo(() => {
    const variableOrderBy = isRecord(mergedFilterVariables)
      ? toOrderByEntries(mergedFilterVariables.orderBy)
      : [];
    if (variableOrderBy.length > 0) {
      return variableOrderBy;
    }
    return resolveOrderByWithFallback(advancedFilters.orderBy);
  }, [advancedFilters.orderBy, mergedFilterVariables]);

  const fieldLookup = useMemo(() => {
    const lookup = new Map<string, FieldSchema>();
    if (!metadata?.fields) {
      return lookup;
    }

    metadata.fields.forEach((field) => {
      const normalizedName = toGraphqlFieldName(field.name || field.fieldName);
      const normalizedFieldName = field.fieldName
        ? toGraphqlFieldName(field.fieldName)
        : undefined;

      [field.name, field.fieldName, normalizedName, normalizedFieldName]
        .filter((entry): entry is string => !!entry)
        .forEach((entry) => {
          lookup.set(entry, field);
        });
    });

    return lookup;
  }, [metadata?.fields]);

  const relationLookup = useMemo(() => {
    const lookup = new Map<
      string,
      {
        relatedApp: string;
        relatedModel: string;
        relationName: string;
        relationLabel: string;
        isToMany: boolean;
      }
    >();
    if (!metadata?.relationships) {
      return lookup;
    }

    metadata.relationships.forEach((relation) => {
      const normalizedName = toGraphqlFieldName(
        relation.name || relation.fieldName,
      );
      const normalizedFieldName = relation.fieldName
        ? toGraphqlFieldName(relation.fieldName)
        : undefined;
      const descriptor = {
        relatedApp: relation.relatedApp,
        relatedModel: relation.relatedModel,
        relationName: relation.fieldName || relation.name,
        relationLabel: relation.verboseName || relation.name,
        isToMany: Boolean(relation.isToMany),
      };

      [relation.name, relation.fieldName, normalizedName, normalizedFieldName]
        .filter((entry): entry is string => !!entry)
        .forEach((entry) => {
          lookup.set(entry, descriptor);
        });
    });

    return lookup;
  }, [metadata?.relationships]);

  const accessorPathLookup = useMemo(() => {
    const paths = new Map<string, string[]>();
    (columnDefs ?? []).forEach((column) => {
      paths.set(column.accessor, buildAccessorPath(column.accessor));
    });
    return paths;
  }, [columnDefs]);

  const resolveStatsRelation = useCallback(
    (column: BaseModelTableColumnDef): StatsRelationMeta | null => {
      if (!relationStatsConfig?.enabled) {
        return null;
      }

      const columnRoot = column.accessor.replace(/__/g, ".").split(".")[0];
      const fieldMeta = fieldLookup.get(columnRoot);
      const syntheticSource = fieldMeta
        ? getSyntheticRelationCountSource(fieldMeta)
        : undefined;
      const relationSource = fieldMeta?.isRelation
        ? fieldMeta.name || fieldMeta.fieldName
        : syntheticSource || columnRoot;
      if (!relationSource) {
        return null;
      }

      const relationMeta = relationLookup.get(relationSource);
      if (!relationMeta || !relationMeta.isToMany) {
        return null;
      }

      if (
        relationStatsConfig?.include &&
        !relationStatsConfig.include.includes(column.id) &&
        !relationStatsConfig.include.includes(columnRoot) &&
        !relationStatsConfig.include.includes(relationMeta.relationName)
      ) {
        return null;
      }
      if (
        relationStatsConfig?.exclude &&
        (relationStatsConfig.exclude.includes(column.id) ||
          relationStatsConfig.exclude.includes(columnRoot) ||
          relationStatsConfig.exclude.includes(relationMeta.relationName))
      ) {
        return null;
      }

      return {
        relationName: relationMeta.relationName,
        relationLabel: relationMeta.relationLabel,
        relatedApp: relationMeta.relatedApp,
        relatedModel: relationMeta.relatedModel,
      };
    },
    [fieldLookup, relationLookup, relationStatsConfig],
  );

  const resolveStatsOverride = useCallback(
    (columnId: string, relationName: string) => {
      return (
        relationStatsConfig?.overrides?.[columnId] ||
        relationStatsConfig?.overrides?.[relationName]
      );
    },
    [relationStatsConfig?.overrides],
  );

  const dynamicColumns = useMemo<
    DynamicTableColumnInput<Record<string, unknown>>[]
  >(() => {
    if (!columnDefs) {
      return [];
    }

    return columnDefs.map((column) => {
      const sortKey = column.id.replace(/\./g, "__");
      const accessorPath =
        accessorPathLookup.get(column.accessor) ??
        buildAccessorPath(column.accessor);

      return {
        id: column.id,
        headerMode: "custom",
        title: column.title,
        accessorFn: (row) => resolveValueOptimized(row, accessorPath),
        sortKey,
        enableSorting: disableSorting ? false : true,
        size: columnWidths[column.id],
        header: () => (
          <div className="flex h-full w-full items-stretch self-stretch">
            <div className="min-w-0 flex-1 h-full">
              <TableColumnMenu
                columnId={column.id}
                title={column.title}
                disabled={disableSorting}
                fullWidthTrigger
                variant="default"
              />
            </div>
            <ColumnFilter columnId={column.id} hideTrigger />
          </div>
        ),
        cell: ({ row, value }) => {
          const root = column.accessor.replace(/__/g, ".").split(".")[0];
          const field = fieldLookup.get(root);
          const isProtectedFileField =
            !column.render && field?.isFile && typeof value === "string";
          const pdfUrl =
            !isProtectedFileField && pdfPreviewEnabled
              ? normalizePdfUrl(value)
              : null;
          const renderedValue = column.render
            ? column.render(value, row, {
                accessor: column.accessor,
                columnId: column.id,
                data,
                refetch: refetch as BaseModelTableRefetch | undefined,
              })
            : isProtectedFileField
              ? (
                  <ProtectedFileCell
                    value={value}
                    onPdfPreview={
                      pdfPreviewEnabled ? handleTemplatePdfPreview : undefined
                    }
                  />
                )
              : (() => {
                  if (field) {
                    return formatCellValue(value, field);
                  }
                  return formatFallbackCellValue(value);
                })();

          const displayValue =
            pdfUrl && typeof renderedValue === "string" ? (
              <button
                type="button"
                className="max-w-full truncate text-left text-primary underline underline-offset-4 transition-colors hover:text-primary/80"
                onClick={() => openPdfPreview(pdfUrl, renderedValue)}
              >
                {renderedValue}
              </button>
            ) : (
              renderedValue
            );

          const statsRelation = resolveStatsRelation(column);
          if (!statsRelation) {
            return displayValue;
          }

          const overrideRenderer = resolveStatsOverride(
            column.id,
            statsRelation.relationName,
          );
          return (
            <RelationStatsHover
              row={row}
              primaryKey={primaryKey}
              model={metadata?.model || "Model"}
              whereType={whereType}
              relation={statsRelation}
              queryManager={queryManager}
              overrideRenderer={overrideRenderer}
            >
              <span className="cursor-pointer hover:text-primary transition-colors underline-offset-4 decoration-primary/30 hover:underline">
                {displayValue}
              </span>
            </RelationStatsHover>
          );
        },
      };
    });
  }, [
    accessorPathLookup,
    columnDefs,
    columnWidths,
    data,
    disableSorting,
    fieldLookup,
    handleTemplatePdfPreview,
    metadata?.model,
    openPdfPreview,
    primaryKey,
    pdfPreviewEnabled,
    queryManager,
    refetch,
    resolveStatsOverride,
    resolveStatsRelation,
    whereType,
  ]);

  const selectedPaginationState = useMemo<DynamicPaginationState>(
    () => ({
      pageIndex: Math.max(0, pagination.page - 1),
      pageSize: pagination.perPage,
    }),
    [pagination.page, pagination.perPage],
  );

  const features = useMemo<DynamicTableFeatureFlags>(
    () => ({
      enableSelection: resolvedEnableSelection,
      enableColumnOrdering: allowColumnDrag,
      enableColumnResizing: true,
      enableColumnHiding: true,
      enableGrouping: true,
      enableVirtualization: performance?.enableVirtualization ?? true,
      virtualizeThreshold: performance?.virtualizeThreshold ?? 50,
      overscan: performance?.overscan ?? 10,
      dataMode: isInfiniteMode ? "infinite" : "pagination",
      enablePagination: false,
      infiniteScrollThresholdPx: performance?.infiniteScrollThresholdPx ?? 200,
      lockedColumnIds: Array.from(lockedColumns),
    }),
    [
      allowColumnDrag,
      isInfiniteMode,
      lockedColumns,
      performance?.enableVirtualization,
      performance?.infiniteScrollThresholdPx,
      performance?.overscan,
      performance?.virtualizeThreshold,
      resolvedEnableSelection,
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

      const nextVariables = isRecord(filterVariables)
        ? { ...filterVariables }
        : {};
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
      columnOrder: string[];
      columnVisibility: VisibilityState;
      columnSizing: ColumnSizingState;
      rowSelection: RowSelectionState;
      pagination: DynamicPaginationState;
      dragModeEnabled: boolean;
      density: "compact" | "comfortable" | "spacious";
      wrapCells: boolean;
      expanded: ExpandedState;
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

      if (
        !isPaginationStateEqual(nextState.pagination, selectedPaginationState)
      ) {
        if (nextState.pagination.pageSize !== pagination.perPage) {
          setPerPage(nextState.pagination.pageSize);
        }
        const nextPage = nextState.pagination.pageIndex + 1;
        if (nextPage !== pagination.page) {
          setPage(nextPage);
        }
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
      pagination.page,
      pagination.perPage,
      rowSelection,
      selectedPaginationState,
      setColumnOrder,
      setColumnVisibility,
      setColumnWidths,
      setDensity,
      setDragModeEnabled,
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
      columnOrder: resolvedEnableSelection
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
      groupingField,
      orderBy,
      resolvedEnableSelection,
      rowSelection,
      selectedPaginationState,
      wrapCells,
    ],
  );

  useEffect(() => {
    if (!groupingField) {
      if (!rowDetailExpandEnabled) {
        setDynamicExpanded({});
      }
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
  }, [groupCollapsed, groupingField, rowDetailExpandEnabled]);

  const sectionControllerInput: UseModelTableContentControllerInput = {
    filterPanel,
    navFilters,
    queryManager,
    create,
    tableConfig,
    quickSearch,
    quickFilters,
    fields: effectiveFields,
    showReversed,
    showCount,
    topActions,
    selectedRows,
    onTemplatePdfPreview: pdfPreviewEnabled
      ? handleTemplatePdfPreview
      : undefined,
  };
  const sectionController = useModelTableContentController<TSource>(
    sectionControllerInput,
  );
  const sectionVisibility = resolveSectionVisibility(content?.show);
  const HeaderSlot =
    (content?.slots?.Header ?? ModelTableHeader) as React.ComponentType<
      ModelTableHeaderSlotProps<TSource>
    >;
  const TopActionsSlot =
    (content?.slots?.TopActions ?? ModelTableTopActions) as React.ComponentType<
      ModelTableTopActionsSlotProps<TSource>
    >;
  const ToolbarSlot =
    (content?.slots?.Toolbar ??
      ModelTableToolbarSection) as React.ComponentType<
      ModelTableToolbarSlotProps<TSource>
    >;
  const BulkActionsBarSlot =
    (content?.slots?.BulkActionsBar ??
      ModelTableBulkActionsBar) as React.ComponentType<
      ModelTableBulkActionsBarSlotProps<TSource>
    >;
  const FooterSlot =
    (content?.slots?.Footer ?? ModelTableFooter) as React.ComponentType<
      ModelTableFooterSlotProps<TSource>
    >;
  const DialogsSlot =
    (content?.slots?.Dialogs ?? ModelTableDialogs) as React.ComponentType<
      ModelTableDialogsSlotProps<TSource>
    >;

  if (metadataLoading) {
    return <ModelTableLoadingSkeleton />;
  }
  if (metadataError) {
    return <ModelTableMetadataErrorState error={metadataError} />;
  }

  return (
    <ModelTableSurface<TSource>
      persistenceKey={effectiveKey}
      controller={sectionController}
      sectionVisibility={sectionVisibility}
      HeaderSlot={HeaderSlot}
      TopActionsSlot={TopActionsSlot}
      ToolbarSlot={ToolbarSlot}
      BulkActionsBarSlot={BulkActionsBarSlot}
      FooterSlot={FooterSlot}
      DialogsSlot={DialogsSlot}
      devtools={
        devtoolsEnabled ? <ModelTableDevtoolsPanel timings={timings} /> : null
      }
      hideTableOnMobile={hideTableOnMobile}
      mobileContent={
        hideTableOnMobile ? (
          <TableMobileCard
            emptyState={tableConfig?.emptyState}
            refetch={refetch}
            fields={effectiveFields}
            columnActions={columnActions}
            update={update}
            detail={detail}
            pdfPreview={tableConfig?.pdfPreview}
            onTemplatePdfPreview={
              pdfPreviewEnabled ? handleTemplatePdfPreview : undefined
            }
          />
        ) : null
      }
      desktopContent={
        <div ref={tableScrollRef} className="relative z-0 h-full min-h-0 w-full">
          <DynamicTable
            className="h-full border-none [&_.table-header]:border-b-border/40"
            rows={data}
            columns={dynamicColumns}
            getRowId={(row, index) => resolveRowId(row, index, primaryKey)}
            loading={tableLoading}
            loadingText={tableConfig?.loadingText}
            emptyState={tableConfig?.emptyState ?? "Aucun resultat."}
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
              containerClassName:
                "group/frame relative flex h-full flex-col overflow-hidden bg-transparent transition-all duration-500",
              stickySelectionColumn: false,
              actions: {
                headerLabel: tableConfig?.actionsLabel ?? "",
                sticky: true,
                headerClassName: "w-[1%] whitespace-nowrap pr-3",
                cellClassName: "w-[1%] whitespace-nowrap pr-3",
                renderCell: ({ row }) => (
                  <RowActions<TSource>
                    row={row as DynamicModelTableRow<TSource>}
                    data={data as DynamicModelTableRow<TSource>[]}
                    refetch={refetch}
                    permissions={
                      row.rowPermissions as RowMutationPermissions | undefined
                    }
                    columnActions={columnActions}
                    update={update}
                    detail={detail}
                    onTemplatePdfPreview={
                      pdfPreviewEnabled ? handleTemplatePdfPreview : undefined
                    }
                  />
                ),
              },
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
          <TablePagination
            labels={tableConfig?.paginationLabels}
            enableSelection={resolvedEnableSelection}
          />
        ) : null
      }
      dataErrorContent={
        dataError ? <ModelTableDataErrorDisplay error={dataError} /> : null
      }
      pdfPreviewDialog={
        pdfPreviewEnabled && pdfPreviewUrl && pdfPreviewSrc ? (
          <ModelTablePdfPreviewDialog
            open
            onOpenChange={(open) => {
              if (!open) {
                closePdfPreview();
              }
            }}
            title={pdfPreviewTitle || "PDF preview"}
            description={
              pdfPreviewConfig?.description ||
              "Preview the PDF without leaving the current page."
            }
            pdfUrl={pdfPreviewUrl}
            pdfSrc={pdfPreviewSrc}
            openInNewTabLabel={
              pdfPreviewConfig?.openInNewTabLabel || "Open in a new tab"
            }
            refreshLabel="Refresh"
            refreshPendingLabel="Refreshing..."
            refreshing={pdfPreviewRefreshing}
            onRefresh={refreshPdfPreview}
          />
        ) : null
      }
    />
  );
}

/**
 * Dynamic-model table built on the same metadata/filter contract as ModelTableV2.
 */
const DynamicModelTableInner = <TSource extends object = Record<string, unknown>>(
  {
    app,
    model,
    filterPanel,
    create,
    update,
    detail,
    baseTable,
    navFilters,
    devtools,
    initVariables,
  }: DynamicModelTableProps<TSource>,
  ref: React.ForwardedRef<DynamicModelTableHandle<TSource>>,
) => {
  const tableInstanceKey = `${app}:${model}`;
  const locationPath =
    typeof window !== "undefined" ? window.location.pathname : "";
  const effectivePersistenceKey =
    baseTable?.persistenceKey || `${app}-${model}-${locationPath}`;
  const initialTableState = useMemo(
    () => resolveInitialTableState(initVariables),
    [initVariables],
  );
  const initialNavFilterSelections = useMemo(
    () => resolveInitialNavFilterSelections(navFilters),
    [navFilters],
  );
  const resolvedFilterPanel: ModelTableFilterPanelProps = {
    ...(filterPanel ?? {}),
    widthClassName: "!w-full lg:!w-1/2 sm:!max-w-none",
  };
  const normalizedBaseTableFields = useMemo(
    () => normalizeBaseModelTableFieldsInput(baseTable?.fields),
    [baseTable?.fields],
  );
  const baseTableIncludedFieldOrder = useMemo(
    () => collectIncludedFieldAccessors(normalizedBaseTableFields),
    [normalizedBaseTableFields],
  );
  const effectiveColumnOrdering = useMemo(() => {
    const explicitOrder = baseTable?.columnOrdering?.order;
    if (explicitOrder && explicitOrder.length > 0) {
      return baseTable.columnOrdering;
    }
    if (baseTableIncludedFieldOrder.length === 0) {
      return baseTable?.columnOrdering;
    }
    return {
      ...baseTable?.columnOrdering,
      order: baseTableIncludedFieldOrder,
    };
  }, [baseTable?.columnOrdering, baseTableIncludedFieldOrder]);
  const shouldHydratePersistedColumnOrder = useMemo(() => {
    const explicitOrder = baseTable?.columnOrdering?.order;
    if (explicitOrder && explicitOrder.length > 0) {
      return true;
    }
    return baseTableIncludedFieldOrder.length === 0;
  }, [baseTable?.columnOrdering?.order, baseTableIncludedFieldOrder.length]);
  const devtoolsEnabled = resolveDevtoolsEnabled(devtools);
  const refetchRef = useRef<BaseModelTableRefetch | undefined>(undefined);
  const snapshotRef = useRef<DynamicModelTableSnapshot<TSource>>({
    data: [],
    selectedRows: [],
    rowSelection: {},
    loading: false,
    metadataLoading: false,
    dataError: null,
    metadataError: null,
    metadata: null,
    pagination: null,
  });

  /**
   * Stores the latest refetch function provided by the table content.
   */
  const handleRefetchResolved = useCallback(
    (nextRefetch?: BaseModelTableRefetch) => {
      refetchRef.current = nextRefetch;
    },
    [],
  );
  /**
   * Stores the latest runtime snapshot provided by the table content.
   */
  const handleSnapshotResolved = useCallback(
    (nextSnapshot: DynamicModelTableSnapshot<TSource>) => {
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
      get metadataLoading() {
        return snapshotRef.current.metadataLoading;
      },
      get dataError() {
        return snapshotRef.current.dataError;
      },
      get metadataError() {
        return snapshotRef.current.metadataError;
      },
      get metadata() {
        return snapshotRef.current.metadata;
      },
      get pagination() {
        return snapshotRef.current.pagination;
      },
    }),
    [],
  );

  return (
    <div
      data-slot="model-table"
      className={
        baseTable?.className
          ? `h-full w-full ${baseTable.className}`
          : "h-full w-full"
      }
      >
      <MetadataProvider
        key={tableInstanceKey}
        app={app}
        model={model}
        persistenceKey={effectivePersistenceKey}
      >
        <TableProvider
          initialState={{
            density: baseTable?.view?.defaultDensity ?? "compact",
            wrapCells: baseTable?.view?.defaultWrapCells ?? false,
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
            navFilterSelections: initialNavFilterSelections,
          }}
        >
          <DynamicBaseTableContent<TSource>
            persistenceKey={effectivePersistenceKey}
            navFilters={navFilters}
            filterPanel={resolvedFilterPanel}
            create={create}
            update={update}
            detail={detail}
            tableConfig={baseTable?.tableConfig}
            view={baseTable?.view}
            performance={baseTable?.performance}
            quickSearch={baseTable?.quickSearch ?? true}
            quickFilters={baseTable?.quickFilters}
            topActions={baseTable?.topActions}
            content={baseTable?.content}
            hideTableOnMobile={baseTable?.hideTableOnMobile ?? true}
            fields={baseTable?.fields}
            showReversed={baseTable?.showReversed}
            showCount={baseTable?.showCount}
            relations={baseTable?.relations}
            relationStats={baseTable?.relationStats}
            queryManager={baseTable?.queryManager}
            columnOrdering={effectiveColumnOrdering}
            hydratePersistedColumnOrder={shouldHydratePersistedColumnOrder}
            skipCount={baseTable?.skipCount ?? false}
            disableSorting={baseTable?.disableSorting}
            enableSelection={baseTable?.enableSelection}
            expand={baseTable?.expand}
            columnActions={baseTable?.columnActions}
            devtoolsEnabled={devtoolsEnabled}
            onRefetchResolved={handleRefetchResolved}
            onSnapshotResolved={handleSnapshotResolved}
          />
        </TableProvider>
      </MetadataProvider>
    </div>
  );
};

export const DynamicModelTable = forwardRef(DynamicModelTableInner) as <
  TSource extends object = Record<string, unknown>,
>(
  props: DynamicModelTableProps<TSource> &
    React.RefAttributes<DynamicModelTableHandle<TSource>>,
) => React.ReactElement | null;

(DynamicModelTable as { displayName?: string }).displayName = "DynamicModelTable";
