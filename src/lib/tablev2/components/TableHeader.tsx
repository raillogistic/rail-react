import React from "react";
import { ArrowDown, ArrowUp, ChevronsUpDown, GripVertical } from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";
import { Button } from "@/lib/components/ui/button";
import {
  TableHead,
  ShadcnTableHeader,
  TableRow,
} from "./TableFrame";
import { useTable } from "../context/TableContext";
import { useMetadata } from "../context/MetadataContext";
import { Checkbox } from "@/lib/components/ui/checkbox";
import type { BaseModelTableColumnDef, BaseModelTableOrderingConfig } from "../types";

interface DraggableHeadProps {
  id: string;
  children: React.ReactNode;
  className?: string;
  isSortable?: boolean;
  sortDirection?: "asc" | "desc" | false;
  onSort?: (event: React.MouseEvent<HTMLButtonElement>) => void;
}

function DraggableHead({
  id,
  children,
  className,
  isSortable,
  sortDirection,
  onSort,
}: DraggableHeadProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <TableHead
      ref={setNodeRef}
      style={style}
      className={cn("relative group", className)}
    >
      <div className="flex items-center gap-2">
        <button
          {...attributes}
          {...listeners}
          className="cursor-move opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-muted rounded"
          aria-label="Reordonner la colonne"
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </button>

        {isSortable ? (
          <Button
            variant="ghost"
            size="sm"
            className="-ml-3 h-8 data-[state=open]:bg-accent"
            onClick={onSort}
          >
            {children}
            {sortDirection === "asc" ? (
              <ArrowUp className="ml-2 h-4 w-4" />
            ) : sortDirection === "desc" ? (
              <ArrowDown className="ml-2 h-4 w-4" />
            ) : (
              <ChevronsUpDown className="ml-2 h-4 w-4" />
            )}
          </Button>
        ) : (
          <span className="font-medium text-sm">{children}</span>
        )}
      </div>
    </TableHead>
  );
}

export function TableHeader({
  actionsLabel,
  columns,
  ordering,
}: {
  actionsLabel?: string;
  columns?: BaseModelTableColumnDef[];
  ordering?: BaseModelTableOrderingConfig;
}) {
  const { metadata } = useMetadata();
  const {
    sorting,
    setSorting,
    columnOrder,
    columnVisibility,
    data,
    rowSelection,
    setRowSelection,
  } = useTable();

  if (!metadata && !columns) return null;

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

  const orderingMode = ordering?.mode ?? "single";
  const orderingCycle = ordering?.cycle ?? "asc-desc-none";
  const maxLevels = ordering?.maxLevels ?? 3;
  const requireModifier = ordering?.requireModifier ?? true;
  const allow = ordering?.allow ? new Set(ordering.allow) : null;
  const map = ordering?.map ?? {};

  const resolveSortKey = (columnId: string, fallback: string) => {
    const mapped = map[columnId];
    if (typeof mapped === "string") return mapped;
    if (mapped && typeof mapped === "object" && mapped.id) return mapped.id;
    return fallback;
  };

  const isAllowedSort = (sortKey: string) => !allow || allow.has(sortKey);

  const nextSortState = (current: { id: string; desc: boolean } | undefined, sortKey: string) => {
    if (!current) return { id: sortKey, desc: false };
    if (!current.desc) return { id: sortKey, desc: true };
    if (orderingCycle === "asc-desc") return { id: sortKey, desc: false };
    return null;
  };

  const handleSort = (
    sortKey: string,
    event?: React.MouseEvent<HTMLButtonElement>,
  ) => {
    if (!isAllowedSort(sortKey)) return;
    const current = sorting.find((s) => s.id === sortKey);
    const next = nextSortState(current, sortKey);
    const allowMulti =
      orderingMode === "multi" && (!requireModifier || event?.shiftKey);

    if (!allowMulti) {
      setSorting(next ? [next] : []);
      return;
    }

    let nextSorting = sorting.filter((s) => s.id !== sortKey);
    if (next) {
      nextSorting = [...nextSorting, next];
      if (maxLevels > 0 && nextSorting.length > maxLevels) {
        nextSorting = nextSorting.slice(-maxLevels);
      }
    }
    setSorting(nextSorting);
  };

  // Selection logic
  const allSelected = data.length > 0 && Object.keys(rowSelection).length === data.length;
  const someSelected = Object.keys(rowSelection).length > 0 && !allSelected;

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
    <ShadcnTableHeader>
      <TableRow>
        {/* Selection Column */}
        <TableHead className="w-[40px]">
          <Checkbox
            checked={allSelected || (someSelected ? "indeterminate" : false)}
            onCheckedChange={toggleSelectAll}
            aria-label="Tout selectionner"
          />
        </TableHead>

        {visibleColumns.map((field) => {
          if (!field) return null;

          if ("accessor" in field) {
            const sortKey = resolveSortKey(
              field.id,
              field.sortKey ?? field.accessor,
            );
            const sortable =
              (field.sortable ?? false) && isAllowedSort(sortKey);
            const sort = sorting.find((s) => s.id === sortKey);
            const direction = sort ? (sort.desc ? "desc" : "asc") : false;

            return (
              <DraggableHead
                key={field.id}
                id={field.id}
                isSortable={sortable}
                sortDirection={direction}
                onSort={sortable ? (event) => handleSort(sortKey, event) : undefined}
              >
                {field.title}
              </DraggableHead>
            );
          }

          const sortKey = resolveSortKey(field.name, field.name);
          const sortable = field.isIndexed && isAllowedSort(sortKey);
          const sort = sorting.find((s) => s.id === sortKey);
          const direction = sort ? (sort.desc ? "desc" : "asc") : false;

          return (
            <DraggableHead
              key={field.name}
              id={field.name}
              isSortable={sortable}
              sortDirection={direction}
              onSort={sortable ? (event) => handleSort(sortKey, event) : undefined}
            >
              {field.verboseName}
            </DraggableHead>
          );
        })}

        {/* Actions Column Placeholder */}
        <TableHead className="w-[110px] sticky right-0 bg-background z-10 text-right">
          {actionsLabel ?? "Actions"}
        </TableHead>
      </TableRow>
    </ShadcnTableHeader>
  );
}
