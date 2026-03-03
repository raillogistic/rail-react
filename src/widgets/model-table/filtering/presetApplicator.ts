/**
 * Dynamic Filters - Preset Applicator
 * 
 * Converts GraphQL where format to filter form state.
 */

import type { FilterPreset, FilterGroup, FilterCondition, UnifiedFilterSchema } from "./types";
import { generateId } from "./state";

/**
 * Apply a preset's filter JSON to the current filter state.
 * This converts GraphQL where format back to FilterGroup structure.
 */
export function applyPresetToFilterState(
 preset: FilterPreset,
 currentState: FilterGroup,
 schema: UnifiedFilterSchema,
 mode: "replace" | "merge" = "replace"
): FilterGroup {
 const presetGroup = graphqlWhereToFilterGroup(preset.filterJson, schema);

 if (mode === "replace") {
 return presetGroup;
 }

 // Merge mode: add preset conditions to current state
 return {
 ...currentState,
 conditions: [...currentState.conditions, ...presetGroup.conditions],
 };
}

/**
 * Convert GraphQL where input format to FilterGroup structure.
 */
export function graphqlWhereToFilterGroup(
 where: Record<string, any>,
 schema: UnifiedFilterSchema,
 parentPath: string[] = []
): FilterGroup {
 const group: FilterGroup = {
 id: generateId(),
 type: "group",
 logic: "AND",
 conditions: [],
 negated: false,
 };

 // Handle NOT wrapper
 if (where.NOT) {
 const inner = graphqlWhereToFilterGroup(where.NOT, schema, parentPath);
 inner.negated = true;
 return inner;
 }

 // Handle AND array
 if (where.AND && Array.isArray(where.AND)) {
 group.logic = "AND";
 group.conditions = where.AND.map((item) =>
 graphqlWhereToFilterGroup(item, schema, parentPath)
 );
 return flattenSingleConditionGroups(group);
 }

 // Handle OR array
 if (where.OR && Array.isArray(where.OR)) {
 group.logic = "OR";
 group.conditions = where.OR.map((item) =>
 graphqlWhereToFilterGroup(item, schema, parentPath)
 );
 return flattenSingleConditionGroups(group);
 }

 // Process each field in the where object
 for (const [fieldKey, fieldValue] of Object.entries(where)) {
 if (fieldKey === "AND" || fieldKey === "OR" || fieldKey === "NOT") continue;

 const condition = parseFieldCondition(fieldKey, fieldValue, schema, parentPath);
 if (condition) {
 group.conditions.push(condition);
 }
 }

 return group;
}

function parseFieldCondition(
 fieldKey: string,
 fieldValue: any,
 schema: UnifiedFilterSchema,
 parentPath: string[]
): FilterCondition | FilterGroup | null {
 // Check for relation operators (_some, _every, _none, _count)
 let actualFieldName = fieldKey;
 let relationOperator: string | undefined;

 for (const suffix of ["_some", "_every", "_none", "_count"]) {
 if (fieldKey.endsWith(suffix)) {
 actualFieldName = fieldKey.slice(0, -suffix.length);
 relationOperator = suffix;
 break;
 }
 }

 // Find the field in schema
 const field = schema.fields.find((f) => f.fieldName === actualFieldName);
 const relation = schema.relationFilters.find((r) => r.fieldName === actualFieldName);

 if (!field && !relation) {
 // Unknown field - might be a special filter like "quick" or "id"
 if (typeof fieldValue === "object" && fieldValue !== null) {
 const operators = Object.keys(fieldValue);
 if (operators.length === 1) {
 const [op, val] = Object.entries(fieldValue)[0];
 return {
 id: generateId(),
 type: "condition",
 fieldPath: [...parentPath, actualFieldName],
 fieldName: actualFieldName,
 operator: op,
 value: val,
 relationOperator,
 };
 }
 }
 return null;
 }

 // If fieldValue is an object with filter operators
 if (typeof fieldValue === "object" && fieldValue !== null && !Array.isArray(fieldValue)) {
 const operatorKeys = Object.keys(fieldValue);
 const filterOperators = [
 "eq", "neq", "gt", "gte", "lt", "lte", "contains", "icontains", 
 "in", "notIn", "isNull", "startsWith", "endsWith", "between", "regex", "hasKey"
 ];

 const hasFilterOp = operatorKeys.some((k) => filterOperators.includes(k));

 if (hasFilterOp) {
 // It's a direct filter condition
 const [operator, value] = Object.entries(fieldValue)[0];
 return {
 id: generateId(),
 type: "condition",
 fieldPath: [...parentPath, actualFieldName],
 fieldName: actualFieldName,
 operator,
 value,
 relationOperator,
 };
 }

 // It's a nested relation filter - recurse
 if (relation?.nestedSchema) {
 const nestedGroup = graphqlWhereToFilterGroup(
 fieldValue,
 relation.nestedSchema,
 [...parentPath, actualFieldName]
 );
 // Merge nested conditions into a single group
 return nestedGroup;
 }
 }

 return null;
}

function flattenSingleConditionGroups(group: FilterGroup): FilterGroup {
 // If a group has only one condition that is itself a group, flatten it
 if (group.conditions.length === 1 && group.conditions[0].type === "group") {
 const inner = group.conditions[0] as FilterGroup;
 if (!group.negated && !inner.negated) {
 return inner;
 }
 }
 return group;
}
