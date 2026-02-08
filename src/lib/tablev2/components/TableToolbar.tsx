import { useMemo, useState } from "react";
import { Check, Columns3Icon, Filter, Rows3, Search } from "lucide-react";
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
import { Switch } from "@/lib/components/ui/switch";
import { useTable } from "../context/TableContext";
import { useMetadata } from "../context/MetadataContext";
import { useTableFilters } from "../hooks/useTableFilters";
import { FilterPanel } from "../../form/filters/FilterPanel";
import {
  FilterFormState,
  FilterQueryVariables,
} from "../../form/filters/types";
import type { ModelTableFilterPanelProps, ModelTableV2TableConfig } from "../index";
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
    groupingField,
    setGroupingField,
    setGroupCollapsed,
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
    // variables contains the compiled GraphQL query variables (where, presets, etc.)
    // state contains the UI state (FilterFormState)

    // We update the context with the new filter state
    // This will trigger useTableData to re-run
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

  if (!metadata) return null;

  return (
    <div className="mb-4 space-y-3 rounded-lg bg-card/60 p-3 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-1 items-center gap-2">
          {quickSearch !== false && supportsQuick ? (
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                className="h-8 w-64 pl-8 focus-visible:z-10"
                placeholder={tableConfig?.searchPlaceholder ?? "Recherche rapide..."}
                value={quickSearchValue}
                onChange={(event) => setQuickSearch(event.target.value)}
              />
            </div>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {panelDefaults.mode === "modal" ? (
            <Dialog open={filterOpen} onOpenChange={setFilterOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="relative h-8 w-8"
                  title={panelDefaults.title}
                  aria-label={panelDefaults.title}
                >
                  <Filter className="h-4 w-4" />
                  {hasActiveFilters && (
                    <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-primary" />
                  )}
                </Button>
              </DialogTrigger>
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
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="relative h-8 w-8"
                  title={panelDefaults.title}
                  aria-label={panelDefaults.title}
                >
                  <Filter className="h-4 w-4" />
                  {hasActiveFilters && (
                    <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-primary" />
                  )}
                </Button>
              </SheetTrigger>
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

          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                title="Regrouper les lignes"
                aria-label="Regrouper les lignes"
              >
                <Rows3 className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <div className="px-2 py-1 text-xs text-muted-foreground">
                Regrouper par
              </div>
              <DropdownMenuItem
                onClick={() => {
                  setGroupingField(null);
                  setGroupCollapsed({});
                }}
              >
                <div className="flex items-center gap-2">
                  {groupingField === null ? (
                    <Check className="h-3.5 w-3.5" />
                  ) : (
                    <span className="inline-block h-3.5 w-3.5" />
                  )}
                  <span>Aucun regroupement</span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {groupableFields.map((field) => (
                <DropdownMenuItem
                  key={field.value}
                  onClick={() => setGroupingField(field.value)}
                >
                  <div className="flex items-center gap-2">
                    {groupingField === field.value ? (
                      <Check className="h-3.5 w-3.5" />
                    ) : (
                      <span className="inline-block h-3.5 w-3.5" />
                    )}
                    <span>{field.label}</span>
                  </div>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <div className="flex items-center justify-between px-2 py-1 text-xs">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleExpandAllGroups}
                  disabled={!groupingField}
                >
                  Tout ouvrir
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCollapseAllGroups}
                  disabled={!groupingField}
                >
                  Tout fermer
                </Button>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          <ModelTableExportDialog labels={tableConfig?.exportLabels} />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                title={tableConfig?.columnsLabel ?? "Selectionner les colonnes"}
                aria-label={tableConfig?.columnsLabel ?? "Selectionner les colonnes"}
              >
                <Columns3Icon className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-64 p-2" align="end">
              <div className="mb-2">
                <Input
                  placeholder="Rechercher une colonne..."
                  value={columnSearch}
                  onChange={(event) => setColumnSearch(event.target.value)}
                />
              </div>
              <div className="mb-2 flex items-center justify-between gap-2 text-xs text-muted-foreground">
                <label className="flex items-center gap-2 font-medium">
                  <span>Afficher toutes les colonnes</span>
                  <Switch
                    checked={allColumnsVisible}
                    onCheckedChange={(checked) =>
                      setAllColumnsVisibility(Boolean(checked))
                    }
                  />
                </label>
              </div>
              <div className="max-h-64 overflow-auto pr-1">
                {visibleColumns.map((column) => {
                  const id = column.fieldName || column.name;
                  return (
                    <DropdownMenuCheckboxItem
                      key={id}
                      checked={columnVisibility[id] ?? true}
                      onCheckedChange={(value) => toggleColumn(id, !!value)}
                    >
                      {column.verboseName || column.name}
                    </DropdownMenuCheckboxItem>
                  );
                })}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      {hasActiveFilters && (
        <div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => clearAllFilters()}
            className="h-8 px-2 lg:px-3"
          >
            {tableConfig?.resetLabel ?? "Reinitialiser"}
          </Button>
        </div>
      )}
    </div>
  );
}
