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
import { useAuthContext } from "@/auth/context";
import {
  DynamicTable,
  DYNAMIC_TABLE_SELECTION_COLUMN_ID,
  type DynamicTableColumnInput,
} from "@/lib/dynamic-table";
import type { DynamicTableFeatureFlags } from "@/lib/dynamic-table";
import { TooltipProvider } from "@/lib/components/ui/tooltip";
import { cn } from "@/lib/utils";
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
  FieldSchema,
  RowMutationPermissions,
} from "../types";
import type {
  DynamicModelTableHandle,
  DynamicModelTableProps,
  DynamicModelTableSnapshot,
  ModelTableFilterPanelProps,
  ModelTableV2ExpandConfig,
  ModelTableV2TopActionsInput,
  ModelTableV2PerformanceOptions,
  ModelTableV2TableConfig,
  ModelTableV2ViewOptions,
} from "../config/types";
import {
  decodeTableConfigs,
  loadPersistedTableState,
  useTablePersistence,
} from "../hooks/useTablePersistence";
import { useTableColumns } from "../hooks/useTableColumns";
import { useTableData } from "../hooks/useTableData";
import { useTableLayout } from "../hooks/useTableLayout";
import { useTableQueryConfig } from "../hooks/useTableQueryConfig";
import { useTableFilters } from "../hooks/useTableFilters";
import { ColumnFilter } from "./ColumnFilter";
import { RowActions } from "./row/RowActions";
import {
  useModelTableContentController,
  type UseModelTableContentControllerInput,
} from "./content/useModelTableContentController";
import { ModelTableBulkActionsBar } from "./content/ModelTableBulkActionsBar";
import { ModelTableDialogs } from "./content/ModelTableDialogs";
import { ModelTableFooter } from "./content/ModelTableFooter";
import { ModelTableHeader } from "./content/ModelTableHeader";
import { ModelTableToolbarSection } from "./content/ModelTableToolbarSection";
import { ModelTableTopActions } from "./content/ModelTableTopActions";
import type {
  ModelTableContentConfig,
  ModelTableContentSectionVisibility,
  ModelTableTopActionsSlotProps,
} from "./content/types";
import {
  RelationStatsHover,
  type StatsRelationMeta,
} from "./row/RelationStatsHover";
import { TableColumnMenu } from "./TableColumnMenu";
import { TableMobileCard } from "./TableMobileCard";
import { TablePagination } from "./TablePagination";
import {
  formatCellValue,
  getDefaultHiddenColumnIds,
  getSyntheticRelationCountSource,
  toGraphqlFieldName,
} from "../utils";
import {
  buildAccessorPath,
  resolveValueOptimized,
} from "../utils/valueResolution";

/**
 * Internal props used by the dynamic-table powered content implementation.
 */
type DynamicBaseTableContentProps = {
  persistenceKey?: string;
  filterPanel?: ModelTableFilterPanelProps;
  tableConfig?: ModelTableV2TableConfig;
  view?: ModelTableV2ViewOptions;
  performance?: ModelTableV2PerformanceOptions;
  quickSearch?: boolean;
  topActions?: ModelTableV2TopActionsInput;
  content?: ModelTableContentConfig;
  hideTableOnMobile?: boolean;
  fields?: BaseModelTableFieldsInput;
  relations?: Record<string, BaseModelTableRelationConfig>;
  relationStats?: BaseModelTableRelationStatsConfig;
  queryManager?: string;
  columnOrdering?: BaseModelTableColumnOrderingConfig;
  skipCount?: boolean;
  disableSorting?: boolean;
  enableSelection?: boolean;
  expand?: ModelTableV2ExpandConfig;
  columnActions?: BaseModelTableColumnActionsInput;
  /**
   * Emits the current query refetch function to the parent wrapper.
   */
  onRefetchResolved?: (refetch?: BaseModelTableRefetch) => void;
  /**
   * Emits a runtime snapshot whenever table state changes.
   */
  onSnapshotResolved?: (snapshot: DynamicModelTableSnapshot) => void;
};

/**
 * Default section visibility when no content.show overrides are provided.
 */
const DEFAULT_SECTION_VISIBILITY: Required<ModelTableContentSectionVisibility> =
  {
    header: true,
    topActions: true,
    toolbar: true,
    bulkActionsBar: true,
    footer: false,
    dialogs: true,
  };

/**
 * Resolves effective section visibility from defaults and optional overrides.
 */
function resolveSectionVisibility(
  visibility?: ModelTableContentSectionVisibility,
): Required<ModelTableContentSectionVisibility> {
  return {
    ...DEFAULT_SECTION_VISIBILITY,
    ...(visibility ?? {}),
  };
}

