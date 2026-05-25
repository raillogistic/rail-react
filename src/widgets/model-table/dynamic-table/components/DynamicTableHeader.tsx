/**
 * @file DynamicTableHeader.tsx
 * @description Renders the custom TanStack table header groups and headers.
 * Modernized with a premium primary-colored background, custom column menus,
 * slick drag-and-drop handles, and interactive column resizing handles.
 * Fully responsive and visually optimized for the Patrimoin workspace.
 */
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
  isPrimary = false,
  density = "comfortable",
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
  /** Whether the header background is primary color. */
  isPrimary?: boolean;
  /** Resolved table density. */
  density?: "compact" | "comfortable" | "spacious";
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
            "flex h-full w-full items-center justify-between outline-none border-none bg-transparent",
            density === "compact"
              ? "px-1.5 py-0 gap-1 text-[10px]"
              : density === "spacious"
                ? "px-3.5 py-0 gap-2 text-[13px]"
                : "px-2.5 py-0 gap-1.5 text-[11px]",
            "font-semibold tracking-normal transition-all duration-200",
            "group/trigger text-left",
            sortedState
              ? isPrimary
                ? "text-white font-semibold bg-primary-foreground/10 shadow-sm"
                : "text-primary font-semibold bg-primary/5 dark:bg-primary/10 shadow-sm"
              : isPrimary
                ? "text-primary-foreground/80 hover:text-white hover:bg-primary-foreground/10"
                : "text-muted-foreground hover:text-foreground",
            className,
          )}
          aria-label={`Open column menu for ${title}`}
        >
          {children}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="w-56 rounded-md border bg-popover p-1 shadow-md"
      >
        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
          Options de colonne
        </div>
        <DropdownMenuSeparator className="mx-1" />
        {canSort ? (
          <>
            <DropdownMenuItem
              onClick={() => header.column.toggleSorting(false)}
              className="gap-3 px-3 py-2 text-sm focus:bg-accent focus:text-accent-foreground cursor-pointer"
            >
              <ArrowUp className="size-4 text-muted-foreground/60" />
              <span>Trier croissant</span>
              {sortedState === "asc" ? (
                <Check className="ml-auto size-4 text-primary" />
              ) : null}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => header.column.toggleSorting(true)}
              className="gap-3 px-3 py-2 text-sm focus:bg-accent focus:text-accent-foreground cursor-pointer"
            >
              <ArrowDown className="size-4 text-muted-foreground/60" />
              <span>Trier décroissant</span>
              {sortedState === "desc" ? (
                <Check className="ml-auto size-4 text-primary" />
              ) : null}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={clearSort}
              disabled={!sortedState}
              className="gap-3 px-3 py-2 text-sm focus:bg-accent focus:text-accent-foreground cursor-pointer"
            >
              <RotateCcw className="size-4 text-muted-foreground/60" />
              <span>Effacer le tri</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="mx-1 my-1" />
          </>
        ) : null}

        {canGroup ? (
          <DropdownMenuItem
            onClick={() => header.column.toggleGrouping()}
            className="gap-3 px-3 py-2 text-sm focus:bg-accent focus:text-accent-foreground cursor-pointer"
          >
            <Rows3 className="size-4 text-muted-foreground/60" />
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
            className="gap-3 px-3 py-2 text-sm text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer"
          >
            <EyeOff className="size-4 text-muted-foreground/60" />
            <span>Masquer la colonne</span>
          </DropdownMenuItem>
        ) : null}

        <DropdownMenuItem
          onClick={() =>
            state.setDragModeEnabled((previousValue) => !previousValue)
          }
          className="gap-3 px-3 py-2 text-sm focus:bg-accent focus:text-accent-foreground cursor-pointer"
        >
          <MoveHorizontal className="size-4 text-muted-foreground/60" />
          <span>
            {state.dragModeEnabled
              ? "Désactiver glissement/redimension"
              : "Activer glissement/redimension"}
          </span>
        </DropdownMenuItem>

        <DropdownMenuSeparator className="mx-1 my-1" />

        <DropdownMenuItem
          onClick={onResetLayout}
          className="gap-3 px-3 py-2 text-sm text-muted-foreground focus:bg-accent focus:text-accent-foreground cursor-pointer"
        >
          <RotateCcw className="size-4" />
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
  isPrimary = false,
  density = "comfortable",
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
  /** Whether the header background is primary color. */
  isPrimary?: boolean;
  /** Resolved table density. */
  density?: "compact" | "comfortable" | "spacious";
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
        "group/header relative border-b p-0 align-middle transition-all duration-200",
        isPrimary
          ? "border-primary-foreground/15 bg-primary/95 text-primary-foreground backdrop-blur-md"
          : "border-border/80 bg-background/95 dark:bg-zinc-950/95 backdrop-blur-md text-muted-foreground hover:bg-muted/50 dark:hover:bg-zinc-900/50",
        isPrimary
          ? "after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-white/80 after:scale-x-0 after:origin-left after:transition-transform after:duration-300 hover:after:scale-x-100"
          : "after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-primary/80 after:scale-x-0 after:origin-left after:transition-transform after:duration-300 hover:after:scale-x-100",
        header.column.getIsSorted() &&
          (isPrimary
            ? "after:scale-x-100 after:bg-white text-white bg-primary-foreground/10"
            : "after:scale-x-100 after:bg-primary text-foreground font-semibold bg-primary/[0.02]"),
        density === "compact"
          ? "h-8 text-[10px]"
          : density === "spacious"
            ? "h-12 text-[12px]"
            : "h-10 text-[11px]",
        stickyClassName,
        fitContent && "w-[1%] whitespace-nowrap",
        isDragging &&
          (isPrimary
            ? "z-40 opacity-90 ring-2 ring-white shadow-2xl scale-[1.01] bg-primary"
            : "z-40 opacity-90 ring-2 ring-primary shadow-2xl scale-[1.01] bg-background dark:bg-zinc-950"),
      )}
    >
      <div className="flex h-full items-stretch">
        {draggable ? (
          <button
            type="button"
            aria-label="Reorder column"
            className={cn(
              "grid w-7 shrink-0 place-items-center border-r transition-all duration-150 cursor-grab active:cursor-grabbing",
              isPrimary
                ? "border-primary-foreground/10 text-primary-foreground/40 hover:bg-primary-foreground/10 hover:text-white"
                : "border-border/40 text-muted-foreground/35 hover:bg-muted-foreground/5 hover:text-muted-foreground",
            )}
            {...attributes}
            {...listeners}
            onClick={(event) => event.stopPropagation()}
          >
            <GripVertical className="size-3.5" />
          </button>
        ) : null}
        <div className="min-w-0 flex-1 h-full">{children}</div>
      </div>
      {resizable ? (
        <div
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize column"
          onMouseDown={header.getResizeHandler()}
          onTouchStart={header.getResizeHandler()}
          className={cn(
            "absolute right-0 top-0 bottom-0 z-50 w-[6px] cursor-col-resize select-none touch-none",
            "bg-transparent transition-all duration-200",
            isPrimary
              ? "before:absolute before:right-[2px] before:top-2 before:bottom-2 before:w-[1px] before:bg-primary-foreground/20 before:transition-all hover:before:bg-white hover:before:w-[2px] hover:before:top-0 hover:before:bottom-0 hover:before:shadow-[0_0_8px_rgba(255,255,255,0.4)]"
              : "before:absolute before:right-[2px] before:top-2 before:bottom-2 before:w-[1px] before:bg-border/40 before:transition-all hover:before:bg-primary hover:before:w-[2px] hover:before:top-0 hover:before:bottom-0 hover:before:shadow-[0_0_8px_rgba(59,130,246,0.4)]",
            header.column.getIsResizing() &&
              (isPrimary
                ? "before:bg-white before:w-[2px] before:top-0 before:bottom-0 before:shadow-[0_0_8px_rgba(255,255,255,0.7)]"
                : "before:bg-primary before:w-[2px] before:top-0 before:bottom-0 before:shadow-[0_0_8px_rgba(59,130,246,0.7)]"),
          )}
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

  const isPrimaryHeader =
    !layout.headerClassName?.includes("bg-background") &&
    !layout.headerClassName?.includes("bg-default") &&
    !layout.headerClassName?.includes("bg-muted");

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
                  className={cn(
                    "border-b",
                    isPrimaryHeader
                      ? "border-primary-foreground/10 bg-primary/40"
                      : "border-border/20 bg-muted/20",
                  )}
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
                  className={cn(
                    "border-b py-0 outline-none transition-all duration-200 font-semibold tracking-normal",
                    layout.density === "compact"
                      ? "px-1.5 gap-1 text-[10px]"
                      : layout.density === "spacious"
                        ? "px-3.5 gap-2 text-[13px]"
                        : "px-2.5 gap-1.5 text-[11px]",
                    isPrimaryHeader
                      ? "border-primary-foreground/15 bg-primary/95 text-primary-foreground backdrop-blur-md"
                      : "border-border/80 bg-background/95 dark:bg-zinc-950/95 backdrop-blur-md text-muted-foreground",
                  )}
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
                  isPrimary={isPrimaryHeader}
                  density={layout.density}
                >
                  <div
                    className={cn(
                      "grid h-full place-items-center text-xs font-medium",
                      isPrimaryHeader
                        ? "text-primary-foreground"
                        : "text-muted-foreground",
                    )}
                  >
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
                  isPrimary={isPrimaryHeader}
                  density={layout.density}
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
                      className={cn(
                        isPrimaryHeader
                          ? "data-[state=checked]:bg-white data-[state=checked]:text-primary border-primary-foreground/40 text-primary-foreground"
                          : "data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground border-muted-foreground/30 text-primary-foreground",
                      )}
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
                  isPrimary={isPrimaryHeader}
                  density={layout.density}
                >
                  <div
                    className={cn(
                      "flex h-full items-center justify-end text-xs font-medium px-3 tracking-normal",
                      isPrimaryHeader
                        ? "text-primary-foreground"
                        : "text-muted-foreground",
                    )}
                  >
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
                isPrimary={isPrimaryHeader}
                density={layout.density}
              >
                {isCustomHeader ? (
                  <div
                    className={cn("flex h-full items-center", headerClassName)}
                  >
                    <div
                      className={cn(
                        "min-w-0 flex-1 flex items-center h-full font-semibold",
                        layout.density === "compact"
                          ? "px-1.5 py-0 gap-1 text-[10px]"
                          : layout.density === "spacious"
                            ? "px-3.5 py-0 gap-2 text-[13px]"
                            : "py-0 gap-1.5 text-[11px]",
                        isPrimaryHeader
                          ? "text-primary-foreground"
                          : "text-muted-foreground hover:text-foreground",
                      )}
                    >
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
                    isPrimary={isPrimaryHeader}
                    density={layout.density}
                  >
                    <div
                      className="min-w-0 flex-1 flex items-center gap-2 text-left"
                      title={resolveHeaderLabel(header)}
                    >
                      <span className="truncate tracking-normal font-semibold text-xs">
                        {resolveHeaderLabel(header)}
                      </span>
                      {/* Sort Indicator Pill */}
                      {sortedState && (
                        <div
                          className={cn(
                            "flex shrink-0 items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] border animate-in fade-in duration-300 font-semibold",
                            isPrimaryHeader
                              ? "bg-primary-foreground/20 text-white border-white/20"
                              : "bg-primary/10 text-primary border border-primary/20",
                          )}
                          aria-hidden
                        >
                          {sortedState === "asc" ? (
                            <>
                              <ArrowUp className="size-2.5" />
                              <span>Croissant</span>
                            </>
                          ) : (
                            <>
                              <ArrowDown className="size-2.5" />
                              <span>Décroissant</span>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                    {!sortedState && (
                      <ArrowUpDown
                        className={cn(
                          "size-3.5 shrink-0 opacity-0 group-hover/trigger:opacity-40 transition-all duration-250",
                          isPrimaryHeader
                            ? "text-primary-foreground/80"
                            : "text-muted-foreground/60",
                        )}
                      />
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
