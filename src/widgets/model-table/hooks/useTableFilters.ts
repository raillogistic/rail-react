import { useCallback, useMemo } from "react";
import { useTable } from "../context/TableContext";
import {
 FilterFormState,
 RelationFunctionFilter,
} from "@/widgets/model-table/filtering/types";
import {
 appendChild,
 createCondition,
 findAll,
 removeById,
 updateById,
} from "@/widgets/model-table/filtering/tree/operations";
import { buildQueryVariablesFromState } from "@/widgets/model-table/filtering/queryBuilder";
import {
 getActiveFilterStats,
 normalizeFilterFormState,
 removeRelationFunctionsByRelation,
 upsertRelationFunction,
} from "@/widgets/model-table/filtering/engine";
import { createInitialFilterState } from "@/widgets/model-table/filtering/state";

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
 navFilterSelections,
 setQuickSearch,
 setAdvancedFilters: setAdvancedFiltersRaw,
 setNavFilterSelection: setNavFilterSelectionRaw,
 resetNavFilters,
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

 if (inputVariables) {
 setAdvancedFiltersRaw(normalizedState, inputVariables);
 return;
 }

 const nextVariables = buildQueryVariablesFromState(normalizedState) as Record<
 string,
 unknown
 >;
 setAdvancedFiltersRaw(normalizedState, nextVariables as Record<string, unknown>);
 },
 [setAdvancedFiltersRaw]
 );

 const clearAllFilters = useCallback(() => {
 setQuickSearch("");
 resetNavFilters();
 handleAdvancedFiltersChange(createInitialFilterState());
 }, [resetNavFilters, setQuickSearch, handleAdvancedFiltersChange]);

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

 const handleNavFilterSelectionChange = useCallback(
 (groupKey: string, itemKey: string | null) => {
 setNavFilterSelectionRaw(groupKey, itemKey);
 },
 [setNavFilterSelectionRaw],
 );

 return {
 quickSearch,
 advancedFilters,
 filterVariables,
 navFilterSelections,
 setQuickSearch: handleQuickSearchChange,
 setAdvancedFilters: handleAdvancedFiltersChange,
 setNavFilterSelection: handleNavFilterSelectionChange,
 resetNavFilters,
 clearAllFilters,
 hasActiveFilters,
 activeFilterStats,
 addFilterCondition,
 removeFilterCondition,
 setRelationFunction,
 clearRelationFunctions,
 };
}
