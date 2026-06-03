/**
 * @file TableHeader.tsx
 * @description Composant d'en-tête de table historique.
 * Modifié pour inclure le bouton de configuration de la table dans l'en-tête de la colonne Actions.
 */
import React, { useCallback, useEffect, useRef, useState, useMemo } from "react";
import {
  GripVertical,
  SlidersHorizontal,
  Columns3,
  Search,
  Layers,
  LayoutGrid,
  Check,
  Eye,
  EyeOff,
  RotateCcw,
} from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/shared/utils";
import { TableHead, ShadcnTableHeader, TableRow } from "./TableFrame";
import { useTable } from "../context/TableContext";
import { useMetadata } from "../context/MetadataContext";
import { Checkbox } from "@/shared/ui/kit/checkbox";
import { TableColumnMenu } from "./TableColumnMenu";
import { ColumnFilter } from "./ColumnFilter";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuCheckboxItem,
} from "@/shared/ui/kit/dropdown-menu";
import { Button } from "@/shared/ui/kit/button";
import { Input } from "@/shared/ui/kit/input";
import { Switch } from "@/shared/ui/kit/switch";
import { resolveColumnVisibility, getDefaultHiddenColumnIds, resolveGroupingKey } from "../utils";
import {
  clampColumnWidth,
  getColumnWidthStyle,
  MIN_COLUMN_WIDTH_PX,
} from "../utils/columnSizing";
import type {
  BaseModelTableColumnDef,
  BaseModelTableColumnOrderingConfig,
} from "../types";

type ResizePointerHandler = (event: React.PointerEvent<HTMLDivElement>) => void;

interface DraggableHeadProps {
  id: string;
  children: React.ReactNode;
  className?: string;
  draggable?: boolean;
  resizable?: boolean;
  onResizePointerDown?: ResizePointerHandler;
  widthStyle?: React.CSSProperties;
  ariaSort?: React.AriaAttributes["aria-sort"];
  density?: "compact" | "comfortable" | "spacious";
  isActions?: boolean;
}

