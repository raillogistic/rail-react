import type { CSSProperties, ReactNode } from "react";
import type { Header, Table } from "@tanstack/react-table";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Check,
  GripVertical,
  RotateCcw,
  Rows3,
  EyeOff,
  MoveHorizontal,
} from "lucide-react";
import { cn } from "@/shared/utils";
import { Checkbox } from "@/shared/ui/kit/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/ui/kit/dropdown-menu";
import {
  TableHead,
  TableRow,
  TableHeader as UITableHeader,
} from "@/shared/ui/kit/table";
import { flexRender } from "@tanstack/react-table";
import type {
  DynamicTableResolvedFeatures,
  DynamicTableResolvedLayout,
} from "../types";
import type { UseDynamicTableStateResult } from "../state/useDynamicTableState";

/**
 * Props for`DynamicTableHeader`.
 */
export interface DynamicTableHeaderProps<TRow extends Record<string, unknown>> {
  /** TanStack table instance. */
  table: Table<TRow>;
  /** Resolved table state controls. */
  state: UseDynamicTableStateResult;
  /** Resolved feature flags. */
  features: DynamicTableResolvedFeatures;
  /** Resolved layout configuration. */
  layout: DynamicTableResolvedLayout<TRow>;
  /** Expand utility column id. */
  expandColumnId: string;
  /** Selection utility column id. */
  selectionColumnId: string;
  /** Actions utility column id. */
  actionsColumnId: string;
  /** Optional header content for the expand utility column. */
  expandColumnHeader?: ReactNode;
  /** Whether the expand utility column is sticky. */
  expandColumnSticky: boolean;
  /** Left sticky offset in px applied to the selection utility column. */
  selectionColumnLeftOffsetPx: number;
  /** Callback used by column menu reset action. */
  onResetLayout: () => void;
}

/**
 * Returns true if the header belongs to a leaf-level utility column.
 */
