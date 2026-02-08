import { useCallback } from "react";
import { useTable } from "../context/TableContext";
import { FilterFormState, FilterCondition } from "../../form/filters/types";

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

  const addFilterCondition = useCallback((condition: { field: string; operator: string; value: any }) => {
    const root = advancedFilters.root;
    // Check if condition exists in root group
    const existingIndex = root.conditions.findIndex(
        (c) => c.type === "condition" && c.fieldName === condition.field
    );

    let nextConditions = [...root.conditions];
    
    if (existingIndex >= 0) {
        // Update existing
        const existing = nextConditions[existingIndex] as FilterCondition;
        nextConditions[existingIndex] = {
            ...existing,
            operator: condition.operator,
            value: condition.value
        };
    } else {
        // Add new
        const newCondition: FilterCondition = {
            id: Math.random().toString(36).substr(2, 9),
            type: "condition",
            fieldPath: [condition.field],
            fieldName: condition.field,
            operator: condition.operator,
            value: condition.value
        };
        nextConditions.push(newCondition);
    }

    setAdvancedFilters({
        ...advancedFilters,
        root: { ...root, conditions: nextConditions }
    });
  }, [advancedFilters, setAdvancedFilters]);

  const removeFilterCondition = useCallback((id: string) => {
      const root = advancedFilters.root;
      const nextConditions = root.conditions.filter((c) => c.id !== id);
      
      setAdvancedFilters({
          ...advancedFilters,
          root: { ...root, conditions: nextConditions }
      });
  }, [advancedFilters, setAdvancedFilters]);

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
    addFilterCondition,
    removeFilterCondition,
  };
}
