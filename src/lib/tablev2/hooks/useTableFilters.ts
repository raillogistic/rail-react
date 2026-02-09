import { useCallback } from "react";
import { useTable } from "../context/TableContext";
import {
  FilterFormState,
  FilterCondition,
  FilterGroup,
} from "../../form/filters/types";

function serializeCondition(condition: FilterCondition): Record<string, unknown> | null {
  const { value, operator, fieldPath } = condition;
  if (
    value === undefined ||
    value === null ||
    value === "" ||
    (Array.isArray(value) && value.length === 0)
  ) {
    return null;
  }
  const filterValue: Record<string, unknown> = { [operator]: value };
  if (!Array.isArray(fieldPath) || fieldPath.length === 0) {
    return filterValue;
  }
  return [...fieldPath].reverse().reduce<Record<string, unknown>>(
    (acc, segment) => ({ [segment]: acc }),
    filterValue,
  );
}

function serializeGroup(group: FilterGroup): Record<string, unknown> | null {
  const entries = group.conditions
    .map((item) =>
      item.type === "condition"
        ? serializeCondition(item)
        : serializeGroup(item),
    )
    .filter((entry): entry is Record<string, unknown> => !!entry);

  if (entries.length === 0) return null;

  const base =
    entries.length === 1
      ? entries[0]
      : ({ [group.logic]: entries } as Record<string, unknown>);

  if (group.negated) {
    return { NOT: base };
  }
  return base;
}

function buildFallbackVariables(state: FilterFormState): Record<string, unknown> {
  const variables: Record<string, unknown> = {};
  const where = serializeGroup(state.root);
  if (where && Object.keys(where).length > 0) {
    variables.where = where;
  }
  if (state.selectedPresets.length > 0) {
    variables.presets = state.selectedPresets;
  }
  if (state.distinctOn.length > 0) {
    variables.distinctOn = state.distinctOn;
  }
  if (state.orderBy.length > 0) {
    variables.orderBy = state.orderBy;
  }
  return variables;
}

export function useTableFilters() {
  const {
    quickSearch,
    advancedFilters,
    setQuickSearch,
    setAdvancedFilters: setAdvancedFiltersRaw,
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
      setAdvancedFiltersRaw(value, variables ?? buildFallbackVariables(value));
    },
    [setAdvancedFiltersRaw]
  );

  const clearAllFilters = useCallback(() => {
    setQuickSearch("");
    handleAdvancedFiltersChange({
      root: { id: "root", type: "group", logic: "AND", conditions: [], negated: false },
      selectedPresets: [],
      distinctOn: [],
      orderBy: [],
    });
  }, [setQuickSearch, handleAdvancedFiltersChange]);

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

    handleAdvancedFiltersChange({
        ...advancedFilters,
        root: { ...root, conditions: nextConditions }
    });
  }, [advancedFilters, handleAdvancedFiltersChange]);

  const removeFilterCondition = useCallback((id: string) => {
      const root = advancedFilters.root;
      const nextConditions = root.conditions.filter((c) => c.id !== id);
      
      handleAdvancedFiltersChange({
          ...advancedFilters,
          root: { ...root, conditions: nextConditions }
      });
  }, [advancedFilters, handleAdvancedFiltersChange]);

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
