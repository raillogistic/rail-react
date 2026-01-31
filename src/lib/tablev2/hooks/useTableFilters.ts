import { useCallback } from "react";
import { useTable } from "../context/TableContext";
import { FilterFormState } from "../../form/filters/types";

export function useTableFilters() {
  const {
    quickSearch,
    advancedFilters,
    setQuickSearch,
    setAdvancedFilters,
    // pagination often needed to reset page on filter change (handled in reducer)
  } = useTable();

  const handleQuickSearchChange = useCallback(
    (value: string) => {
      setQuickSearch(value);
    },
    [setQuickSearch]
  );

  const handleAdvancedFiltersChange = useCallback(
    (value: FilterFormState, variables?: Record<string, unknown>) => {
      setAdvancedFilters(value, variables);
    },
    [setAdvancedFilters]
  );

  const clearAllFilters = useCallback(() => {
    setQuickSearch("");
    setAdvancedFilters({
      root: { id: "root", type: "group", logic: "AND", conditions: [], negated: false },
      selectedPresets: [],
      distinctOn: [],
      orderBy: [],
    });
  }, [setQuickSearch, setAdvancedFilters]);

  // Check if any filters are active
  const hasActiveFilters =
    !!quickSearch ||
    advancedFilters.root.conditions.length > 0 ||
    advancedFilters.selectedPresets.length > 0;

  return {
    quickSearch,
    advancedFilters,
    setQuickSearch: handleQuickSearchChange,
    setAdvancedFilters: handleAdvancedFiltersChange,
    clearAllFilters,
    hasActiveFilters,
  };
}
