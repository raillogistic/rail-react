import type React from "react";
import type {
  ColumnSizingState,
  ExpandedState,
  PaginationState,
  RowSelectionState,
  Table,
  VisibilityState,
} from "@tanstack/react-table";

/**
 * Represents a single external sorting token used by the table API.
 * Example values: `"name"`, `"-createdAt"`.
 */
export type DynamicTableOrderByEntry = string;

/**
 * Controls global row density.
 */
export type DynamicTableDensity = "compact" | "comfortable" | "spacious";

/**
 * Controls table pagination behavior.
 */
export type DynamicTableDataMode = "pagination" | "infinite";

/**
 * Controls sorting ownership and execution strategy.
 */
export type DynamicTableSortMode = "server" | "client";

/**
 * Controls pagination ownership and execution strategy.
 */
export type DynamicTablePaginationMode = "server" | "client";

/**
 * Header render context for a leaf column.
 */
export interface DynamicTableHeaderRenderContext<
  TRow extends Record<string, unknown>,
> {
  /** The current table instance. */
  table: Table<TRow>;
  /** The current column id. */
  columnId: string;
}

/**
 * Cell render context for a leaf column.
 */
export interface DynamicTableCellRenderContext<
  TRow extends Record<string, unknown>,
> {
  /** The current table instance. */
  table: Table<TRow>;
  /** Original row data object. */
  row: TRow;
  /** Zero-based row index in current row model. */
  rowIndex: number;
  /** Current column id. */
  columnId: string;
  /** Resolved accessor value for the current cell. */
  value: unknown;
}

/**
 * Styling context for row-level className resolution.
 */
export interface DynamicTableRowClassContext<
  TRow extends Record<string, unknown>,
> {
  /** Original row data object. */
  row: TRow;
  /** Zero-based row index in current row model. */
  rowIndex: number;
}

/**
 * Styling context for cell-level className resolution.
 */
export interface DynamicTableCellClassContext<
  TRow extends Record<string, unknown>,
> {
  /** Original row data object. */
  row: TRow;
  /** Zero-based row index in current row model. */
  rowIndex: number;
  /** Current column id. */
  columnId: string;
  /** Resolved accessor value for the current cell. */
  value: unknown;
}

/**
 * Context passed to `renderExpandedRow` for row-detail panel rendering.
 */
export interface DynamicTableExpandedRowRenderContext<
  TRow extends Record<string, unknown>,
> {
  /** Original row data object. */
  row: TRow;
  /** Zero-based row index in current row model. */
  rowIndex: number;
  /** The current table instance. */
  table: Table<TRow>;
}

/**
 * Leaf column specification used to generate a TanStack column definition.
 */
export interface DynamicTableColumnSpec<TRow extends Record<string, unknown>> {
  /** Stable column id. */
  id: string;
  /** Controls whether this column uses built-in or fully custom header rendering. */
  headerMode?: "menu" | "custom";
  /** Optional static title used for default header rendering. */
  title?: React.ReactNode;
  /** Optional accessor key for simple field columns. */
  accessorKey?: keyof TRow & string;
  /** Optional accessor function for computed values. */
  accessorFn?: (row: TRow) => unknown;
  /** Optional custom header renderer. */
  header?: (
    context: DynamicTableHeaderRenderContext<TRow>,
  ) => React.ReactNode;
  /** Optional custom cell renderer. */
  cell?: (context: DynamicTableCellRenderContext<TRow>) => React.ReactNode;
  /** Enables sort actions for this column. */
  enableSorting?: boolean;
  /** Enables hide/show actions for this column. */
  enableHiding?: boolean;
  /** Enables grouping actions for this column. */
  enableGrouping?: boolean;
  /** Enables resize handles for this column. */
  enableResizing?: boolean;
  /** Optional external sort key used for `orderBy` mapping. */
  sortKey?: string;
  /** Optional initial/default size in px. */
  size?: number;
  /** Optional minimum size in px. */
  minSize?: number;
  /** Optional maximum size in px. */
  maxSize?: number;
  /** Optional className applied to body cells of this column. */
  className?: string;
  /** Optional className applied to header cells of this column. */
  headerClassName?: string;
  /** Additional consumer metadata. */
  meta?: Record<string, unknown>;
}

/**
 * Group column specification allowing nested header layouts.
 */
export interface DynamicTableColumnGroupSpec<
  TRow extends Record<string, unknown>,
