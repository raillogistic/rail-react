import React from "react";
import { Button } from "@/lib/components/ui/button";
import { Input } from "@/lib/components/ui/input";
import { AdvancedFilterChips, AdvancedFiltersTrigger } from "./filtering";
import type { AdvancedFilteringController } from "./filtering/types";

/**
 * Props for {@link TableToolbar}.
 * @property showQuickSearch - Render the quick search input when true.
 * @property searchValue - Current quick search value.
 * @property onSearchChange - Handler fired when the quick search value updates.
 * @property onSubmitSearch - Handler fired when the user submits the search.
 * @property quickFilterComponents - Optional inline quick filters rendered after the input.
 * @property toolbarActions - Optional toolbar actions aligned to the right.
 * @property advancedFiltersEnabled - Whether advanced filters are available.
 * @property advancedFiltersController - Controller returned by useAdvancedFiltering.
 * @property advancedTriggerVariant - Visual variant for the advanced filter trigger.
 * @property advancedTriggerLabel - Label for the advanced filter trigger.
 * @property columnVisibilityMenu - Column visibility dropdown trigger/content.
 * @property filterChips - Rendered chips summarizing active filters.
 */
export type TableToolbarProps = {
  showQuickSearch: boolean;
  searchValue: string;
  onSearchChange: (value: string) => void;
  onSubmitSearch: () => void;
  quickFilterComponents?: React.ReactNode;
  toolbarActions?: React.ReactNode;
  advancedFiltersEnabled: boolean;
  advancedFiltersController?: AdvancedFilteringController;
  advancedTriggerVariant?: "icon" | "button";
  advancedTriggerLabel?: string;
  columnVisibilityMenu: React.ReactNode;
  filterChips?: React.ReactNode;
};

/**
 * Renders the toolbar with quick search, quick filters, advanced filters, and column visibility.
 */
export function TableToolbar({
  showQuickSearch,
  searchValue,
  onSearchChange,
  onSubmitSearch,
  quickFilterComponents,
  toolbarActions,
  advancedFiltersEnabled,
  advancedFiltersController,
  advancedTriggerVariant = "icon",
  advancedTriggerLabel = "Filtres avancés",
  columnVisibilityMenu,
  filterChips,
}: TableToolbarProps) {
  return (
    <div className="mb-4 rounded-lg shadow-sm bg-card/60 p-3  space-y-3">
      <div className="flex flex-wrap items-center gap-3 justify-between">
        {showQuickSearch ? (
          <div className="flex items-center gap-2">
            <Input
              className="w-64 h-8 focus-visible:z-10"
              placeholder="Recherche rapide..."
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  onSubmitSearch();
                }
              }}
            />
            {quickFilterComponents}
          </div>
        ) : quickFilterComponents ? (
          <div className="flex items-center gap-2">{quickFilterComponents}</div>
        ) : (
          <span />
        )}
        <div className="flex flex-wrap items-center gap-2">
          {toolbarActions}
          {advancedFiltersEnabled && advancedFiltersController ? (
            <AdvancedFiltersTrigger
              controller={advancedFiltersController}
              variant={advancedTriggerVariant}
              label={advancedTriggerLabel}
            />
          ) : null}
          {columnVisibilityMenu}
        </div>
      </div>
      {advancedFiltersEnabled && advancedFiltersController ? (
        filterChips ?? (
          <AdvancedFilterChips
            controller={advancedFiltersController}
            clearLabel="Effacer les filtres"
          />
        )
      ) : null}
    </div>
  );
}
