import React from "react";
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
import type {
  BaseModelTableColumnDef,
  BaseModelTableColumnOrderingConfig,
} from "../types";

interface DraggableHeadProps {
  id: string;
  children: React.ReactNode;
  className?: string;
  draggable?: boolean;
  ariaSort?: React.AriaAttributes["aria-sort"];
  density?: "compact" | "comfortable" | "spacious";
  isActions?: boolean;
}

function DraggableHead({
  id,
  children,
  className,
  draggable = true,
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
  };

  return (
    <TableHead
      ref={setNodeRef}
      style={style}
      className={cn(
        "group/col sticky top-0 z-20 whitespace-nowrap",
        "border-b border-border",
        "bg-background/95 backdrop-blur-sm text-left font-semibold text-muted-foreground",
        "transition-colors duration-150",
        // Colored accent line on top
        "before:absolute before:left-0 before:top-0 before:h-[2px] before:w-full before:bg-primary/0 before:transition-colors hover:before:bg-primary",
        density === "compact"
          ? "h-8 p-0 text-xs"
          : density === "spacious"
            ? "h-12 p-0 text-sm"
            : "h-10 p-0 text-sm",
        isDragging && "opacity-50 scale-[1.02] shadow-lg z-30 ring-1 ring-primary/20",
        "hover:bg-muted/60 hover:text-foreground",
        isActions && "bg-muted/60 backdrop-blur-sm",
        className,
      )}
      aria-sort={ariaSort}
    >
      <div
        className={cn(
          "flex items-stretch justify-between gap-0 h-full",
        )}
      >
        <div className="flex items-stretch gap-0 flex-1 min-w-0 h-full">
          {children}
        </div>
        {draggable ? (
          <button
            type="button"
            aria-label="Reordonner la colonne"
            className={cn(
              "h-full px-2 border-l border-border/60",
              "text-muted-foreground hover:text-foreground hover:bg-accent/60",
              "cursor-grab active:cursor-grabbing",
              "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/50",
            )}
            {...attributes}
            {...listeners}
            onClick={(event) => event.stopPropagation()}
          >
            <GripVertical className="h-3.5 w-3.5" />
          </button>
        ) : null}
      </div>
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
    data,
    rowSelection,
    setRowSelection,
    density,
    dragModeEnabled,
  } = useTable();

  // Determine visible columns in order
  const visibleColumns = (() => {
    if (columns && columns.length > 0) {
      const byId = new Map(columns.map((column) => [column.id, column]));
      const orderedIds =
        columnOrder.length > 0 ? columnOrder : columns.map((c) => c.id);
      return orderedIds
        .map((id) => byId.get(id))
        .filter((column): column is BaseModelTableColumnDef => !!column)
        .filter((column) => columnVisibility[column.id] ?? true);
    }

    if (!metadata) return [];
    return columnOrder
      .map((colId) => metadata.fields.find((f) => f.name === colId))
      .filter((f) => f && columnVisibility[f.name]);
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
    <ShadcnTableHeader className="bg-muted/40">
      <TableRow className="border-b-0 hover:bg-transparent">
        {enableSelection ? (
          <TableHead
            className={cn(
              "w-[40px] table-first-column sticky top-0 z-20",
              "border-b border-border bg-background/95 backdrop-blur-sm",
              "transition-colors duration-150",
              density === "compact"
                ? "py-0 px-2 h-8"
                : density === "spacious"
                  ? "py-0 px-3 h-12"
                  : "py-0 px-2.5 h-10",
            )}
          >
            <div className="flex items-center justify-center h-full">
              <Checkbox
                checked={
                  allSelected || (someSelected ? "indeterminate" : false)
                }
                onCheckedChange={toggleSelectAll}
                aria-label="Tout sélectionner"
                className="transition-all duration-200 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
              />
            </div>
          </TableHead>
        ) : null}

        {visibleColumns.map((field) => {
          if (!field) return null;

          if ("accessor" in field) {
             // Custom column def
            return (
              <DraggableHead
                key={field.id}
                id={field.id}
                draggable={allowDrag && dragModeEnabled && !locked.has(field.id)}
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
                draggable={allowDrag && dragModeEnabled && !locked.has(field.name)}
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
          className="w-[60px] text-right sticky right-0 z-30 table-last-column"
          density={density}
          isActions
        >
          <span className="block w-full pr-2">{actionsLabel ?? ""}</span>
        </DraggableHead>
      </TableRow>
    </ShadcnTableHeader>
  );
}
