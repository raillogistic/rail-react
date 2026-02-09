import React, { useMemo } from "react";
import {
  ArrowDownAZ,
  ArrowUpAZ,
  Check,
  EyeOff,
  Filter,
  GripVertical,
  Layers,
  MoreVertical,
  RotateCcw,
  Scaling,
  X,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/lib/components/ui/dropdown-menu";
import { Button } from "@/lib/components/ui/button";
import { useTable } from "../context/TableContext";
import { useMetadata } from "../context/MetadataContext";
import type { FieldSchema } from "../types";
import { cn } from "@/lib/utils";
import { getSyntheticRelationCountSource } from "../utils";
import { RelationFilterDialog } from "./column-menu";

interface TableColumnMenuProps {
  columnId: string;
  title: React.ReactNode;
  field?: FieldSchema;
  disabled?: boolean;
  fullWidthTrigger?: boolean;
}

export function TableColumnMenu({
  columnId,
  title,
  field,
  disabled,
  fullWidthTrigger = false,
}: TableColumnMenuProps) {
  const triggerTitle = typeof title === "string" ? title : "Options de colonne";

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
    setActiveColumnFilter,
    dragModeEnabled,
    setDragModeEnabled,
  } = useTable();
  const metadataFilters = metadata?.filters ?? [];

  const resolvedField = useMemo(() => {
    if (field) return field;
    if (!metadata) return undefined;
    return metadata.fields.find(
      (f) => f.name === columnId || f.fieldName === columnId,
    );
  }, [field, metadata, columnId]);

  const normalizeSortKey = (value: string) => value.replace(/^-/, "").replace(/\./g, "__");
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
      nextOrderBy = [`${prefix}${sortKey}`, ...nextOrderBy];
    }

    setAdvancedFilters(
      { ...advancedFilters, orderBy: nextOrderBy },
      {
        ...(filterVariables ?? {}),
        orderBy: nextOrderBy.length ? nextOrderBy : undefined,
      },
    );
  };

  const isGrouped = groupingField === (resolvedField?.fieldName || resolvedField?.name);
  const canGroup =
    resolvedField &&
    !["DateField", "DateTimeField", "TextField"].includes(resolvedField.fieldType);

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

  const handleToggleDragMode = () => {
    setDragModeEnabled(!dragModeEnabled);
  };

  const filterSchema = useMemo(() => {
    if (!metadata) return null;

    return metadataFilters.find(
      (f) =>
        f.fieldName === resolvedField?.fieldName ||
        f.name === resolvedField?.name ||
        f.fieldName === columnId ||
        f.name === columnId,
    );
  }, [metadata, metadataFilters, resolvedField, columnId]);

  const handleOpenFilter = () => {
    setActiveColumnFilter(columnId);
  };

  const relationSource = useMemo(() => {
    if (!resolvedField) return null;
    if (resolvedField.isRelation) return resolvedField.name || resolvedField.fieldName;
    return getSyntheticRelationCountSource(resolvedField) ?? null;
  }, [resolvedField]);

  const relationSchema = useMemo(() => {
    if (!metadata?.relationships) return undefined;
    const source = relationSource || columnId;
    return metadata.relationships.find(
      (relation) =>
        relation.name === source ||
        relation.fieldName === source ||
        relation.name === columnId ||
        relation.fieldName === columnId,
    );
  }, [metadata?.relationships, relationSource, columnId]);

  const relationType = (relationSchema?.relationType || "").toUpperCase();
  const supportsRelationFunctions =
    relationType === "MANY_TO_MANY" || relationType === "REVERSE_FK";

  const relationBaseName = relationSchema?.name || relationSchema?.fieldName;
  const relationFunctionKeys = useMemo(() => {
    if (!relationBaseName) return null;
    return {
      some: `${relationBaseName}Some`,
      none: `${relationBaseName}None`,
      every: `${relationBaseName}Every`,
      count: `${relationBaseName}Count`,
      agg: `${relationBaseName}Agg`,
    } as const;
  }, [relationBaseName]);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild disabled={disabled}>
          {fullWidthTrigger ? (
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "h-full w-full min-h-0 m-0 self-stretch rounded-none justify-between px-0 py-0 data-[state=open]:bg-accent data-[state=open]:text-accent-foreground",
                "font-medium",
                currentSort
                  ? "text-primary"
                  : "text-foreground hover:text-foreground",
              )}
            >
              <span className="truncate text-left px-2">{triggerTitle}</span>
              {currentSort && (
                <span className="px-2 text-xs font-semibold" aria-hidden="true">
                  {currentSort === "asc" ? "^" : "v"}
                </span>
              )}
            </Button>
          ) : (
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
          )}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          <div className="px-2 py-1.5 text-xs font-semibold text-foreground/70 border-b border-border/50 mb-1">
            {triggerTitle}
          </div>

          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <ArrowUpAZ className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
              <span>Trier</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem onClick={() => handleSort("asc")}>
                <ArrowUpAZ className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                <span>Croissant (A-Z)</span>
                {currentSort === "asc" && <Check className="ml-auto h-3.5 w-3.5" />}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSort("desc")}>
                <ArrowDownAZ className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                <span>Decroissant (Z-A)</span>
                {currentSort === "desc" && <Check className="ml-auto h-3.5 w-3.5" />}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleSort(null)} disabled={!currentSort}>
                <X className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                <span>Effacer le tri</span>
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>

          {filterSchema && filterSchema.options.length > 0 && (
            <DropdownMenuItem onClick={handleOpenFilter}>
              <Filter className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
              <span>Filtrer</span>
            </DropdownMenuItem>
          )}

          {supportsRelationFunctions && relationFunctionKeys && relationBaseName && (
            <RelationFilterDialog
              columnId={columnId}
              metadataFilters={metadataFilters}
              relationBaseName={relationBaseName}
              relationFunctionKeys={relationFunctionKeys}
              filterVariables={filterVariables}
              advancedFilters={advancedFilters}
              setAdvancedFilters={setAdvancedFilters}
            />
          )}

          <DropdownMenuSeparator />

          <DropdownMenuItem onClick={handleToggleDragMode}>
            <GripVertical className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
            <span>
              {dragModeEnabled
                ? "Desactiver glisser-deposer"
                : "Activer glisser-deposer"}
            </span>
            {dragModeEnabled && <Check className="ml-auto h-3.5 w-3.5" />}
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          {canGroup && (
            <DropdownMenuItem onClick={handleGroup}>
              <Layers className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
              <span>{isGrouped ? "Degrouper" : "Grouper par"}</span>
              {isGrouped && <Check className="ml-auto h-3.5 w-3.5" />}
            </DropdownMenuItem>
          )}

          <DropdownMenuItem onClick={() => console.log("Auto resize")}>
            <Scaling className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
            <span>Ajuster la largeur</span>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

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
    </>
  );
}
