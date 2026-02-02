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

interface DraggableHeadProps {
  id: string;
  children: React.ReactNode;
  className?: string;
  isSortable?: boolean;
  sortDirection?: "asc" | "desc" | false;
  onSort?: () => void;
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
          aria-label="Reorder column"
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

export function TableHeader() {
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

  if (!metadata) return null;

  // Determine visible columns in order
  const visibleColumns = columnOrder
    .map((colId) => metadata.fields.find((f) => f.name === colId))
    .filter((f) => f && columnVisibility[f.name]);

  const handleSort = (field: string) => {
    // Toggle sort: none -> asc -> desc -> none (or just asc/desc toggle)
    // Simple implementation: toggle existing or set new
    const current = sorting.find((s) => s.id === field);
    if (!current) {
      setSorting([{ id: field, desc: false }]); // Default asc
    } else if (!current.desc) {
      setSorting([{ id: field, desc: true }]); // Asc -> Desc
    } else {
      setSorting([]); // Desc -> Clear
    }
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
            aria-label="Select all"
          />
        </TableHead>

        {visibleColumns.map((field) => {
          if (!field) return null;
          const sort = sorting.find((s) => s.id === field.name);
          const direction = sort ? (sort.desc ? "desc" : "asc") : false;

          return (
            <DraggableHead
              key={field.name}
              id={field.name}
              isSortable={field.isIndexed} // Use isIndexed as proxy for sortability
              sortDirection={direction}
              onSort={() => handleSort(field.name)}
            >
              {field.verboseName}
            </DraggableHead>
          );
        })}

        {/* Actions Column Placeholder */}
        <TableHead className="w-[110px] sticky right-0 bg-background z-10 text-right">
          Actions
        </TableHead>
      </TableRow>
    </ShadcnTableHeader>
  );
}
