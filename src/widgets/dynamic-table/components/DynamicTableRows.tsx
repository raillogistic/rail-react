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
 * Premium density treatment with refined typography and spacing.
 */
function resolveCellTextClasses(
 density: DynamicTableDensity,
 wrapCells: boolean,
): string {
 const densityClass =
 density === "compact"
 ? "text-[11px] px-2.5 py-1.5"
 : density === "spacious"
 ? "text-sm px-4 py-3.5"
 : "text-[13px] px-3 py-2.5";
 const wrappingClass = wrapCells
 ? "whitespace-normal break-words"
 : "truncate";
 return`${densityClass} ${wrappingClass}`;
}

/**
 * Renders grouped-row value cell using TanStack grouping metadata.
 * Premium styled group header with chevron animation and count badge.
 */
function renderGroupedCell<TRow extends Record<string, unknown>>(
 row: Row<TRow>,
 value: React.ReactNode,
): React.ReactNode {
 return (
 <button
 type="button"
 className="inline-flex items-center gap-2.5 text-left font-semibold text-foreground transition-colors hover:text-primary"
 onClick={row.getToggleExpandedHandler()}
 >
 <div className="flex size-5 items-center justify-center bg-primary/10 text-primary transition-colors">
 <ChevronRight
 className={cn(
 "size-3.5 transition-transform duration-200",
 row.getIsExpanded() && "rotate-90",
 )}
 />
 </div>
 <span className="font-semibold">{value}</span>
 <span className="inline-flex items-center justify-center bg-muted/60 px-2 py-0.5 text-[10px] font-bold tabular-nums text-muted-foreground">
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
 className: "sticky z-20 bg-inherit",
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
 ? "sticky z-20 bg-inherit"
 : "sticky left-0 z-20 bg-inherit",
 style: leftOffset > 0 ? { left: leftOffset } : undefined,
 };
 }
 if (columnId === actionsColumnId && layout.actions?.sticky !== false) {
 return {
 className: "sticky right-0 z-20 bg-inherit",
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
 className="border-b border-border/30 bg-muted/15 px-5 py-4"
 >
 {content}
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
 data-state={row.getIsSelected() ? "selected" : undefined}
 className={cn(
 "transition-colors duration-150",
 "hover:bg-muted/30",
 row.getIsSelected() && "bg-primary/5 hover:bg-primary/8",
 rowIndex % 2 === 1 && !row.getIsSelected() && "bg-muted/8",
 rowClassName,
 )}
 >
 {row.getVisibleCells().map((cell) => {
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
 ...(sticky.style ?? {}),
 }}
 className={cn(
 "border-b border-border/20 align-middle text-foreground/80",
 cellTextClasses,
 sticky.className,
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
 <TableRow>
 <TableCell colSpan={visibleColumnCount} className="h-52 border-0">
 <div className="flex flex-col items-center justify-center gap-3 py-8">
 <div className="relative flex size-10 items-center justify-center">
 <div className="absolute inset-0 animate-ping bg-primary/10" />
 <Loader2 className="size-5 animate-spin text-primary" />
 </div>
 <span className="text-xs font-medium text-muted-foreground">
 {loadingText ?? "Chargement des données…"}
 </span>
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
 <TableRow>
 <TableCell colSpan={visibleColumnCount} className="h-52 border-0">
 <div className="flex flex-col items-center justify-center gap-3 py-8">
 <div className="flex size-12 items-center justify-center bg-muted/40 text-muted-foreground/40">
 <Inbox className="size-6" />
 </div>
 <div className="text-center">
 <p className="text-sm font-semibold text-muted-foreground/70">
 {emptyState ?? "Aucune donnée disponible"}
 </p>
 <p className="mt-0.5 text-[11px] text-muted-foreground/40">
 Essayez d'ajuster vos filtres ou d'ajouter de nouvelles
 entrées.
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
 <TableRow style={{ height:`${paddingTop}px` }}>
 <TableCell colSpan={visibleColumnCount} className="border-0 p-0" />
 </TableRow>
 ) : null}

 {virtualRows.map((virtualRow) => {
 const row = rows[virtualRow.index];
 return renderRow(row, virtualRow.index);
 })}

 {paddingBottom > 0 ? (
 <TableRow style={{ height:`${paddingBottom}px` }}>
 <TableCell colSpan={visibleColumnCount} className="border-0 p-0" />
 </TableRow>
 ) : null}
 </TableBody>
 );
}