> {
  /** Stable group id. */
  id: string;
  /** Optional static title used for the group header. */
  title?: React.ReactNode;
  /** Optional custom header content for the group. */
  header?: React.ReactNode;
  /** Nested child columns/groups. */
  columns: DynamicTableColumnInput<TRow>[];
}

/**
 * A single column entry in the table specification.
 */
export type DynamicTableColumnInput<TRow extends Record<string, unknown>> =
  | DynamicTableColumnSpec<TRow>
  | DynamicTableColumnGroupSpec<TRow>;

/**
 * Optional actions-column layout configuration.
 */
export interface DynamicTableActionsLayout<
  TRow extends Record<string, unknown>,
> {
  /** Header label for the actions column. */
  headerLabel?: React.ReactNode;
  /** Whether the actions column is sticky on the right edge. */
  sticky?: boolean;
  /** Fixed size in px for the actions column. */
  size?: number;
  /** Optional className for actions header cell. */
  headerClassName?: string;
  /** Optional className for actions body cells. */
  cellClassName?: string;
  /** Cell renderer for row actions. */
  renderCell: (context: {
    /** Original row object. */
    row: TRow;
    /** Zero-based row index in the current row model. */
    rowIndex: number;
  }) => React.ReactNode;
}

/**
 * Optional configuration for the built-in row-expand utility column.
 */
export interface DynamicTableExpandColumnConfig<
  TRow extends Record<string, unknown>,
> {
  /** Fixed size in px for the expand column. */
  size?: number;
  /** Whether the expand column is sticky on the left edge. */
  sticky?: boolean;
  /** Optional header label for the expand column. */
  headerLabel?: React.ReactNode;
  /** Optional aria-label resolver for the expand toggle button. */
  ariaLabel?: (
    row: TRow,
    rowIndex: number,
    expanded: boolean,
  ) => string;
}

/**
 * Row-detail expansion configuration.
 */
export interface DynamicTableExpandConfig<
  TRow extends Record<string, unknown>,
> {
  /** Enables row-detail expansion mode. Defaults to `Boolean(renderRow)`. */
  enabled?: boolean;
  /** Emits expanded state after row expansion transitions. */
  onExpandedChange?: (expanded: ExpandedState) => void;
  /** Optional configuration for the built-in expand utility column. */
  column?: DynamicTableExpandColumnConfig<TRow>;
  /** Optional row-detail panel renderer shown below expanded rows. */
  renderRow?: (
    context: DynamicTableExpandedRowRenderContext<TRow>,
  ) => React.ReactNode;
}

/**
 * Global visual and layout options.
 */
export interface DynamicTableLayoutSpec<TRow extends Record<string, unknown>> {
  /** Initial/controlled density. */
  density?: DynamicTableDensity;
  /** Initial/controlled wrapping behavior for text-heavy cells. */
  wrapCells?: boolean;
  /** Optional className for the outer table card container. */
  containerClassName?: string;
  /** Optional className for the table element. */
  tableClassName?: string;
  /** Optional className for header row groups. */
  headerClassName?: string;
  /** Optional dynamic row className resolver. */
  rowClassName?: (context: DynamicTableRowClassContext<TRow>) => string;
  /** Optional dynamic cell className resolver. */
  cellClassName?: (context: DynamicTableCellClassContext<TRow>) => string;
  /** Enables sticky behavior for the selection column. */
  stickySelectionColumn?: boolean;
  /** Optional actions column layout. */
  actions?: DynamicTableActionsLayout<TRow>;
}

/**
 * Core feature flags for table capabilities.
 */
export interface DynamicTableFeatureFlags {
  /** Enables checkbox selection column and row selection state. */
  enableSelection?: boolean;
  /** Enables drag-and-drop column ordering. */
  enableColumnOrdering?: boolean;
  /** Enables manual column resize interactions. */
  enableColumnResizing?: boolean;
  /** Enables hide/show actions for columns. */
  enableColumnHiding?: boolean;
  /** Enables grouping actions and grouped row rendering. */
  enableGrouping?: boolean;
  /** Enables virtualized body rendering for large datasets. */
  enableVirtualization?: boolean;
  /** Row count threshold above which virtualization activates. */
  virtualizeThreshold?: number;
  /** Overscan value passed to the row virtualizer. */
  overscan?: number;
  /** Pagination mode for the body and footer logic. */
  dataMode?: DynamicTableDataMode;
  /** Enables pagination footer controls. */
  enablePagination?: boolean;
  /** Infinite-scroll threshold from bottom in px. */
  infiniteScrollThresholdPx?: number;
  /** Column ids that cannot be reordered by drag-and-drop. */
  lockedColumnIds?: string[];
}

