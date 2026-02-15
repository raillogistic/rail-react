import React, { useCallback, useEffect, useRef } from "react";
import { GripVertical } from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";
import { TableHead, ShadcnTableHeader, TableRow } from "./TableFrame";
import { useTable } from "../context/TableContext";
import { useMetadata } from "../context/MetadataContext";
import { Checkbox } from "@/lib/components/ui/checkbox";
import { TableColumnMenu } from "./TableColumnMenu";
import { ColumnFilter } from "./ColumnFilter";
import { resolveColumnVisibility } from "../utils";
import {
  clampColumnWidth,
  getColumnWidthStyle,
  MIN_COLUMN_WIDTH_PX,
} from "../utils/columnSizing";
import type {
  BaseModelTableColumnDef,
  BaseModelTableColumnOrderingConfig,
} from "../types";

type ResizePointerHandler = (event: React.PointerEvent<HTMLDivElement>) => void;

interface DraggableHeadProps {
  id: string;
  children: React.ReactNode;
  className?: string;
  draggable?: boolean;
  resizable?: boolean;
  onResizePointerDown?: ResizePointerHandler;
  widthStyle?: React.CSSProperties;
  ariaSort?: React.AriaAttributes["aria-sort"];
  density?: "compact" | "comfortable" | "spacious";
  isActions?: boolean;
}

function DraggableHead({
  id,
  children,
  className,
  draggable = true,
  resizable = false,
  onResizePointerDown,
  widthStyle,
  ariaSort,
  density = "comfortable",
  isActions = false,
}: DraggableHeadProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled: !draggable });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    ...widthStyle,
  };

  return (
    <TableHead
      ref={setNodeRef}
      style={style}
      className={cn(
        "group/col relative sticky top-0 z-20 whitespace-nowrap overflow-visible",
        "border-b border-border/40",
        "bg-background/80 backdrop-blur-md text-left",
        "transition-all duration-300",
        // Colored accent line on bottom
        "after:absolute after:left-0 after:bottom-[-1px] after:h-[2px] after:w-0 after:bg-primary after:transition-all hover:after:w-full",
        density === "compact"
          ? "h-9 p-0 text-[11px] font-bold uppercase tracking-wider"
          : density === "spacious"
            ? "h-14 p-0 text-[14px] font-semibold"
            : "h-11 p-0 text-[13px] font-semibold",
        isDragging &&
          "opacity-30 scale-95 shadow-2xl z-30 ring-2 ring-primary/20 bg-muted",
        "hover:bg-muted/40 hover:text-foreground text-muted-foreground/80",
        isActions &&
          "bg-muted/30 font-bold text-[10px] uppercase tracking-widest",
        className,
      )}
      aria-sort={ariaSort}
    >
      <div className="flex items-stretch gap-0 h-full w-full">
        {draggable ? (
          <button
            type="button"
            aria-label="Reordonner la colonne"
            className={cn(
              "h-full px-2.5 border-r border-border/20",
              "text-muted-foreground/40 hover:text-primary hover:bg-primary/5",
              "cursor-grab active:cursor-grabbing transition-all",
              "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/50",
            )}
            {...attributes}
            {...listeners}
            onClick={(event) => event.stopPropagation()}
          >
            <GripVertical className="h-3.5 w-3.5" />
          </button>
        ) : null}
        <div className="flex items-stretch gap-0 flex-1 min-w-0 h-full group/title">
          {children}
        </div>
      </div>
      {resizable && onResizePointerDown ? (
        <div
          role="separator"
          aria-orientation="vertical"
          aria-label="Redimensionner la colonne"
          className={cn(
            "absolute right-0 top-0 z-40 h-full w-2 translate-x-1",
            "cursor-col-resize touch-none select-none",
            "opacity-0 transition-opacity group-hover/col:opacity-100",
            "after:absolute after:right-1 after:top-1/2 after:h-8 after:w-px",
            "after:-translate-y-1/2 after:bg-primary/60",
          )}
          onPointerDown={onResizePointerDown}
          onClick={(event) => event.stopPropagation()}
        />
      ) : null}
    </TableHead>
  );
}

