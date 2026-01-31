import { useState } from "react";
import { Search, X, Filter, Columns } from "lucide-react";
import { Input } from "@/lib/components/ui/input";
import { Button } from "@/lib/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
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
import { useTable } from "../context/TableContext";
import { useMetadata } from "../context/MetadataContext";
import { useTableFilters } from "../hooks/useTableFilters";
import { FilterPanel } from "../../form/filters/FilterPanel";
import {
  FilterFormState,
  FilterQueryVariables,
} from "../../form/filters/types";

export function TableToolbar() {
  const { app, model, metadata } = useMetadata();
  const { columnVisibility, setColumnVisibility } = useTable();
  const {
    quickSearch,
    setQuickSearch,
    setAdvancedFilters,
    clearAllFilters,
    hasActiveFilters,
    advancedFilters,
  } = useTableFilters();

  const [filterOpen, setFilterOpen] = useState(false);

  if (!metadata) return null;

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

  return (
    <div className="flex items-center justify-between py-4 gap-2">
      <div className="flex flex-1 items-center space-x-2">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search..."
            value={quickSearch}
            onChange={(event) => setQuickSearch(event.target.value)}
            className="pl-8"
          />
        </div>

        <Dialog open={filterOpen} onOpenChange={setFilterOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="border-dashed">
              <Filter className="mr-2 h-4 w-4" />
              Filters
              {hasActiveFilters && (
                <span className="ml-1 rounded-full bg-primary w-2 h-2" />
              )}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden flex flex-col">
            <FilterPanel
              app={app}
              model={model}
              layout="panel"
              onApply={handleApplyFilters}
              initialState={advancedFilters}
            />
          </DialogContent>
        </Dialog>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            onClick={() => clearAllFilters()}
            className="h-8 px-2 lg:px-3"
          >
            Reset
            <X className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="ml-auto">
            <Columns className="mr-2 h-4 w-4" />
            Columns
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {metadata.fields
            .filter((f) => !f.isPrimaryKey) // Usually don't hide ID via menu? or yes?
            .map((column) => {
              return (
                <DropdownMenuCheckboxItem
                  key={column.name}
                  className="capitalize"
                  checked={columnVisibility[column.name] ?? false}
                  onCheckedChange={(value) =>
                    toggleColumn(column.name, !!value)
                  }
                >
                  {column.verboseName}
                </DropdownMenuCheckboxItem>
              );
            })}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
