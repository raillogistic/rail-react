import { useCallback } from "react";
import type { CSSProperties, ReactNode } from "react";
import type { Header, Table } from "@tanstack/react-table";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ArrowDownAZ,
  ArrowUpAZ,
  Check,
  GripVertical,
  MoreVertical,
  RotateCcw,
  Rows3,
  EyeOff,
  MoveHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/lib/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/lib/components/ui/dropdown-menu";
import { Button } from "@/lib/components/ui/button";
import { TableHead, TableRow, TableHeader as UITableHeader } from "@/lib/components/ui/table";
import { flexRender } from "@tanstack/react-table";
import type { DynamicTableResolvedFeatures, DynamicTableResolvedLayout } from "../types";
import type { UseDynamicTableStateResult } from "../state/useDynamicTableState";

/**
 * Props for `DynamicTableHeader`.
 */
export interface DynamicTableHeaderProps<
  TRow extends Record<string, unknown>,
> {
  /** TanStack table instance. */
  table: Table<TRow>;
  /** Resolved table state controls. */
  state: UseDynamicTableStateResult;
  /** Resolved feature flags. */
  features: DynamicTableResolvedFeatures;
  /** Resolved layout configuration. */
  layout: DynamicTableResolvedLayout<TRow>;
  /** Selection utility column id. */
  selectionColumnId: string;
  /** Actions utility column id. */
  actionsColumnId: string;
  /** Callback used by column menu reset action. */
  onResetLayout: () => void;
}

/**
 * Returns true if the header belongs to a leaf-level utility column.
 */
function isUtilityHeader<TRow extends Record<string, unknown>>(
  header: Header<TRow, unknown>,
  selectionColumnId: string,
  actionsColumnId: string,
): boolean {
  return (
    header.column.id === selectionColumnId || header.column.id === actionsColumnId
  );
}

/**
 * Resolves a column header label suitable for aria labels and menu titles.
 */
function resolveHeaderLabel<TRow extends Record<string, unknown>>(
  header: Header<TRow, unknown>,
): string {
  const headerValue = header.column.columnDef.header;
  if (typeof headerValue === "string") {
    return headerValue;
  }
  const titleCandidate = (header.column.columnDef.meta as { title?: string } | undefined)?.title;
  if (typeof titleCandidate === "string" && titleCandidate.length > 0) {
    return titleCandidate;
  }
  return header.column.id;
}

/**
 * Resolves header-cell style based on the current computed column width.
 */
function resolveHeaderStyle<TRow extends Record<string, unknown>>(
  header: Header<TRow, unknown>,
): CSSProperties {
  const width = header.getSize();
  return {
    width,
    minWidth: width,
    maxWidth: width,
  };
}

/**
 * Renders the contextual column menu for sorting/grouping/hiding/reset actions.
 */
