import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMutation } from "@apollo/client";
import {
  Download,
  Filter,
  GripVertical,
  ListFilter,
  RefreshCw,
  X,
  Settings2,
  Layers,
  LayoutGrid,
  SlidersHorizontal,
} from "lucide-react";
import { Button } from "@/shared/ui/kit/button";
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
} from "@/shared/ui/kit/dropdown-menu";
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
import { ModelTableExportDialog } from "./ExportDialog";
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
 * GÃ¨re la recherche, les filtres, l'affichage des colonnes, le groupement et l'export.
 * Design moderne, responsive et optimisÃ© pour une utilisation intensive.
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
      title: filterPanel?.title ?? "Filtres AvancÃ©s",
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
          className={cn(
            "group flex flex-col gap-3 bg-transparent transition-all duration-300",
            hasActiveFilters &&
              "ring-1 ring-primary/15 bg-primary/5 rounded-md p-1 -m-1",
          )}
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
              {quickFilters?.length ? <QuickFilters fields={quickFilters} /> : null}

              {/* Status Badges - Visible only if something is active */}
              {!isMobile && (hasActiveFilters || hasGroupedRows) && (
                <div className="flex items-center gap-2 animate-in fade-in zoom-in duration-500">
                  {activeAdvancedFilterCount > 0 && (
                    <Badge
                      variant="secondary"
                      className="h-7 gap-1.5 border-none bg-primary/10 px-3 text-xs font-semibold text-primary transition-all hover:bg-primary/15"
                    >
                      <Filter className="h-3.5 w-3.5 fill-primary/20" />
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
                      className="h-7 gap-1.5 border-none bg-emerald-500/10 px-3 text-xs font-semibold text-emerald-700 transition-all hover:bg-emerald-500/15"
                    >
                      <Layers className="h-3.5 w-3.5 fill-emerald-500/20" />
                      <span>{activeNavFilterCount} raccourcis</span>
                    </Badge>
                  )}
                  {hasGroupedRows && (
                    <Badge
                      variant="outline"
                      className="h-7 gap-1.5 border-primary/15 bg-background px-3 text-xs font-semibold text-foreground/70 transition-all hover:border-primary/30"
                    >
                      <div className="relative flex h-2 w-2">
                        <span className="absolute inline-flex h-full w-full animate-ping bg-primary opacity-75"></span>
                        <span className="relative inline-flex h-2 w-2 bg-primary"></span>
                      </div>
                      <span className="text-[10px] uppercase tracking-wider">
                        GroupÃ© par {groupingField}
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
              {/* Tools Cluster */}
              <div className="flex items-center gap-0.5 bg-muted/20 p-1 transition-all">
                {!isMobile ? (
                  <>
                    <ViewOptionsMenu
                      density={density}
                      onDensityChange={setDensity}
                      wrapCells={wrapCells}
                      onWrapChange={setWrapCells}
                    />

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDragModeEnabled(!dragModeEnabled)}
                          className={cn(
                            "h-8 w-8 transition-all",
                            dragModeEnabled
                              ? "bg-primary/20 text-primary shadow-inner"
                              : "text-muted-foreground hover:bg-background hover:text-foreground",
                          )}
                        >
                          <GripVertical className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">
                        Glisser-dÃ©poser
                      </TooltipContent>
                    </Tooltip>

                    <Separator orientation="vertical" className="mx-1 h-4" />

                    <ColumnsMenu
                      columnSearch={columnSearch}
                      onColumnSearchChange={setColumnSearch}
                      visibleColumns={visibleColumns}
                      columnVisibility={columnVisibility}
                      allColumnsVisible={allColumnsVisible}
                      onToggleColumn={toggleColumn}
                      onSetAllColumnsVisibility={(v) => {
                        const next = { ...columnVisibility };
                        orderedColumns.forEach((c) => {
                          c.visibilityKeys.forEach((key) => {
                            next[key] = v;
                          });
                        });
                        setColumnVisibility(next);
                      }}
                      onApplyDefaultColumnsVisibility={() => {
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
                    />

                    <GroupingMenu
                      groupingField={groupingField}
                      hasGroupedRows={hasGroupedRows}
                      groupableFields={groupableFields}
                      onSetGroupingField={setGroupingField}
                      onResetCollapsed={() => setGroupCollapsed({})}
                      onExpandAll={() => {
                        const next: Record<string, boolean> = {};
                        const keys = new Set<string>();
                        data.forEach((r) =>
                          keys.add(resolveGroupingKey(r, groupingField!)),
                        );
                        keys.forEach((k) => (next[k] = false));
                        setGroupCollapsed(next);
                      }}
                      onCollapseAll={() => {
                        const next: Record<string, boolean> = {};
                        const keys = new Set<string>();
                        data.forEach((r) =>
                          keys.add(resolveGroupingKey(r, groupingField!)),
                        );
                        keys.forEach((k) => (next[k] = true));
                        setGroupCollapsed(next);
                      }}
                    />
                  </>
                ) : (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 ">
                        <Settings2 className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="w-56 border-none shadow-xl backdrop-blur-xl"
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
                        DensitÃ©: {density}
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
                        Mode Glisser:{" "}
                        {dragModeEnabled ? "ActivÃ©" : "DÃ©sactivÃ©"}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
              {/* Filters & Export Cluster */}
              <div className="flex items-center gap-1.5">
                {panelConfig.mode === "modal" ? (
                  <Dialog open={filterOpen} onOpenChange={setFilterOpen}>
                    <DialogTrigger asChild>
                      <Button
                        variant={hasActiveFilters ? "default" : "secondary"}
                        size="sm"
                        className={cn(
                          "h-9 gap-2 px-3.5 font-bold text-[10px] transition-all hover:scale-[1.02] active:scale-[0.98]",
                          hasActiveFilters
                            ? "bg-primary shadow-md shadow-primary/20 ring-1 ring-primary/20"
                            : "bg-muted/30 hover:bg-muted/50",
                        )}
                      >
                        <ListFilter
                          className={cn(
                            "h-4 w-4",
                            hasActiveFilters && "animate-pulse",
                          )}
                        />
                        <span className="hidden sm:inline-block text-[10px] uppercase tracking-wider">
                          Filtres
                        </span>
                        {activeAdvancedFilterCount > 0 && (
                          <Badge className="ml-0.5 flex h-5 w-5 items-center justify-center bg-primary-foreground/20 p-0 text-[10px] font-black backdrop-blur-sm">
                            {activeAdvancedFilterCount}
                          </Badge>
                        )}
                      </Button>
                    </DialogTrigger>
                    <DialogContent
                      className={cn(
                        "flex flex-col overflow-hidden border-none p-0 shadow-3xl bg-background/95 backdrop-blur-xl",
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
                        variant={hasActiveFilters ? "default" : "secondary"}
                        size="sm"
                        className={cn(
                          "h-9 gap-2 px-3.5 font-bold text-[10px] transition-all hover:scale-[1.02] active:scale-[0.98]",
                          hasActiveFilters
                            ? "bg-primary shadow-md shadow-primary/20 ring-1 ring-primary/20"
                            : "bg-muted/30 hover:bg-muted/50 dark:bg-muted/15 dark:hover:bg-muted/25",
                        )}
                      >
                        <ListFilter
                          className={cn(
                            "h-4 w-4",
                            hasActiveFilters && "animate-pulse",
                          )}
                        />
                        <span className="hidden sm:inline-block text-[10px] uppercase tracking-wider">
                          Filtres
                        </span>
                        {activeAdvancedFilterCount > 0 && (
                          <Badge className="ml-0.5 flex h-5 w-5 items-center justify-center bg-primary-foreground/20 p-0 text-[10px] font-black backdrop-blur-sm">
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
                        "p-0 border-none shadow-3xl bg-background/95 backdrop-blur-2xl",
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

                <div className="flex items-center gap-0.5 bg-muted/20 p-1">
                  <ModelTableExportDialog
                    filterVariablesOverride={mergedFilterVariables}
                    labels={tableConfig?.exportLabels}
                    trigger={
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:bg-background hover:text-primary transition-all"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    }
                  />
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:bg-background hover:text-primary transition-all active:scale-90"
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
                      className="w-56 border-none shadow-xl backdrop-blur-xl"
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
        </div>

        {/* Mobile Filter Summary Bar */}
        {isMobile && (hasActiveFilters || hasGroupedRows) && (
          <div className="flex flex-wrap items-center gap-2 px-4 animate-in slide-in-from-top-2 duration-300">
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
