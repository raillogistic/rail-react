/**
 * Dynamic Filters - Serializer
 * 
 * Converts filter form state to GraphQL where input format.
 */

import type {
 FilterGroup,
 FilterCondition,
 UnifiedFilterSchema,
 RelationFilter,
} from "./types";

/**
 * Serialize nested filter form state to GraphQL where input.
 */
export function serializeFilterToGraphQL(
 group: FilterGroup,
 schema?: UnifiedFilterSchema | null,
 maxDepth: number = 3
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
 schema?: UnifiedFilterSchema | null,
 maxDepth: number = 3
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
 schema?: UnifiedFilterSchema | null,
 maxDepth: number = 3
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
 schema?: UnifiedFilterSchema | null,
 relationOperator?: string
): Record<string, any> {
 if (fieldPath.length === 0) {
 return filterValue;
 }

 // 1. Resolve schemas and relation info for each segment forward
 // We need to know the schema context for each segment to determine if it's a M2M relation
 const pathInfo: Array<{
 segment: string;
 relation?: RelationFilter;
 schema?: UnifiedFilterSchema;
 }> = [];

 let currentSchema: UnifiedFilterSchema | undefined = schema;

 for (const segment of fieldPath) {
 const schemaAtSegment = currentSchema;
 const relation = currentSchema?.relationFilters.find(
 (r) => r.name === segment || r.fieldName === segment
 );

 pathInfo.push({ segment, relation, schema: schemaAtSegment });

 if (relation?.nestedSchema) {
 currentSchema = relation.nestedSchema;
 } else {
 // If we can't traverse deeper, we stop schema resolution but keep collecting segments
 currentSchema = undefined;
 }
 }

 // 2. Build result backwards using the resolved relation info
 let result = filterValue;

 for (let i = fieldPath.length - 1; i >= 0; i--) {
 const { segment, relation, schema: segmentSchema } = pathInfo[i];
 const isFirst = i === 0;
 const isLast = i === fieldPath.length - 1;

 if (relation && !isLast) {
 const isM2MOrReverse =
 relation.relationType === "MANY_TO_MANY" ||
 relation.relationType === "REVERSE_FK";

 if (isM2MOrReverse) {
 // Apply relation operator for M2M at the appropriate level
 // Default to 'Some' if not specified
 const rawOp = isFirst && relationOperator ? relationOperator : "Some";

 // Ensure operator is camelCase suffix (e.g. "_some" -> "Some", "some" -> "Some")
 const opSuffix = normalizeOperator(rawOp);

 const relationKey = relation.name || relation.fieldName || segment;
 const fieldWithOp =`${relationKey}${opSuffix}`;
 result = { [fieldWithOp]: result };
 } else {
 const relationKey = resolveToOneNestedRelationKey(
 relation,
 segment,
 segmentSchema
 );
 result = { [relationKey]: result };
 }
 } else {
 result = { [segment]: result };
 }
 }

 return result;
}

function normalizeOperator(op: string): string {
 // Remove leading underscore if present
 const clean = op.startsWith("_") ? op.slice(1) : op;
 // Capitalize first letter
 return clean.charAt(0).toUpperCase() + clean.slice(1);
}

function resolveToOneNestedRelationKey(
 relation: RelationFilter,
 segment: string,
 schema?: UnifiedFilterSchema
): string {
 if (!schema) {
 return relation.name || relation.fieldName || segment;
 }

 const relationName = relation.name || segment;
 const relationFieldName = relation.fieldName || segment;

 const nestedAliasByName =`${relationName}Rel`;
 const nestedAliasByFieldName =`${relationFieldName}_rel`;

 const nestedField = schema.fields.find(
 (field) =>
 field.name === nestedAliasByName ||
 field.fieldName === nestedAliasByFieldName
 );

 // Prefer explicit nested alias when present (dual-field pattern),
 // otherwise keep the relation key (unified pattern compatibility).
 return nestedField?.name ?? relationName;
}
