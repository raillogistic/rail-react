import React, { useMemo } from "react";
import {
  ArrowDownAZ,
  ArrowUpAZ,
  Check,
  ClipboardList,
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
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/shared/ui/kit/dropdown-menu";
import { Button } from "@/shared/ui/kit/button";
import { useTable } from "../context/TableContext";
import { useMetadata } from "../context/MetadataContext";
import { useTableFilters } from "../hooks/useTableFilters";
import type { FieldSchema } from "../types";
import { cn } from "@/shared/utils";
import { getSyntheticRelationCountSource } from "../utils";
import { RelationFilterDialog } from "./column-menu";

interface TableColumnMenuProps {
  columnId: string;
  title: React.ReactNode;
  field?: FieldSchema;
  disabled?: boolean;
  fullWidthTrigger?: boolean;
  variant?: "default" | "primary";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function TableColumnMenu({
  columnId,
  title,
  field,
  disabled,
  fullWidthTrigger = false,
  variant = "default",
}: TableColumnMenuProps) {
  const triggerTitle = typeof title === "string" ? title : "Options de colonne";

  const { metadata } = useMetadata();
  const {
    columnVisibility,
    setColumnVisibility,
    groupingField,
    setGroupingField,
    setGroupCollapsed,
    setColumnOrder,
    setColumnWidths,
    setActiveColumnFilter,
    dragModeEnabled,
    setDragModeEnabled,
  } = useTable();
  const { advancedFilters, filterVariables, setAdvancedFilters } =
    useTableFilters();
  const metadataFilters = metadata?.filters ?? [];

  const resolvedField = useMemo(() => {
    if (field) return field;
    if (!metadata) return undefined;
    return metadata.fields.find(
      (f) => f.name === columnId || f.fieldName === columnId,
    );
  }, [field, metadata, columnId]);

  const normalizeSortKey = (value: string) =>
    value.replace(/^-/, "").replace(/\./g, "__");
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

    const nextVariables = isRecord(filterVariables)
      ? { ...filterVariables }
      : {};
    if (nextOrderBy.length > 0) {
      nextVariables.orderBy = nextOrderBy;
    } else {
      delete nextVariables.orderBy;
    }

    setAdvancedFilters(
      { ...advancedFilters, orderBy: nextOrderBy },
      nextVariables,
    );
  };

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

  const handleHide = () => {
    setColumnVisibility({
      ...columnVisibility,
      [columnId]: false,
    });
  };

  const handleResetColumns = () => {
    setColumnVisibility({});
    setColumnOrder([]);
    setColumnWidths({});
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
    if (resolvedField.isRelation)
      return resolvedField.name || resolvedField.fieldName;
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
            <button
              type="button"
              className={cn(
                "flex h-full w-full items-center justify-between gap-2 px-3 py-0 outline-none",
                "text-[10px] font-bold uppercase tracking-widest transition-all duration-300",
                "group/trigger",
                variant === "primary"
                  ? currentSort
                    ? "text-white font-black"
                    : "text-primary-foreground/80 hover:text-white hover:bg-white/5 data-[state=open]:bg-white/10 data-[state=open]:text-white"
                  : currentSort
                    ? "bg-primary/[0.03] text-primary"
                    : "text-muted-foreground/70 hover:text-foreground hover:bg-primary/5 active:bg-primary/8 data-[state=open]:bg-primary/5 data-[state=open]:text-primary",
              )}
            >
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <span className="truncate text-left">{triggerTitle}</span>

                {/* Sort Indicator */}
                <div className="flex shrink-0 items-center gap-1" aria-hidden>
                  {currentSort === "asc" ? (
                    <ArrowUpAZ className="size-3 animate-in fade-in zoom-in-75 duration-300" />
                  ) : currentSort === "desc" ? (
                    <ArrowDownAZ className="size-3 animate-in fade-in zoom-in-75 duration-300" />
                  ) : null}
                </div>
              </div>

              {!currentSort && (
                <MoreVertical className="size-3 shrink-0 opacity-0 group-hover/trigger:opacity-40 transition-opacity" />
              )}
            </button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "h-8 w-8 p-0 ml-1 transition-all duration-200 rounded-lg",
                variant === "primary"
                  ? "text-primary-foreground/60 hover:text-white hover:bg-white/10 data-[state=open]:bg-white/20 data-[state=open]:text-white"
                  : "text-muted-foreground/50 hover:text-foreground data-[state=open]:bg-accent data-[state=open]:text-accent-foreground",
                currentSort &&
                  (variant === "primary"
                    ? "text-white scale-110"
                    : "text-primary scale-110"),
              )}
            >
              {currentSort === "asc" && <ArrowUpAZ className="h-3.5 w-3.5" />}
              {currentSort === "desc" && (
                <ArrowDownAZ className="h-3.5 w-3.5" />
              )}
              {!currentSort && <MoreVertical className="h-3.5 w-3.5" />}
            </Button>
          )}
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="start"
          className="w-60 rounded-xl border-border/30 p-1.5 shadow-xl backdrop-blur-xl bg-background/95"
        >
          <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50 border-b border-border/20 mb-1 flex items-center gap-2">
            <ClipboardList className="size-3 text-muted-foreground/40" />
            {triggerTitle}
          </div>

          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <ArrowUpAZ className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
              <span>Trier</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuPortal>
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
                  <span>Décroissant (Z-A)</span>
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
            </DropdownMenuPortal>
          </DropdownMenuSub>

          {filterSchema && filterSchema.options.length > 0 && (
            <DropdownMenuItem onClick={handleOpenFilter}>
              <Filter className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
              <span>Filtrer</span>
            </DropdownMenuItem>
          )}

          {supportsRelationFunctions &&
            relationFunctionKeys &&
            relationBaseName && (
              <RelationFilterDialog
                columnId={columnId}
                metadataFilters={metadataFilters}
                relationBaseName={relationBaseName}
                relationFunctionKeys={relationFunctionKeys}
                advancedFilters={advancedFilters}
                setAdvancedFilters={setAdvancedFilters}
              />
            )}

          <DropdownMenuSeparator />

          <DropdownMenuItem onClick={handleToggleDragMode}>
            <GripVertical className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
            <span>
              {dragModeEnabled
                ? "Désactiver le glisser-déposer"
                : "Activer le glisser-déposer"}
            </span>
            {dragModeEnabled && <Check className="ml-auto h-3.5 w-3.5" />}
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          {canGroup && (
            <DropdownMenuItem onClick={handleGroup}>
              <Layers className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
              <span>{isGrouped ? "Dégrouper" : "Grouper par"}</span>
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
            <span>Réinitialiser les colonnes</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
