/**
 * @file DynamicTable.tsx
 * @description Composant de table dynamique basé sur TanStack Table v8.
 * Fournit des fonctionnalités de tri, sélection de lignes, colonnes redimensionnables, regroupement et virtualisation.
 */

import { useCallback, useEffect, useMemo, useRef } from "react";
import type { CSSProperties } from "react";
import { DndContext, closestCenter } from "@dnd-kit/core";
import type { DragEndEvent } from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  type ColumnDef,
  type ColumnSizingState,
  type ExpandedState,
  type PaginationState,
  type RowSelectionState,
  type Updater,
  type VisibilityState,
  getCoreRowModel,
  getExpandedRowModel,
  getGroupedRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ChevronRight, Loader2 } from "lucide-react";
import { Checkbox } from "@/shared/ui/kit/checkbox";
import { Table } from "@/shared/ui/kit/table";
import { cn } from "@/shared/utils";
import type {
  DynamicTableColumnInput,
  DynamicTableExpandColumnConfig,
  DynamicTableColumnSpec,
  DynamicTableProps,
  DynamicTableResolvedFeatures,
  DynamicTableResolvedLayout,
} from "../types";
import { useDynamicTableState } from "../state/useDynamicTableState";
import {
  type DynamicTableSortDescriptor,
  orderByToSortingState,
  sortingStateToOrderBy,
} from "../utils/sorting";
import { DynamicTableHeader } from "./DynamicTableHeader";
import { DynamicTableRows } from "./DynamicTableRows";
import { DynamicTablePagination } from "./DynamicTablePagination";

/**
 * Utility id for the built-in selection column.
 */
export const DYNAMIC_TABLE_SELECTION_COLUMN_ID = "__dynamic_table_selection";

/**
 * Utility id for the built-in expand column.
 */
export const DYNAMIC_TABLE_EXPAND_COLUMN_ID = "__dynamic_table_expand";

/**
 * Utility id for the built-in actions column.
 */
export const DYNAMIC_TABLE_ACTIONS_COLUMN_ID = "__dynamic_table_actions";

/**
 * Resolves updater values into concrete next-state values.
 */
function resolveUpdater<TValue>(
  updater: Updater<TValue>,
  previousValue: TValue,
): TValue {
  if (typeof updater === "function") {
    const updateFn = updater as (previousState: TValue) => TValue;
    return updateFn(previousValue);
  }
  return updater;
}

/**
 * Returns true when the input column node is a group specification.
 */
function isGroupSpec<TRow extends Record<string, unknown>>(
  column: DynamicTableColumnInput<TRow>,
): column is Extract<DynamicTableColumnInput<TRow>, { columns: unknown }> {
  return "columns" in column;
}

/**
 * Collects leaf sort descriptors from nested column specifications.
 */
function collectSortDescriptors<TRow extends Record<string, unknown>>(
  columns: DynamicTableColumnInput<TRow>[],
): DynamicTableSortDescriptor[] {
  const descriptors: DynamicTableSortDescriptor[] = [];

  columns.forEach((column) => {
    if (isGroupSpec(column)) {
      descriptors.push(...collectSortDescriptors(column.columns));
      return;
    }
    descriptors.push({
      id: column.id,
      sortKey: column.sortKey,
    });
  });

  return descriptors;
}

/**
 * Collects leaf column ids from nested column specifications in render order.
 */
function collectLeafColumnIds<TRow extends Record<string, unknown>>(
  columns: DynamicTableColumnInput<TRow>[],
): string[] {
  const ids: string[] = [];
  columns.forEach((column) => {
    if (isGroupSpec(column)) {
      ids.push(...collectLeafColumnIds(column.columns));
      return;
    }
    ids.push(column.id);
  });
  return ids;
}

/**
 * Forces utility columns into stable positions for controlled column-order state.
 */
