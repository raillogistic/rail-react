import { useCallback, useEffect, useMemo } from "react";
import { useTable } from "../context/TableContext";
import {
  FilterFormState,
  RelationFunctionFilter,
} from "../../filters/types";
import {
  appendChild,
  createCondition,
  findAll,
  removeById,
  updateById,
} from "../../filters/tree/operations";
import { buildQueryVariablesFromState } from "../../filters/queryBuilder";
import {
  getActiveFilterStats,
  hasLegacyRelationVariables,
  migrateLegacyRelationState,
  normalizeFilterFormState,
  removeRelationFunctionsByRelation,
  upsertRelationFunction,
} from "../../filters/engine";
import { createInitialFilterState } from "../../filters/state";

type AddConditionInput = {
  field?: string;
  fieldPath?: string[];
  fieldName?: string;
  operator: string;
  value: unknown;
  relationOperator?: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function sameFieldPath(left: string[], right: string[]): boolean {
  if (left.length !== right.length) return false;
  for (let index = 0; index < left.length; index += 1) {
    if (left[index] !== right[index]) return false;
  }
  return true;
}

export function useTableFilters() {
  const {
    quickSearch,
    advancedFilters,
    filterVariables,
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
      const normalizedState = normalizeFilterFormState(value);
      const inputVariables = isRecord(variables) ? variables : undefined;
      const migration = migrateLegacyRelationState({
        state: normalizedState,
        variables: inputVariables,
      });
      const nextState = migration.state;

      if (inputVariables && !migration.migrated) {
        setAdvancedFiltersRaw(nextState, inputVariables);
        return;
      }

      const nextVariables = buildQueryVariablesFromState(nextState) as Record<
        string,
        unknown
      >;
      const migratedVariables = migration.variables;
      if (
        !nextVariables.where &&
        migratedVariables &&
        isRecord(migratedVariables.where)
      ) {
        nextVariables.where = migratedVariables.where;
      }
      if (
        !nextVariables.presets &&
        migratedVariables &&
        Array.isArray(migratedVariables.presets)
      ) {
        nextVariables.presets = migratedVariables.presets;
      }
      if (
        !nextVariables.distinctOn &&
        migratedVariables &&
        Array.isArray(migratedVariables.distinctOn)
      ) {
        nextVariables.distinctOn = migratedVariables.distinctOn;
      }
      if (
        !nextVariables.orderBy &&
        migratedVariables &&
        Array.isArray(migratedVariables.orderBy)
      ) {
        nextVariables.orderBy = migratedVariables.orderBy;
      }
      setAdvancedFiltersRaw(nextState, nextVariables as Record<string, unknown>);
    },
    [setAdvancedFiltersRaw]
  );

  useEffect(() => {
    if (!isRecord(filterVariables)) return;
    if (!hasLegacyRelationVariables(filterVariables)) return;
    handleAdvancedFiltersChange(advancedFilters, filterVariables);
  }, [advancedFilters, filterVariables, handleAdvancedFiltersChange]);

  const clearAllFilters = useCallback(() => {
    setQuickSearch("");
    handleAdvancedFiltersChange(createInitialFilterState());
  }, [setQuickSearch, handleAdvancedFiltersChange]);

  const addFilterCondition = useCallback(
    (input: AddConditionInput) => {
      const nextPath =
        input.fieldPath && input.fieldPath.length > 0
          ? input.fieldPath
          : input.field
            ? [input.field]
            : [];
      if (nextPath.length === 0) return;

      const nextFieldName = input.fieldName ?? nextPath[nextPath.length - 1];
      if (!nextFieldName) return;

      const existing = findAll(
        advancedFilters.root,
        (node) =>
          node.type === "condition" && sameFieldPath(node.fieldPath, nextPath),
      )[0];

      const nextCondition = createCondition(
        nextPath,
        nextFieldName,
        input.operator,
        input.value,
        input.relationOperator,
      );

      let nextRoot = advancedFilters.root;
      if (existing) {
        const updated = updateById(nextRoot, existing.node.id, (node) => ({
          ...node,
          operator: input.operator,
          value: input.value,
          relationOperator: input.relationOperator,
        }));
        if (updated.success) {
          nextRoot = updated.root;
        }
      } else {
        const appended = appendChild(nextRoot, [], nextCondition);
        if (appended.success) {
          nextRoot = appended.root;
        }
      }

      handleAdvancedFiltersChange({
        ...advancedFilters,
        root: nextRoot,
      });
    },
    [advancedFilters, handleAdvancedFiltersChange],
  );

  const removeFilterCondition = useCallback((id: string) => {
    const removed = removeById(advancedFilters.root, id);
    if (!removed.success) return;
    handleAdvancedFiltersChange({
      ...advancedFilters,
      root: removed.root,
    });
  }, [advancedFilters, handleAdvancedFiltersChange]);

  const setRelationFunction = useCallback(
    (relationFilter: RelationFunctionFilter) => {
      const nextRelationFilters = upsertRelationFunction(
        advancedFilters.relationFunctions ?? [],
        relationFilter,
      );
      handleAdvancedFiltersChange({
        ...advancedFilters,
        relationFunctions: nextRelationFilters,
      });
    },
    [advancedFilters, handleAdvancedFiltersChange],
  );

  const clearRelationFunctions = useCallback(
    (relationName?: string) => {
      const nextRelationFilters = relationName
        ? removeRelationFunctionsByRelation(
            advancedFilters.relationFunctions ?? [],
            relationName,
          )
        : [];
      handleAdvancedFiltersChange({
        ...advancedFilters,
        relationFunctions: nextRelationFilters,
      });
    },
    [advancedFilters, handleAdvancedFiltersChange],
  );

  const activeFilterStats = useMemo(
    () => getActiveFilterStats(advancedFilters),
    [advancedFilters],
  );
  const hasActiveFilters = !!quickSearch || activeFilterStats.hasActiveFilters;

  return {
    quickSearch,
    advancedFilters,
    filterVariables,
    setQuickSearch: handleQuickSearchChange,
    setAdvancedFilters: handleAdvancedFiltersChange,
    clearAllFilters,
    hasActiveFilters,
    activeFilterStats,
    addFilterCondition,
    removeFilterCondition,
    setRelationFunction,
    clearRelationFunctions,
  };
}