/**
 * Empty top-actions renderer used when topActions are intentionally hidden.
 */
const HiddenTopActions: (
  props: ModelTableTopActionsSlotProps,
) => React.ReactNode = () => null;

/**
 * Returns true when the input is a plain object record.
 */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Extracts a backend permission codename from GraphQL errors.
 */
function extractPermissionCodeFromMessage(message: string): string | null {
  const match = message.match(/Permission required:\s*([a-z0-9_.-]+)/i);
  return match?.[1] ?? null;
}

/**
 * Localizes technical GraphQL errors into user-facing French text.
 */
function localizeTableErrorMessage(error: Error): string {
  const rawMessage = error.message || "Une erreur est survenue.";
  const permissionCode = extractPermissionCodeFromMessage(rawMessage);
  if (permissionCode) {
    return `Acces refuse : permission requise (${permissionCode}).`;
  }
  return rawMessage;
}

/**
 * Converts unknown filter-variable order input to a normalized string array.
 */
function toOrderByEntries(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .filter((entry): entry is string => typeof entry === "string")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

/**
 * Compares two string arrays for exact ordered equality.
 */
function areStringArraysEqual(left: string[], right: string[]): boolean {
  if (left.length !== right.length) {
    return false;
  }
  for (let index = 0; index < left.length; index += 1) {
    if (left[index] !== right[index]) {
      return false;
    }
  }
  return true;
}

/**
 * Compares two boolean record maps for exact key/value equality.
 */
function areBooleanMapsEqual(
  left: Record<string, boolean>,
  right: Record<string, boolean>,
): boolean {
  const leftKeys = Object.keys(left);
  const rightKeys = Object.keys(right);
  if (leftKeys.length !== rightKeys.length) {
    return false;
  }
  for (const key of leftKeys) {
    if (left[key] !== right[key]) {
      return false;
    }
  }
  return true;
}

/**
 * Compares two number record maps for exact key/value equality.
 */
function areNumberMapsEqual(
  left: Record<string, number>,
  right: Record<string, number>,
): boolean {
  const leftKeys = Object.keys(left);
  const rightKeys = Object.keys(right);
  if (leftKeys.length !== rightKeys.length) {
    return false;
  }
  for (const key of leftKeys) {
    if (left[key] !== right[key]) {
      return false;
    }
  }
  return true;
}

/**
 * Compares TanStack pagination objects.
 */
function isPaginationStateEqual(
  left: DynamicPaginationState,
  right: DynamicPaginationState,
): boolean {
  return left.pageIndex === right.pageIndex && left.pageSize === right.pageSize;
}

/**
 * Compares expanded-state snapshots.
 */
function isExpandedStateEqual(
  left: ExpandedState,
  right: ExpandedState,
): boolean {
  if (left === right) {
    return true;
  }
  if (typeof left === "boolean" || typeof right === "boolean") {
    return left === right;
  }
  return areBooleanMapsEqual(left, right);
}

/**
 * Resolves a fallback cell string for unknown values.
 */
function formatFallbackCellValue(value: unknown): string {
  if (value === null || value === undefined) {
    return "-";
  }
  if (typeof value === "object") {
    return JSON.stringify(value);
  }
  return String(value);
}

/**
 * Resolves one row id from primary key metadata with safe fallback.
 */
function resolveRowId(
  row: Record<string, unknown>,
  index: number,
  primaryKey: string,
): string {
  const candidate = row[primaryKey] ?? row.id;
  if (typeof candidate === "string" || typeof candidate === "number") {
    return String(candidate);
  }
  return String(index);
}

/**
 * Dynamic, feature-parity table content implemented with DynamicTable as the desktop grid.
 */
function DynamicBaseTableContent({
  persistenceKey,
  filterPanel,
  tableConfig,
  quickSearch,
  topActions,
  content,
  performance,
  hideTableOnMobile,
  fields,
  relations,
  relationStats,
  queryManager,
  columnOrdering,
  skipCount,
  disableSorting,
  enableSelection,
  expand,
  columnActions,
  onRefetchResolved,
  onSnapshotResolved,
}: DynamicBaseTableContentProps) {
  const { user } = useAuthContext();
  const {
    metadata,
    loading: metadataLoading,
    error: metadataError,
    app,
    model,
  } = useMetadata();
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
  } = useTable();
  const { advancedFilters, filterVariables, setAdvancedFilters } =
    useTableFilters();

  const [dynamicExpanded, setDynamicExpanded] = useState<ExpandedState>({});
  const tableScrollRef = useRef<HTMLDivElement>(null);
  const isInfiniteMode = performance?.dataMode === "infinite";

  const locationPath =
    typeof window !== "undefined" ? window.location.pathname : "";
  const effectiveKey = persistenceKey || `${app}-${model}-${locationPath}`;
  useTablePersistence(effectiveKey);

  const userTableConfigs = useMemo(() => {
    const settings = user?.settings as
      | { table_configs?: unknown; tableConfigs?: unknown }
      | undefined;
    return decodeTableConfigs(
      settings?.table_configs ?? settings?.tableConfigs ?? null,
    );
  }, [user?.settings]);

  const persistedState = useMemo(
    () =>
      loadPersistedTableState(effectiveKey, userTableConfigs, {
        allowLocalFallback: true,
      }),
    [effectiveKey, userTableConfigs],
  );

  const { columnDefs, normalizedFieldsConfig, excludedAccessors } =
    useTableColumns({
      metadata,
      fields,
      relations,
      columnVisibility,
      persistedVisibility: persistedState?.columnVisibility,
    });

  const defaultHiddenColumnIds = useMemo(() => {
    if (normalizedFieldsConfig.include !== undefined) {
      return new Set<string>();
    }
    const hidden = getDefaultHiddenColumnIds(metadata);
    normalizedFieldsConfig.add.forEach((entry: { accessor: string }) => {
      const root = entry.accessor.split(".")[0].split("__")[0];
      hidden.delete(root);
      hidden.delete(entry.accessor);
    });
    return hidden;
  }, [metadata, normalizedFieldsConfig]);

  const { queryConfig } = useTableQueryConfig({
    fields,
    relations,
    queryManager,
    skipCount,
    performance,
    normalizedFieldsConfig,
    excludedAccessors,
    defaultHiddenColumnIds,
    persistedVisibility: persistedState?.columnVisibility,
  });

  const { refetch } = useTableData(queryConfig);
  useEffect(() => {
    onRefetchResolved?.(refetch as BaseModelTableRefetch | undefined);
    return () => {
      onRefetchResolved?.(undefined);
    };
  }, [onRefetchResolved, refetch]);

  const { allowColumnDrag, lockedColumns } = useTableLayout({
    columnDefs,
    columnOrdering,
    defaultHiddenColumnIds,
    persistedState,
  });

  const resolvedEnableSelection = useMemo(() => {
    if (enableSelection) {
      return true;
    }
    return (metadata?.templates ?? []).length > 0;
  }, [enableSelection, metadata?.templates]);
  const rowDetailExpandEnabled = useMemo(() => {
    const requested = expand?.enabled ?? Boolean(expand?.renderRow);
    return requested && Boolean(expand?.renderRow);
  }, [expand]);

  const primaryKey = metadata?.primaryKey || "id";
  const selectedRows = useMemo(() => {
    const selectedRowIds = new Set(
      Object.entries(rowSelection)
        .filter(([, isSelected]) => isSelected)
        .map(([rowId]) => rowId),
    );
    if (selectedRowIds.size === 0) {
      return [];
    }
    return data.filter((row, index) =>
      selectedRowIds.has(resolveRowId(row, index, primaryKey)),
    );
  }, [data, primaryKey, rowSelection]);
  const whereType =
    metadata?.filterConfig?.inputTypeName ||
    `${metadata?.model || "Model"}WhereInput`;
  useEffect(() => {
    if (!onSnapshotResolved) {
      return;
    }
    onSnapshotResolved({
      data,
      selectedRows,
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
    const variableOrderBy = isRecord(filterVariables)
      ? toOrderByEntries(filterVariables.orderBy)
      : [];
    if (variableOrderBy.length > 0) {
      return variableOrderBy;
    }
    return advancedFilters.orderBy;
  }, [advancedFilters.orderBy, filterVariables]);

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
      if (!relationStats?.enabled) {
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
        relationStats.include &&
        !relationStats.include.includes(column.id) &&
        !relationStats.include.includes(columnRoot) &&
        !relationStats.include.includes(relationMeta.relationName)
      ) {
        return null;
      }
      if (
        relationStats.exclude &&
        (relationStats.exclude.includes(column.id) ||
          relationStats.exclude.includes(columnRoot) ||
          relationStats.exclude.includes(relationMeta.relationName))
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
    [fieldLookup, relationLookup, relationStats],
  );

  const resolveStatsOverride = useCallback(
    (columnId: string, relationName: string) => {
      return (
        relationStats?.overrides?.[columnId] ||
        relationStats?.overrides?.[relationName]
      );
    },
    [relationStats?.overrides],
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
          const renderedValue = column.render
            ? column.render(value, row, {
                accessor: column.accessor,
                columnId: column.id,
                data,
                refetch: refetch as BaseModelTableRefetch | undefined,
              })
            : (() => {
                const root = column.accessor.replace(/__/g, ".").split(".")[0];
                const field = fieldLookup.get(root);
                if (field) {
                  return formatCellValue(value, field);
                }
                return formatFallbackCellValue(value);
              })();

          const statsRelation = resolveStatsRelation(column);
          if (!statsRelation) {
            return renderedValue;
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
                {renderedValue}
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
    metadata?.model,
    primaryKey,
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
      const nextVariables = isRecord(filterVariables)
        ? { ...filterVariables }
        : {};
      if (nextOrderBy.length > 0) {
        nextVariables.orderBy = nextOrderBy;
      } else {
        delete nextVariables.orderBy;
      }

      setAdvancedFilters(
        {
          ...advancedFilters,
          orderBy: nextOrderBy,
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
      columnOrder:
        resolvedEnableSelection
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
    tableConfig,
    quickSearch,
    fields,
    topActions,
  };
  const sectionController = useModelTableContentController(sectionControllerInput);
  const sectionVisibility = resolveSectionVisibility(content?.show);
  const HeaderSlot = content?.slots?.Header ?? ModelTableHeader;
  const TopActionsSlot = content?.slots?.TopActions ?? ModelTableTopActions;
  const ToolbarSlot = content?.slots?.Toolbar ?? ModelTableToolbarSection;
  const BulkActionsBarSlot =
    content?.slots?.BulkActionsBar ?? ModelTableBulkActionsBar;
  const FooterSlot = content?.slots?.Footer ?? ModelTableFooter;
  const DialogsSlot = content?.slots?.Dialogs ?? ModelTableDialogs;
  const headerTopActionsSlot = sectionVisibility.topActions
    ? TopActionsSlot
    : HiddenTopActions;
  const showStandaloneTopActions =
    !sectionVisibility.header && sectionVisibility.topActions;

  if (metadataLoading) {
    return <LoadingSkeleton />;
  }
  if (metadataError) {
    return <ErrorState error={metadataError} />;
  }

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex h-full w-full max-w-full min-w-0 flex-col overflow-hidden animate-in fade-in duration-700 p-1 sm:p-2">
        {sectionController.metadata && (
          <div className="flex-none">
            <div className="flex flex-col gap-6 w-full animate-in fade-in duration-700">
              {sectionVisibility.header && (
                <HeaderSlot
                  controller={sectionController}
                  TopActionsComponent={headerTopActionsSlot}
                />
              )}

              {showStandaloneTopActions && (
                <div className="flex w-full justify-end px-1">
                  <TopActionsSlot controller={sectionController} />
                </div>
              )}

              {sectionVisibility.toolbar && (
                <ToolbarSlot controller={sectionController} />
              )}
              {sectionVisibility.bulkActionsBar && (
                <BulkActionsBarSlot controller={sectionController} />
              )}
              {sectionVisibility.footer && (
                <FooterSlot controller={sectionController} />
              )}
            </div>
          </div>
        )}

        {hideTableOnMobile && (
          <div className="flex-1 min-h-0 min-w-0 my-2 md:hidden">
            <TableMobileCard
              emptyState={tableConfig?.emptyState}
              refetch={refetch}
              columnActions={columnActions}
            />
          </div>
        )}

        <div
          className={cn(
            "flex-1 min-h-0 min-w-0 transition-all duration-300 my-2",
            hideTableOnMobile ? "hidden md:block" : "block",
          )}
        >
          <div ref={tableScrollRef} className="h-full min-h-0 w-full">
            <DynamicTable
              className="h-full"
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
                  "group/frame relative flex h-full flex-col overflow-hidden rounded-[1.25rem] border border-border/40 bg-card/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-xl transition-all duration-500 hover:shadow-[0_8px_40px_rgb(0,0,0,0.08)] hover:border-border/60",
                actions: {
                  headerLabel: tableConfig?.actionsLabel ?? "Actions",
                  sticky: true,
                  size: 140,
                  renderCell: ({ row }) => (
                    <RowActions
                      row={row}
                      data={data}
                      refetch={refetch}
                      permissions={
                        row.rowPermissions as RowMutationPermissions | undefined
                      }
                      columnActions={columnActions}
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
        </div>

        {!isInfiniteMode && (
          <TablePagination
            labels={tableConfig?.paginationLabels}
            enableSelection={resolvedEnableSelection}
          />
        )}

        {dataError && <DataErrorDisplay error={dataError} />}
        {sectionController.metadata && sectionVisibility.dialogs && (
          <DialogsSlot controller={sectionController} />
        )}
      </div>
    </TooltipProvider>
  );
}

/**
 * Dynamic-model table built on the same metadata/filter contract as ModelTableV2.
 */
export const DynamicModelTable = forwardRef<
  DynamicModelTableHandle,
  DynamicModelTableProps
>(function DynamicModelTable(
  { app, model, filterPanel, baseTable }: DynamicModelTableProps,
  ref,
) {
  const tableInstanceKey = `${app}:${model}`;
  const refetchRef = useRef<BaseModelTableRefetch | undefined>(undefined);
  const snapshotRef = useRef<DynamicModelTableSnapshot>({
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
    (nextSnapshot: DynamicModelTableSnapshot) => {
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
      className={
        baseTable?.className
          ? `h-full w-full ${baseTable.className}`
          : "h-full w-full"
      }
    >
      <MetadataProvider key={tableInstanceKey} app={app} model={model}>
        <TableProvider
          initialState={{
            density: baseTable?.view?.defaultDensity ?? "compact",
            wrapCells: baseTable?.view?.defaultWrapCells ?? false,
          }}
        >
          <DynamicBaseTableContent
            persistenceKey={baseTable?.persistenceKey}
            filterPanel={filterPanel}
            tableConfig={baseTable?.tableConfig}
            view={baseTable?.view}
            performance={baseTable?.performance}
            quickSearch={baseTable?.quickSearch ?? true}
            topActions={baseTable?.topActions}
            content={baseTable?.content}
            hideTableOnMobile={baseTable?.hideTableOnMobile ?? true}
            fields={baseTable?.fields}
            relations={baseTable?.relations}
            relationStats={baseTable?.relationStats}
            queryManager={baseTable?.queryManager}
            columnOrdering={baseTable?.columnOrdering}
            skipCount={baseTable?.skipCount ?? false}
            disableSorting={baseTable?.disableSorting}
            enableSelection={baseTable?.enableSelection}
            expand={baseTable?.expand}
            columnActions={baseTable?.columnActions}
            onRefetchResolved={handleRefetchResolved}
            onSnapshotResolved={handleSnapshotResolved}
          />
        </TableProvider>
      </MetadataProvider>
    </div>
  );
});

DynamicModelTable.displayName = "DynamicModelTable";

/**
 * Skeleton displayed while metadata is loading.
 */
function LoadingSkeleton() {
  return (
    <div
      className="flex h-[400px] w-full flex-col gap-4 p-4 animate-in fade-in duration-500"
      role="status"
    >
      <div className="flex items-center justify-between">
        <div className="h-10 w-64 animate-pulse rounded-lg bg-muted/40" />
        <div className="flex gap-2">
          <div className="h-10 w-24 animate-pulse rounded-lg bg-muted/40" />
          <div className="h-10 w-24 animate-pulse rounded-lg bg-muted/40" />
        </div>
      </div>
      <div className="flex-1 rounded-xl border border-border/40 bg-card/30 backdrop-blur-sm p-1">
        <div className="h-12 w-full animate-pulse rounded-t-lg bg-muted/60" />
        {[...Array(6)].map((_, index) => (
          <div key={index} className="flex gap-4 p-4 border-b border-border/10">
            <div className="h-4 w-4 animate-pulse rounded bg-muted/40" />
            <div className="h-4 flex-1 animate-pulse rounded bg-muted/30" />
            <div className="h-4 w-24 animate-pulse rounded bg-muted/30" />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Error state displayed when metadata loading fails.
 */
function ErrorState({ error }: { error: Error }) {
  return (
    <div className="flex h-[400px] items-center justify-center p-8">
      <div className="max-w-md w-full rounded-2xl border border-red-200 bg-red-50/30 p-8 text-center backdrop-blur-sm animate-in zoom-in-95 duration-300">
        <h3 className="mb-2 text-lg font-bold text-red-900">
          Erreur de metadonnees
        </h3>
        <p className="text-sm text-red-700/80 mb-6">
          {localizeTableErrorMessage(error)}
        </p>
        <button
          onClick={() => window.location.reload()}
          className="rounded-full bg-red-600 px-6 py-2 text-sm font-semibold text-white shadow-lg"
        >
          Reessayer
        </button>
      </div>
    </div>
  );
}

/**
 * Data-level error display shown below the table.
 */
function DataErrorDisplay({ error }: { error: Error }) {
  return (
    <div className="flex-none flex items-center gap-2 rounded-lg bg-red-50/50 border border-red-100 px-4 py-2 text-xs font-semibold text-red-600 mt-2">
      Erreur de donnees : {localizeTableErrorMessage(error)}
    </div>
  );
}
