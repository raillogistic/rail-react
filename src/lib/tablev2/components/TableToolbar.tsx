import { useMemo, useState } from "react";
import {
  Check,
  Columns3Icon,
  Download,
  Filter,
  Layers,
  RefreshCw,
  Search,
  Settings2,
  SlidersHorizontal,
  WrapText,
  X,
} from "lucide-react";
import { Input } from "@/lib/components/ui/input";
import { Button } from "@/lib/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/lib/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/lib/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/lib/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/lib/components/ui/tooltip";
import { Switch } from "@/lib/components/ui/switch";
import { cn } from "@/lib/utils";
import { useTable } from "../context/TableContext";
import { useMetadata } from "../context/MetadataContext";
import { useTableFilters } from "../hooks/useTableFilters";
import { FilterPanel } from "../../form/filters/FilterPanel";
import {
  FilterFormState,
  FilterQueryVariables,
} from "../../form/filters/types";
import type {
  ModelTableFilterPanelProps,
  ModelTableV2TableConfig,
} from "../index";
import { resolveGroupingKey } from "../utils";
import { ModelTableExportDialog } from "./ExportDialog";

export function TableToolbar({
  filterPanel,
  tableConfig,
  quickSearch,
}: {
  filterPanel?: ModelTableFilterPanelProps;
  tableConfig?: ModelTableV2TableConfig;
  quickSearch?: boolean;
}) {
  const { app, model, metadata } = useMetadata();
  const {
    columnVisibility,
    setColumnVisibility,
    columnOrder,
    data,
    pagination,
    groupingField,
    setGroupingField,
    setGroupCollapsed,
    density,
    setDensity,
    wrapCells,
    setWrapCells,
    refresh,
  } = useTable();
  const {
    quickSearch: quickSearchValue,
    setQuickSearch,
    setAdvancedFilters,
    clearAllFilters,
    hasActiveFilters,
    advancedFilters,
  } = useTableFilters();

  const panelDefaults = useMemo(
    () => ({
      mode: filterPanel?.mode ?? "drawer",
      defaultOpen: filterPanel?.defaultOpen ?? false,
      title: filterPanel?.title ?? "Filtres",
      widthClassName: filterPanel?.widthClassName ?? "sm:w-1/2 sm:max-w-none",
      side: filterPanel?.side ?? "right",
    }),
    [filterPanel],
  );

  const panelWidthClassName = useMemo(() => {
    const baseWidth = "w-screen max-w-screen";
    if (!filterPanel?.widthClassName) {
      return `${baseWidth} ${panelDefaults.widthClassName}`;
    }
    return `${baseWidth} ${filterPanel.widthClassName} sm:max-w-none`;
  }, [filterPanel?.widthClassName, panelDefaults.widthClassName]);

  const [filterOpen, setFilterOpen] = useState(panelDefaults.defaultOpen);
  const [columnSearch, setColumnSearch] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);

  const supportsQuick = !!metadata?.filterConfig?.supportsQuick;

  const orderedColumns = useMemo(() => {
    if (!metadata) return [];
    const byName = new Map(metadata.fields.map((field) => [field.name, field]));
    const byFieldName = new Map(
      metadata.fields.map((field) => [field.fieldName || field.name, field]),
    );

    const ordered: typeof metadata.fields = [];
    const seen = new Set<string>();

    columnOrder.forEach((columnId) => {
      const field = byName.get(columnId) || byFieldName.get(columnId);
      if (!field) return;
      if (seen.has(field.name)) return;
      ordered.push(field);
      seen.add(field.name);
    });

    metadata.fields.forEach((field) => {
      if (seen.has(field.name)) return;
      ordered.push(field);
      seen.add(field.name);
    });

    return ordered;
  }, [columnOrder, metadata]);

  const visibleColumns = useMemo(
    () =>
      orderedColumns.filter((column) =>
        (column.verboseName || column.name)
          .toLowerCase()
          .includes(columnSearch.toLowerCase()),
      ),
    [columnSearch, orderedColumns],
  );

  const allColumnsVisible =
    orderedColumns.length > 0 &&
    orderedColumns.every((column) => {
      const id = column.fieldName || column.name;
      return columnVisibility[id] ?? true;
    });

  const groupableFields = useMemo(() => {
    if (!metadata) return [];
    const disallowed = new Set([
      "DateField",
      "DateTimeField",
      "TimeField",
      "TextField",
    ]);

    return metadata.fields
      .filter((field) => field.visibility !== "hidden")
      .filter((field) => !disallowed.has(field.fieldType))
      .map((field) => ({
        value: field.fieldName || field.name,
        label: field.verboseName || field.name,
      }));
  }, [metadata]);

  const groupingKeys = useMemo(() => {
    if (!groupingField) return [];
    const keys = new Set<string>();
    data.forEach((row) => keys.add(resolveGroupingKey(row, groupingField)));
    return Array.from(keys);
  }, [data, groupingField]);

  // Handle column toggling
  const toggleColumn = (columnId: string, checked: boolean) => {
    setColumnVisibility({
      ...columnVisibility,
      [columnId]: checked,
    });
  };

  const handleApplyFilters = (
    variables: FilterQueryVariables,
    state: FilterFormState,
  ) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setAdvancedFilters(state, variables as any);
    setFilterOpen(false);
  };

  const filterContent = (
    <FilterPanel
      app={app}
      model={model}
      layout="panel"
      onApply={handleApplyFilters}
      initialState={advancedFilters}
      {...filterPanel}
    />
  );

  const setAllColumnsVisibility = (checked: boolean) => {
    const nextVisibility = { ...columnVisibility };
    orderedColumns.forEach((column) => {
      const id = column.fieldName || column.name;
      nextVisibility[id] = checked;
    });
    setColumnVisibility(nextVisibility);
  };

  const handleExpandAllGroups = () => {
    if (!groupingField) return;
    const nextCollapsed: Record<string, boolean> = {};
    groupingKeys.forEach((key) => {
      nextCollapsed[key] = false;
    });
    setGroupCollapsed(nextCollapsed);
  };

  const handleCollapseAllGroups = () => {
    if (!groupingField) return;
    const nextCollapsed: Record<string, boolean> = {};
    groupingKeys.forEach((key) => {
      nextCollapsed[key] = true;
    });
    setGroupCollapsed(nextCollapsed);
  };

  const activeAdvancedFilterCount =
    advancedFilters.root.conditions.length +
    advancedFilters.selectedPresets.length +
    (quickSearchValue ? 1 : 0);
  const hasGroupedRows = !!groupingField;
  const totalLabel = pagination.totalKnown
    ? `${pagination.total} ligne${pagination.total > 1 ? "s" : ""}`
    : `${data.length} chargee${data.length > 1 ? "s" : ""}`;
  const densityLabels = {
    compact: tableConfig?.densityOptions?.compact ?? "Compact",
    comfortable: tableConfig?.densityOptions?.comfortable ?? "Confort",
    spacious: tableConfig?.densityOptions?.spacious ?? "Large",
  };

  if (!metadata) return null;

  return (
    <TooltipProvider delayDuration={300}>
      <div className="mb-4 space-y-0 overflow-hidden rounded-xl border border-border/50 bg-card/80 shadow-sm backdrop-blur-sm">
        {/* Main toolbar row */}
        <div className="flex flex-wrap items-center gap-2 p-2.5">
          {/* Search section */}
          {quickSearch !== false && supportsQuick ? (
            <div
              className={cn(
                "group relative flex-1 min-w-[200px] max-w-md transition-all duration-300",
                searchFocused && "max-w-lg",
              )}
            >
              <Search
                className={cn(
                  "absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors duration-200",
                  searchFocused ? "text-primary" : "text-muted-foreground/50",
                )}
              />
              <Input
                className={cn(
                  "h-9 w-full pl-9 pr-8 rounded-lg border-border/50 bg-muted/30",
                  "placeholder:text-muted-foreground/40",
                  "transition-all duration-200",
                  "focus:bg-background focus:border-primary/30 focus:ring-2 focus:ring-primary/10",
                )}
                placeholder={
                  tableConfig?.searchPlaceholder ?? "Recherche rapide..."
                }
                value={quickSearchValue}
                onChange={(event) => setQuickSearch(event.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
              />
              {quickSearchValue && (
                <button
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md hover:bg-muted/60 transition-colors"
                  onClick={() => setQuickSearch("")}
                >
                  <X className="h-3 w-3 text-muted-foreground" />
                </button>
              )}
            </div>
          ) : null}

          {/* Spacer */}
          <div className="flex-1" />

          {/* Action buttons group */}
          <div className="flex items-center gap-1">
            {/* Refresh */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-lg hover:bg-muted/60"
                  onClick={() => refresh()}
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">
                {tableConfig?.refreshLabel ?? "Rafraichir"}
              </TooltipContent>
            </Tooltip>

            {/* Divider */}
            <div className="mx-1 h-5 w-px bg-border/50" />

            {/* Filter button */}
            {panelDefaults.mode === "modal" ? (
              <Dialog open={filterOpen} onOpenChange={setFilterOpen}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <DialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className={cn(
                          "relative h-8 w-8 rounded-lg hover:bg-muted/60",
                          hasActiveFilters && "text-primary",
                        )}
                      >
                        <Filter className="h-4 w-4" />
                        {hasActiveFilters && (
                          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-semibold text-primary-foreground">
                            {activeAdvancedFilterCount}
                          </span>
                        )}
                      </Button>
                    </DialogTrigger>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="text-xs">
                    {panelDefaults.title}
                  </TooltipContent>
                </Tooltip>
                <DialogContent
                  className={`max-h-[90vh] overflow-hidden p-0 flex flex-col ${panelWidthClassName}`}
                >
                  <DialogHeader className="border-b px-4 py-3">
                    <DialogTitle>{panelDefaults.title}</DialogTitle>
                  </DialogHeader>
                  {filterContent}
                </DialogContent>
              </Dialog>
            ) : (
              <Sheet open={filterOpen} onOpenChange={setFilterOpen}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <SheetTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className={cn(
                          "relative h-8 w-8 rounded-lg hover:bg-muted/60",
                          hasActiveFilters && "text-primary",
                        )}
                      >
                        <Filter className="h-4 w-4" />
                        {hasActiveFilters && (
                          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-semibold text-primary-foreground">
                            {activeAdvancedFilterCount}
                          </span>
                        )}
                      </Button>
                    </SheetTrigger>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="text-xs">
                    {panelDefaults.title}
                  </TooltipContent>
                </Tooltip>
                <SheetContent
                  side={panelDefaults.side}
                  className={`p-0 ${panelWidthClassName}`}
                >
                  <SheetHeader className="border-b">
                    <SheetTitle>{panelDefaults.title}</SheetTitle>
                  </SheetHeader>
                  {filterContent}
                </SheetContent>
              </Sheet>
            )}

            {/* Group by dropdown */}
            <DropdownMenu modal={false}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={cn(
                        "h-8 w-8 rounded-lg hover:bg-muted/60",
                        hasGroupedRows && "text-primary",
                      )}
                    >
                      <Layers className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">
                  Regrouper
                </TooltipContent>
              </Tooltip>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                  Regrouper par
                </div>
                <DropdownMenuItem
                  onClick={() => {
                    setGroupingField(null);
                    setGroupCollapsed({});
                  }}
                  className="gap-2"
                >
                  {groupingField === null ? (
                    <Check className="h-3.5 w-3.5 text-primary" />
                  ) : (
                    <span className="h-3.5 w-3.5" />
                  )}
                  <span>Aucun regroupement</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {groupableFields.map((field) => (
                  <DropdownMenuItem
                    key={field.value}
                    onClick={() => setGroupingField(field.value)}
                    className="gap-2"
                  >
                    {groupingField === field.value ? (
                      <Check className="h-3.5 w-3.5 text-primary" />
                    ) : (
                      <span className="h-3.5 w-3.5" />
                    )}
                    <span>{field.label}</span>
                  </DropdownMenuItem>
                ))}
                {hasGroupedRows && (
                  <>
                    <DropdownMenuSeparator />
                    <div className="flex items-center gap-1 px-2 py-1.5">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 flex-1 text-xs"
                        onClick={handleExpandAllGroups}
                      >
                        Tout ouvrir
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 flex-1 text-xs"
                        onClick={handleCollapseAllGroups}
                      >
                        Tout fermer
                      </Button>
                    </div>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Columns dropdown */}
            <DropdownMenu>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-lg hover:bg-muted/60"
                    >
                      <Columns3Icon className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">
                  {tableConfig?.columnsLabel ?? "Colonnes"}
                </TooltipContent>
              </Tooltip>
              <DropdownMenuContent className="w-64 p-2" align="end">
                <div className="mb-2">
                  <Input
                    placeholder="Rechercher..."
                    value={columnSearch}
                    onChange={(event) => setColumnSearch(event.target.value)}
                    className="h-8 text-sm"
                  />
                </div>
                <div className="mb-2 flex items-center justify-between gap-2 px-1 text-xs">
                  <span className="text-muted-foreground">Tout afficher</span>
                  <Switch
                    checked={allColumnsVisible}
                    onCheckedChange={(checked) =>
                      setAllColumnsVisibility(Boolean(checked))
                    }
                  />
                </div>
                <DropdownMenuSeparator className="my-1" />
                <div className="max-h-64 overflow-auto">
                  {visibleColumns.map((column) => {
                    const id = column.fieldName || column.name;
                    return (
                      <DropdownMenuCheckboxItem
                        key={id}
                        checked={columnVisibility[id] ?? true}
                        onCheckedChange={(value) => toggleColumn(id, !!value)}
                        className="text-sm"
                      >
                        {column.verboseName || column.name}
                      </DropdownMenuCheckboxItem>
                    );
                  })}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* View options dropdown */}
            <DropdownMenu>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-lg hover:bg-muted/60"
                    >
                      <Settings2 className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">
                  {tableConfig?.viewLabel ?? "Affichage"}
                </TooltipContent>
              </Tooltip>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                  {tableConfig?.densityLabel ?? "Densite"}
                </div>
                <DropdownMenuItem
                  onClick={() => setDensity("compact")}
                  className="gap-2"
                >
                  {density === "compact" ? (
                    <Check className="h-3.5 w-3.5 text-primary" />
                  ) : (
                    <span className="h-3.5 w-3.5" />
                  )}
                  <span>{densityLabels.compact}</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setDensity("comfortable")}
                  className="gap-2"
                >
                  {density === "comfortable" ? (
                    <Check className="h-3.5 w-3.5 text-primary" />
                  ) : (
                    <span className="h-3.5 w-3.5" />
                  )}
                  <span>{densityLabels.comfortable}</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setDensity("spacious")}
                  className="gap-2"
                >
                  {density === "spacious" ? (
                    <Check className="h-3.5 w-3.5 text-primary" />
                  ) : (
                    <span className="h-3.5 w-3.5" />
                  )}
                  <span>{densityLabels.spacious}</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <div className="flex items-center justify-between gap-2 px-2 py-2">
                  <div className="flex items-center gap-2 text-sm">
                    <WrapText className="h-4 w-4 text-muted-foreground" />
                    <span>{tableConfig?.wrapCellsLabel ?? "Retour ligne"}</span>
                  </div>
                  <Switch
                    checked={wrapCells}
                    onCheckedChange={(checked) =>
                      setWrapCells(Boolean(checked))
                    }
                  />
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Export */}
            <ModelTableExportDialog labels={tableConfig?.exportLabels} />
          </div>
        </div>

        {/* Status bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/30 bg-muted/20 px-3 py-1.5">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs text-muted-foreground">{totalLabel}</span>
            {hasGroupedRows && (
              <>
                <span className="text-muted-foreground/30">|</span>
                <span className="text-xs text-muted-foreground">Regroupe</span>
              </>
            )}
            {hasActiveFilters && (
              <>
                <span className="text-muted-foreground/30">|</span>
                <span className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-1.5 py-0.5 text-xs text-primary">
                  {activeAdvancedFilterCount} filtre
                  {activeAdvancedFilterCount > 1 ? "s" : ""}
                </span>
              </>
            )}
          </div>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => clearAllFilters()}
              className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
            >
              {tableConfig?.resetLabel ?? "Reinitialiser"}
            </Button>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}