/**
 * Complete serializable table state snapshot.
 */
export interface DynamicTableStateSnapshot {
  /** External sorting contract (`orderBy`) state. */
  orderBy: DynamicTableOrderByEntry[];
  /** Current ordered list of column ids. */
  columnOrder: string[];
  /** Current column visibility map. */
  columnVisibility: VisibilityState;
  /** Current column size map. */
  columnSizing: ColumnSizingState;
  /** Current row selection map keyed by row id. */
  rowSelection: RowSelectionState;
  /** Current grouping column ids. */
  grouping: string[];
  /** Current grouped row expansion state. */
  expanded: ExpandedState;
  /** Current page index and page size state. */
  pagination: PaginationState;
  /** UI toggle to enable drag/resize affordances in header. */
  dragModeEnabled: boolean;
  /** Current text density mode. */
  density: DynamicTableDensity;
  /** Current text wrapping mode. */
  wrapCells: boolean;
}

/**
 * Callback fired when infinite-scroll reaches the configured threshold.
 */
export interface DynamicTableLoadMoreContext {
  /** Number of currently rendered rows. */
  rowsCount: number;
}

/**
 * Main DynamicTable component props.
 */
export interface DynamicTableProps<TRow extends Record<string, unknown>> {
  /** Data rows rendered by the table. */
  rows: TRow[];
  /** Spec-driven column and layout schema. */
  columns: DynamicTableColumnInput<TRow>[];
  /** Optional custom row id resolver for stable selection/state. */
  getRowId?: (row: TRow, index: number) => string;
  /** Optional function returning nested children for grouped rows. */
  getSubRows?: (row: TRow) => TRow[] | undefined;
  /** Optional loading state flag for body rendering and footer behavior. */
  loading?: boolean;
  /** Optional loading message when table has no rows yet. */
  loadingText?: string;
  /** Optional empty-state content when no rows are available. */
  emptyState?: React.ReactNode;
  /** Optional className for root wrapper. */
  className?: string;
  /** Optional full state override for controlled mode. */
  state?: Partial<DynamicTableStateSnapshot>;
  /** Optional default state seed for uncontrolled mode. */
  defaultState?: Partial<DynamicTableStateSnapshot>;
  /** Emits full merged state after any internal transition. */
  onStateChange?: (nextState: DynamicTableStateSnapshot) => void;
  /** Emits external sorting state after sort transitions. */
  onOrderByChange?: (orderBy: DynamicTableOrderByEntry[]) => void;
  /** Emits row selection state after selection transitions. */
  onRowSelectionChange?: (selection: RowSelectionState) => void;
  /** Emits pagination state after page/page-size transitions. */
  onPaginationChange?: (pagination: PaginationState) => void;
  /** Row-detail expansion behavior and rendering. */
  expand?: DynamicTableExpandConfig<TRow>;
  /** Sort execution ownership mode. */
  sortMode?: DynamicTableSortMode;
  /** Pagination execution ownership mode. */
  paginationMode?: DynamicTablePaginationMode;
  /** Feature flag configuration. */
  features?: DynamicTableFeatureFlags;
  /** Layout and styling configuration. */
  layout?: DynamicTableLayoutSpec<TRow>;
  /** Known total rows across all pages (server pagination). */
  totalRows?: number;
  /** Known server page count, when available. */
  pageCount?: number;
  /** Indicates if the remote source has a next page. */
  hasNextPage?: boolean;
  /** Indicates if the remote source has a previous page. */
  hasPreviousPage?: boolean;
  /** Infinite-scroll callback for threshold-based loading. */
  onLoadMore?: (context: DynamicTableLoadMoreContext) => void;
}

/**
 * Resolved feature flags with defaults applied.
 */
export type DynamicTableResolvedFeatures =
  Required<DynamicTableFeatureFlags>;

/**
 * Resolved layout options with defaults applied.
 */
export interface DynamicTableResolvedLayout<
  TRow extends Record<string, unknown>,
> extends DynamicTableLayoutSpec<TRow> {
  /** Actions layout is optional in resolved layout as well. */
  actions?: DynamicTableActionsLayout<TRow>;
}