function isUtilityHeader<TRow extends Record<string, unknown>>(
  header: Header<TRow, unknown>,
  expandColumnId: string,
  selectionColumnId: string,
  actionsColumnId: string,
): boolean {
  return (
    header.column.id === expandColumnId ||
    header.column.id === selectionColumnId ||
    header.column.id === actionsColumnId
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
  const titleCandidate = (
    header.column.columnDef.meta as { title?: string } | undefined
  )?.title;
  if (typeof titleCandidate === "string" && titleCandidate.length > 0) {
    return titleCandidate;
  }
  return header.column.id;
}

/**
 * Resolves the configured leaf-header rendering mode for a column.
 */
function resolveHeaderMode<TRow extends Record<string, unknown>>(
  header: Header<TRow, unknown>,
): "menu" | "custom" {
  const meta = header.column.columnDef.meta as
    | {
        headerMode?: "menu" | "custom";
      }
    | undefined;
  return meta?.headerMode === "custom" ? "custom" : "menu";
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
 * Premium dropdown with grouped actions and refined visual treatment.
 */
function ColumnMenu<TRow extends Record<string, unknown>>({
  header,
  table,
  features,
  state,
  onResetLayout,
  children,
  className,
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
  /** Content to display within the trigger. */
  children: ReactNode;
  /** Optional extra classes for the trigger. */
  className?: string;
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
        <button
          type="button"
          className={cn(
            "flex h-full w-full items-center justify-between gap-2 px-3 py-0 outline-none",
            "text-[10px] font-bold uppercase tracking-widest transition-all duration-300",
            "hover:bg-primary/5 hover:text-primary active:bg-primary/8 group/trigger",
            sortedState
              ? "bg-primary/[0.03] text-primary"
              : "text-muted-foreground/70 hover:text-foreground",
            className,
          )}
          aria-label={`Open column menu for ${title}`}
        >
          {children}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="w-56 overflow-hidden border-border/20 bg-background/80 p-1.5 shadow-2xl backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-200"
      >
        <div className="px-2 py-1.5 text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">
          Options de colonne
        </div>
        <DropdownMenuSeparator className="mx-1 bg-border/40" />
        {canSort ? (
          <>
            <DropdownMenuItem
              onClick={() => header.column.toggleSorting(false)}
              className="gap-3 px-3 py-2 text-xs font-semibold focus:bg-primary/5 focus:text-primary transition-colors"
            >
              <ArrowUp className="size-3.5 text-muted-foreground/60" />
              <span>Trier croissant</span>
              {sortedState === "asc" ? (
                <Check className="ml-auto size-3.5 text-primary animate-in fade-in zoom-in duration-300" />
              ) : null}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => header.column.toggleSorting(true)}
              className="gap-3 px-3 py-2 text-xs font-semibold focus:bg-primary/5 focus:text-primary transition-colors"
            >
              <ArrowDown className="size-3.5 text-muted-foreground/60" />
              <span>Trier décroissant</span>
              {sortedState === "desc" ? (
                <Check className="ml-auto size-3.5 text-primary animate-in fade-in zoom-in duration-300" />
              ) : null}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={clearSort}
              disabled={!sortedState}
              className="gap-3 px-3 py-2 text-xs font-semibold focus:bg-muted/50 transition-colors"
            >
              <RotateCcw className="size-3.5 text-muted-foreground/60" />
              <span>Effacer le tri</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="mx-1 my-1 bg-border/40" />
          </>
        ) : null}

        {canGroup ? (
          <DropdownMenuItem
            onClick={() => header.column.toggleGrouping()}
            className="gap-3 px-3 py-2 text-xs font-semibold focus:bg-primary/5 focus:text-primary transition-colors"
          >
            <Rows3 className="size-3.5 text-muted-foreground/60" />
            <span>
              {header.column.getIsGrouped()
                ? "Dégrouper cette colonne"
                : "Grouper par cette colonne"}
            </span>
          </DropdownMenuItem>
        ) : null}

        {canHide ? (
          <DropdownMenuItem
            onClick={() => header.column.toggleVisibility(false)}
            className="gap-3 px-3 py-2 text-xs font-semibold focus:bg-destructive/5 focus:text-destructive transition-colors"
          >
            <EyeOff className="size-3.5 text-muted-foreground/60" />
            <span>Masquer la colonne</span>
          </DropdownMenuItem>
        ) : null}

        <DropdownMenuItem
          onClick={() =>
            state.setDragModeEnabled((previousValue) => !previousValue)
          }
          className="gap-3 px-3 py-2 text-xs font-semibold focus:bg-primary/5 focus:text-primary transition-colors"
        >
          <MoveHorizontal className="size-3.5 text-muted-foreground/60" />
          <span>
            {state.dragModeEnabled
              ? "Désactiver glissement/redimension"
              : "Activer glissement/redimension"}
          </span>
        </DropdownMenuItem>

        <DropdownMenuSeparator className="mx-1 my-1 bg-border/40" />

        <DropdownMenuItem
          onClick={onResetLayout}
          className="gap-3 px-3 py-2 text-xs font-semibold text-muted-foreground/70 hover:text-foreground focus:bg-muted/50 transition-colors"
        >
          <RotateCcw className="size-3.5" />
          <span>Réinitialiser la disposition</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * Renders a sortable/resizable header cell wrapper with premium styling.
 */
function DraggableHeaderCell<TRow extends Record<string, unknown>>({
  header,
  children,
  draggable,
  resizable,
  fitContent = false,
  stickyClassName,
  stickyStyle,
}: {
  /** Current TanStack header instance. */
  header: Header<TRow, unknown>;
  /** Header content node. */
  children: ReactNode;
  /** Enables DnD on this header. */
  draggable: boolean;
  /** Enables resize affordance on this header. */
  resizable: boolean;
  /** Lets the browser size the cell based on its content. */
  fitContent?: boolean;
  /** Optional sticky positioning className. */
  stickyClassName?: string;
  /** Optional sticky positioning style. */
  stickyStyle?: CSSProperties;
}) {
  const {
    attributes,
    listeners,
    isDragging,
    setNodeRef,
    transform,
    transition,
  } = useSortable({
    id: header.column.id,
    disabled: !draggable,
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    ...(fitContent ? {} : resolveHeaderStyle(header)),
    ...stickyStyle,
  };

  return (
    <TableHead
      ref={setNodeRef}
      colSpan={header.colSpan}
      style={style}
      className={cn(
        "group/header relative border-b border-border/30 bg-muted/30 p-0 align-middle",
        "text-[11px] font-medium tracking-wide text-muted-foreground",
        stickyClassName,
        fitContent && "w-[1%] whitespace-nowrap",
        isDragging && "z-40 opacity-75 ring-1 ring-primary/30 shadow-lg",
      )}
    >
      <div className="flex h-full min-h-9 items-stretch">
        {draggable ? (
          <button
            type="button"
            aria-label="Reorder column"
            className="grid w-8 shrink-0 place-items-center border-r border-border/10 text-muted-foreground/30 transition-all hover:bg-primary/5 hover:text-primary active:scale-95"
            {...attributes}
            {...listeners}
            onClick={(event) => event.stopPropagation()}
          >
            <GripVertical className="size-3" />
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
          className="absolute right-0 top-[20%] z-50 h-[60%] w-[3px] cursor-col-resize bg-primary/0 opacity-0 transition-all group-hover/header:bg-primary/30 group-hover/header:opacity-100 hover:!bg-primary/60 active:!bg-primary"
        />
      ) : null}
    </TableHead>
  );
}

/**
 * Renders all table header groups with selection/menu/reorder/resize features.
 * Uses refined visual treatment with subtle backgrounds and modern sort indicators.
 */
export function DynamicTableHeader<TRow extends Record<string, unknown>>({
  table,
  state,
  features,
  layout,
  expandColumnId,
  selectionColumnId,
  actionsColumnId,
  expandColumnHeader,
  expandColumnSticky,
  selectionColumnLeftOffsetPx,
  onResetLayout,
}: DynamicTableHeaderProps<TRow>) {
  const allPageRowsSelected = table.getIsAllPageRowsSelected();
  const somePageRowsSelected = table.getIsSomePageRowsSelected();

  return (
    <UITableHeader className={layout.headerClassName}>
      {table.getHeaderGroups().map((headerGroup) => (
        <TableRow
          key={headerGroup.id}
          className="hover:bg-transparent border-0"
        >
          {headerGroup.headers.map((header) => {
            if (header.isPlaceholder) {
              return (
                <TableHead
                  key={header.id}
                  colSpan={header.colSpan}
                  className="border-b border-border/20 bg-muted/20"
                />
              );
            }

            const isLeafHeader = header.subHeaders.length === 0;
            const utilityHeader = isUtilityHeader(
              header,
              expandColumnId,
              selectionColumnId,
              actionsColumnId,
            );
            const isExpand = header.column.id === expandColumnId;
            const isSelection = header.column.id === selectionColumnId;
            const isActions = header.column.id === actionsColumnId;
            const autoSizeActionsHeader =
              isActions && typeof layout.actions?.size !== "number";

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

            const stickyClassName =
              isExpand && expandColumnSticky
                ? "sticky z-30"
                : isSelection && layout.stickySelectionColumn !== false
                  ? "sticky z-30"
                  : isActions && layout.actions?.sticky !== false
                    ? "sticky right-0 z-30"
                    : undefined;
            const stickyStyle =
              isExpand && expandColumnSticky
                ? { left: 0 }
                : isSelection &&
                    layout.stickySelectionColumn !== false &&
                    selectionColumnLeftOffsetPx > 0
                  ? { left: selectionColumnLeftOffsetPx }
                  : undefined;

            if (!isLeafHeader) {
              return (
                <TableHead
                  key={header.id}
                  colSpan={header.colSpan}
                  style={resolveHeaderStyle(header)}
                  className="border-b border-border/20 bg-muted/20 px-3 py-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60"
                >
                  {flexRender(
                    header.column.columnDef.header,
                    header.getContext(),
                  )}
                </TableHead>
              );
            }

            if (isExpand) {
              return (
                <DraggableHeaderCell
                  key={header.id}
                  header={header}
                  draggable={false}
                  resizable={false}
                  fitContent={autoSizeActionsHeader}
                  stickyClassName={stickyClassName}
                  stickyStyle={stickyStyle}
                >
                  <div className="grid h-full place-items-center text-[9px] font-semibold uppercase tracking-widest text-muted-foreground/50">
                    {expandColumnHeader ?? null}
                  </div>
                </DraggableHeaderCell>
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
                  stickyStyle={stickyStyle}
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
                      className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
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
                  stickyStyle={stickyStyle}
                >
                  <div className="flex h-full items-center justify-end text-[9px] font-semibold uppercase tracking-widest text-muted-foreground/50">
                    {layout.actions?.headerLabel ?? ""}
                  </div>
                </DraggableHeaderCell>
              );
            }

            const isCustomHeader = resolveHeaderMode(header) === "custom";
            const sortedState = header.column.getIsSorted();
            const headerClassName = (
              header.column.columnDef.meta as
                | { headerClassName?: string }
                | undefined
            )?.headerClassName;

            return (
              <DraggableHeaderCell
                key={header.id}
                header={header}
                draggable={draggable}
                resizable={resizable}
                fitContent={autoSizeActionsHeader}
                stickyClassName={stickyClassName}
                stickyStyle={stickyStyle}
              >
                {isCustomHeader ? (
                  <div
                    className={cn("flex h-full items-center", headerClassName)}
                  >
                    <div className="min-w-0 flex-1 flex items-center h-full">
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                    </div>
                  </div>
                ) : (
                  <ColumnMenu
                    header={header}
                    table={table}
                    features={features}
                    state={state}
                    onResetLayout={onResetLayout}
                    className={headerClassName}
                  >
                    <div className="min-w-0 flex-1 flex items-center gap-2">
                      <span className="truncate">
                        {resolveHeaderLabel(header)}
                      </span>
                      {/* Sort Indicator */}
                      <div
                        className="flex shrink-0 items-center gap-1"
                        aria-hidden
                      >
                        {sortedState === "asc" ? (
                          <ArrowUp className="size-3 animate-in fade-in zoom-in-75 text-primary duration-300" />
                        ) : sortedState === "desc" ? (
                          <ArrowDown className="size-3 animate-in fade-in zoom-in-75 text-primary duration-300" />
                        ) : null}
                      </div>
                    </div>
                    {!sortedState && (
                      <ArrowUpDown className="size-3 shrink-0 opacity-0 group-hover/trigger:opacity-40 transition-opacity" />
                    )}
                  </ColumnMenu>
                )}
              </DraggableHeaderCell>
            );
          })}
        </TableRow>
      ))}
    </UITableHeader>
  );
}
