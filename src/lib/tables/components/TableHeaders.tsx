import React from "react";
import {
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable";
import { restrictToHorizontalAxis } from "@dnd-kit/modifiers";
import { CSS } from "@dnd-kit/utilities";
import type { ColumnDef, Header } from "@tanstack/react-table";
import { flexRender, type Table as RTTable } from "@tanstack/react-table";
import {
  ArrowUpDown,
  ChevronDown,
  ChevronUp,
  GripVertical,
} from "lucide-react";
import { Checkbox } from "@/lib/components/ui/checkbox";
import {
  TableHead,
  TableHeader,
  TableRow,
} from "@/lib/components/ui/table";
import { cn } from "@/lib/utils";
import type { RowActionsConfig, SelectionConfig } from "./baseTableTypes";

type SortableHeadProps = {
  id: string;
  disabled?: boolean;
  children: React.ReactNode;
};

/**
 * Sortable wrapper used to display a drag handle and animate column movement.
 */
function SortableHead({ id, disabled, children }: SortableHeadProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled });
  const style: React.CSSProperties = {
    transform: transform ? CSS.Transform.toString(transform) : undefined,
    transition,
    opacity: isDragging ? 0.8 : 1,
  };
  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-1">
      {!disabled && (
        <button
          type="button"
          className="p-0.5 mr-1 rounded hover:bg-muted"
          aria-label="Reorder column"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      )}
      {children}
    </div>
  );
}

/**
 * Props for {@link TableHeaders}.
 * @template TData Table row data type.
 * @property table - TanStack table instance.
 * @property column_overrides - Optional per-column overrides.
 * @property selection - Selection configuration.
 * @property row_actions - Row action configuration.
 * @property expandableEnabled - Whether expandable rows are active.
 * @property expandablePosition - Expander column placement.
 * @property multiSortEnabled - Enable multi-column sort with modifiers.
 * @property multiSortOnPlainClick - Enable multi-sort without modifiers.
 * @property showSortIndex - Display sort order badges.
 * @property sortHint - Tooltip hint for sortable headers.
 * @property columnFiltersEnabled - Whether column filters are enabled.
 * @property columnFiltersMode - Column filter UI mode.
 * @property renderHeaderFilterTrigger - Renderer for filter trigger in headers.
 * @property renderColumnFilterCell - Renderer for column filter row cells.
 * @property onHeaderSorted - Callback fired after a header triggers sorting.
 * @property columnDragEnabled - Enable column drag-and-drop.
 * @property onColumnDragEnd - Handler invoked after drag ends.
 */
export type TableHeadersProps<TData> = {
  table: RTTable<TData>;
  column_overrides?: Record<string, Partial<ColumnDef<TData>>>;
  selection?: SelectionConfig<TData>;
  row_actions?: RowActionsConfig<TData>;
  expandableEnabled: boolean;
  expandablePosition: "start" | "end";
  multiSortEnabled: boolean;
  multiSortOnPlainClick: boolean;
  showSortIndex: boolean;
  sortHint: string;
  columnFiltersEnabled: boolean;
  columnFiltersMode: "devextreme" | "ag-grid";
  renderHeaderFilterTrigger: (
    header: Header<TData, unknown>
  ) => React.ReactNode;
  renderColumnFilterCell: (
    header: Header<TData, unknown>
  ) => React.ReactNode;
  onHeaderSorted?: () => void;
  columnDragEnabled: boolean;
  onColumnDragEnd?: (event: DragEndEvent) => void;
};

/**
 * Renders table headers, including optional selection/expander columns, sortable headers,
 * column filters, and drag-and-drop ordering when enabled.
 */
