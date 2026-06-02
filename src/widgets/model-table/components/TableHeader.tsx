/**
 * @file TableHeader.tsx
 * @description Renders the legacy table header component, styled with the primary background color
 * and contrast-adjusted elements for clear text, checkboxes, and sort buttons.
 */
import React, { useCallback, useEffect, useRef } from "react";
import { GripVertical } from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/shared/utils";
import { TableHead, ShadcnTableHeader, TableRow } from "./TableFrame";
import { useTable } from "../context/TableContext";
import { useMetadata } from "../context/MetadataContext";
import { Checkbox } from "@/shared/ui/kit/checkbox";
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
        "group/col font-semibold sticky top-0 z-20 whitespace-nowrap overflow-visible",
        "border-b border-primary-foreground/15 bg-primary text-primary-foreground hover:bg-primary/95 text-left",
        "transition-all duration-200",
        density === "compact"
          ? "h-8 p-0 text-[11px] tracking-normal"
          : density === "spacious"
            ? "h-12 p-0 text-sm"
            : "h-10 p-0 text-xs tracking-normal",
        isDragging && "opacity-75 z-30 ring-1 ring-white shadow-sm bg-primary text-primary-foreground",
        isActions && "bg-primary font-semibold text-xs tracking-wider",
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
              "h-full px-2 border-r border-primary-foreground/10",
              "text-primary-foreground/35 hover:text-white hover:bg-primary-foreground/5",
              "cursor-grab active:cursor-grabbing transition-all",
              "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
            )}
            {...attributes}
            {...listeners}
            onClick={(event) => event.stopPropagation()}
          >
            <GripVertical className="size-3" />
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
            "absolute right-0 top-[20%] z-40 h-[60%] w-0.75",
            "cursor-col-resize touch-none select-none ",
            "bg-primary/0 opacity-0 transition-all",
            "group-hover/col:bg-primary/30 group-hover/col:opacity-100",
            "hover:bg-primary/60! active:bg-primary!",
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
          f && resolveColumnVisibility(columnVisibility, [f.name, f.fieldName]),
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

  return (
    <ShadcnTableHeader className="bg-transparent group/header">
      <TableRow className="border-0 hover:bg-transparent transition-none">
        {enableSelection ? (
          <TableHead
            className={cn(
              "w-12.5 table-first-column sticky top-0 z-20 overflow-visible",
              "border-b border-primary-foreground/15 bg-primary",
              "transition-colors duration-200",
              density === "compact"
                ? "py-0 px-2 h-8"
                : density === "spacious"
                  ? "py-0 px-3.5 h-12"
                  : "py-0 px-3 h-10",
            )}
          >
            <div className="flex items-center justify-center h-full">
              <Checkbox
                checked={
                  allSelected || (someSelected ? "indeterminate" : false)
                }
                onCheckedChange={toggleSelectAll}
                aria-label="Tout sélectionner"
                className="size-4 transition-all data-[state=checked]:bg-white data-[state=checked]:text-primary border-primary-foreground/45 data-[state=checked]:border-white"
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
                onResizePointerDown={(event) =>
                  startColumnResize(columnId, event)
                }
                widthStyle={getColumnWidthStyle(columnWidths, columnId)}
                density={density}
                className="p-0 m-0"
              >
                <div className="flex h-full w-full items-stretch self-stretch">
                  <div className="min-w-0 flex-1 h-full">
                    <TableColumnMenu
                      columnId={field.id}
                      title={field.title}
                      disabled={disableSorting}
                      fullWidthTrigger
                      variant="primary"
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
              onResizePointerDown={(event) =>
                startColumnResize(field.name, event)
              }
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
                    variant="primary"
                  />
                </div>
                <ColumnFilter columnId={field.name} field={field} hideTrigger />
              </div>
            </DraggableHead>
          );
        })}
        {/* Actions Column Header */}
        <DraggableHead
          id="actions"
          draggable={false}
          className="w-35 text-right sticky right-0 z-30 table-last-column bg-primary text-primary-foreground border-b border-primary-foreground/15"
          density={density}
          isActions
        >
          <div className="flex w-full items-center justify-end pr-4 gap-1.5 h-full">
            <span className="block text-[9px] font-semibold uppercase tracking-widest text-primary-foreground/70">
              {actionsLabel ?? ""}
            </span>
          </div>
        </DraggableHead>
      </TableRow>
    </ShadcnTableHeader>
  );
}
