import { useMemo, useState } from "react";
import { Download, Filter, ListFilter, RefreshCw, X } from "lucide-react";
import { Button } from "@/lib/components/ui/button";
import { Badge } from "@/lib/components/ui/badge";
import { Separator } from "@/lib/components/ui/separator";
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
  TooltipProvider,
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
import { getDefaultHiddenColumnIds, resolveGroupingKey } from "../utils";
import { ModelTableExportDialog } from "./ExportDialog";
import { ColumnsMenu, GroupingMenu, QuickSearch, ViewOptionsMenu } from "./toolbar";

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
      const id = column.fieldName || column.name;
      return columnVisibility[id] ?? true;
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

  const toggleColumn = (columnId: string, checked: boolean) => {
    setColumnVisibility({
      ...columnVisibility,
      [columnId]: checked,
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
      const id = column.fieldName || column.name;
      nextVisibility[id] = checked;
    });
    setColumnVisibility(nextVisibility);
  };

  const applyDefaultColumnsVisibility = () => {
    if (!metadata) return;
    const defaultHidden = getDefaultHiddenColumnIds(metadata);
    const nextVisibility = { ...columnVisibility };
    orderedColumns.forEach((column) => {
      const id = column.fieldName || column.name;
      nextVisibility[id] = !defaultHidden.has(id);
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
    advancedFilters.selectedPresets.length;

  const hasGroupedRows = !!groupingField;

  if (!metadata) return null;

  return (
    <TooltipProvider delayDuration={300}>
      <div className="mb-4 flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-lg border bg-card p-1 shadow-sm">
          <div className="flex flex-1 items-center gap-2 w-full sm:w-auto px-1">
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
              <div className="hidden lg:flex items-center gap-2 ml-2">
                {activeAdvancedFilterCount > 0 && (
                  <Badge variant="secondary" className="h-6 gap-1 bg-primary/10 text-primary hover:bg-primary/20">
                    <Filter className="h-3 w-3" />
                    <span>{activeAdvancedFilterCount}</span>
                    <button onClick={() => clearAllFilters()} className="ml-1 rounded-full p-0.5 hover:bg-primary/20">
                      <X className="h-2.5 w-2.5" />
                    </button>
                  </Badge>
                )}
                {hasGroupedRows && (
                  <Badge variant="outline" className="h-6 gap-1 border-dashed">
                    <Filter className="h-3 w-3 text-muted-foreground" />
                    <span className="text-muted-foreground">Groupe</span>
                    <button onClick={() => setGroupingField(null)} className="ml-1 rounded-full p-0.5 hover:bg-muted">
                      <X className="h-2.5 w-2.5" />
                    </button>
                  </Badge>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-1 w-full sm:w-auto px-1">
            <ViewOptionsMenu
              density={density}
              onDensityChange={setDensity}
              wrapCells={wrapCells}
              onWrapChange={setWrapCells}
            />

            <Separator orientation="vertical" className="h-5" />

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

            {panelDefaults.mode === "modal" ? (
              <Dialog open={filterOpen} onOpenChange={setFilterOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant={hasActiveFilters ? "secondary" : "ghost"}
                    size="sm"
                    className={cn("h-8 gap-2", hasActiveFilters && "bg-primary/10 text-primary hover:bg-primary/20")}
                  >
                    <ListFilter className="h-4 w-4" />
                    <span className="hidden sm:inline-block text-xs">Filtres</span>
                    {hasActiveFilters && (
                      <span className="ml-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                        {activeAdvancedFilterCount}
                      </span>
                    )}
                  </Button>
                </DialogTrigger>
                <DialogContent className={`max-h-[90vh] overflow-hidden p-0 flex flex-col ${panelWidthClassName}`}>
                  <DialogHeader className="border-b px-4 py-3">
                    <DialogTitle>{panelDefaults.title}</DialogTitle>
                  </DialogHeader>
                  {filterOpen ? renderFilterContent() : null}
                </DialogContent>
              </Dialog>
            ) : (
              <Sheet open={filterOpen} onOpenChange={setFilterOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant={hasActiveFilters ? "secondary" : "ghost"}
                    size="sm"
                    className={cn("h-8 gap-2", hasActiveFilters && "bg-primary/10 text-primary hover:bg-primary/20")}
                  >
                    <ListFilter className="h-4 w-4" />
                    <span className="hidden sm:inline-block text-xs">Filtres</span>
                    {hasActiveFilters && (
                      <span className="ml-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                        {activeAdvancedFilterCount}
                      </span>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent side={panelDefaults.side} className={`p-0 ${panelWidthClassName}`}>
                  <SheetHeader className="border-b">
                    <SheetTitle>{panelDefaults.title}</SheetTitle>
                  </SheetHeader>
                  {filterOpen ? renderFilterContent() : null}
                </SheetContent>
              </Sheet>
            )}

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
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <Download className="h-4 w-4 text-muted-foreground" />
                </Button>
              }
            />

            <Separator orientation="vertical" className="h-5" />

            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => refresh()}>
              <RefreshCw className="h-4 w-4 text-muted-foreground" />
            </Button>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
