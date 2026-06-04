/**
 * @file TableColumnMenu.tsx
 * @description Renders the premium, highly interactive context dropdown menu for column headers.
 * Modernized with a standard casing font-semibold structure, custom padding/centering,
 * and high-contrast color variants suited for primary backgrounds.
 * Modifié pour supprimer les animations et les ombres afin d'améliorer les performances de l'interface utilisateur.
 * Ajout de la fonctionnalité de redimensionnement automatique des colonnes basée sur les données chargées.
 */
import React, { useCallback, useMemo } from "react";
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
import {
  buildAccessorPath,
  resolveValueOptimized,
} from "../utils/valueResolution";

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

/**
 * Estime la longueur textuelle d'une valeur de cellule pour l'auto-dimensionnement.
 *
 * @param value Valeur de la cellule à mesurer.
 * @param field Schéma de champ optionnel décrivant le type.
 * @returns Longueur estimée du texte en caractères.
 */
function get_cell_text_length(value: unknown, field?: FieldSchema): number {
  if (value === null || value === undefined) return 1;

  if (Array.isArray(value)) {
    if (field?.isRelation) {
      const rel_key = field.relationLookupField;
      const rendered = value
        .map((item) => {
          if (!item || typeof item !== "object") return String(item);
          const item_obj = item as Record<string, unknown>;
          if (item_obj.desc !== undefined && item_obj.desc !== null) return String(item_obj.desc);
          if (rel_key && item_obj[rel_key] !== undefined && item_obj[rel_key] !== null) {
            return String(item_obj[rel_key]);
          }
          return String(item_obj.name ?? item_obj.id ?? JSON.stringify(item));
        });
      return rendered.join(", ").length;
    }
    return JSON.stringify(value).length;
  }

  if (field?.isBoolean) {
    return 3; // "Oui" / "Non"
  }

  if (field?.isDate || field?.isDatetime) {
    if (typeof value === "string") {
      if (field.isDate) {
        const date_only = value.match(/^(\d{4}-\d{2}-\d{2})/);
        if (date_only?.[1]) return date_only[1].length;
      }
      if (field.isDatetime) {
        const date_time = value.match(/^((\d{4}-\d{2}-\d{2}))[T\s](\d{2}):(\d{2})/);
        if (date_time) {
          return `${date_time[1]} ${date_time[3]}:${date_time[4]}`.length;
        }
      }
    }
    return 16;
  }

  if (field?.choices) {
    const choice = field.choices.find((c) => c.value === value);
    return choice ? choice.label.length : String(value).length;
  }

  if (typeof value === "object") {
    const val_obj = value as Record<string, unknown>;
    if (field?.isRelation) {
      const rel_key = field.relationLookupField;
      if (val_obj.desc !== undefined && val_obj.desc !== null) {
        return String(val_obj.desc).length;
      }
      if (rel_key && val_obj[rel_key] !== undefined && val_obj[rel_key] !== null) {
        return String(val_obj[rel_key]).length;
      }
      return String(val_obj.name ?? val_obj.id ?? JSON.stringify(value)).length;
    }
    return String(val_obj.name || val_obj.id || JSON.stringify(value)).length;
  }

  return String(value).length;
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

  const {
    metadata,
    ensureCapabilitiesLoaded,
    capabilitiesLoaded,
    capabilitiesLoading,
  } = useMetadata();
  const {
    columnVisibility,
    setColumnVisibility,
    groupingField,
    setGroupingField,
    setGroupCollapsed,
    setColumnOrder,
    setColumnWidths,
    columnWidths,
    setActiveColumnFilter,
    dragModeEnabled,
    setDragModeEnabled,
    density,
    data,
  } = useTable();
  const { advancedFilters, filterVariables, setAdvancedFilters } =
    useTableFilters();
  const metadataFilters = metadata?.filters ?? [];
  const columnRoot = useMemo(() => {
    const [root] = columnId.replace(/__/g, ".").split(".").filter(Boolean);
    return root || columnId;
  }, [columnId]);

  const resolvedField = useMemo(() => {
    if (field) return field;
    if (!metadata) return undefined;
    return metadata.fields.find(
      (f) =>
        f.name === columnId ||
        f.fieldName === columnId ||
        f.name === columnRoot ||
        f.fieldName === columnRoot,
    );
  }, [field, metadata, columnId, columnRoot]);

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

  /**
   * Calcule et applique automatiquement la largeur optimale pour la colonne courante.
   */
  const handle_auto_resize = () => {
    const path = buildAccessorPath(columnId.replace(/__/g, "."));
    let max_len = triggerTitle.length;

    if (data && data.length > 0) {
      data.forEach((row) => {
        const val = resolveValueOptimized(row, path);
        const len = get_cell_text_length(val, resolvedField);
        if (len > max_len) {
          max_len = len;
        }
      });
    }

    const estimated_width = Math.max(
      120,
      Math.min(
        500,
        Math.ceil(max_len * 7.8) + 40
      )
    );

    const new_widths = {
      ...columnWidths,
      [columnId]: estimated_width,
    };

    setColumnWidths(new_widths);
  };

  const filterSchema = useMemo(() => {
    if (!metadata) return null;
    const candidates = new Set<string>([
      columnId,
      columnId.replace(/\./g, "__"),
      columnId.replace(/__/g, "."),
      columnRoot,
      columnRoot.replace(/\./g, "__"),
      columnRoot.replace(/__/g, "."),
    ]);
    if (resolvedField?.name) {
      candidates.add(resolvedField.name);
      candidates.add(resolvedField.name.replace(/\./g, "__"));
      candidates.add(resolvedField.name.replace(/__/g, "."));
    }
    if (resolvedField?.fieldName) {
      candidates.add(resolvedField.fieldName);
      candidates.add(resolvedField.fieldName.replace(/\./g, "__"));
      candidates.add(resolvedField.fieldName.replace(/__/g, "."));
    }

    return metadataFilters.find(
      (f) => candidates.has(f.fieldName) || candidates.has(f.name),
    );
  }, [metadata, metadataFilters, resolvedField, columnId, columnRoot]);

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

  const handleMenuOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen) return;
      if (capabilitiesLoaded || capabilitiesLoading) return;
      void ensureCapabilitiesLoaded();
    },
    [capabilitiesLoaded, capabilitiesLoading, ensureCapabilitiesLoaded],
  );

  return (
    <>
      <DropdownMenu onOpenChange={handleMenuOpenChange}>
        <DropdownMenuTrigger asChild disabled={disabled}>
          {fullWidthTrigger ? (
            <button
               type="button"
               className={cn(
                 "flex h-full w-full items-center justify-between outline-none border-none bg-transparent text-left",
                  density === "compact"
                    ? "px-1.5 py-0 gap-1 text-[11px]"
                    : density === "spacious"
                      ? "px-3.5 py-0 gap-2 text-sm"
                      : "px-2.5 py-0 gap-1.5 text-xs",
                  "font-semibold uppercase tracking-wider",
                 "group/trigger",
                 variant === "primary"
                   ? currentSort
                     ? "text-white bg-primary-foreground/15 font-bold"
                     : "text-primary-foreground/90 hover:text-white hover:bg-primary-foreground/10 data-[state=open]:bg-primary-foreground/15 data-[state=open]:text-white"
                   : currentSort
                     ? "bg-primary/[0.03] text-primary"
                     : "text-neutral-600 hover:text-foreground dark:text-neutral-300 hover:bg-neutral-100/50 dark:hover:bg-zinc-900/30 data-[state=open]:bg-neutral-100/80 dark:data-[state=open]:bg-zinc-900/50 data-[state=open]:text-foreground",
               )}
             >
               <div className="flex items-center gap-2 min-w-0 flex-1" title={triggerTitle}>
                 <span className="truncate text-left">{title}</span>
                 {/* Sort Indicator Pill */}
                 {currentSort && (
                   <div
                     className={cn(
                       "flex shrink-0 items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-semibold",
                       variant === "primary"
                         ? "bg-primary-foreground/25 text-white border border-white/20"
                         : "bg-primary/10 text-primary border border-primary/20"
                     )}
                     aria-hidden
                   >
                     {currentSort === "asc" ? (
                       <>
                         <ArrowUpAZ className="size-2.5" />
                         <span>Croissant</span>
                       </>
                     ) : (
                       <>
                         <ArrowDownAZ className="size-2.5" />
                         <span>Décroissant</span>
                       </>
                     )}
                   </div>
                 )}
               </div>
 
               {!currentSort && (
                 <MoreVertical className="size-3 shrink-0 opacity-0 group-hover/trigger:opacity-40" />
               )}
             </button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "h-8 w-8 p-0 ml-1 border-none",
                variant === "primary"
                  ? "text-primary-foreground/80 hover:text-white hover:bg-primary-foreground/10 data-[state=open]:bg-primary-foreground/15 data-[state=open]:text-white"
                  : "text-neutral-600 dark:text-neutral-300 hover:text-foreground data-[state=open]:bg-accent data-[state=open]:text-accent-foreground",
                currentSort &&
                  (variant === "primary"
                    ? "text-white"
                    : "text-primary"),
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
          className="w-60 border-border/30 p-1.5 bg-background/95"
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

          <DropdownMenuItem onClick={handle_auto_resize}>
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