function normalizeColumnOrderWithUtilityColumns(
  columnOrder: string[],
  leafColumnIds: string[],
  options: {
    includeExpand: boolean;
    includeSelection: boolean;
    includeActions: boolean;
  },
): string[] {
  if (columnOrder.length === 0) {
    return columnOrder;
  }

  const leafIdSet = new Set(leafColumnIds);
  const userOrderedIds: string[] = [];
  const seenUserIds = new Set<string>();

  columnOrder.forEach((id) => {
    if (
      id === DYNAMIC_TABLE_EXPAND_COLUMN_ID ||
      id === DYNAMIC_TABLE_SELECTION_COLUMN_ID ||
      id === DYNAMIC_TABLE_ACTIONS_COLUMN_ID
    ) {
      return;
    }
    if (!leafIdSet.has(id) || seenUserIds.has(id)) {
      return;
    }
    seenUserIds.add(id);
    userOrderedIds.push(id);
  });

  leafColumnIds.forEach((id) => {
    if (!seenUserIds.has(id)) {
      seenUserIds.add(id);
      userOrderedIds.push(id);
    }
  });

  const normalizedOrder = [...userOrderedIds];
  if (options.includeSelection) {
    normalizedOrder.unshift(DYNAMIC_TABLE_SELECTION_COLUMN_ID);
  }
  if (options.includeExpand) {
    normalizedOrder.unshift(DYNAMIC_TABLE_EXPAND_COLUMN_ID);
  }
  if (options.includeActions) {
    normalizedOrder.push(DYNAMIC_TABLE_ACTIONS_COLUMN_ID);
  }
  return normalizedOrder;
}

/**
 * Formats fallback cell values when no custom renderer is provided.
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
 * Resolves default row ids when no custom resolver is provided.
 */
function resolveDefaultRowId<TRow extends Record<string, unknown>>(
  row: TRow,
  index: number,
): string {
  const rowIdCandidate = row.id;
  if (
    typeof rowIdCandidate === "string" ||
    typeof rowIdCandidate === "number"
  ) {
    return String(rowIdCandidate);
  }
  return String(index);
}

/**
 * Resolves fully-defaulted feature flags.
 */
function resolveFeatures(
  input?: DynamicTableProps<Record<string, unknown>>["features"],
): DynamicTableResolvedFeatures {
  return {
    enableSelection: input?.enableSelection ?? false,
    enableColumnOrdering: input?.enableColumnOrdering ?? true,
    enableColumnResizing: input?.enableColumnResizing ?? true,
    enableColumnHiding: input?.enableColumnHiding ?? true,
    enableGrouping: input?.enableGrouping ?? true,
    enableVirtualization: input?.enableVirtualization ?? true,
    virtualizeThreshold: input?.virtualizeThreshold ?? 50,
    overscan: input?.overscan ?? 10,
    dataMode: input?.dataMode ?? "pagination",
    enablePagination: input?.enablePagination ?? true,
    infiniteScrollThresholdPx: input?.infiniteScrollThresholdPx ?? 200,
    lockedColumnIds: input?.lockedColumnIds ?? [],
  };
}

/**
 * Resolves fully-defaulted layout options.
 */
function resolveLayout<TRow extends Record<string, unknown>>(
  input?: DynamicTableProps<TRow>["layout"],
): DynamicTableResolvedLayout<TRow> {
  return {
    density: input?.density ?? "comfortable",
    wrapCells: input?.wrapCells ?? false,
    containerClassName: input?.containerClassName,
    tableClassName: input?.tableClassName,
    headerClassName: input?.headerClassName,
    rowClassName: input?.rowClassName,
    cellClassName: input?.cellClassName,
    stickySelectionColumn: input?.stickySelectionColumn ?? false,
    actions: input?.actions,
  };
}

/**
 * Resolved expand-column config with defaults.
 */
type DynamicTableResolvedExpandColumnConfig<
  TRow extends Record<string, unknown>,
> = Required<Pick<DynamicTableExpandColumnConfig<TRow>, "size" | "sticky">> &
  Pick<DynamicTableExpandColumnConfig<TRow>, "headerLabel" | "ariaLabel">;

/**
 * Resolves fully-defaulted expand-column options.
 */
function resolveExpandColumnConfig<TRow extends Record<string, unknown>>(
  input?: DynamicTableExpandColumnConfig<TRow>,
): DynamicTableResolvedExpandColumnConfig<TRow> {
  return {
    size: input?.size ?? 44,
    sticky: input?.sticky ?? true,
    headerLabel: input?.headerLabel,
    ariaLabel: input?.ariaLabel,
  };
}

/**
 * Converts one leaf column specification into a TanStack column definition.
 */
