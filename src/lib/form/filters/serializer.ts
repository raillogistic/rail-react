/**
 * Dynamic Filters - Serializer
 * 
 * Converts filter form state to GraphQL where input format.
 */

import type { FilterGroup, FilterCondition, UnifiedFilterSchema, RelationFilter } from "./types";

/**
 * Serialize nested filter form state to GraphQL where input.
 */
export function serializeFilterToGraphQL(
  group: FilterGroup,
  schema: UnifiedFilterSchema,
  maxDepth: number
): Record<string, any> {
  const serialized = serializeGroup(group, schema, maxDepth);
  
  // Simplify if only one condition at root and no negation
  if (!group.negated && serialized[group.logic]?.length === 1) {
    return serialized[group.logic][0];
  }
  
  // Remove empty logic arrays
  if (serialized[group.logic]?.length === 0) {
    return {};
  }
  
  return serialized;
}

function serializeGroup(
  group: FilterGroup,
  schema: UnifiedFilterSchema,
  maxDepth: number
): Record<string, any> {
  const conditions = group.conditions
    .map((item) => {
      if (item.type === "condition") {
        return serializeCondition(item, schema, maxDepth);
      }
      return serializeGroup(item, schema, maxDepth);
    })
    .filter((c) => c !== null && Object.keys(c).length > 0);

  if (conditions.length === 0) {
    return {};
  }

  let result: Record<string, any>;

  if (conditions.length === 1) {
    result = conditions[0];
  } else {
    result = { [group.logic]: conditions };
  }

  // Apply NOT if negated
  if (group.negated) {
    result = { NOT: result };
  }

  return result;
}

function serializeCondition(
  condition: FilterCondition,
  schema: UnifiedFilterSchema,
  maxDepth: number
): Record<string, any> | null {
  // Skip empty values
  if (
    condition.value === undefined || 
    condition.value === "" || 
    condition.value === null ||
    (Array.isArray(condition.value) && condition.value.length === 0)
  ) {
    return null;
  }

  const { fieldPath, operator, value, relationOperator } = condition;

  // Build the filter value
  const filterValue = { [operator]: value };

  // Build the nested structure from the field path
  return buildNestedFilter(fieldPath, filterValue, schema, relationOperator);
}

/**
 * Build nested filter object from field path.
 */
function buildNestedFilter(
  fieldPath: string[],
  filterValue: Record<string, any>,
  schema: UnifiedFilterSchema,
  relationOperator?: string
): Record<string, any> {
  if (fieldPath.length === 0) {
    return filterValue;
  }

  if (fieldPath.length === 1) {
    return { [fieldPath[0]]: filterValue };
  }

  // Work backwards from the leaf
  let result = filterValue;
  let currentSchema: UnifiedFilterSchema | undefined = schema;

  for (let i = fieldPath.length - 1; i >= 0; i--) {
    const segment = fieldPath[i];
    const isFirst = i === 0;
    const isLast = i === fieldPath.length - 1;

    // Find relation info at this level
    const relation = currentSchema?.relationFilters.find(
      (r) => r.fieldName === segment
    );

    if (relation && !isLast) {
      const isM2MOrReverse =
        relation.relationType === "MANY_TO_MANY" ||
        relation.relationType === "REVERSE_FK";

      if (isM2MOrReverse) {
        // Apply relation operator for M2M at the appropriate level
        const opToUse = isFirst && relationOperator ? relationOperator : "_some";
        const fieldWithOp = `${segment}${opToUse}`;
        result = { [fieldWithOp]: result };
      } else {
        result = { [segment]: result };
      }

      // Navigate to nested schema for next iteration
      currentSchema = relation.nestedSchema;
    } else {
      result = { [segment]: result };
    }
  }

  return result;
}
