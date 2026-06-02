/**
 * @file DynamicTableRows.tsx
 * @description Renders the dynamic rows for TanStack table, with optional virtualization.
 * Modernized with high-density readable text, translation and selected highlights (left accent border),
 * fluid collapsible groupings, nested detail panels, and premium loading/empty states.
 * Highly reactive visual enhancements for the Patrimoin workspace.
 * Modifié pour supprimer les animations et les ombres afin d'améliorer les performances de l'interface utilisateur.
 */
import { useMemo } from "react";
import type { CSSProperties, RefObject } from "react";
import type { Row, Table } from "@tanstack/react-table";
import { flexRender } from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import { ChevronRight, Inbox, Loader2 } from "lucide-react";
import { cn } from "@/shared/utils";
import { TableBody, TableCell, TableRow } from "@/shared/ui/kit/table";
import type {
  DynamicTableDensity,
  DynamicTableExpandedRowRenderContext,
  DynamicTableResolvedFeatures,
  DynamicTableResolvedLayout,
} from "../types";

/**
 * Props for`DynamicTableRows`.
 */
export interface DynamicTableRowsProps<TRow extends Record<string, unknown>> {
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
  /** Disables virtualization for content with variable row heights. */
  disableVirtualization?: boolean;
  /** Enables rendering row-detail panels below expanded rows. */
  expansionEnabled?: boolean;
  /** Optional row-detail panel renderer. */
  renderExpandedRow?: (
    context: DynamicTableExpandedRowRenderContext<TRow>,
  ) => React.ReactNode;
  /** Expand utility column id. */
  expandColumnId: string;
  /** Selection utility column id. */
  selectionColumnId: string;
  /** Actions utility column id. */
  actionsColumnId: string;
  /** Whether the expand utility column is sticky. */
  expandColumnSticky?: boolean;
  /** Left sticky offset in px applied to the selection utility column. */
  selectionColumnLeftOffsetPx?: number;
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
function formatFallbackValue(value: unknown): React.ReactNode {
  if (value === null || value === undefined) {
    return <span className="text-muted-foreground/30 font-light select-none">-</span>;
  }
  if (typeof value === "object") {
    return <span className="font-mono text-[10px] bg-muted px-1.5 py-0.5 rounded-sm">{JSON.stringify(value)}</span>;
  }
  return String(value);
}

/**
 * Computes text and spacing classes derived from density and wrapping modes.
 * Premium density treatment with refined typography and spacing.
 */
function resolveCellTextClasses(
  density: DynamicTableDensity,
  wrapCells: boolean,
): string {
  const densityClass =
    density === "compact"
      ? "text-[11px] leading-tight px-3 py-1.5 tabular-nums"
      : density === "spacious"
        ? "text-sm leading-relaxed px-5 py-3.5"
        : "text-xs leading-normal px-4 py-2.5 tabular-nums";
  const wrappingClass = wrapCells
    ? "whitespace-normal break-words"
    : "truncate";
  return `${densityClass} ${wrappingClass}`;
}

/**
 * Returns true when the built-in actions column should size to content.
 */
function shouldAutoSizeActionsColumn<TRow extends Record<string, unknown>>(
  layout: DynamicTableResolvedLayout<TRow>,
  columnId: string,
  actionsColumnId: string,
): boolean {
  return (
    columnId === actionsColumnId && typeof layout.actions?.size !== "number"
  );
}

/**
 * Renders grouped-row value cell using TanStack grouping metadata.
 * Premium styled group header with chevron and count badge.
 */
function renderGroupedCell<TRow extends Record<string, unknown>>(
  row: Row<TRow>,
  value: React.ReactNode,
): React.ReactNode {
  const isExpanded = row.getIsExpanded();
  return (
    <button
      type="button"
      className="inline-flex items-center gap-2.5 text-left font-semibold text-foreground hover:text-primary group"
      onClick={row.getToggleExpandedHandler()}
    >
      <div className="flex size-5 items-center justify-center rounded bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground">
        <ChevronRight className={cn("size-3.5", isExpanded && "rotate-90")} />
      </div>
      <span className="font-bold tracking-tight text-xs md:text-sm">{value}</span>
      <span className="inline-flex items-center justify-center rounded-full bg-primary/5 border border-primary/10 px-2 py-0.5 text-[10px] font-bold tabular-nums text-primary">
        {row.subRows.length}
      </span>
    </button>
  );
}

/**
 * Renders all table body rows with optional virtualization.
 * Premium row styling with refined hover states, selection highlights,
 * and polished loading/empty placeholder states.
 */
export function DynamicTableRows<TRow extends Record<string, unknown>>({
  table,
  loading,
  loadingText,
  emptyState,
  features,
  layout,
  scrollContainerRef,
  disableVirtualization,
  expansionEnabled,
  renderExpandedRow,
  expandColumnId,
  selectionColumnId,
  actionsColumnId,
  expandColumnSticky,
  selectionColumnLeftOffsetPx,
}: DynamicTableRowsProps<TRow>) {
  const rows = table.getRowModel().rows;
  const visibleColumnCount = table.getVisibleLeafColumns().length;
  const cellTextClasses = useMemo(
    () => resolveCellTextClasses(layout.density, layout.wrapCells),
    [layout.density, layout.wrapCells],
  );

  const shouldVirtualize =
    features.enableVirtualization &&
    !disableVirtualization &&
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
  const resolveStickyCellStyle = (
    columnId: string,
  ): { className?: string; style?: CSSProperties } => {
    if (columnId === expandColumnId && expandColumnSticky) {
      return {
        className: "sticky z-20 table-first-column table-sticky-cell",
        style: { left: 0 },
      };
    }
    if (
      columnId === selectionColumnId &&
      layout.stickySelectionColumn !== false
    ) {
      const leftOffset = selectionColumnLeftOffsetPx ?? 0;
      return {
        className:
          leftOffset > 0
            ? "sticky z-20 table-sticky-cell"
            : "sticky left-0 z-20 table-first-column table-sticky-cell",
        style: leftOffset > 0 ? { left: leftOffset } : undefined,
      };
    }
    if (columnId === actionsColumnId && layout.actions?.sticky !== false) {
      return {
        className: "sticky right-0 z-20 table-last-column table-sticky-cell",
      };
    }
    return {};
  };

  /**
   * Renders the optional expanded detail row below a base row.
   */
  const renderExpandedPanelRow = (
    row: Row<TRow>,
    rowIndex: number,
  ): React.ReactNode => {
    if (!expansionEnabled || !renderExpandedRow || !row.getIsExpanded()) {
      return null;
    }

    const content = renderExpandedRow({
      row: row.original,
      rowIndex,
      table,
    });

    if (content === null || content === undefined) {
      return null;
    }

    return (
      <TableRow key={`${row.id}::expanded`} className="hover:bg-transparent">
        <TableCell
          colSpan={visibleColumnCount}
          className="border-b border-border bg-muted/15 p-0"
        >
          <div className="border-l-4 border-l-primary bg-card/60 dark:bg-card/30 mx-4 my-3 p-5 rounded-lg border border-border/80">
            {content}
          </div>
        </TableCell>
      </TableRow>
    );
  };

  /**
   * Renders one base row and its optional detail row.
   * Includes subtle even/odd banding and smooth hover transitions.
   */
  const renderRow = (row: Row<TRow>, rowIndex: number) => {
    const rowClassName = layout.rowClassName?.({
      row: row.original,
      rowIndex,
    });

    const baseRow = (
      <TableRow
        key={row.id}
        data-row-stripe={rowIndex % 2 === 0 ? "even" : "odd"}
        data-state={row.getIsSelected() ? "selected" : undefined}
        className={cn(
          "hover:bg-primary/5",
          row.getIsSelected() && "bg-primary/6 hover:bg-primary/8 dark:bg-primary/15 dark:hover:bg-primary/20",
          rowIndex % 2 === 1 && !row.getIsSelected() && "bg-muted/10",
          rowClassName,
        )}
      >
        {row.getVisibleCells().map((cell, cellIndex) => {
          const rendered = flexRender(
            cell.column.columnDef.cell,
            cell.getContext(),
          );
          const fallbackRendered =
            rendered ?? formatFallbackValue(cell.getValue());
          const sticky = resolveStickyCellStyle(cell.column.id);
          const metaClass = (
            cell.column.columnDef.meta as { className?: string } | undefined
          )?.className;
          const userCellClass = layout.cellClassName?.({
            row: row.original,
            rowIndex,
            columnId: cell.column.id,
            value: cell.getValue(),
          });
          const autoSizeActionsCell = shouldAutoSizeActionsColumn(
            layout,
            cell.column.id,
            actionsColumnId,
          );

          let content = fallbackRendered;
          if (cell.getIsGrouped()) {
            content = renderGroupedCell(row, fallbackRendered);
          } else if (cell.getIsAggregated()) {
            content = fallbackRendered;
          } else if (cell.getIsPlaceholder()) {
            content = null;
          }

          const isFirstCell = cellIndex === 0;

          return (
            <TableCell
              key={cell.id}
              style={
                autoSizeActionsCell
                  ? { ...(sticky.style ?? {}) }
                  : {
                      width: cell.column.getSize(),
                      minWidth: cell.column.getSize(),
                      maxWidth: cell.column.getSize(),
                      ...(sticky.style ?? {}),
                    }
              }
              className={cn(
                "border-b border-border align-middle text-foreground",
                cellTextClasses,
                autoSizeActionsCell && "w-[1%] whitespace-nowrap",
                sticky.className,
                isFirstCell && row.getIsSelected() && "border-l-[3px] border-l-primary",
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

    const expandedRow = renderExpandedPanelRow(row, rowIndex);
    if (!expandedRow) {
      return baseRow;
    }
    return [baseRow, expandedRow];
  };

  /* Loading state — premium spinner with shimmer skeleton rows */
  if (loading && rows.length === 0) {
    return (
      <TableBody>
        <TableRow className="hover:bg-transparent">
          <TableCell colSpan={visibleColumnCount} className="h-64 border-0">
            <div className="flex flex-col items-center justify-center gap-4 py-12">
              <div className="relative flex size-12 items-center justify-center rounded-full bg-primary/10">
                <Loader2 className="size-6 text-primary animate-spin" />
              </div>
              <div className="text-center">
                <span className="text-xs font-semibold text-primary uppercase tracking-wider block">
                  {loadingText ?? "Chargement des données"}
                </span>
                <span className="text-[10px] text-muted-foreground mt-1 block">
                  Veuillez patienter pendant la récupération...
                </span>
              </div>
            </div>
          </TableCell>
        </TableRow>
      </TableBody>
    );
  }

  /* Empty state — premium illustrated placeholder */
  if (!loading && rows.length === 0) {
    return (
      <TableBody>
        <TableRow className="hover:bg-transparent">
          <TableCell colSpan={visibleColumnCount} className="h-64 border-0">
            <div className="flex flex-col items-center justify-center gap-4 py-12">
              <div className="flex size-14 items-center justify-center rounded-full bg-primary/5 text-primary/60 border border-primary/10">
                <Inbox className="size-6" />
              </div>
              <div className="text-center max-w-sm px-4">
                <h4 className="text-sm font-bold text-foreground">
                  {emptyState ?? "Aucune donnée disponible"}
                </h4>
                <p className="mt-1.5 text-xs text-muted-foreground/80 leading-relaxed">
                  Aucun enregistrement ne correspond aux critères actuels. Essayez d'ajuster vos filtres ou d'ajouter de nouvelles entrées dans le système.
                </p>
              </div>
            </div>
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