function buildLeafColumnDef<TRow extends Record<string, unknown>>(
  column: DynamicTableColumnSpec<TRow>,
): ColumnDef<TRow, unknown> {
  return {
    id: column.id,
    accessorKey: column.accessorKey,
    accessorFn: column.accessorFn,
    header: (context) =>
      column.header?.({
        table: context.table,
        columnId: column.id,
      }) ??
      column.title ??
      column.id,
    cell: (context) => {
      const value = context.getValue();
      const rendered = column.cell?.({
        table: context.table,
        row: context.row.original,
        rowIndex: context.row.index,
        columnId: column.id,
        value,
      });
      return rendered ?? formatFallbackCellValue(value);
    },
    enableSorting: column.enableSorting ?? true,
    enableHiding: column.enableHiding ?? true,
    enableGrouping: column.enableGrouping ?? true,
    enableResizing: column.enableResizing ?? true,
    size: column.size,
    minSize: column.minSize,
    maxSize: column.maxSize,
    meta: {
      ...column.meta,
      headerMode: column.headerMode,
      title: typeof column.title === "string" ? column.title : undefined,
      className: column.className,
      headerClassName: column.headerClassName,
      sortKey: column.sortKey,
    },
  };
}

/**
 * Converts nested column input into TanStack column definitions.
 */
function buildColumnDefsFromSpec<TRow extends Record<string, unknown>>(
  columns: DynamicTableColumnInput<TRow>[],
): ColumnDef<TRow, unknown>[] {
  return columns.map((column) => {
    if (isGroupSpec(column)) {
      return {
        id: column.id,
        header: column.header ?? column.title ?? column.id,
        columns: buildColumnDefsFromSpec(column.columns),
      } as ColumnDef<TRow, unknown>;
    }

    return buildLeafColumnDef(column);
  });
}

/**
 * Creates the built-in selection column definition.
 */
function buildSelectionColumnDef<
  TRow extends Record<string, unknown>,
>(): ColumnDef<TRow, unknown> {
  return {
    id: DYNAMIC_TABLE_SELECTION_COLUMN_ID,
    header: () => null,
    cell: (context) => (
      <div className="grid place-items-center">
        <Checkbox
          checked={context.row.getIsSelected()}
          onCheckedChange={(checked) =>
            context.row.toggleSelected(Boolean(checked))
          }
          aria-label={`Select row ${context.row.id}`}
        />
      </div>
    ),
    size: 52,
    minSize: 52,
    maxSize: 52,
    enableHiding: false,
    enableSorting: false,
    enableGrouping: false,
    enableResizing: false,
  };
}

/**
 * Resolves fallback aria-label text for expand/collapse toggles.
 */
function resolveExpandToggleAriaLabel<TRow extends Record<string, unknown>>(
  context: {
    row: TRow;
    rowId: string;
    rowIndex: number;
    expanded: boolean;
  },
  config: DynamicTableResolvedExpandColumnConfig<TRow>,
): string {
  if (config.ariaLabel) {
    return config.ariaLabel(context.row, context.rowIndex, context.expanded);
  }
  const actionLabel = context.expanded ? "Collapse" : "Expand";
  return `${actionLabel} row ${context.rowId}`;
}

/**
 * Creates the optional built-in expand column definition.
 */
function buildExpandColumnDef<TRow extends Record<string, unknown>>(
  config: DynamicTableResolvedExpandColumnConfig<TRow>,
): ColumnDef<TRow, unknown> {
  return {
    id: DYNAMIC_TABLE_EXPAND_COLUMN_ID,
    header: () => null,
    cell: (context) => {
      const expanded = context.row.getIsExpanded();
      const rowId = String(context.row.id);
      const rowIndex = context.row.index;
      const ariaLabel = resolveExpandToggleAriaLabel(
        {
          row: context.row.original,
          rowId,
          rowIndex,
          expanded,
        },
        config,
      );

      return (
        <div className="grid place-items-center">
          <button
            type="button"
            className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted/80 hover:text-foreground transition-colors"
            onClick={context.row.getToggleExpandedHandler()}
            aria-label={ariaLabel}
            aria-expanded={expanded}
          >
            <ChevronRight className={cn("h-4 w-4", expanded && "rotate-90")} />
          </button>
        </div>
      );
    },
    size: config.size,
    minSize: config.size,
    maxSize: config.size,
    enableHiding: false,
    enableSorting: false,
    enableGrouping: false,
    enableResizing: false,
    meta: {
      title:
        typeof config.headerLabel === "string" ? config.headerLabel : undefined,
    },
  };
}

/**
 * Creates the optional built-in actions column definition.
 */