function DraggableHead({
  id,
  children,
  className,
  draggable = true,
  resizable = false,
  onResizePointerDown,
  widthStyle,
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
    ...widthStyle,
  };

  return (
    <TableHead
      ref={setNodeRef}
      style={style}
      className={cn(
        "group/col font-semibold sticky top-0 z-20 whitespace-nowrap overflow-visible",
        "border-b border-primary-foreground/15 bg-primary text-primary-foreground hover:bg-primary/95 text-left",
        "transition-all duration-200",
        density === "compact"
          ? "h-8 p-0 text-[11px] tracking-normal"
          : density === "spacious"
            ? "h-12 p-0 text-sm"
            : "h-10 p-0 text-xs tracking-normal",
        isDragging && "opacity-75 z-30 ring-1 ring-white shadow-sm bg-primary text-primary-foreground",
        isActions && "bg-primary font-semibold text-xs tracking-wider",
        className,
      )}
      aria-sort={ariaSort}
    >
      <div className="flex items-stretch gap-0 h-full w-full">
        {draggable ? (
          <button
            type="button"
            aria-label="Reordonner la colonne"
            className={cn(
              "h-full px-2 border-r border-primary-foreground/10",
              "text-primary-foreground/35 hover:text-white hover:bg-primary-foreground/5",
              "cursor-grab active:cursor-grabbing transition-all",
              "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
            )}
            {...attributes}
            {...listeners}
            onClick={(event) => event.stopPropagation()}
          >
            <GripVertical className="size-3" />
          </button>
        ) : null}
        <div className="flex items-stretch gap-0 flex-1 min-w-0 h-full group/title">
          {children}
        </div>
      </div>
      {resizable && onResizePointerDown ? (
        <div
          role="separator"
          aria-orientation="vertical"
          aria-label="Redimensionner la colonne"
          className={cn(
            "absolute right-0 top-[20%] z-40 h-[60%] w-0.75",
            "cursor-col-resize touch-none select-none ",
            "bg-primary/0 opacity-0 transition-all",
            "group-hover/col:bg-primary/30 group-hover/col:opacity-100",
            "hover:bg-primary/60! active:bg-primary!",
          )}
          onPointerDown={onResizePointerDown}
          onClick={(event) => event.stopPropagation()}
        />
      ) : null}
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
  const [columnSearch, setColumnSearch] = useState("");
  const { metadata } = useMetadata();
  const {
    columnOrder,
    columnVisibility,
    columnWidths,
    data,
    rowSelection,
    setRowSelection,
    density,
    dragModeEnabled,
    setColumnWidths,
    groupingField,
    setColumnVisibility,
    setGroupingField,
    setGroupCollapsed,
    setDensity,
    wrapCells,
    setWrapCells,
    setDragModeEnabled,
  } = useTable();

  const groupableFields = useMemo(() => {
    if (columns && columns.length > 0) {
      return columns.map((column) => ({
        value: column.id,
        label: String(column.title || column.id),
      }));
    }
    if (!metadata) return [];
    return metadata.fields.map((f) => ({
      value: f.name,
      label: f.verboseName || f.name,
    }));
  }, [columns, metadata]);

  const toggleColumn = useCallback(
    (
      column: { visibilityKeys: string[] },
      checked: boolean,
    ) => {
      const nextVisibility = { ...columnVisibility };
      column.visibilityKeys.forEach((key) => {
        nextVisibility[key] = checked;
      });
      setColumnVisibility(nextVisibility);
    },
    [columnVisibility, setColumnVisibility],
  );

  const columnWidthsRef = useRef(columnWidths);
  const activeResizeHandlersRef = useRef<{
    move: (event: PointerEvent) => void;
    up: () => void;
  } | null>(null);

  useEffect(() => {
    columnWidthsRef.current = columnWidths;
  }, [columnWidths]);

  const stopColumnResize = useCallback(() => {
    const handlers = activeResizeHandlersRef.current;
    if (!handlers) return;
    window.removeEventListener("pointermove", handlers.move);
    window.removeEventListener("pointerup", handlers.up);
    activeResizeHandlersRef.current = null;
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
  }, []);

  useEffect(() => {
    return () => {
      stopColumnResize();
    };
  }, [stopColumnResize]);

  const startColumnResize = useCallback(
    (columnId: string, event: React.PointerEvent<HTMLDivElement>) => {
      if (!dragModeEnabled) return;

      event.preventDefault();
      event.stopPropagation();
      stopColumnResize();

      const headerCell = event.currentTarget.closest("th");
      const measuredWidth =
        headerCell?.getBoundingClientRect().width ?? MIN_COLUMN_WIDTH_PX;
      const persistedWidth = columnWidthsRef.current[columnId];
      const baseWidth = clampColumnWidth(
        typeof persistedWidth === "number" ? persistedWidth : measuredWidth,
      );
      const startX = event.clientX;

      const handlePointerMove = (moveEvent: PointerEvent) => {
        const delta = moveEvent.clientX - startX;
        const nextWidth = clampColumnWidth(baseWidth + delta);
        const nextWidths = {
          ...columnWidthsRef.current,
          [columnId]: nextWidth,
        };
        columnWidthsRef.current = nextWidths;
        setColumnWidths(nextWidths);
      };

      const handlePointerUp = () => {
        stopColumnResize();
      };

      activeResizeHandlersRef.current = {
        move: handlePointerMove,
        up: handlePointerUp,
      };

      window.addEventListener("pointermove", handlePointerMove);
      window.addEventListener("pointerup", handlePointerUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    },
    [dragModeEnabled, setColumnWidths, stopColumnResize],
  );

  // Determine visible columns in order
  const visibleColumns = (() => {
    if (columns && columns.length > 0) {
      const byId = new Map(columns.map((column) => [column.id, column]));
      const orderedIds =
        columnOrder.length > 0 ? columnOrder : columns.map((c) => c.id);
      return orderedIds
        .map((id) => byId.get(id))
        .filter((column): column is BaseModelTableColumnDef => !!column)
        .filter((column) =>
          resolveColumnVisibility(columnVisibility, [
            column.id,
            "accessor" in column ? column.accessor : undefined,
            "accessor" in column
              ? column.accessor.replace(/__/g, ".").split(".")[0]
              : undefined,
          ]),
        );
    }

    if (!metadata) return [];
    return columnOrder
      .map((colId) => metadata.fields.find((f) => f.name === colId))
      .filter(
        (f) =>
          f && resolveColumnVisibility(columnVisibility, [f.name, f.fieldName]),
      );
  })();

  // Optionnel: orderedColumns pour la configuration
  const orderedColumns = useMemo(() => {
    if (!metadata) return [];
    const definitions = columns && columns.length > 0 ? columns.map(c => ({
      id: c.id,
      label: c.title || c.id,
      visibilityKeys: [c.id, "accessor" in c ? c.accessor : undefined].filter((k): k is string => !!k),
    })) : metadata.fields.map(f => ({
      id: f.name,
      label: f.verboseName || f.name,
      visibilityKeys: [f.name, f.fieldName],
    }));
    return definitions;
  }, [columns, metadata]);

  const allColumnsVisible =
    orderedColumns.length > 0 &&
    orderedColumns.every((c) =>
      resolveColumnVisibility(columnVisibility, c.visibilityKeys),
    );

  const hasGroupedRows = !!groupingField;

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

  const allowDrag = columnOrdering?.draggable !== false;
  const locked = new Set(columnOrdering?.locked ?? []);

  return (
    <ShadcnTableHeader className="bg-transparent group/header">
      <TableRow className="border-0 hover:bg-transparent transition-none">
        {enableSelection ? (
          <TableHead
            className={cn(
              "w-12.5 table-first-column sticky top-0 z-20 overflow-visible",
              "border-b border-primary-foreground/15 bg-primary",
              "transition-colors duration-200",
              density === "compact"
                ? "py-0 px-2 h-8"
                : density === "spacious"
                  ? "py-0 px-3.5 h-12"
                  : "py-0 px-3 h-10",
            )}
          >
            <div className="flex items-center justify-center h-full">
              <Checkbox
                checked={
                  allSelected || (someSelected ? "indeterminate" : false)
                }
                onCheckedChange={toggleSelectAll}
                aria-label="Tout sélectionner"
                className="size-4 transition-all data-[state=checked]:bg-white data-[state=checked]:text-primary border-primary-foreground/45 data-[state=checked]:border-white"
              />
            </div>
          </TableHead>
        ) : null}
        {visibleColumns.map((field) => {
          if (!field) return null;

          if ("accessor" in field) {
            const columnId = field.id;
            // Custom column def
            return (
              <DraggableHead
                key={columnId}
                id={columnId}
                draggable={
                  allowDrag && dragModeEnabled && !locked.has(columnId)
                }
                resizable={dragModeEnabled}
                onResizePointerDown={(event) =>
                  startColumnResize(columnId, event)
                }
                widthStyle={getColumnWidthStyle(columnWidths, columnId)}
                density={density}
                className="p-0 m-0"
              >
                <div className="flex h-full w-full items-stretch self-stretch">
                  <div className="min-w-0 flex-1 h-full">
                    <TableColumnMenu
                      columnId={field.id}
                      title={field.title}
                      disabled={disableSorting}
                      fullWidthTrigger
                      variant="primary"
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
              draggable={
                allowDrag && dragModeEnabled && !locked.has(field.name)
              }
              resizable={dragModeEnabled}
              onResizePointerDown={(event) =>
                startColumnResize(field.name, event)
              }
              widthStyle={getColumnWidthStyle(columnWidths, field.name)}
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
                    variant="primary"
                  />
                </div>
                <ColumnFilter columnId={field.name} field={field} hideTrigger />
              </div>
            </DraggableHead>
          );
        })}
        {/* Actions Column Header */}
        <DraggableHead
          id="actions"
          draggable={false}
          className="w-35 text-right sticky right-0 z-30 table-last-column bg-primary text-primary-foreground border-b border-primary-foreground/15"
          density={density}
          isActions
        >
          <div className="flex w-full items-center justify-end pr-4 gap-1.5 h-full">
            <span className="block text-[9px] font-semibold uppercase tracking-widest text-primary-foreground/70">
              {actionsLabel ?? ""}
            </span>
            
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 rounded-md hover:bg-primary-foreground/10 text-primary-foreground border-none transition-none shadow-none focus-visible:ring-0"
                  title="Configuration de la table"
                >
                  <SlidersHorizontal className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64 border-none p-2 bg-background/95 shadow-lg z-50">
                <DropdownMenuLabel className="flex items-center gap-2 px-3 py-2 text-xs font-black uppercase tracking-widest text-muted-foreground/60">
                  <SlidersHorizontal className="h-3.5 w-3.5" />
                  Options de table
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="mx-2 bg-border/40" />

                {/* Visibilité des colonnes */}
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger className="flex items-center gap-2 py-2 px-3 text-xs font-medium hover:bg-muted/50 rounded-sm cursor-pointer">
                    <Columns3 className="h-3.5 w-3.5 text-muted-foreground/60" />
                    <span>Colonnes visibles</span>
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent className="w-72 border-none p-2 bg-background/95 shadow-md">
                    <div className="relative px-2 pb-2">
                      <Search className="absolute left-4 top-2.5 h-3.5 w-3.5 text-muted-foreground/40" />
                      <Input
                        placeholder="Rechercher une colonne..."
                        value={columnSearch}
                        onChange={(e) => setColumnSearch(e.target.value)}
                        className="h-9 pl-9 pr-4 text-xs bg-muted/30 border-none focus-visible:ring-primary/20"
                      />
                    </div>
                    <div className="flex items-center justify-between gap-2 px-2 py-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 gap-2 text-[10px] font-bold uppercase tracking-wider hover:bg-primary/10 hover:text-primary shadow-none"
                        onClick={() => {
                          if (!metadata) return;
                          const defaults = getDefaultHiddenColumnIds(metadata, {
                            showReversed: false,
                            showCount: true,
                          });
                          const next = { ...columnVisibility };
                          orderedColumns.forEach((c) => {
                            const rootKey = c.id.split(".")[0];
                            const vis =
                              !defaults.has(rootKey) &&
                              !c.visibilityKeys.some((key) => defaults.has(key));
                            c.visibilityKeys.forEach((key) => {
                              next[key] = vis;
                            });
                          });
                          setColumnVisibility(next);
                        }}
                      >
                        <RotateCcw className="h-3 w-3" />
                        Défaut
                      </Button>
                      <div className="flex items-center gap-3 bg-muted/30 px-3 py-1.5 rounded">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                          Toutes
                        </span>
                        <Switch
                          checked={allColumnsVisible}
                          onCheckedChange={(v) => {
                            const next = { ...columnVisibility };
                            orderedColumns.forEach((c) => {
                              c.visibilityKeys.forEach((key) => {
                                next[key] = v;
                              });
                            });
                            setColumnVisibility(next);
                          }}
                          className="scale-75 data-[state=checked]:bg-primary"
                        />
                      </div>
                    </div>
                    <DropdownMenuSeparator className="mx-2 bg-border/40" />
                    <div className="max-h-[240px] overflow-auto custom-scrollbar px-1 py-1">
                      {visibleColumns.map((col) => {
                        const id = col.id;
                        // For legacy column visibility mapping
                        const isVisible = resolveColumnVisibility(
                          columnVisibility,
                          "accessor" in col ? [col.id, col.accessor] : [col.id]
                        );
                        return (
                          <DropdownMenuCheckboxItem
                            key={id}
                            checked={isVisible}
                            onCheckedChange={(v) => toggleColumn(col as any, !!v)}
                            className={cn(
                              "py-2 text-xs font-medium mb-0.5",
                              isVisible
                                ? "bg-primary/5 text-primary"
                                : "text-muted-foreground hover:bg-muted/50",
                            )}
                          >
                            {col.label}
                          </DropdownMenuCheckboxItem>
                        );
                      })}
                      {visibleColumns.length === 0 && (
                        <div className="py-8 text-center text-xs text-muted-foreground italic">
                          Aucune colonne trouvée
                        </div>
                      )}
                    </div>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>

                {/* Regroupement des lignes */}
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger className="flex items-center gap-2 py-2 px-3 text-xs font-medium hover:bg-muted/50 rounded-sm cursor-pointer">
                    <Layers className="h-3.5 w-3.5 text-muted-foreground/60" />
                    <span>Regrouper les données</span>
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent className="w-64 border-none p-2 bg-background/95 shadow-md">
                    <DropdownMenuItem
                      onClick={() => {
                        setGroupingField(null);
                        setGroupCollapsed({});
                      }}
                      className={cn(
                        "gap-3 py-2 text-xs font-medium mb-1 cursor-pointer",
                        groupingField === null
                          ? "bg-primary/5 text-primary"
                          : "text-muted-foreground hover:bg-muted/50",
                      )}
                    >
                      <div
                        className={cn(
                          "flex h-4 w-4 items-center justify-center border border-current",
                          groupingField === null
                            ? "bg-primary/20"
                            : "border-muted-foreground/30",
                        )}
                      >
                        {groupingField === null && <Check className="h-2.5 w-2.5" />}
                      </div>
                      <span>Aucun regroupement</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="mx-2 bg-border/40" />
                    <div className="max-h-[200px] overflow-auto custom-scrollbar px-1 py-1">
                      {groupableFields.map((field) => {
                        const isActive = groupingField === field.value;
                        return (
                          <DropdownMenuItem
                            key={field.value}
                            onClick={() => setGroupingField(field.value)}
                            className={cn(
                              "gap-3 py-2 text-xs font-medium mb-0.5 cursor-pointer",
                              isActive
                                ? "bg-primary/5 text-primary"
                                : "text-muted-foreground hover:bg-muted/50",
                            )}
                          >
                            <div
                              className={cn(
                                "flex h-4 w-4 items-center justify-center border border-current",
                                isActive ? "bg-primary/20" : "border-muted-foreground/30",
                              )}
                            >
                              {isActive && <Check className="h-2.5 w-2.5" />}
                            </div>
                            <span>{field.label}</span>
                          </DropdownMenuItem>
                        );
                      })}
                    </div>
                    {hasGroupedRows && (
                      <>
                        <DropdownMenuSeparator className="mx-2 bg-border/40" />
                        <div className="grid grid-cols-2 gap-2 p-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 gap-2 text-[10px] font-bold uppercase tracking-wider hover:bg-primary/10 hover:text-primary shadow-none"
                            onClick={() => {
                              const next: Record<string, boolean> = {};
                              const keys = new Set<string>();
                              data.forEach((r) =>
                                keys.add(resolveGroupingKey(r, groupingField!)),
                              );
                              keys.forEach((k) => (next[k] = false));
                              setGroupCollapsed(next);
                            }}
                          >
                            <Eye className="h-3 w-3" />
                            Ouvrir
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 gap-2 text-[10px] font-bold uppercase tracking-wider hover:bg-primary/10 hover:text-primary shadow-none"
                            onClick={() => {
                              const next: Record<string, boolean> = {};
                              const keys = new Set<string>();
                              data.forEach((r) =>
                                keys.add(resolveGroupingKey(r, groupingField!)),
                              );
                              keys.forEach((k) => (next[k] = true));
                              setGroupCollapsed(next);
                            }}
                          >
                            <EyeOff className="h-3 w-3" />
                            Fermer
                          </Button>
                        </div>
                      </>
                    )}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>

                {/* Densité d'affichage */}
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger className="flex items-center gap-2 py-2 px-3 text-xs font-medium hover:bg-muted/50 rounded-sm cursor-pointer">
                    <LayoutGrid className="h-3.5 w-3.5 text-muted-foreground/60" />
                    <span>Densité</span>
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent className="w-48 border-none p-2 bg-background/95 shadow-md">
                    <DropdownMenuItem
                      onClick={() => setDensity("compact")}
                      className={cn(
                        "py-2 text-xs font-medium cursor-pointer",
                        density === "compact" ? "bg-primary/5 text-primary" : "text-muted-foreground hover:bg-muted/50",
                      )}
                    >
                      {density === "compact" && <Check className="mr-2 h-4 w-4" />}
                      <span className={density !== "compact" ? "ml-6" : ""}>Compact</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setDensity("comfortable")}
                      className={cn(
                        "py-2 text-xs font-medium cursor-pointer",
                        density === "comfortable" ? "bg-primary/5 text-primary" : "text-muted-foreground hover:bg-muted/50",
                      )}
                    >
                      {density === "comfortable" && <Check className="mr-2 h-4 w-4" />}
                      <span className={density !== "comfortable" ? "ml-6" : ""}>Confortable</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setDensity("spacious")}
                      className={cn(
                        "py-2 text-xs font-medium cursor-pointer",
                        density === "spacious" ? "bg-primary/5 text-primary" : "text-muted-foreground hover:bg-muted/50",
                      )}
                    >
                      {density === "spacious" && <Check className="mr-2 h-4 w-4" />}
                      <span className={density !== "spacious" ? "ml-6" : ""}>Spacieux</span>
                    </DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>

                <DropdownMenuSeparator className="mx-2 bg-border/40" />

                {/* Toggles: Retour à la ligne & Mode Glisser */}
                <div className="p-2 flex items-center justify-between text-xs font-medium text-neutral-600 dark:text-neutral-300">
                  <span>Retour à la ligne</span>
                  <Switch
                    checked={wrapCells}
                    onCheckedChange={setWrapCells}
                    className="scale-75 data-[state=checked]:bg-primary"
                  />
                </div>
                <div className="p-2 flex items-center justify-between text-xs font-medium text-neutral-600 dark:text-neutral-300">
                  <span>Mode Glisser-déposer</span>
                  <Switch
                    checked={dragModeEnabled}
                    onCheckedChange={setDragModeEnabled}
                    className="scale-75 data-[state=checked]:bg-primary"
                  />
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </DraggableHead>
      </TableRow>
    </ShadcnTableHeader>
  );
}
