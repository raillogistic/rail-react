import React from "react";
import { ArrowUpDown, ChevronDown, ChevronUp, GripVertical } from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";
import {
  TableHead,
  ShadcnTableHeader,
  TableRow,
} from "./TableFrame";
import { useTable } from "../context/TableContext";
import { useMetadata } from "../context/MetadataContext";
import { Checkbox } from "@/lib/components/ui/checkbox";
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
}

function DraggableHead({
  id,
  children,
  className,
  draggable = true,
  ariaSort,
}: DraggableHeadProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id, disabled: !draggable });

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
      aria-sort={ariaSort}
    >
      <div className="flex items-center gap-2">
        {draggable ? (
          <button
            {...attributes}
            {...listeners}
            className="cursor-move opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-muted rounded"
            aria-label="Reordonner la colonne"
          >
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </button>
        ) : null}

        <span className="font-medium text-sm">{children}</span>
      </div>
    </TableHead>
  );
}

export function TableHeader({
  actionsLabel,
  columns,
  columnOrdering,
  disableSorting,
}: {
  actionsLabel?: string;
  columns?: BaseModelTableColumnDef[];
  columnOrdering?: BaseModelTableColumnOrderingConfig;
  disableSorting?: boolean;
}) {
  const { metadata } = useMetadata();
  const {
    columnOrder,
    columnVisibility,
    data,
    rowSelection,
    setRowSelection,
    advancedFilters,
    filterVariables,
    setAdvancedFilters,
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

  const allowDrag = columnOrdering?.draggable !== false;
  const locked = new Set(columnOrdering?.locked ?? []);
  const sortingDisabled = disableSorting === true;
  const orderBy = advancedFilters?.orderBy ?? [];
  const distinctOn = advancedFilters?.distinctOn ?? [];

  const normalizeSortKey = React.useCallback((value: string) => {
    const trimmed = value.replace(/^-/, "");
    return trimmed.replace(/\./g, "__");
  }, []);

  const sortMap = React.useMemo(() => {
    const map = new Map<string, { direction: "asc" | "desc"; index: number }>();
    orderBy.forEach((entry, index) => {
      if (!entry) return;
      const direction = entry.startsWith("-") ? "desc" : "asc";
      const key = normalizeSortKey(entry);
      if (!key) return;
      map.set(key, { direction, index });
    });
    return map;
  }, [orderBy, normalizeSortKey]);

  const ensureDistinctOrderBy = React.useCallback(
    (distinctFields: string[], nextOrderBy: string[]) => {
      if (!distinctFields.length) return nextOrderBy;
      const result: string[] = [];
      const used = new Set<string>();
      distinctFields.forEach((field) => {
        const normalized = normalizeSortKey(field);
        const existing = nextOrderBy.find(
          (entry) => normalizeSortKey(entry) === normalized,
        );
        if (existing) {
          result.push(existing);
        } else if (field) {
          result.push(normalized || field);
        }
        if (normalized) used.add(normalized);
      });
      nextOrderBy.forEach((entry) => {
        const normalized = normalizeSortKey(entry);
        if (!normalized || used.has(normalized)) return;
        result.push(entry);
        used.add(normalized);
      });
      return result;
    },
    [normalizeSortKey],
  );

  const buildNextOrderBy = React.useCallback(
    (key: string, multi: boolean) => {
      const normalizedKey = normalizeSortKey(key);
      const current = orderBy ?? [];
      const index = current.findIndex(
        (entry) => normalizeSortKey(entry) === normalizedKey,
      );
      if (index === -1) {
        return multi ? [...current, normalizedKey] : [normalizedKey];
      }
      const existing = current[index];
      const isDesc = existing.startsWith("-");
      if (!isDesc) {
        if (multi) {
          const next = [...current];
          next[index] = `-${normalizedKey}`;
          return next;
        }
        return [`-${normalizedKey}`];
      }
      if (multi) {
        const next = [...current];
        next.splice(index, 1);
        return next;
      }
      return [];
    },
    [normalizeSortKey, orderBy],
  );

  const handleSortToggle = React.useCallback(
    (key: string, event: React.MouseEvent) => {
      if (sortingDisabled) return;
      const multiSortEnabled = true;
      const multiSortOnPlainClick = true;
      const multi =
        multiSortEnabled &&
        (multiSortOnPlainClick ||
          event.shiftKey ||
          event.ctrlKey ||
          event.metaKey);
      const nextOrderByRaw = buildNextOrderBy(key, multi);
      const nextOrderBy = ensureDistinctOrderBy(distinctOn, nextOrderByRaw);
      const nextFilters = {
        ...advancedFilters,
        orderBy: nextOrderBy,
      };
      const nextVariables = {
        ...(filterVariables ?? {}),
        orderBy: nextOrderBy.length > 0 ? nextOrderBy : undefined,
      };
      setAdvancedFilters(nextFilters, nextVariables);
    },
    [
      advancedFilters,
      buildNextOrderBy,
      distinctOn,
      ensureDistinctOrderBy,
      filterVariables,
      setAdvancedFilters,
      sortingDisabled,
    ],
  );

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
            const sortKey = field.id;
            const normalizedKey = normalizeSortKey(sortKey);
            const sortState = sortMap.get(normalizedKey);
            const sortDirection = sortState?.direction;
            const ariaSort: React.AriaAttributes["aria-sort"] = sortingDisabled
              ? "none"
              : sortDirection === "asc"
                ? "ascending"
                : sortDirection === "desc"
                  ? "descending"
                  : "none";
            return (
              <DraggableHead
                key={field.id}
                id={field.id}
                draggable={allowDrag && !locked.has(field.id)}
                ariaSort={ariaSort}
              >
                {sortingDisabled ? (
                  <span className="font-medium text-sm">{field.title}</span>
                ) : (
                  <button
                    type="button"
                    className="flex items-center gap-1 text-left select-none"
                    onClick={(event) => handleSortToggle(sortKey, event)}
                    title="Click to sort"
                  >
                    <span className="font-medium text-sm">{field.title}</span>
                    <span className="inline-flex items-center gap-1">
                      {sortDirection === "asc" ? (
                        <ChevronUp className="h-3.5 w-3.5 text-primary" />
                      ) : sortDirection === "desc" ? (
                        <ChevronDown className="h-3.5 w-3.5 text-primary" />
                      ) : (
                        <ArrowUpDown className="h-3.5 w-3.5 opacity-40" />
                      )}
                      {sortState ? (
                        <span className="text-[10px] text-muted-foreground">
                          {sortState.index + 1}
                        </span>
                      ) : null}
                    </span>
                  </button>
                )}
              </DraggableHead>
            );
          }

          const sortKey = field.name;
          const normalizedKey = normalizeSortKey(sortKey);
          const sortState = sortMap.get(normalizedKey);
          const sortDirection = sortState?.direction;
          const ariaSort: React.AriaAttributes["aria-sort"] = sortingDisabled
            ? "none"
            : sortDirection === "asc"
              ? "ascending"
              : sortDirection === "desc"
                ? "descending"
                : "none";
          return (
            <DraggableHead
              key={field.name}
              id={field.name}
              draggable={allowDrag && !locked.has(field.name)}
              ariaSort={ariaSort}
            >
              {sortingDisabled ? (
                <span className="font-medium text-sm">{field.verboseName}</span>
              ) : (
                <button
                  type="button"
                  className="flex items-center gap-1 text-left select-none"
                  onClick={(event) => handleSortToggle(sortKey, event)}
                  title="Click to sort"
                >
                  <span className="font-medium text-sm">
                    {field.verboseName}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    {sortDirection === "asc" ? (
                      <ChevronUp className="h-3.5 w-3.5 text-primary" />
                    ) : sortDirection === "desc" ? (
                      <ChevronDown className="h-3.5 w-3.5 text-primary" />
                    ) : (
                      <ArrowUpDown className="h-3.5 w-3.5 opacity-40" />
                    )}
                    {sortState ? (
                      <span className="text-[10px] text-muted-foreground">
                        {sortState.index + 1}
                      </span>
                    ) : null}
                  </span>
                </button>
              )}
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