export function TableHeader({
  actionsLabel,
  columns,
  columnOrdering,
  disableSorting,
  enableSelection,
}: {
  actionsLabel?: string;
  columns?: BaseModelTableColumnDef[];
  columnOrdering?: BaseModelTableColumnOrderingConfig;
  disableSorting?: boolean;
  enableSelection?: boolean;
}) {
  const { metadata } = useMetadata();
  const {
    columnOrder,
    columnVisibility,
    columnWidths,
    data,
    rowSelection,
    setRowSelection,
    density,
    dragModeEnabled,
    setColumnWidths,
  } = useTable();

  const columnWidthsRef = useRef(columnWidths);
  const activeResizeHandlersRef = useRef<{
    move: (event: PointerEvent) => void;
    up: () => void;
  } | null>(null);

  useEffect(() => {
    columnWidthsRef.current = columnWidths;
  }, [columnWidths]);

  const stopColumnResize = useCallback(() => {
    const handlers = activeResizeHandlersRef.current;
    if (!handlers) return;
    window.removeEventListener("pointermove", handlers.move);
    window.removeEventListener("pointerup", handlers.up);
    activeResizeHandlersRef.current = null;
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
  }, []);

  useEffect(() => {
    return () => {
      stopColumnResize();
    };
  }, [stopColumnResize]);

  const startColumnResize = useCallback(
    (columnId: string, event: React.PointerEvent<HTMLDivElement>) => {
      if (!dragModeEnabled) return;

      event.preventDefault();
      event.stopPropagation();
      stopColumnResize();

      const headerCell = event.currentTarget.closest("th");
      const measuredWidth =
        headerCell?.getBoundingClientRect().width ?? MIN_COLUMN_WIDTH_PX;
      const persistedWidth = columnWidthsRef.current[columnId];
      const baseWidth = clampColumnWidth(
        typeof persistedWidth === "number" ? persistedWidth : measuredWidth,
      );
      const startX = event.clientX;

      const handlePointerMove = (moveEvent: PointerEvent) => {
        const delta = moveEvent.clientX - startX;
        const nextWidth = clampColumnWidth(baseWidth + delta);
        const nextWidths = {
          ...columnWidthsRef.current,
          [columnId]: nextWidth,
        };
        columnWidthsRef.current = nextWidths;
        setColumnWidths(nextWidths);
      };

      const handlePointerUp = () => {
        stopColumnResize();
      };

      activeResizeHandlersRef.current = {
        move: handlePointerMove,
        up: handlePointerUp,
      };

      window.addEventListener("pointermove", handlePointerMove);
      window.addEventListener("pointerup", handlePointerUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    },
    [dragModeEnabled, setColumnWidths, stopColumnResize],
  );

  // Determine visible columns in order
  const visibleColumns = (() => {
    if (columns && columns.length > 0) {
      const byId = new Map(columns.map((column) => [column.id, column]));
      const orderedIds =
        columnOrder.length > 0 ? columnOrder : columns.map((c) => c.id);
      return orderedIds
        .map((id) => byId.get(id))
        .filter((column): column is BaseModelTableColumnDef => !!column)
        .filter((column) =>
          resolveColumnVisibility(columnVisibility, [
            column.id,
            "accessor" in column ? column.accessor : undefined,
            "accessor" in column
              ? column.accessor.replace(/__/g, ".").split(".")[0]
              : undefined,
          ]),
        );
    }

    if (!metadata) return [];
    return columnOrder
      .map((colId) => metadata.fields.find((f) => f.name === colId))
      .filter(
        (f) =>
          f &&
          resolveColumnVisibility(columnVisibility, [f.name, f.fieldName]),
      );
  })();

  const allowDrag = columnOrdering?.draggable !== false;
  const locked = new Set(columnOrdering?.locked ?? []);

  // Selection logic
  const selectedOnPage = data.reduce((count, row) => {
    const rowId = String(row.id);
    return rowSelection[rowId] ? count + 1 : count;
  }, 0);
  const allSelected = data.length > 0 && selectedOnPage === data.length;
  const someSelected = selectedOnPage > 0 && !allSelected;

  const toggleSelectAll = () => {
    if (allSelected) {
      setRowSelection({});
    } else {
      const newSelection: Record<string, boolean> = {};
      data.forEach((row) => {
        const id = String(row.id);
        if (id) newSelection[id] = true;
      });
      setRowSelection(newSelection);
    }
  };

  if (!metadata && !columns) return null;

  return (
    <ShadcnTableHeader className="bg-muted/5 group/header">
      <TableRow className="border-b-0 hover:bg-transparent transition-none">
        {enableSelection ? (
          <TableHead
            className={cn(
              "w-[46px] table-first-column sticky top-0 z-20 overflow-visible",
              "border-b border-border/40 bg-background/80 backdrop-blur-md",
              "transition-colors duration-200",
              density === "compact"
                ? "py-0 px-2 h-9"
                : density === "spacious"
                  ? "py-0 px-3.5 h-14"
                  : "py-0 px-3 h-11",
            )}
          >
            <div className="flex items-center justify-center h-full">
              <Checkbox
                checked={
                  allSelected || (someSelected ? "indeterminate" : false)
                }
                onCheckedChange={toggleSelectAll}
                aria-label="Tout sélectionner"
                className="h-4.5 w-4.5 transition-all duration-300 data-[state=checked]:bg-primary data-[state=checked]:scale-110 data-[state=checked]:shadow-lg data-[state=checked]:shadow-primary/20"
              />
            </div>
          </TableHead>
        ) : null}

        {visibleColumns.map((field) => {
          if (!field) return null;

          if ("accessor" in field) {
            const columnId = field.id;
            // Custom column def
            return (
              <DraggableHead
                key={columnId}
                id={columnId}
                draggable={
                  allowDrag && dragModeEnabled && !locked.has(columnId)
                }
                resizable={dragModeEnabled}
                onResizePointerDown={(event) => startColumnResize(columnId, event)}
                widthStyle={getColumnWidthStyle(columnWidths, columnId)}
                density={density}
              >
                <div className="flex h-full w-full items-stretch self-stretch">
                  <div className="min-w-0 flex-1 h-full">
                    <TableColumnMenu
                      columnId={field.id}
                      title={field.title}
                      disabled={disableSorting}
                      fullWidthTrigger
                    />
                  </div>
                  <ColumnFilter columnId={field.id} hideTrigger />
                </div>
              </DraggableHead>
            );
          }

          // Metadata field
          return (
            <DraggableHead
              key={field.name}
              id={field.name}
              draggable={
                allowDrag && dragModeEnabled && !locked.has(field.name)
              }
              resizable={dragModeEnabled}
              onResizePointerDown={(event) => startColumnResize(field.name, event)}
              widthStyle={getColumnWidthStyle(columnWidths, field.name)}
              density={density}
            >
              <div className="flex h-full w-full items-stretch self-stretch">
                <div className="min-w-0 flex-1 h-full">
                  <TableColumnMenu
                    columnId={field.name}
                    title={field.verboseName}
                    field={field}
                    disabled={disableSorting}
                    fullWidthTrigger
                  />
                </div>
                <ColumnFilter columnId={field.name} field={field} hideTrigger />
              </div>
            </DraggableHead>
          );
        })}

        {/* Actions Column */}
        <DraggableHead
          id="actions"
          draggable={false}
          className="w-[140px] text-right sticky right-0 z-30 table-last-column border-l border-border/20 shadow-[-12px_0_15px_-10px_rgba(0,0,0,0.05)]"
          density={density}
          isActions
        >
          <span className="block w-full pr-4 text-[10px] font-bold uppercase tracking-[0.15em] opacity-60">
            {actionsLabel ?? ""}
          </span>
        </DraggableHead>
      </TableRow>
    </ShadcnTableHeader>
  );
}
