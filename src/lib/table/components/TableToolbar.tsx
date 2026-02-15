import { useMemo, useState } from "react";
import { Download, Filter, GripVertical, ListFilter, RefreshCw, X } from "lucide-react";
import { Button } from "@/lib/components/ui/button";
import { Badge } from "@/lib/components/ui/badge";
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
import { cn } from "@/lib/utils";
import { useTable } from "../context/TableContext";
import { useMetadata } from "../context/MetadataContext";
import { useTableFilters } from "../hooks/useTableFilters";
import { FilterPanel } from "../../filters/FilterPanel";
import {
  FilterFormState,
  FilterQueryVariables,
} from "../../filters/types";
import type {
  ModelTableFilterPanelProps,
  ModelTableV2TableConfig,
} from "../config/types";
import {
  getDefaultHiddenColumnIds,
  resolveColumnVisibility,
  resolveGroupingKey,
} from "../utils";
import { ModelTableExportDialog } from "./ExportDialog";
import { ColumnsMenu, GroupingMenu, QuickSearch, ViewOptionsMenu } from "./toolbar";

export function TableToolbar({
  filterPanel,
  tableConfig,
  quickSearch,
  extraActions,
}: {
  filterPanel?: ModelTableFilterPanelProps;
  tableConfig?: ModelTableV2TableConfig;
  quickSearch?: boolean;
  extraActions?: React.ReactNode;
}) {
  const { app, model, metadata } = useMetadata();
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
    setQuickSearch,
    setAdvancedFilters,
    clearAllFilters,
    hasActiveFilters,
    activeFilterStats,
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
      metadata.fields.map((field) => [field.name || field.fieldName, field]),
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
      return resolveColumnVisibility(columnVisibility, [
        column.name,
        column.fieldName,
      ]);
    });

  const groupableFields = useMemo(() => {
    if (!metadata) return [];
    const disallowed = new Set(["DateField", "DateTimeField", "TimeField", "TextField"]);

    return metadata.fields
      .filter((field) => field.visibility !== "hidden")
      .filter((field) => !disallowed.has(field.fieldType))
      .map((field) => ({
        value: field.name || field.fieldName,
        label: field.verboseName || field.name,
      }));
  }, [metadata]);

  const groupingKeys = useMemo(() => {
    if (!groupingField) return [];
    const keys = new Set<string>();
    data.forEach((row) => keys.add(resolveGroupingKey(row, groupingField)));
    return Array.from(keys);
  }, [data, groupingField]);

  const toggleColumn = (
    column: (typeof orderedColumns)[number],
    checked: boolean,
  ) => {
    setColumnVisibility({
      ...columnVisibility,
      [column.name]: checked,
      [column.fieldName]: checked,
    });
  };

  const handleApplyFilters = (
    variables: FilterQueryVariables,
    state: FilterFormState,
    context?: { source: "manual" | "preset" },
  ) => {
    setAdvancedFilters(state, variables as unknown as Record<string, unknown>);
    if (context?.source !== "preset") {
      setFilterOpen(false);
    }
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

  const setAllColumnsVisibility = (checked: boolean) => {
    const nextVisibility = { ...columnVisibility };
    orderedColumns.forEach((column) => {
      nextVisibility[column.name] = checked;
      nextVisibility[column.fieldName] = checked;
    });
    setColumnVisibility(nextVisibility);
  };

  const applyDefaultColumnsVisibility = () => {
    if (!metadata) return;
    const defaultHidden = getDefaultHiddenColumnIds(metadata);
    const nextVisibility = { ...columnVisibility };
    orderedColumns.forEach((column) => {
      const isVisible =
        !defaultHidden.has(column.name) && !defaultHidden.has(column.fieldName);
      nextVisibility[column.name] = isVisible;
      nextVisibility[column.fieldName] = isVisible;
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

  const activeAdvancedFilterCount = activeFilterStats.activeCount;

  const hasGroupedRows = !!groupingField;

  if (!metadata) return null;

  return (
    <TooltipProvider delayDuration={300}>
      <div className="mb-4 flex flex-col gap-3 animate-in fade-in slide-in-from-top-4 duration-500">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-2xl border border-border/40 bg-card/60 p-2 shadow-[0_8px_30px_rgb(0,0,0,0.02)] backdrop-blur-xl transition-all hover:shadow-[0_8px_40px_rgb(0,0,0,0.04)]">
          <div className="flex flex-1 items-center gap-3 w-full sm:w-auto px-1">
            {quickSearch !== false && supportsQuick && (
              <QuickSearch
                value={quickSearchValue}
                onChange={setQuickSearch}
                placeholder={tableConfig?.searchPlaceholder ?? "Rechercher..."}
                expanded={searchFocused}
                onFocusChange={setSearchFocused}
              />
            )}

            {(hasActiveFilters || hasGroupedRows) && (
              <div className="hidden lg:flex items-center gap-2 ml-2 animate-in fade-in zoom-in-95 duration-300">
                {activeAdvancedFilterCount > 0 && (
                  <Badge 
                    variant="secondary" 
                    className="h-8 gap-2 bg-primary/10 text-primary hover:bg-primary/20 border-none px-3 font-bold transition-all"
                  >
                    <Filter className="h-3.5 w-3.5" />
                    <span>{activeAdvancedFilterCount}</span>
                    <button 
                      onClick={() => clearAllFilters()} 
                      className="ml-1 rounded-full p-0.5 hover:bg-primary/30 transition-colors"
                      title="Effacer les filtres"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                {hasGroupedRows && (
                  <Badge 
                    variant="outline" 
                    className="h-8 gap-2 border-dashed border-primary/30 bg-primary/5 px-3 font-bold transition-all"
                  >
                    <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                    <span className="text-primary/80 uppercase text-[10px] tracking-widest">Groupe</span>
                    <button 
                      onClick={() => setGroupingField(null)} 
                      className="ml-1 rounded-full p-0.5 hover:bg-primary/10 transition-colors"
                    >
                      <X className="h-3 w-3 text-primary" />
                    </button>
                  </Badge>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-1.5 w-full sm:w-auto px-1">
            {extraActions ? (
              <>
                <div className="flex items-center p-1 bg-muted/20 rounded-xl border border-border/10">
                  {extraActions}
                </div>
                <div className="h-6 w-px bg-border/20 mx-1" />
              </>
            ) : null}

            <div className="flex items-center p-1 bg-muted/20 rounded-xl border border-border/10">
              <ViewOptionsMenu
                density={density}
                onDensityChange={setDensity}
                wrapCells={wrapCells}
                onWrapChange={setWrapCells}
              />

              <div className="h-4 w-px bg-border/20 mx-1" />

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDragModeEnabled(!dragModeEnabled)}
                    aria-label={
                      dragModeEnabled
                        ? "Desactiver le glisser-deposer"
                        : "Activer le glisser-deposer"
                    }
                    className={cn(
                      "h-8 w-8 p-0 rounded-lg transition-all",
                      dragModeEnabled
                        ? "bg-primary/10 text-primary hover:bg-primary/20"
                        : "hover:bg-background hover:text-primary",
                    )}
                  >
                    <GripVertical className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {dragModeEnabled
                    ? "Desactiver le glisser-deposer"
                    : "Activer le glisser-deposer"}
                </TooltipContent>
              </Tooltip>

              <div className="h-4 w-px bg-border/20 mx-1" />

              <ColumnsMenu
                columnSearch={columnSearch}
                onColumnSearchChange={setColumnSearch}
                visibleColumns={visibleColumns}
                columnVisibility={columnVisibility}
                allColumnsVisible={allColumnsVisible}
                onToggleColumn={toggleColumn}
                onSetAllColumnsVisibility={setAllColumnsVisibility}
                onApplyDefaultColumnsVisibility={applyDefaultColumnsVisibility}
              />
            </div>

            <div className="h-6 w-px bg-border/20 mx-1" />

            {panelDefaults.mode === "modal" ? (
              <Dialog open={filterOpen} onOpenChange={setFilterOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant={hasActiveFilters ? "secondary" : "ghost"}
                    size="sm"
                    className={cn(
                      "h-9 px-3 gap-2.5 rounded-xl font-bold transition-all", 
                      hasActiveFilters ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20" : "hover:bg-muted/60"
                    )}
                  >
                    <ListFilter className={cn("h-4 w-4", hasActiveFilters ? "animate-pulse" : "text-muted-foreground")} />
                    <span className="hidden sm:inline-block text-xs uppercase tracking-widest">Filtres</span>
                    {hasActiveFilters && (
                      <span className="ml-1 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-background/20 text-[10px] font-black">
                        {activeAdvancedFilterCount}
                      </span>
                    )}
                  </Button>
                </DialogTrigger>
                <DialogContent className={`max-h-[90vh] overflow-hidden p-0 flex flex-col rounded-3xl border-none shadow-2xl backdrop-blur-2xl bg-background/95 ${panelWidthClassName}`}>
                  <DialogHeader className="border-b border-border/20 px-6 py-4 bg-muted/10">
                    <DialogTitle className="text-xl font-black uppercase tracking-tighter">{panelDefaults.title}</DialogTitle>
                  </DialogHeader>
                  <div className="flex-1 overflow-auto custom-scrollbar">
                    {filterOpen ? renderFilterContent() : null}
                  </div>
                </DialogContent>
              </Dialog>
            ) : (
              <Sheet open={filterOpen} onOpenChange={setFilterOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant={hasActiveFilters ? "secondary" : "ghost"}
                    size="sm"
                    className={cn(
                      "h-9 px-3 gap-2.5 rounded-xl font-bold transition-all", 
                      hasActiveFilters ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20" : "hover:bg-muted/60"
                    )}
                  >
                    <ListFilter className={cn("h-4 w-4", hasActiveFilters ? "animate-pulse" : "text-muted-foreground")} />
                    <span className="hidden sm:inline-block text-xs uppercase tracking-widest">Filtres</span>
                    {hasActiveFilters && (
                      <span className="ml-1 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-background/20 text-[10px] font-black">
                        {activeAdvancedFilterCount}
                      </span>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent side={panelDefaults.side} className={`p-0 border-none shadow-2xl backdrop-blur-2xl bg-background/95 ${panelWidthClassName}`}>
                  <SheetHeader className="border-b border-border/20 px-6 py-4 bg-muted/10">
                    <SheetTitle className="text-xl font-black uppercase tracking-tighter">{panelDefaults.title}</SheetTitle>
                  </SheetHeader>
                  <div className="h-full overflow-auto custom-scrollbar">
                    {filterOpen ? renderFilterContent() : null}
                  </div>
                </SheetContent>
              </Sheet>
            )}

            <div className="flex items-center p-1 bg-muted/20 rounded-xl border border-border/10">
              <GroupingMenu
                groupingField={groupingField}
                hasGroupedRows={hasGroupedRows}
                groupableFields={groupableFields}
                onSetGroupingField={setGroupingField}
                onResetCollapsed={() => setGroupCollapsed({})}
                onExpandAll={handleExpandAllGroups}
                onCollapseAll={handleCollapseAllGroups}
              />

              <ModelTableExportDialog
                labels={tableConfig?.exportLabels}
                trigger={
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg hover:bg-background hover:text-primary transition-all">
                    <Download className="h-4 w-4" />
                  </Button>
                }
              />

              <div className="h-4 w-px bg-border/20 mx-1" />

              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 w-8 p-0 rounded-lg hover:bg-background hover:text-primary transition-all active:scale-90" 
                onClick={() => refresh()}
                disabled={loading}
              >
                <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