function buildActionsColumnDef<TRow extends Record<string, unknown>>(
  layout: DynamicTableResolvedLayout<TRow>,
): ColumnDef<TRow, unknown> {
  const size = layout.actions?.size;

  return {
    id: DYNAMIC_TABLE_ACTIONS_COLUMN_ID,
    header: () => null,
    cell: (context) => {
      if (!layout.actions) {
        return null;
      }
      return layout.actions.renderCell({
        row: context.row.original,
        rowIndex: context.row.index,
      });
    },
    ...(typeof size === "number"
      ? {
          size,
          minSize: size,
          maxSize: size,
        }
      : {}),
    enableHiding: false,
    enableSorting: false,
    enableGrouping: false,
    enableResizing: false,
    meta: {
      className: layout.actions?.cellClassName,
      headerClassName: layout.actions?.headerClassName,
      title:
        typeof layout.actions?.headerLabel === "string"
          ? layout.actions.headerLabel
          : undefined,
    },
  };
}

/**
 * DynamicTable renders a model-agnostic, spec-driven table using TanStack v8.
 */
export function DynamicTable<TRow extends Record<string, unknown>>({
  rows,
  columns,
  getRowId,
  getSubRows,
  loading = false,
  loadingText,
  emptyState,
  className,
  state,
  defaultState,
  onStateChange,
  onOrderByChange,
  onRowSelectionChange,
  onPaginationChange,
  expand,
  sortMode = "server",
  paginationMode = "server",
  features: featuresInput,
  layout: layoutInput,
  totalRows,
  pageCount,
  hasNextPage,
  hasPreviousPage,
  onLoadMore,
}: DynamicTableProps<TRow>) {
  const features = useMemo(
    () =>
      resolveFeatures(
        featuresInput as DynamicTableProps<Record<string, unknown>>["features"],
      ),
    [featuresInput],
  );
  const layout = useMemo(() => resolveLayout(layoutInput), [layoutInput]);
  const expandRequested = expand?.enabled;
  const expandRenderer = expand?.renderRow;
  const expandOnChange = expand?.onExpandedChange;
  const expandColumnConfig = useMemo(
    () => resolveExpandColumnConfig(expand?.column),
    [expand?.column],
  );

  const dynamicState = useDynamicTableState({
    state,
    defaultState: {
      ...defaultState,
      density: defaultState?.density ?? layout.density,
      wrapCells: defaultState?.wrapCells ?? layout.wrapCells,
    },
    onStateChange,
    onOrderByChange,
    onRowSelectionChange,
    onExpandedChange: expandOnChange,
    onPaginationChange,
  });

  const rowDetailRequested = expandRequested ?? Boolean(expandRenderer);
  const groupingActive =
    features.enableGrouping && dynamicState.grouping.length > 0;
  const rowDetailEnabled = rowDetailRequested && Boolean(expandRenderer);
  const showExpandColumn = rowDetailEnabled && !groupingActive;
  const selectionColumnLeftOffsetPx =
    showExpandColumn && expandColumnConfig.sticky ? expandColumnConfig.size : 0;

  const sortDescriptors = useMemo(
    () => collectSortDescriptors(columns),
    [columns],
  );
  const leafColumnIds = useMemo(() => collectLeafColumnIds(columns), [columns]);
  const sortingState = useMemo(
    () => orderByToSortingState(dynamicState.orderBy, sortDescriptors),
    [dynamicState.orderBy, sortDescriptors],
  );
  const controlledColumnOrder = useMemo(
    () =>
      normalizeColumnOrderWithUtilityColumns(
        dynamicState.columnOrder,
        leafColumnIds,
        {
          includeExpand: showExpandColumn,
          includeSelection: features.enableSelection,
          includeActions: Boolean(layout.actions),
        },
      ),
    [
      dynamicState.columnOrder,
      features.enableSelection,
      leafColumnIds,
      layout.actions,
      showExpandColumn,
    ],
  );

  const baseColumnDefs = useMemo(
    () => buildColumnDefsFromSpec(columns),
    [columns],
  );

  const columnDefs = useMemo(() => {
    const resolved = [...baseColumnDefs];
    if (features.enableSelection) {
      resolved.unshift(buildSelectionColumnDef<TRow>());
    }
    if (showExpandColumn) {
      resolved.unshift(buildExpandColumnDef<TRow>(expandColumnConfig));
    }
    if (layout.actions) {
      resolved.push(buildActionsColumnDef(layout));
    }
    return resolved;
  }, [
    baseColumnDefs,
    expandColumnConfig,
    features.enableSelection,
    layout,
    showExpandColumn,
  ]);

  const table = useReactTable({
    data: rows,
    columns: columnDefs,
    initialState: {
      pagination: dynamicState.pagination,
    },
    state: {
      sorting: sortingState,
      rowSelection: dynamicState.rowSelection,
      columnOrder: controlledColumnOrder,
      columnVisibility: dynamicState.columnVisibility,
      columnSizing: dynamicState.columnSizing,
      grouping: dynamicState.grouping,
      expanded: dynamicState.expanded,
      pagination: dynamicState.pagination,
    },
    getRowId: (row, index) =>
      getRowId?.(row, index) ?? resolveDefaultRowId(row, index),
    getSubRows,
    getRowCanExpand: (row) => {
      if (showExpandColumn) {
        return true;
      }
      return row.subRows.length > 0;
    },
    enableRowSelection: features.enableSelection,
    enableMultiSort: true,
    columnResizeMode: "onChange",
    manualSorting: sortMode === "server",
    manualPagination: paginationMode === "server",
    autoResetExpanded: false,
    pageCount: paginationMode === "server" ? pageCount : undefined,
    onSortingChange: (updater) => {
      const nextSorting = resolveUpdater(updater, sortingState);
      dynamicState.setOrderBy(
        sortingStateToOrderBy(nextSorting, sortDescriptors),
      );
    },
    onRowSelectionChange: (updater) =>
      dynamicState.setRowSelection(updater as Updater<RowSelectionState>),
    onColumnOrderChange: (updater) =>
      dynamicState.setColumnOrder(updater as Updater<string[]>),
    onColumnVisibilityChange: (updater) =>
      dynamicState.setColumnVisibility(updater as Updater<VisibilityState>),
    onColumnSizingChange: (updater) =>
      dynamicState.setColumnSizing(updater as Updater<ColumnSizingState>),
    onGroupingChange: (updater) =>
      dynamicState.setGrouping(updater as Updater<string[]>),
    onExpandedChange: (updater) =>
      dynamicState.setExpanded(updater as Updater<ExpandedState>),
    onPaginationChange: (updater) =>
      dynamicState.setPagination(updater as Updater<PaginationState>),
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: sortMode === "client" ? getSortedRowModel() : undefined,
    getGroupedRowModel: features.enableGrouping
      ? getGroupedRowModel()
      : undefined,
    getExpandedRowModel:
      features.enableGrouping || showExpandColumn
        ? getExpandedRowModel()
        : undefined,
    getPaginationRowModel:
      features.enablePagination &&
      features.dataMode !== "infinite" &&
      paginationMode === "client"
        ? getPaginationRowModel()
        : undefined,
  });

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const lockedColumns = useMemo(
    () =>
      new Set<string>([
        ...features.lockedColumnIds,
        DYNAMIC_TABLE_EXPAND_COLUMN_ID,
        DYNAMIC_TABLE_SELECTION_COLUMN_ID,
        DYNAMIC_TABLE_ACTIONS_COLUMN_ID,
      ]),
    [features.lockedColumnIds],
  );

  const sortableColumnIds = useMemo(
    () => table.getVisibleLeafColumns().map((column) => column.id),
    [table],
  );

  /**
   * Resets visibility/order/sizing state back to defaults.
   */
  const handleResetLayout = useCallback(() => {
    dynamicState.setColumnVisibility({});
    dynamicState.setColumnOrder([]);
    dynamicState.setColumnSizing({});
  }, [dynamicState]);

  /**
   * Reorders columns after a drag end event.
   */
  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      if (!features.enableColumnOrdering || !dynamicState.dragModeEnabled) {
        return;
      }

      const activeId = String(event.active.id);
      const overId = event.over ? String(event.over.id) : null;
      if (!overId || activeId === overId) {
        return;
      }
      if (lockedColumns.has(activeId) || lockedColumns.has(overId)) {
        return;
      }

      const baseOrder =
        dynamicState.columnOrder.length > 0
          ? [...dynamicState.columnOrder]
          : table.getAllLeafColumns().map((column) => column.id);

      const oldIndex = baseOrder.indexOf(activeId);
      const nextIndex = baseOrder.indexOf(overId);
      if (oldIndex < 0 || nextIndex < 0) {
        return;
      }

      dynamicState.setColumnOrder(arrayMove(baseOrder, oldIndex, nextIndex));
    },
    [dynamicState, features.enableColumnOrdering, lockedColumns, table],
  );

  /**
   * Loads more data when infinite mode reaches bottom threshold.
   */
  useEffect(() => {
    if (features.dataMode !== "infinite" || !onLoadMore) {
      return;
    }

    const container = scrollContainerRef.current;
    if (!container) {
      return;
    }

    let ticking = false;
    const onScroll = () => {
      if (ticking || loading || !hasNextPage) {
        return;
      }
      ticking = true;
      window.requestAnimationFrame(() => {
        ticking = false;
        const distanceToBottom =
          container.scrollHeight - container.scrollTop - container.clientHeight;
        if (distanceToBottom <= features.infiniteScrollThresholdPx) {
          onLoadMore({ rowsCount: rows.length });
        }
      });
    };

    container.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      container.removeEventListener("scroll", onScroll);
    };
  }, [
    features.dataMode,
    features.infiniteScrollThresholdPx,
    hasNextPage,
    loading,
    onLoadMore,
    rows.length,
  ]);

  const tableStyle = useMemo<CSSProperties>(
    () => ({
      minWidth: "100%",
      borderCollapse: "separate",
      borderSpacing: 0,
    }),
    [],
  );

  return (
    <div
      className={cn(
        "flex h-full w-full min-w-0 flex-col overflow-hidden",
        className,
      )}
    >
      <div
        className={cn(
          "relative flex min-h-0 flex-1 flex-col overflow-hidden bg-background shadow-none",
          layout.containerClassName,
        )}
      >
        <div
          ref={scrollContainerRef}
          className="min-h-0 flex-1 overflow-auto"
        >
          <DndContext
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={sortableColumnIds}
              strategy={horizontalListSortingStrategy}
            >
              <Table
                style={tableStyle}
                className={cn("w-full", layout.tableClassName)}
              >
                <DynamicTableHeader
                  table={table}
                  state={dynamicState}
                  features={features}
                  layout={layout}
                  expandColumnId={DYNAMIC_TABLE_EXPAND_COLUMN_ID}
                  selectionColumnId={DYNAMIC_TABLE_SELECTION_COLUMN_ID}
                  actionsColumnId={DYNAMIC_TABLE_ACTIONS_COLUMN_ID}
                  expandColumnHeader={expandColumnConfig.headerLabel}
                  expandColumnSticky={
                    showExpandColumn && expandColumnConfig.sticky
                  }
                  selectionColumnLeftOffsetPx={selectionColumnLeftOffsetPx}
                  onResetLayout={handleResetLayout}
                />
                <DynamicTableRows
                  table={table}
                  loading={loading}
                  loadingText={loadingText}
                  emptyState={emptyState}
                  features={features}
                  layout={{
                    ...layout,
                    density: dynamicState.density,
                    wrapCells: dynamicState.wrapCells,
                  }}
                  scrollContainerRef={scrollContainerRef}
                  disableVirtualization={showExpandColumn}
                  expansionEnabled={showExpandColumn}
                  renderExpandedRow={
                    showExpandColumn
                      ? (context) => expandRenderer?.(context)
                      : undefined
                  }
                  expandColumnId={DYNAMIC_TABLE_EXPAND_COLUMN_ID}
                  selectionColumnId={DYNAMIC_TABLE_SELECTION_COLUMN_ID}
                  actionsColumnId={DYNAMIC_TABLE_ACTIONS_COLUMN_ID}
                  expandColumnSticky={
                    showExpandColumn && expandColumnConfig.sticky
                  }
                  selectionColumnLeftOffsetPx={selectionColumnLeftOffsetPx}
                />
              </Table>
            </SortableContext>
          </DndContext>
        </div>
        {features.dataMode === "infinite" ? (
          <div className="flex items-center justify-between border-t border-border/20 bg-muted/20 px-4 py-2.5 text-[11px] font-medium text-muted-foreground backdrop-blur-sm">
            <span className="tabular-nums">{rows.length} éléments chargés</span>
            {loading ? (
              <span className="inline-flex items-center gap-2 text-primary">
                <Loader2 className="size-3.5" />
                Chargement…
              </span>
            ) : hasNextPage ? (
              <span className="text-muted-foreground/60">
                Faites défiler pour charger plus
              </span>
            ) : (
              <span className="text-muted-foreground/40">Fin de la liste</span>
            )}
          </div>
        ) : null}
      </div>

      {features.enablePagination && features.dataMode !== "infinite" ? (
        <DynamicTablePagination
          state={dynamicState}
          enableSelection={features.enableSelection}
          totalRows={totalRows}
          pageCount={pageCount}
          hasNextPage={hasNextPage}
          hasPreviousPage={hasPreviousPage}
          mode={paginationMode}
        />
      ) : null}
    </div>
  );
}
