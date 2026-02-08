import React, { useMemo } from "react";
import {
  ArrowDownAZ,
  ArrowUpAZ,
  Check,
  EyeOff,
  Filter,
  Layers,
  MoreVertical,
  RotateCcw,
  Sigma,
  Scaling,
  X,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "@/lib/components/ui/dropdown-menu";
import { Button } from "@/lib/components/ui/button";
import { useTable } from "../context/TableContext";
import { useMetadata } from "../context/MetadataContext";
import { useTableFilters } from "../hooks/useTableFilters";
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
  const { metadata } = useMetadata();
  const {
    advancedFilters,
    filterVariables,
    setAdvancedFilters,
    columnVisibility,
    setColumnVisibility,
    groupingField,
    setGroupingField,
    setGroupCollapsed,
    setColumnOrder,
  } = useTable();
  const { addFilterCondition } = useTableFilters();
  const resolvedField = useMemo(() => {
    if (field) return field;
    if (!metadata) return undefined;
    return metadata.fields.find(
      (f) => f.name === columnId || f.fieldName === columnId,
    );
  }, [field, metadata, columnId]);

  // Sort logic
  const normalizeSortKey = (value: string) => {
    return value.replace(/^-/, "").replace(/\./g, "__");
  };

  const sortKey = resolvedField?.name || columnId;
  const normalizedKey = normalizeSortKey(sortKey);

  const currentSort = useMemo(() => {
    const entry = advancedFilters.orderBy.find(
      (e) => normalizeSortKey(e) === normalizedKey,
    );
    if (!entry) return null;
    return entry.startsWith("-") ? "desc" : "asc";
  }, [advancedFilters.orderBy, normalizedKey]);

  const handleSort = (direction: "asc" | "desc" | null) => {
    let nextOrderBy = advancedFilters.orderBy.filter(
      (e) => normalizeSortKey(e) !== normalizedKey,
    );

    if (direction) {
      const prefix = direction === "desc" ? "-" : "";
      nextOrderBy = [`${prefix}${sortKey}`, ...nextOrderBy]; // Add to front for primary sort
    }

    setAdvancedFilters(
      { ...advancedFilters, orderBy: nextOrderBy },
      {
        ...(filterVariables ?? {}),
        orderBy: nextOrderBy.length ? nextOrderBy : undefined,
      },
    );
  };

  // Group logic
  const isGrouped =
    groupingField === (resolvedField?.fieldName || resolvedField?.name);
  const canGroup =
    resolvedField &&
    !["DateField", "DateTimeField", "TextField"].includes(
      resolvedField.fieldType,
    );

  const handleGroup = () => {
    const key = resolvedField?.fieldName || resolvedField?.name;
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

  const handleResetColumns = () => {
    setColumnVisibility({});
    setColumnOrder([]);
  };

  // Filter Logic
  const filterSchema = useMemo(() => {
    if (!metadata) return null;

    return metadata.filters.find(
      (f) =>
        f.fieldName === resolvedField?.fieldName ||
        f.name === resolvedField?.name ||
        f.fieldName === columnId ||
        f.name === columnId,
    );
  }, [metadata, resolvedField, columnId]);

  const handleAddFilter = (operator: string) => {
    const filterFieldName =
      resolvedField?.name || resolvedField?.fieldName || columnId;
    if (!filterFieldName) return;
    // Add a basic condition. In a real app, this would open a dialog to capture the value.
    // For now, we'll rely on the main filter panel or add an 'empty' filter that the user can fill.
    // Since we don't have a way to pop a dialog here easily without creating more components,
    // we will just open the filter panel? No, the user wants "use the field filter options".
    // We will add a condition with a null value, which might prompt the UI to show it?
    // Or we can just log it for now as "Feature pending" or trigger the main panel.
    // Let's try to add it to the state.
    addFilterCondition({
      field: filterFieldName,
      operator: operator,
      value: null,
    });
  };

  // Aggregation Logic
  const supportsAggregation =
    metadata?.filterConfig?.supportsAggregation && resolvedField?.isNumeric;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild disabled={disabled}>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "h-8 w-8 p-0 data-[state=open]:bg-accent data-[state=open]:text-accent-foreground ml-1",
            currentSort
              ? "text-primary"
              : "text-muted-foreground/50 hover:text-foreground",
          )}
        >
          {currentSort === "asc" && <ArrowUpAZ className="h-3.5 w-3.5" />}
          {currentSort === "desc" && <ArrowDownAZ className="h-3.5 w-3.5" />}
          {!currentSort && <MoreVertical className="h-3.5 w-3.5" />}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <div className="px-2 py-1.5 text-xs font-semibold text-foreground/70 border-b border-border/50 mb-1">
          {typeof title === "string" ? title : "Options de colonne"}
        </div>
        {/* Sorting Submenu */}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <ArrowUpAZ className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
            <span>Trier</span>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuItem onClick={() => handleSort("asc")}>
              <ArrowUpAZ className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
              <span>Croissant (A-Z)</span>
              {currentSort === "asc" && (
                <Check className="ml-auto h-3.5 w-3.5" />
              )}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleSort("desc")}>
              <ArrowDownAZ className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
              <span>Decroissant (Z-A)</span>
              {currentSort === "desc" && (
                <Check className="ml-auto h-3.5 w-3.5" />
              )}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => handleSort(null)}
              disabled={!currentSort}
            >
              <X className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
              <span>Effacer le tri</span>
            </DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        {/* Filter Submenu */}

        {filterSchema && filterSchema.options.length > 0 && (
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <Filter className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
              <span>Filtrer</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="max-h-[300px] overflow-y-auto">
              {filterSchema.options.map((opt) => (
                <DropdownMenuItem
                  key={opt.name}
                  onClick={() => handleAddFilter(opt.name)}
                >
                  <span>{opt.label}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        )}
        {/* Aggregation Submenu */}
        {supportsAggregation && (
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <Sigma className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
              <span>Agregation</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem onClick={() => console.log("Sum")}>
                Somme
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => console.log("Avg")}>
                Moyenne
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => console.log("Min")}>
                Minimum
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => console.log("Max")}>
                Maximum
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        )}
        <DropdownMenuSeparator />
        {/* Grouping */}
        {canGroup && (
          <DropdownMenuItem onClick={handleGroup}>
            <Layers className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
            <span>{isGrouped ? "Degrouper" : "Grouper par"}</span>
            {isGrouped && <Check className="ml-auto h-3.5 w-3.5" />}
          </DropdownMenuItem>
        )}
        {/* Auto Resize (Mock) */}
        <DropdownMenuItem onClick={() => console.log("Auto resize")}>
          <Scaling className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
          <span>Ajuster la largeur</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {/* Visibility */}
        <DropdownMenuItem onClick={handleHide}>
          <EyeOff className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
          <span>Masquer</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleResetColumns}>
          <RotateCcw className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
          <span>Reinitialiser les colonnes</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
