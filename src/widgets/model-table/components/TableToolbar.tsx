/**
 * @file TableToolbar.tsx
 * @description Barre d'outils de la table de modèle permettant la recherche rapide,
 * l'activation des filtres avancés, et la gestion des options d'affichage de la table.
 * Modifié pour supprimer les ombres sur tous les boutons et appliquer un fond neutre pour les boutons d'icônes.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Filter,
  Layers,
  ListFilter,
  X,
} from "lucide-react";
import { Button } from "@/shared/ui/kit/button";
import { Badge } from "@/shared/ui/kit/badge";
import { TooltipProvider } from "@/shared/ui/kit/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/ui/kit/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTrigger,
} from "@/shared/ui/kit/sheet";
import { cn } from "@/shared/utils";
import { useTable } from "../context/TableContext";
import { useMetadata } from "../context/MetadataContext";
import { useTableFilters } from "../hooks/useTableFilters";
import { FilterPanel } from "@/widgets/model-table/filtering/FilterPanel";
import type {
  ModelTableFilterPanelProps,
  ModelTableNavFiltersConfig,
  ModelTableV2TableConfig,
} from "../config/types";
import type {
  BaseModelTableFieldsInput,
} from "../types";
import type {
  FilterQueryVariables,
  FilterFormState,
} from "../filtering/types";
import {
  NavFiltersBar,
  QuickFilters,
  QuickSearch,
} from "./toolbar";
import { useIsMobile } from "@/shared/hooks/legacy-hooks/use-mobile";
import {
  getActiveNavFilterCount,
  mergeModelTableQueryVariables,
  resolveNavFilterVariables,
} from "../utils";

type TableToolbarProps = {
  filterPanel?: ModelTableFilterPanelProps;
  navFilters?: ModelTableNavFiltersConfig;
  queryManager?: string;
  tableConfig?: ModelTableV2TableConfig;
  quickSearch?: boolean;
  quickFilters?: string[];
  fields?: BaseModelTableFieldsInput;
  showReversed?: boolean;
  showCount?: boolean;
  extraActions?: React.ReactNode;
};

/**
 * Composant Toolbar pour le ModelTableV2.
 * Gère la recherche, les filtres, l'affichage des colonnes, le groupement et l'export.
 * Design moderne, responsive et optimisé pour une utilisation intensive.
 * Redessiné pour correspondre au style Localira (recherche solide et bouton Filtres icône à droite de la recherche).
 *
 * @param {ModelTableFilterPanelProps} filterPanel - Configuration du panneau de filtres.
 * @param {ModelTableV2TableConfig} tableConfig - Configuration globale de la table.
 * @param {boolean} quickSearch - Active/Desactive la recherche rapide.
 * @param {BaseModelTableFieldsInput} fields - Configuration des colonnes exposees dans le selecteur.
 * @param {React.ReactNode} extraActions - Actions supplementaires a afficher.
 */