export function TableHeaders<TData>({
  table,
  column_overrides,
  selection,
  row_actions,
  expandableEnabled,
  expandablePosition,
  multiSortEnabled,
  multiSortOnPlainClick,
  showSortIndex,
  sortHint,
  columnFiltersEnabled,
  columnFiltersMode,
  renderHeaderFilterTrigger,
  renderColumnFilterCell,
  onHeaderSorted,
  columnDragEnabled,
  onColumnDragEnd,
}: TableHeadersProps<TData>) {
  const selection_enabled = selection?.enabled ?? false;
  const selection_position = selection?.position ?? "start";
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 150, tolerance: 5 },
    }),
    useSensor(KeyboardSensor)
  );

  const renderSortableHeaderCell = React.useCallback(
    (header: Header<TData, unknown>, sortable: boolean, sorted: boolean) => {
      const sortState = header.column.getIsSorted() as false | "asc" | "desc";
      const ariaSort =
        sortState === "asc"
          ? "ascending"
          : sortState === "desc"
          ? "descending"
          : "none";
      const override = column_overrides?.[header.id];
      const columnDef = override
        ? { ...header.column.columnDef, ...override }
        : header.column.columnDef;
      const onClick = sortable
        ? (e: React.MouseEvent) => {
            const isMulti =
              multiSortEnabled &&
              (multiSortOnPlainClick || e.shiftKey || e.ctrlKey || e.metaKey);
            header.column.toggleSorting(undefined, isMulti);
            onHeaderSorted?.();
          }
        : undefined;

      const baseLabel = (
        <div
          className={cn("flex items-center gap-1 select-none", sortable && "cursor-pointer")}
          onClick={onClick}
          title={sortable ? sortHint : undefined}
          role={sortable ? "button" : undefined}
        >
          <span className="leading-none">
            {flexRender(columnDef.header, header.getContext())}
          </span>
          {sortable ? (
            <span className="inline-flex items-center gap-1">
              {sortState === "asc" ? (
                <ChevronUp className="h-3.5 w-3.5 text-primary" />
              ) : sortState === "desc" ? (
                <ChevronDown className="h-3.5 w-3.5 text-primary" />
              ) : (
                <ArrowUpDown className="h-3.5 w-3.5 opacity-40" />
              )}
              {showSortIndex && sorted ? (
                <span className="text-[10px] text-muted-foreground">
                  {header.column.getSortIndex() + 1}
                </span>
              ) : null}
            </span>
          ) : null}
        </div>
      );

      return (
        <TableHead
          key={header.id}
          className="whitespace-nowrap text-left text-[12px] font-semibold tracking-wide text-muted-foreground"
          aria-sort={ariaSort as React.AriaAttributes["aria-sort"]}
        >
          <div className="flex items-center justify-between gap-1">
            {columnDragEnabled ? (
              <SortableHead id={header.id} disabled={!header.column.getIsVisible()}>
                {baseLabel}
              </SortableHead>
            ) : (
              baseLabel
            )}
            {renderHeaderFilterTrigger(header)}
          </div>
        </TableHead>
      );
    },
    [
      columnDragEnabled,
      column_overrides,
      multiSortEnabled,
      multiSortOnPlainClick,
      onHeaderSorted,
      renderHeaderFilterTrigger,
      showSortIndex,
      sortHint,
      table.options,
    ]
  );

  const renderHeaderGroups = (withDrag: boolean) =>
    table.getHeaderGroups().map((headerGroup) => (
      <React.Fragment key={headerGroup.id}>
        <TableRow key={`${headerGroup.id}-main`}>
          {selection_enabled && selection_position === "start" && (
            <TableHead className="whitespace-nowrap text-left text-[11px] uppercase tracking-wide text-muted-foreground">
              <div className="flex items-center">
                <Checkbox
                  checked={
                    table.getIsAllRowsSelected() ||
                    (table.getIsSomeRowsSelected()
                      ? ("indeterminate" as unknown as boolean)
                      : false)
                  }
                  onCheckedChange={(checked) => {
                    table.toggleAllRowsSelected(!!checked);
                  }}
                  aria-label="Select all rows"
                />
              </div>
            </TableHead>
          )}
          {expandableEnabled && expandablePosition === "start" && (
            <TableHead className="w-px" />
          )}
          {row_actions && (row_actions.position ?? "end") === "start" && (
            <TableHead className="whitespace-nowrap text-right text-[11px] uppercase tracking-wide text-muted-foreground px-2 w-px shrink-0">
              {/* actions column */}
            </TableHead>
          )}

          {withDrag ? (
            <SortableContext
              items={headerGroup.headers
                .filter((h) => h.column.getIsVisible())
                .map((h) => h.id)}
              strategy={horizontalListSortingStrategy}
            >
              {headerGroup.headers
                .filter((header) => header.column.getIsVisible())
                .map((header) =>
                  renderSortableHeaderCell(
                    header,
                    header.column.getCanSort(),
                    Boolean(header.column.getIsSorted())
                  )
                )}
            </SortableContext>
          ) : (
            headerGroup.headers
              .filter((header) => header.column.getIsVisible())
              .map((header) =>
                renderSortableHeaderCell(
                  header,
                  header.column.getCanSort(),
                  Boolean(header.column.getIsSorted())
                )
              )
          )}

          {row_actions && (row_actions.position ?? "end") === "end" && (
            <TableHead className="px-2 w-px shrink-0 sticky right-0 z-10 table-last-column table-sticky-cell" />
          )}

          {expandableEnabled && expandablePosition === "end" && (
            <TableHead className="w-px" />
          )}

          {selection_enabled && selection_position === "end" && (
            <TableHead className="whitespace-nowrap text-left text-[11px] uppercase tracking-wide text-muted-foreground px-2 table-last-column">
              <div className="flex items-center">
                <Checkbox
                  checked={
                    table.getIsAllRowsSelected() ||
                    (table.getIsSomeRowsSelected()
                      ? ("indeterminate" as unknown as boolean)
                      : false)
                  }
                  onCheckedChange={(checked) => {
                    table.toggleAllRowsSelected(!!checked);
                  }}
                  aria-label="Select all rows"
                />
              </div>
            </TableHead>
          )}
        </TableRow>
        {columnFiltersEnabled &&
          columnFiltersMode === "devextreme" &&
          headerGroup.headers.some(
            (header) =>
              !header.isPlaceholder && renderColumnFilterCell(header) !== null
          ) && (
            <TableRow
              key={`${headerGroup.id}-filters`}
              className="bg-muted/20"
            >
              {selection_enabled && selection_position === "start" && (
                <TableHead />
              )}
              {expandableEnabled && expandablePosition === "start" && (
                <TableHead />
              )}
              {row_actions && (row_actions.position ?? "end") === "start" && (
                <TableHead />
              )}
              {headerGroup.headers.map((header) => {
                const cell = renderColumnFilterCell(header);
                if (cell) return cell;
                return <TableHead key={`${header.id}-filter`} />;
              })}
              {row_actions && (row_actions.position ?? "end") === "end" && (
                <TableHead />
              )}
              {expandableEnabled && expandablePosition === "end" && (
                <TableHead />
              )}
              {selection_enabled && selection_position === "end" && <TableHead />}
            </TableRow>
          )}
      </React.Fragment>
    ));

  const headerMarkup = (
    <TableHeader className="bg-muted/50 ">{renderHeaderGroups(columnDragEnabled)}</TableHeader>
  );

  if (!columnDragEnabled) {
    return headerMarkup;
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      modifiers={[restrictToHorizontalAxis]}
      onDragEnd={onColumnDragEnd}
    >
      {headerMarkup}
    </DndContext>
  );
}
