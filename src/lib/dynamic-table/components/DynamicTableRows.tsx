import { useMemo } from "react";
import type { RefObject } from "react";
import type { Row, Table } from "@tanstack/react-table";
import { flexRender } from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import { ChevronRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { TableBody, TableCell, TableRow } from "@/lib/components/ui/table";
import type {
  DynamicTableDensity,
  DynamicTableResolvedFeatures,
  DynamicTableResolvedLayout,
} from "../types";

/**
 * Props for `DynamicTableRows`.
 */
export interface DynamicTableRowsProps<
  TRow extends Record<string, unknown>,
> {
  /** TanStack table instance. */
  table: Table<TRow>;
  /** Loading flag for body rendering. */
  loading: boolean;
  /** Optional loading text shown when table has no rows yet. */
  loadingText?: string;
  /** Optional empty-state content shown when table has no rows. */
  emptyState?: React.ReactNode;
  /** Resolved feature flags. */
  features: DynamicTableResolvedFeatures;
  /** Resolved layout options. */
  layout: DynamicTableResolvedLayout<TRow>;
  /** Scroll container reference used by virtualization. */
  scrollContainerRef: RefObject<HTMLDivElement | null>;
  /** Selection utility column id. */
  selectionColumnId: string;
  /** Actions utility column id. */
  actionsColumnId: string;
}

/**
 * Returns row-height estimate based on configured density mode.
 */
function estimateRowHeight(density: DynamicTableDensity): number {
  if (density === "compact") {
    return 34;
  }
  if (density === "spacious") {
    return 50;
  }
  return 42;
}

/**
 * Formats unknown values for default cell rendering.
 */
function formatFallbackValue(value: unknown): string {
  if (value === null || value === undefined) {
    return "-";
  }
  if (typeof value === "object") {
    return JSON.stringify(value);
  }
  return String(value);
}

/**
 * Computes text and spacing classes derived from density and wrapping modes.
 */
function resolveCellTextClasses(
  density: DynamicTableDensity,
  wrapCells: boolean,
): string {
  const densityClass = density === "compact"
    ? "text-[11px] px-2 py-1.5"
    : density === "spacious"
      ? "text-sm px-4 py-3"
      : "text-[13px] px-3 py-2";
  const wrappingClass = wrapCells ? "whitespace-normal break-words" : "truncate";
  return `${densityClass} ${wrappingClass}`;
}

/**
 * Renders grouped-row value cell using TanStack grouping metadata.
 */
function renderGroupedCell<TRow extends Record<string, unknown>>(
  row: Row<TRow>,
  value: React.ReactNode,
): React.ReactNode {
  return (
    <button
      type="button"
      className="inline-flex items-center gap-2 text-left font-semibold text-foreground"
      onClick={row.getToggleExpandedHandler()}
    >
      <ChevronRight
        className={cn(
          "h-4 w-4 transition-transform",
          row.getIsExpanded() && "rotate-90",
        )}
      />
      <span>{value}</span>
      <span className="text-xs text-muted-foreground">
        ({row.subRows.length})
      </span>
    </button>
  );
}

/**
 * Renders all table body rows with optional virtualization.
 */
export function DynamicTableRows<TRow extends Record<string, unknown>>({
  table,
  loading,
  loadingText,
  emptyState,
  features,
  layout,
  scrollContainerRef,
  selectionColumnId,
  actionsColumnId,
}: DynamicTableRowsProps<TRow>) {
  const rows = table.getRowModel().rows;
  const visibleColumnCount = table.getVisibleLeafColumns().length;
  const cellTextClasses = useMemo(
    () => resolveCellTextClasses(layout.density, layout.wrapCells),
    [layout.density, layout.wrapCells],
  );

  const shouldVirtualize =
    features.enableVirtualization &&
    !layout.wrapCells &&
    rows.length >= features.virtualizeThreshold;

  const rowVirtualizer = useVirtualizer({
    count: shouldVirtualize ? rows.length : 0,
    getScrollElement: () => scrollContainerRef.current,
    estimateSize: () => estimateRowHeight(layout.density),
    overscan: features.overscan,
  });

  /**
   * Resolves sticky positioning class for utility columns.
   */
  const resolveStickyCellClass = (columnId: string): string | undefined => {
    if (columnId === selectionColumnId && layout.stickySelectionColumn !== false) {
      return "sticky left-0 z-20 bg-background";
    }
    if (columnId === actionsColumnId && layout.actions?.sticky !== false) {
      return "sticky right-0 z-20 bg-background";
    }
    return undefined;
  };

  /**
   * Renders a single body row.
   */
  const renderRow = (row: Row<TRow>, rowIndex: number) => {
    const rowClassName = layout.rowClassName?.({
      row: row.original,
      rowIndex,
    });

    return (
      <TableRow
        key={row.id}
        data-state={row.getIsSelected() ? "selected" : undefined}
        className={cn(rowClassName)}
      >
        {row.getVisibleCells().map((cell) => {
          const rendered = flexRender(cell.column.columnDef.cell, cell.getContext());
          const fallbackRendered = rendered ?? formatFallbackValue(cell.getValue());
          const stickyClass = resolveStickyCellClass(cell.column.id);
          const metaClass = (cell.column.columnDef.meta as { className?: string } | undefined)?.className;
          const userCellClass = layout.cellClassName?.({
            row: row.original,
            rowIndex,
            columnId: cell.column.id,
            value: cell.getValue(),
          });

          let content = fallbackRendered;
          if (cell.getIsGrouped()) {
            content = renderGroupedCell(row, fallbackRendered);
          } else if (cell.getIsAggregated()) {
            content = fallbackRendered;
          } else if (cell.getIsPlaceholder()) {
            content = null;
          }

          return (
            <TableCell
              key={cell.id}
              style={{
                width: cell.column.getSize(),
                minWidth: cell.column.getSize(),
                maxWidth: cell.column.getSize(),
              }}
              className={cn(
                "border-b border-border/40 align-middle",
                cellTextClasses,
                stickyClass,
                metaClass,
                userCellClass,
              )}
            >
              {content}
            </TableCell>
          );
        })}
      </TableRow>
    );
  };

  if (loading && rows.length === 0) {
    return (
      <TableBody>
        <TableRow>
          <TableCell colSpan={visibleColumnCount} className="h-40">
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>{loadingText ?? "Loading..."}</span>
            </div>
          </TableCell>
        </TableRow>
      </TableBody>
    );
  }

  if (!loading && rows.length === 0) {
    return (
      <TableBody>
        <TableRow>
          <TableCell colSpan={visibleColumnCount} className="h-40 text-center text-sm text-muted-foreground">
            {emptyState ?? "No data available."}
          </TableCell>
        </TableRow>
      </TableBody>
    );
  }

  if (!shouldVirtualize) {
    return (
      <TableBody>
        {rows.map((row, rowIndex) => renderRow(row, rowIndex))}
      </TableBody>
    );
  }

  const virtualRows = rowVirtualizer.getVirtualItems();
  const totalSize = rowVirtualizer.getTotalSize();
  const paddingTop = virtualRows.length > 0 ? virtualRows[0].start : 0;
  const paddingBottom =
    virtualRows.length > 0
      ? totalSize - virtualRows[virtualRows.length - 1].end
      : 0;

  return (
    <TableBody>
      {paddingTop > 0 ? (
        <TableRow style={{ height: `${paddingTop}px` }}>
          <TableCell colSpan={visibleColumnCount} className="border-0 p-0" />
        </TableRow>
      ) : null}

      {virtualRows.map((virtualRow) => {
        const row = rows[virtualRow.index];
        return renderRow(row, virtualRow.index);
      })}

      {paddingBottom > 0 ? (
        <TableRow style={{ height: `${paddingBottom}px` }}>
          <TableCell colSpan={visibleColumnCount} className="border-0 p-0" />
        </TableRow>
      ) : null}
    </TableBody>
  );
}