export function TableToolbar({
  filterPanel,
  navFilters,
  queryManager,
  tableConfig,
  quickSearch,
  quickFilters,
  fields,
  showReversed,
  showCount,
  extraActions,
}: TableToolbarProps) {
  const toolbarRootRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const { app, model, metadata, ensureCapabilitiesLoaded } = useMetadata();
  const {
    columnVisibility,
    setColumnVisibility,
    columnOrder,
    data,
    groupingField,
    setGroupingField,
    setGroupCollapsed,
    density,
    setDensity,
    wrapCells,
    setWrapCells,
    dragModeEnabled,
    setDragModeEnabled,
    loading,
    refresh,
  } = useTable();
  const {
    quickSearch: quickSearchValue,
    filterVariables,
    setQuickSearch,
    setAdvancedFilters,
    clearAllFilters,
    hasActiveFilters: hasBaseActiveFilters,
    activeFilterStats,
    advancedFilters,
    navFilterSelections,
  } = useTableFilters();

  const [filterOpen, setFilterOpen] = useState(
    filterPanel?.defaultOpen ?? false,
  );
  const [searchFocused, setSearchFocused] = useState(false);
  const supportsQuick = !!metadata?.filterConfig?.supportsQuick;
  const activeAdvancedFilterCount = activeFilterStats.activeCount;
  const activeNavFilterCount = useMemo(
    () => getActiveNavFilterCount(navFilters, navFilterSelections),
    [navFilterSelections, navFilters],
  );
  const hasActiveFilters = hasBaseActiveFilters || activeNavFilterCount > 0;
  const hasGroupedRows = !!groupingField;
  const mergedFilterVariables = useMemo(
    () =>
      mergeModelTableQueryVariables(
        filterVariables,
        resolveNavFilterVariables(navFilters, navFilterSelections),
      ),
    [filterVariables, navFilterSelections, navFilters],
  );

  // Configuration du panneau de filtres
  const panelConfig = useMemo(
    () => ({
      mode: filterPanel?.mode ?? (isMobile ? "modal" : "drawer"),
      title: filterPanel?.title ?? "Filtres Avancés",
      side: filterPanel?.side ?? "right",
      widthClassName:
        filterPanel?.widthClassName ?? (isMobile ? "w-full" : "sm:w-[450px]"),
    }),
    [filterPanel, isMobile],
  );

  useEffect(() => {
    if (!filterOpen) return;
    void ensureCapabilitiesLoaded();
  }, [ensureCapabilitiesLoaded, filterOpen]);

  useEffect(() => {
    if (!quickFilters?.length) return;
    void ensureCapabilitiesLoaded();
  }, [ensureCapabilitiesLoaded, quickFilters]);

  const handleApplyFilters = (
    variables: FilterQueryVariables,
    state: FilterFormState,
    context?: { source: "manual" | "preset" },
  ) => {
    setAdvancedFilters(state, variables as Record<string, unknown>);
    if (context?.source !== "preset" && !isMobile) setFilterOpen(false);
  };

  const renderFilterContent = () => (
    <FilterPanel
      app={app}
      model={model}
      layout="panel"
      onApply={handleApplyFilters}
      initialState={advancedFilters}
      {...filterPanel}
    />
  );

  if (!metadata) return null;

  return (
    <TooltipProvider delayDuration={200}>
      <div
        ref={toolbarRootRef}
        className="relative z-20 flex flex-col gap-3 w-full"
      >
        {/* Main Toolbar Container */}
        <div
          data-slot="table-toolbar"
          className="group flex flex-col gap-3 bg-transparent w-full"
        >
          {navFilters?.groups.length ? (
            <NavFiltersBar
              navFilters={navFilters}
              queryManager={queryManager}
            />
          ) : null}
          <div className="flex flex-col items-center justify-between gap-3 sm:flex-row w-full">
            {/* Left: Search and Status Indicators */}
            <div className="flex w-full flex-1 flex-wrap items-start gap-3 sm:w-auto">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                {quickSearch !== false && supportsQuick && (
                  <QuickSearch
                    value={quickSearchValue}
                    onChange={setQuickSearch}
                    placeholder={
                      tableConfig?.searchPlaceholder ?? "Rechercher partout..."
                    }
                    expanded={searchFocused || !!quickSearchValue}
                    onFocusChange={setSearchFocused}
                  />
                )}
                {panelConfig.mode === "modal" ? (
                  <Dialog open={filterOpen} onOpenChange={setFilterOpen}>
                    <DialogTrigger asChild>
                      <Button
                        variant="secondary"
                        size="icon"
                        className={cn(
                          "h-9.5 w-9.5 bg-neutral-100 text-neutral-700 hover:bg-neutral-200/80 dark:bg-zinc-800 dark:text-neutral-200 dark:hover:bg-zinc-700/80 border-none rounded-lg relative shrink-0 shadow-none",
                          hasActiveFilters && "bg-neutral-200 dark:bg-zinc-700 text-foreground"
                        )}
                      >
                        <ListFilter className="h-4 w-4" />
                        {activeAdvancedFilterCount > 0 && (
                          <Badge className="absolute -top-1 -right-1 h-4 w-4 bg-primary text-primary-foreground p-0 text-[10px] border-none font-bold justify-center items-center rounded-full">
                            {activeAdvancedFilterCount}
                          </Badge>
                        )}
                      </Button>
                    </DialogTrigger>
                    <DialogContent
                      className={cn(
                        "flex flex-col overflow-hidden border p-0 bg-background",
                        panelConfig.widthClassName,
                      )}
                    >
                      <DialogHeader className="bg-muted/30 dark:bg-muted/10 px-8 py-6 backdrop-blur-md">
                        <div className="flex items-center justify-between">
                          <DialogTitle className="text-2xl font-black uppercase tracking-tighter text-foreground/80">
                            {panelConfig.title}
                          </DialogTitle>
                          <Badge
                            variant="outline"
                            className="border-primary/20 bg-primary/5 text-[10px] font-bold text-primary dark:text-primary/90 uppercase tracking-widest px-3 py-1"
                          >
                            {model}
                          </Badge>
                        </div>
                      </DialogHeader>
                      <div className="flex-1 overflow-auto bg-background/50 custom-scrollbar">
                        {renderFilterContent()}
                      </div>
                    </DialogContent>
                  </Dialog>
                ) : (
                  <Sheet open={filterOpen} onOpenChange={setFilterOpen}>
                    <SheetTrigger asChild>
                      <Button
                        variant="secondary"
                        size="icon"
                        className={cn(
                          "h-9.5 w-9.5 bg-neutral-100 text-neutral-700 hover:bg-neutral-200/80 dark:bg-zinc-800 dark:text-neutral-200 dark:hover:bg-zinc-700/80 border-none rounded-lg relative shrink-0 shadow-none",
                          hasActiveFilters && "bg-neutral-200 dark:bg-zinc-700 text-foreground"
                        )}
                      >
                        <ListFilter className="h-4 w-4" />
                        {activeAdvancedFilterCount > 0 && (
                          <Badge className="absolute -top-1 -right-1 h-4 w-4 bg-primary text-primary-foreground p-0 text-[10px] border-none font-bold justify-center items-center rounded-full">
                            {activeAdvancedFilterCount}
                          </Badge>
                        )}
                      </Button>
                    </SheetTrigger>
                    <SheetContent
                      side={
                        panelConfig.side as "top" | "right" | "bottom" | "left"
                      }
                      className={cn(
                        "p-0 border-l bg-background",
                        panelConfig.widthClassName,
                      )}
                    >
                      <SheetHeader className="bg-muted/30 dark:bg-muted/10 px-8 py-6 backdrop-blur-md border-b border-border/10">
                        <div className="flex items-center gap-3">
                          <div className="bg-primary/10 p-2 text-primary">
                            <Filter className="h-5 w-5" />
                          </div>
                          <DialogTitle className="text-2xl font-black uppercase tracking-tighter text-foreground/80">
                            {panelConfig.title}
                          </DialogTitle>
                        </div>
                      </SheetHeader>
                      <div className="h-[calc(100%-88px)] overflow-auto custom-scrollbar">
                        {renderFilterContent()}
                      </div>
                    </SheetContent>
                  </Sheet>
                )}
              </div>
              {quickFilters?.length ? (
                <QuickFilters fields={quickFilters} />
              ) : null}

              {/* Status Badges - Visible only if something is active */}
              {!isMobile && (hasActiveFilters || hasGroupedRows) && (
                <div className="flex items-center gap-2">
                  {activeAdvancedFilterCount > 0 && (
                    <Badge
                      variant="secondary"
                      className="h-6 gap-1.5 border-none bg-muted px-2.5 text-[10px] font-medium text-foreground rounded hover:bg-muted/80"
                    >
                      <Filter className="h-3 w-3 opacity-60" />
                      <span>{activeAdvancedFilterCount} filtres</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          clearAllFilters();
                        }}
                        className="ml-1 p-0.5 hover:bg-primary/30"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  )}
                  {activeNavFilterCount > 0 && (
                    <Badge
                      variant="secondary"
                      className="h-7 gap-1.5 border-none bg-emerald-500/10 px-3 text-xs font-semibold text-emerald-700 hover:bg-emerald-500/15"
                    >
                      <Layers className="h-3.5 w-3.5 fill-emerald-500/20" />
                      <span>{activeNavFilterCount} raccourcis</span>
                    </Badge>
                  )}
                  {hasGroupedRows && (
                    <Badge
                      variant="outline"
                      className="h-6 gap-1.5 border-primary/20 bg-primary/5 px-2 text-[10px] font-semibold text-primary rounded"
                    >
                      <Layers className="h-3 w-3" />
                      <span className="uppercase tracking-widest">
                        {groupingField}
                      </span>
                      <button
                        onClick={() => setGroupingField(null)}
                        className="ml-1 p-0.5 hover:bg-muted"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  )}
                </div>
              )}
            </div>

            {/* Right: Action Clusters */}
            <div className="flex w-full items-center justify-end gap-1.5 sm:w-auto">
              {/* Extra Actions Integration */}
              {extraActions && (
                <div className="flex items-center gap-1 bg-muted/20 p-1">
                  {extraActions}
                </div>
              )}

            </div>
          </div>
        </div>

        {/* Mobile Filter Summary Bar */}
        {isMobile && (hasActiveFilters || hasGroupedRows) && (
          <div className="flex flex-wrap items-center gap-2 px-4">
            {activeAdvancedFilterCount > 0 && (
              <Badge
                variant="secondary"
                className="h-7 gap-1.5 bg-primary/10 text-primary border-none"
              >
                <Filter className="h-3 w-3" />
                {activeAdvancedFilterCount} filtres
                <X
                  className="h-3 w-3 cursor-pointer ml-1"
                  onClick={clearAllFilters}
                />
              </Badge>
            )}
            {activeNavFilterCount > 0 && (
              <Badge
                variant="secondary"
                className="h-7 gap-1.5 bg-emerald-500/10 text-emerald-700 border-none"
              >
                <Layers className="h-3 w-3" />
                {activeNavFilterCount} raccourcis
              </Badge>
            )}
            {hasGroupedRows && (
              <Badge
                variant="outline"
                className="h-7 gap-1.5 border-primary/20 bg-primary/5 text-primary/70"
              >
                <div className="h-1.5 w-1.5 bg-primary" />
                {groupingField}
                <X
                  className="h-3 w-3 cursor-pointer ml-1"
                  onClick={() => setGroupingField(null)}
                />
              </Badge>
            )}
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
