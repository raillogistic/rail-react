import React, { useMemo } from "react";
import {
  ArrowDownAZ,
  ArrowUpAZ,
  Check,
  EyeOff,
  Layers,
  MoreVertical,
  X,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/lib/components/ui/dropdown-menu";
import { Button } from "@/lib/components/ui/button";
import { useTable } from "../context/TableContext";
import { FieldSchema } from "../types";
import { cn } from "@/lib/utils";

interface TableColumnMenuProps {
  columnId: string;
  title: React.ReactNode;
  field?: FieldSchema;
  disabled?: boolean;
}

export function TableColumnMenu({
  columnId,
  title,
  field,
  disabled,
}: TableColumnMenuProps) {
  const {
    advancedFilters,
    filterVariables,
    setAdvancedFilters,
    columnVisibility,
    setColumnVisibility,
    groupingField,
    setGroupingField,
    setGroupCollapsed,
  } = useTable();

  // Sort logic
  const normalizeSortKey = (value: string) => {
    return value.replace(/^-/, "").replace(/\./g, "__");
  };

  const sortKey = field?.name || columnId;
  const normalizedKey = normalizeSortKey(sortKey);
  
  const currentSort = useMemo(() => {
    const entry = advancedFilters.orderBy.find(
      (e) => normalizeSortKey(e) === normalizedKey
    );
    if (!entry) return null;
    return entry.startsWith("-") ? "desc" : "asc";
  }, [advancedFilters.orderBy, normalizedKey]);

  const handleSort = (direction: "asc" | "desc" | null) => {
    let nextOrderBy = advancedFilters.orderBy.filter(
      (e) => normalizeSortKey(e) !== normalizedKey
    );

    if (direction) {
      const prefix = direction === "desc" ? "-" : "";
      nextOrderBy = [`${prefix}${sortKey}`, ...nextOrderBy]; // Add to front for primary sort
    }

    setAdvancedFilters(
      { ...advancedFilters, orderBy: nextOrderBy },
      { ...(filterVariables ?? {}), orderBy: nextOrderBy.length ? nextOrderBy : undefined }
    );
  };

  // Group logic
  const isGrouped = groupingField === (field?.fieldName || field?.name);
  const canGroup = field && !["DateField", "DateTimeField", "TextField"].includes(field.fieldType);

  const handleGroup = () => {
    const key = field?.fieldName || field?.name;
    if (!key) return;
    
    if (isGrouped) {
      setGroupingField(null);
      setGroupCollapsed({});
    } else {
      setGroupingField(key);
      setGroupCollapsed({});
    }
  };

  // Hide logic
  const handleHide = () => {
    setColumnVisibility({
      ...columnVisibility,
      [columnId]: false,
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild disabled={disabled}>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "h-8 data-[state=open]:bg-accent data-[state=open]:text-accent-foreground ml-1 px-1.5",
             currentSort ? "text-primary" : "text-muted-foreground/50 hover:text-foreground"
          )}
        >
          {currentSort === "asc" && <ArrowUpAZ className="h-3.5 w-3.5" />}
          {currentSort === "desc" && <ArrowDownAZ className="h-3.5 w-3.5" />}
          {!currentSort && <MoreVertical className="h-3.5 w-3.5" />}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48">
        <div className="px-2 py-1.5 text-xs font-semibold text-foreground/70">
          {typeof title === "string" ? title : "Options de colonne"}
        </div>
        <DropdownMenuSeparator />
        
        {/* Sorting */}
        <DropdownMenuItem onClick={() => handleSort("asc")}>
          <ArrowUpAZ className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
          <span>Trier croissant</span>
          {currentSort === "asc" && <Check className="ml-auto h-3.5 w-3.5" />}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleSort("desc")}>
          <ArrowDownAZ className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
          <span>Trier decroissant</span>
          {currentSort === "desc" && <Check className="ml-auto h-3.5 w-3.5" />}
        </DropdownMenuItem>
        {currentSort && (
          <DropdownMenuItem onClick={() => handleSort(null)}>
            <X className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
            <span>Effacer le tri</span>
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator />

        {/* Grouping */}
        {canGroup && (
          <DropdownMenuItem onClick={handleGroup}>
            <Layers className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
            <span>{isGrouped ? "Degrouper" : "Grouper par cette colonne"}</span>
            {isGrouped && <Check className="ml-auto h-3.5 w-3.5" />}
          </DropdownMenuItem>
        )}

        {/* Visibility */}
        <DropdownMenuItem onClick={handleHide}>
          <EyeOff className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
          <span>Masquer la colonne</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
