import React from "react";
import {
  ArrowUpDown,
  ChevronDown,
  ChevronUp,
  GripVertical,
} from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";
import { TableHead, ShadcnTableHeader, TableRow } from "./TableFrame";
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
  density?: "compact" | "comfortable" | "spacious";
}

function DraggableHead({
  id,
  children,
  className,
  draggable = true,
  ariaSort,
  density = "comfortable",
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
        "border-b-2 border-border/70",
        "bg-muted/60 text-left font-semibold uppercase tracking-wider text-muted-foreground",
        "transition-colors duration-150",
        density === "compact"
          ? "text-[10px] py-1.5 px-2.5"
          : density === "spacious"
            ? "text-[11px] py-3 px-3.5"
            : "text-[10px] py-2 px-3",
        isDragging && "opacity-50 scale-[1.02] shadow-lg z-30",
        "hover:bg-muted/80 hover:text-foreground",
        className,
      )}
      aria-sort={ariaSort}
    >
      <div className="flex items-center gap-1.5">
        {draggable ? (
          <button
            {...attributes}
            {...listeners}
            className={cn(
              "mr-0.5 rounded-md p-1 opacity-0 transition-all duration-200",
              "hover:bg-background/60 hover:text-foreground",
              "group-hover/col:opacity-60",
              "focus-visible:opacity-100 focus-visible:ring-1 focus-visible:ring-primary/50",
            )}
            aria-label="Reordonner la colonne"
          >
            <GripVertical className="h-3 w-3" />
          </button>
        ) : null}

        {children}
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
    advancedFilters,
    filterVariables,
    setAdvancedFilters,
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
  const sortingDisabled = disableSorting === true;
  const orderBy = React.useMemo(
    () => advancedFilters?.orderBy ?? [],
    [advancedFilters?.orderBy],
  );
  const distinctOn = React.useMemo(
    () => advancedFilters?.distinctOn ?? [],
    [advancedFilters?.distinctOn],
  );

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

  const renderSortButton = (sortKey: string, title: string) => {
    const normalizedKey = normalizeSortKey(sortKey);
    const sortState = sortMap.get(normalizedKey);
    const sortDirection = sortState?.direction;

    if (sortingDisabled) {
      return <span className="select-none">{title}</span>;
    }

    return (
      <button
        type="button"
        className={cn(
          "group/sort flex items-center gap-1.5 text-left select-none rounded-md text-[11px] font-bold",
          "transition-all duration-200",
          "hover:text-foreground",
        )}
        onClick={(event) => handleSortToggle(sortKey, event)}
        title="Click to sort"
      >
        <span className="transition-colors">{title}</span>
        <span className="inline-flex items-center gap-0.5">
          {sortDirection === "asc" ? (
            <ChevronUp className="h-3.5 w-3.5 text-primary transition-transform duration-200" />
          ) : sortDirection === "desc" ? (
            <ChevronDown className="h-3.5 w-3.5 text-primary transition-transform duration-200" />
          ) : (
            <ArrowUpDown className="h-3 w-3 opacity-0 transition-all duration-200 group-hover/sort:opacity-40" />
          )}
          {sortState && orderBy.length > 1 ? (
            <span className="ml-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary/10 text-[13px] font-bold text-primary">
              {sortState.index + 1}
            </span>
          ) : null}
        </span>
      </button>
    );
  };

  return (
    <ShadcnTableHeader>
      <TableRow className="border-b-0 hover:bg-transparent">
        {enableSelection ? (
          <TableHead
            className={cn(
              "w-[40px] table-first-column sticky top-0 z-20",
              "border-b-2 border-border/70",
              "bg-muted/60",
              "transition-colors duration-150",
              density === "compact"
                ? "py-1.5 px-2"
                : density === "spacious"
                  ? "py-3 px-3"
                  : "py-2 px-2.5",
            )}
          >
            <div className="flex items-center justify-center">
              <Checkbox
                checked={
                  allSelected || (someSelected ? "indeterminate" : false)
                }
                onCheckedChange={toggleSelectAll}
                aria-label="Tout selectionner"
                className="transition-all duration-200 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
              />
            </div>
          </TableHead>
        ) : null}

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
                density={density}
              >
                {renderSortButton(sortKey, field.title)}
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
              density={density}
            >
              {renderSortButton(sortKey, field.verboseName)}
            </DraggableHead>
          );
        })}

        {/* Actions Column */}
        <TableHead
          className={cn(
            "w-[80px] sticky right-0 top-0 z-30 text-right",
            "border-b-2 border-border/70",
            "bg-muted/60",
            "table-last-column table-sticky-cell",
            "font-semibold uppercase tracking-wider text-muted-foreground",
            density === "compact"
              ? "text-[10px] py-1.5 px-2.5"
              : density === "spacious"
                ? "text-[11px] py-3 px-3.5"
                : "text-[10px] py-2 px-3",
          )}
        >
          <span>{actionsLabel ?? ""}</span>
        </TableHead>
      </TableRow>
    </ShadcnTableHeader>
  );
}
