/**
 * @file TableToolbar.tsx
 * @description Barre d'outils de la table de modèle permettant la recherche rapide,
 * l'activation des filtres avancés, et la gestion des options d'affichage de la table.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMutation } from "@apollo/client";
import {
  Filter,
  GripVertical,
  ListFilter,
  RefreshCw,
  X,
  Settings2,
  Layers,
  LayoutGrid,
  SlidersHorizontal,
  Check,
  Columns3,
  RotateCcw,
  Eye,
  EyeOff,
  Search,
} from "lucide-react";
import { Button } from "@/shared/ui/kit/button";
import { Input } from "@/shared/ui/kit/input";
import { Badge } from "@/shared/ui/kit/badge";
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/ui/kit/tooltip";
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
import { Switch } from "@/shared/ui/kit/switch";
import { Separator } from "@/shared/ui/kit/separator";
import { cn } from "@/shared/utils";
import { useTable } from "../context/TableContext";
import { useMetadata } from "../context/MetadataContext";
import { useTableFilters } from "../hooks/useTableFilters";
import { FilterPanel } from "@/widgets/model-table/filtering/FilterPanel";
import {
  FilterFormState,
  FilterQueryVariables,
} from "@/widgets/model-table/filtering/types";
import type {
  ModelTableFilterPanelProps,
  ModelTableNavFiltersConfig,
  ModelTableV2TableConfig,
} from "../config/types";
import type { BaseModelTableFieldsInput } from "../types";
import { buildColumnDefinitions } from "../builders/columnDefinitions";
import {
  getDefaultHiddenColumnIds,
  normalizeBaseModelTableFieldsInput,
  resolveColumnVisibility,
  resolveGroupingKey,
  toGraphqlFieldName,
} from "../utils";
import {
  ColumnsMenu,
  GroupingMenu,
  NavFiltersBar,
  QuickFilters,
  QuickSearch,
  ViewOptionsMenu,
} from "./toolbar";
import type { ColumnsMenuOption } from "./toolbar/ColumnsMenu";
import { useIsMobile } from "@/shared/hooks/legacy-hooks/use-mobile";
import {
  UPSERT_USER_TABLE_CONFIG_MUTATION_RESOLVED,
  type UpsertUserTableConfigResponse,
  type UpsertUserTableConfigVariables,
} from "@/shared/api/graphql/legacy/mutations";
import {
  clearPersistedMetadataStore,
  getActiveMetadataUserKey,
} from "@/shared/api/graphql/graphql/metadata/persisted-cache";
import {
  clearPendingTablePersistenceReset,
  getNormalizedTablePersistenceKeys,
  markPendingTablePersistenceReset,
} from "../hooks/useTablePersistence";
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
  const [hardRefreshing, setHardRefreshing] = useState(false);
  const [resetUserTableConfig] = useMutation<
    UpsertUserTableConfigResponse,
    UpsertUserTableConfigVariables
  >(UPSERT_USER_TABLE_CONFIG_MUTATION_RESOLVED, {
    ignoreResults: true,
  });
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
  const [columnSearch, setColumnSearch] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);

  const resolvePersistenceKey = useCallback(() => {
    const defaultPath =
      typeof window !== "undefined" ? window.location.pathname : "";
    const fallbackKey = `${app}-${model}-${defaultPath}`;
    const keyFromScope = toolbarRootRef.current
      ?.closest("[data-model-table-persistence-key]")
      ?.getAttribute("data-model-table-persistence-key");
    return keyFromScope || fallbackKey;
  }, [app, model]);

  const handleHardRefresh = useCallback(async () => {
    if (hardRefreshing) {
      return;
    }
    setHardRefreshing(true);

    const persistenceKey = resolvePersistenceKey();
    const persistenceKeys = getNormalizedTablePersistenceKeys(persistenceKey);
    const metadataUserKey = getActiveMetadataUserKey();

    markPendingTablePersistenceReset(persistenceKey);

    if (typeof window !== "undefined") {
      persistenceKeys.forEach((candidateKey) => {
        try {
          window.localStorage.removeItem(`rail-table-v2:${candidateKey}`);
        } catch {
          // Ignore storage errors and continue hard-refresh flow.
        }
      });
    }

    if (metadataUserKey) {
      clearPersistedMetadataStore(metadataUserKey);
    }

    try {
      await Promise.all(
        persistenceKeys.map((candidateKey) =>
          resetUserTableConfig({
            variables: {
              key: candidateKey,
              tableConfig: {},
            },
          }),
        ),
      );
    } catch {
      // Ignore mutation errors; local reset + reload still provide a hard refresh.
    }

    if (typeof window !== "undefined") {
      window.location.reload();
      return;
    }
    clearPendingTablePersistenceReset(persistenceKey);
  }, [hardRefreshing, resetUserTableConfig, resolvePersistenceKey]);

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

  // Gestion des colonnes
  const normalizedFieldsConfig = useMemo(
    () => normalizeBaseModelTableFieldsInput(fields),
    [fields],
  );

  const columnDefinitions = useMemo(
    () =>
      metadata ? buildColumnDefinitions(metadata, normalizedFieldsConfig) : [],
    [metadata, normalizedFieldsConfig],
  );

  const allowedFieldIds = useMemo(
    () => new Set(columnDefinitions.map((column) => column.id.split(".")[0])),
    [columnDefinitions],
  );

  const orderedColumns = useMemo<ColumnsMenuOption[]>(() => {
    if (!metadata) return [];
    const definitions = columnDefinitions;
    const baseColumns = definitions.map((column) => {
      const rootKey = column.id.split(".")[0];
      return {
        id: column.id,
        label: column.title || column.id,
        visibilityKeys: Array.from(
          new Set(
            [column.id, column.accessor, rootKey].filter(
              (entry): entry is string => !!entry,
            ),
          ),
        ),
      };
    });
    if (columnOrder.length === 0) return baseColumns;

    const byId = new Map(baseColumns.map((column) => [column.id, column]));
    const seen = new Set<string>();
    const ordered: ColumnsMenuOption[] = [];

    columnOrder.forEach((id) => {
      const column = byId.get(id);
      if (!column || seen.has(column.id)) return;
      ordered.push(column);
      seen.add(column.id);
    });

    baseColumns.forEach((column) => {
      if (seen.has(column.id)) return;
      ordered.push(column);
      seen.add(column.id);
    });

    return ordered;
  }, [columnDefinitions, columnOrder, metadata]);

  const visibleColumns = useMemo(
    () =>
      orderedColumns.filter((c) =>
        c.label.toLowerCase().includes(columnSearch.toLowerCase()),
      ),
    [columnSearch, orderedColumns],
  );

  const allColumnsVisible =
    orderedColumns.length > 0 &&
    orderedColumns.every((c) =>
      resolveColumnVisibility(columnVisibility, c.visibilityKeys),
    );

  // Actions de groupe
  const groupableFields = useMemo(() => {
    if (!metadata) return [];
    return metadata.fields
      .filter(
        (f) =>
          allowedFieldIds.has(toGraphqlFieldName(f.name || f.fieldName)) &&
          f.visibility !== "hidden" &&
          !["DateField", "DateTimeField", "TimeField", "TextField"].includes(
            f.fieldType,
          ),
      )
      .map((f) => ({
        value: f.name || f.fieldName,
        label: f.verboseName || f.name,
      }));
  }, [allowedFieldIds, metadata]);

  const toggleColumn = (column: ColumnsMenuOption, checked: boolean) => {
    const next = { ...columnVisibility };
    column.visibilityKeys.forEach((key) => {
      next[key] = checked;
    });
    setColumnVisibility(next);
  };

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
                          "h-9.5 w-9.5 bg-neutral-100 text-neutral-700 hover:bg-neutral-200/80 dark:bg-zinc-800 dark:text-neutral-200 dark:hover:bg-zinc-700/80 border-none rounded-lg relative shrink-0",
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
                          "h-9.5 w-9.5 bg-neutral-100 text-neutral-700 hover:bg-neutral-200/80 dark:bg-zinc-800 dark:text-neutral-200 dark:hover:bg-zinc-700/80 border-none rounded-lg relative shrink-0",
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
              <div className="flex items-center gap-1">
                {!isMobile ? (
                  <DropdownMenu modal={false}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 gap-2 hover:bg-background hover:text-primary"
                          >
                            <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
                            <span className="hidden lg:inline-block text-[10px] font-bold uppercase tracking-wider">
                              Configuration
                            </span>
                          </Button>
                        </DropdownMenuTrigger>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">Configuration de la table</TooltipContent>
                    </Tooltip>
                    <DropdownMenuContent align="end" className="w-64 border-none p-2 bg-background/95 shadow-lg">
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
                              className="h-8 gap-2 text-[10px] font-bold uppercase tracking-wider hover:bg-primary/10 hover:text-primary"
                              onClick={() => {
                                if (!metadata) return;
                                const defaults = getDefaultHiddenColumnIds(metadata, {
                                  showReversed,
                                  showCount,
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
                              const isVisible = resolveColumnVisibility(
                                columnVisibility,
                                col.visibilityKeys,
                              );
                              return (
                                <DropdownMenuCheckboxItem
                                  key={id}
                                  checked={isVisible}
                                  onCheckedChange={(v) => toggleColumn(col, !!v)}
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
                                  className="h-8 gap-2 text-[10px] font-bold uppercase tracking-wider hover:bg-primary/10 hover:text-primary"
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
                                  className="h-8 gap-2 text-[10px] font-bold uppercase tracking-wider hover:bg-primary/10 hover:text-primary"
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
                ) : (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 ">
                        <Settings2 className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="w-56"
                    >
                      <DropdownMenuLabel className="flex items-center gap-2 px-3 py-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                        <SlidersHorizontal className="h-3 w-3" />
                        Affichage & Outils
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() =>
                          setDensity(
                            density === "compact"
                              ? "comfortable"
                              : density === "comfortable"
                                ? "spacious"
                                : "compact",
                          )
                        }
                      >
                        <LayoutGrid className="mr-2 h-4 w-4" />
                        Densité: {density}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setWrapCells(!wrapCells)}
                      >
                        <Layers className="mr-2 h-4 w-4" />
                        Retour a la ligne: {wrapCells ? "Oui" : "Non"}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setDragModeEnabled(!dragModeEnabled)}
                      >
                        <GripVertical className="mr-2 h-4 w-4" />
                        Mode Glisser: {dragModeEnabled ? "Activé" : "Désactivé"}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
              {/* Refresh Cluster */}
              <div className="flex items-center gap-1.5">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:bg-background hover:text-primary"
                      disabled={loading || hardRefreshing}
                    >
                      <RefreshCw
                        className={cn(
                          "h-4 w-4",
                          (loading || hardRefreshing) && "animate-spin",
                        )}
                      />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="w-56"
                  >
                    <DropdownMenuLabel className="px-3 py-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                      Rafraichissement
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => refresh()}
                      disabled={loading || hardRefreshing}
                    >
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Simple refresh
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        void handleHardRefresh();
                      }}
                      disabled={hardRefreshing}
                    >
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Hard refresh
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
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