function ColumnMenu<TRow extends Record<string, unknown>>({
  header,
  table,
  features,
  state,
  onResetLayout,
}: {
  /** Current TanStack header. */
  header: Header<TRow, unknown>;
  /** Current table instance. */
  table: Table<TRow>;
  /** Resolved feature flags. */
  features: DynamicTableResolvedFeatures;
  /** Shared table state controls. */
  state: UseDynamicTableStateResult;
  /** Callback used by reset action. */
  onResetLayout: () => void;
}) {
  const canSort = header.column.getCanSort();
  const canHide = features.enableColumnHiding && header.column.getCanHide();
  const canGroup = features.enableGrouping && header.column.getCanGroup();
  const sortedState = header.column.getIsSorted();
  const title = resolveHeaderLabel(header);

  /**
   * Removes the current sort entry for the active column.
   */
  const clearSort = () => {
    table.setSorting((previousSorting) =>
      previousSorting.filter((entry) => entry.id !== header.column.id),
    );
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={cn(
            "h-full w-full justify-between rounded-none px-2 py-0 font-semibold",
            sortedState ? "text-primary" : "text-foreground",
          )}
          aria-label={`Open column menu for ${title}`}
        >
          <span className="truncate text-left">{title}</span>
          <span className="ml-2 shrink-0 text-xs" aria-hidden>
            {sortedState === "asc" ? "↑" : sortedState === "desc" ? "↓" : <MoreVertical className="h-3.5 w-3.5" />}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        {canSort ? (
          <>
            <DropdownMenuItem onClick={() => header.column.toggleSorting(false)}>
              <ArrowUpAZ className="mr-2 h-3.5 w-3.5" />
              <span>Sort ascending</span>
              {sortedState === "asc" ? <Check className="ml-auto h-3.5 w-3.5" /> : null}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => header.column.toggleSorting(true)}>
              <ArrowDownAZ className="mr-2 h-3.5 w-3.5" />
              <span>Sort descending</span>
              {sortedState === "desc" ? <Check className="ml-auto h-3.5 w-3.5" /> : null}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={clearSort} disabled={!sortedState}>
              <RotateCcw className="mr-2 h-3.5 w-3.5" />
              <span>Clear sort</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        ) : null}

        {canGroup ? (
          <DropdownMenuItem onClick={() => header.column.toggleGrouping()}>
            <Rows3 className="mr-2 h-3.5 w-3.5" />
            <span>{header.column.getIsGrouped() ? "Ungroup column" : "Group by column"}</span>
          </DropdownMenuItem>
        ) : null}

        {canHide ? (
          <DropdownMenuItem onClick={() => header.column.toggleVisibility(false)}>
            <EyeOff className="mr-2 h-3.5 w-3.5" />
            <span>Hide column</span>
          </DropdownMenuItem>
        ) : null}

        <DropdownMenuItem onClick={() => state.setDragModeEnabled((previousValue) => !previousValue)}>
          <MoveHorizontal className="mr-2 h-3.5 w-3.5" />
          <span>{state.dragModeEnabled ? "Disable drag/resize mode" : "Enable drag/resize mode"}</span>
        </DropdownMenuItem>

        <DropdownMenuItem onClick={onResetLayout}>
          <RotateCcw className="mr-2 h-3.5 w-3.5" />
          <span>Reset column layout</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * Renders a sortable/resizable header cell wrapper.
 */
function DraggableHeaderCell<TRow extends Record<string, unknown>>({
  header,
  children,
  draggable,
  resizable,
  stickyClassName,
}: {
  /** Current TanStack header instance. */
  header: Header<TRow, unknown>;
  /** Header content node. */
  children: ReactNode;
  /** Enables DnD on this header. */
  draggable: boolean;
  /** Enables resize affordance on this header. */
  resizable: boolean;
  /** Optional sticky positioning className. */
  stickyClassName?: string;
}) {
  const { attributes, listeners, isDragging, setNodeRef, transform, transition } = useSortable({
    id: header.column.id,
    disabled: !draggable,
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    ...resolveHeaderStyle(header),
  };

  return (
    <TableHead
      ref={setNodeRef}
      colSpan={header.colSpan}
      style={style}
      className={cn(
        "group relative border-b border-border bg-background/90 p-0 align-middle",
        "text-xs uppercase tracking-wide text-muted-foreground",
        stickyClassName,
        isDragging && "z-40 opacity-75 ring-1 ring-primary/40",
      )}
    >
      <div className="flex h-full min-h-10 items-stretch">
        {draggable ? (
          <button
            type="button"
            aria-label="Reorder column"
            className="grid w-8 place-items-center border-r border-border/50 text-muted-foreground/70 hover:bg-muted/30 hover:text-primary"
            {...attributes}
            {...listeners}
            onClick={(event) => event.stopPropagation()}
          >
            <GripVertical className="h-3.5 w-3.5" />
          </button>
        ) : null}
        <div className="min-w-0 flex-1">{children}</div>
      </div>
      {resizable ? (
        <div
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize column"
          onMouseDown={header.getResizeHandler()}
          onTouchStart={header.getResizeHandler()}
          className="absolute right-0 top-1/4 z-50 h-1/2 w-1 cursor-col-resize rounded-full bg-border/70 opacity-0 transition-opacity group-hover:opacity-100"
        />
      ) : null}
    </TableHead>
  );
}

/**
 * Renders all table header groups with selection/menu/reorder/resize features.
 */
export function DynamicTableHeader<TRow extends Record<string, unknown>>({
  table,
  state,
  features,
  layout,
  selectionColumnId,
  actionsColumnId,
  onResetLayout,
}: DynamicTableHeaderProps<TRow>) {
  const allPageRowsSelected = table.getIsAllPageRowsSelected();
  const somePageRowsSelected = table.getIsSomePageRowsSelected();

  /**
   * Handles click-to-sort on non-utility leaf headers.
   */
  const handleHeaderSort = useCallback(
    (header: Header<TRow, unknown>) => {
      if (!header.column.getCanSort()) {
        return;
      }
      header.column.toggleSorting(undefined, true);
    },
    [],
  );

  return (
    <UITableHeader className={layout.headerClassName}>
      {table.getHeaderGroups().map((headerGroup) => (
        <TableRow key={headerGroup.id} className="hover:bg-transparent">
          {headerGroup.headers.map((header) => {
            if (header.isPlaceholder) {
              return (
                <TableHead key={header.id} colSpan={header.colSpan} className="border-b border-border/50 bg-background/90" />
              );
            }

            const isLeafHeader = header.subHeaders.length === 0;
            const utilityHeader = isUtilityHeader(
              header,
              selectionColumnId,
              actionsColumnId,
            );
            const isSelection = header.column.id === selectionColumnId;
            const isActions = header.column.id === actionsColumnId;

            const draggable =
              isLeafHeader &&
              !utilityHeader &&
              features.enableColumnOrdering &&
              state.dragModeEnabled &&
              !features.lockedColumnIds.includes(header.column.id);
            const resizable =
              isLeafHeader &&
              !utilityHeader &&
              features.enableColumnResizing &&
              state.dragModeEnabled &&
              header.column.getCanResize();

            const stickyClassName = isSelection && layout.stickySelectionColumn !== false
              ? "sticky left-0 z-30"
              : isActions && layout.actions?.sticky !== false
                ? "sticky right-0 z-30"
                : undefined;

            if (!isLeafHeader) {
              return (
                <TableHead
                  key={header.id}
                  colSpan={header.colSpan}
                  style={resolveHeaderStyle(header)}
                  className="border-b border-border bg-background/90 px-2 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                >
                  {flexRender(
                    header.column.columnDef.header,
                    header.getContext(),
                  )}
                </TableHead>
              );
            }

            if (isSelection) {
              return (
                <DraggableHeaderCell
                  key={header.id}
                  header={header}
                  draggable={false}
                  resizable={false}
                  stickyClassName={stickyClassName}
                >
                  <div className="grid h-full place-items-center">
                    <Checkbox
                      checked={
                        allPageRowsSelected ||
                        (somePageRowsSelected ? "indeterminate" : false)
                      }
                      onCheckedChange={(checked) => {
                        table.toggleAllPageRowsSelected(Boolean(checked));
                      }}
                      aria-label="Select all rows"
                    />
                  </div>
                </DraggableHeaderCell>
              );
            }

            if (isActions) {
              return (
                <DraggableHeaderCell
                  key={header.id}
                  header={header}
                  draggable={false}
                  resizable={false}
                  stickyClassName={stickyClassName}
                >
                  <div className="flex h-full items-center justify-end px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                    {layout.actions?.headerLabel ?? "Actions"}
                  </div>
                </DraggableHeaderCell>
              );
            }

            return (
              <DraggableHeaderCell
                key={header.id}
                header={header}
                draggable={draggable}
                resizable={resizable}
                stickyClassName={stickyClassName}
              >
                <div
                  className={cn(
                    "flex h-full items-center",
                    (header.column.columnDef.meta as { headerClassName?: string } | undefined)?.headerClassName,
                  )}
                >
                  <div className="min-w-0 flex-1">
                    <ColumnMenu
                      header={header}
                      table={table}
                      features={features}
                      state={state}
                      onResetLayout={onResetLayout}
                    />
                  </div>
                  <button
                    type="button"
                    aria-label={`Toggle sorting for ${resolveHeaderLabel(header)}`}
                    className="mr-1 rounded px-1 py-0.5 text-[10px] font-bold text-muted-foreground hover:bg-muted/30 hover:text-primary"
                    onClick={() => handleHeaderSort(header)}
                  >
                    {header.column.getIsSorted() === "asc"
                      ? "↑"
                      : header.column.getIsSorted() === "desc"
                        ? "↓"
                        : "↕"}
                  </button>
                </div>
              </DraggableHeaderCell>
            );
          })}
        </TableRow>
      ))}
    </UITableHeader>
  );
}

