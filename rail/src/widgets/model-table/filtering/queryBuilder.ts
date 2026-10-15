/**
 * Dynamic Filters - Query Builder
 * 
 * Builds complete GraphQL query variables from filter UI state.
 */

import type {
 FilterFormState,
 FilterGroup,
 RelationFunctionFilter,
 UnifiedFilterSchema,
 FilterQueryVariables,
} from "./types";
import { serializeFilterToGraphQL } from "./serializer";
import { buildRelationFunctionClauses, mergeWhereClauses } from "./engine";

export interface QueryBuilderOptions {
 /** Current filter state */
 filterState: FilterGroup;
 /** Unified schema */
 schema?: UnifiedFilterSchema | null;
 /** Selected preset names (for presets argument) */
 selectedPresets: string[];
 /** Selected distinct fields */
 distinctOn: string[];
 /** Order by fields */
 orderBy: string[];
 /** First-class relation function filters */
 relationFunctions?: RelationFunctionFilter[];
 /** Pagination */
 pagination?: {
 limit?: number;
 offset?: number;
 };
 /** Max nesting depth */
 maxDepth?: number;
}

/**
 * Build complete GraphQL query variables from filter UI state.
 */
export function buildQueryVariables(options: QueryBuilderOptions): FilterQueryVariables {
 const {
 filterState,
 schema,
 selectedPresets,
 distinctOn,
 orderBy,
 relationFunctions,
 pagination,
 maxDepth,
 } = options;

 const variables: FilterQueryVariables = {};
 const whereClauses: Array<Record<string, unknown> | undefined> = [];

 // Build where clause from filter state
 const where = serializeFilterToGraphQL(
 filterState,
 schema ?? undefined,
 maxDepth ?? 3,
 );
 if (Object.keys(where).length > 0) {
 whereClauses.push(where);
 }

 // Add relation function clauses to where
 const relationClauses = buildRelationFunctionClauses(relationFunctions);
 relationClauses.forEach((entry) => whereClauses.push(entry));

 // Add preset clauses
 if (schema) {
 const staticPresetNames: string[] = [];
 const savedPresetConditions: Record<string, unknown>[] = [];

 selectedPresets.forEach((presetId) => {
 const preset = schema.presets.find(
 (entry) => entry.id === presetId || entry.name === presetId,
 );
 if (!preset) {
 staticPresetNames.push(presetId);
 return;
 }

 if (preset.source === "static") {
 staticPresetNames.push(preset.name);
 return;
 }

 if (preset.filterJson && typeof preset.filterJson === "object") {
 savedPresetConditions.push(preset.filterJson as Record<string, unknown>);
 }
 });

 if (staticPresetNames.length > 0) {
 variables.presets = staticPresetNames;
 }
 savedPresetConditions.forEach((entry) => whereClauses.push(entry));
 } else if (selectedPresets.length > 0) {
 // Without schema context we preserve IDs/names as-is.
 variables.presets = [...selectedPresets];
 }

 const mergedWhere = mergeWhereClauses(whereClauses);
 if (mergedWhere) {
 variables.where = mergedWhere;
 }

 // Add distinct on (with orderBy validation/auto-adjustment)
 if (distinctOn.length > 0) {
 // Ensure orderBy starts with distinctOn fields
 const adjustedOrderBy = ensureDistinctOrderBy(distinctOn, orderBy);
 variables.distinctOn = distinctOn;
 variables.orderBy = adjustedOrderBy;
 } else if (orderBy.length > 0) {
 variables.orderBy = orderBy;
 }

 // Add pagination
 if (pagination?.limit) {
 variables.limit = pagination.limit;
 }
 if (pagination?.offset) {
 variables.offset = pagination.offset;
 }

 return variables;
}

export function buildQueryVariablesFromState(
 state: FilterFormState,
 options: {
 schema?: UnifiedFilterSchema | null;
 maxDepth?: number;
 pagination?: { limit?: number; offset?: number };
 } = {},
): FilterQueryVariables {
 return buildQueryVariables({
 filterState: state.root,
 schema: options.schema,
 selectedPresets: state.selectedPresets,
 distinctOn: state.distinctOn,
 orderBy: state.orderBy,
 relationFunctions: state.relationFunctions ?? [],
 maxDepth: options.maxDepth,
 pagination: options.pagination,
 });
}

/**
 * Ensure orderBy starts with distinctOn fields (PostgreSQL requirement).
 */
function ensureDistinctOrderBy(distinctOn: string[], orderBy: string[]): string[] {
 const result: string[] = [];
 const usedFields = new Set<string>();

 // First, add all distinctOn fields in order
 for (const field of distinctOn) {
 // Check if field is already in orderBy (possibly with direction)
 const existing = orderBy.find(
 (ob) => ob === field || ob ===`-${field}` || ob.replace(/^-/, "") === field
 );

 if (existing) {
 result.push(existing);
 } else {
 result.push(field); // Add ascending by default
 }
 usedFields.add(field);
 }

 // Then add remaining orderBy fields
 for (const ob of orderBy) {
 const normalizedField = ob.replace(/^-/, "");
 if (!usedFields.has(normalizedField)) {
 result.push(ob);
 usedFields.add(normalizedField);
 }
 }

 return result;
}

/**
 * Generate example GraphQL query string for debugging.
 */
export function generateQueryString(
 modelName: string,
 variables: FilterQueryVariables
): string {
 const args: string[] = [];

 if (variables.where) {
 args.push(`where: $where`);
 }
 if (variables.presets?.length) {
 args.push(`presets: $presets`);
 }
 if (variables.distinctOn?.length) {
 args.push(`distinctOn: $distinctOn`);
 }
 if (variables.orderBy?.length) {
 args.push(`orderBy: $orderBy`);
 }
 if (variables.limit) {
 args.push(`limit: $limit`);
 }
 if (variables.offset) {
 args.push(`offset: $offset`);
 }

 const queryName = modelName.toLowerCase() + "s";
 const argsStr = args.length > 0 ?`(${args.join(", ")})` : "";

 return`
query ${modelName}List(
 $where: ${modelName}WhereInput
 $presets: [String]
 $distinctOn: [String]
 $orderBy: [String]
 $limit: Int
 $offset: Int
) {
 ${queryName}${argsStr} {
 id
 # ... fields
 }
}

# Variables:
${JSON.stringify(variables, null, 2)}
`;
}
