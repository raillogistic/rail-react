/**
 * Dynamic Filters - Query Builder
 * 
 * Builds complete GraphQL query variables from filter UI state.
 */

import type { FilterGroup, UnifiedFilterSchema, FilterQueryVariables } from "./types";
import { serializeFilterToGraphQL } from "./serializer";

export interface QueryBuilderOptions {
  /** Current filter state */
  filterState: FilterGroup;
  /** Unified schema */
  schema: UnifiedFilterSchema;
  /** Selected preset names (for presets argument) */
  selectedPresets: string[];
  /** Selected distinct fields */
  distinctOn: string[];
  /** Order by fields */
  orderBy: string[];
  /** Pagination */
  pagination?: {
    limit?: number;
    offset?: number;
  };
  /** Max nesting depth */
  maxDepth: number;
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
    pagination,
    maxDepth,
  } = options;

  const variables: FilterQueryVariables = {};

  // Build where clause from filter state
  const where = serializeFilterToGraphQL(filterState, schema, maxDepth);
  if (Object.keys(where).length > 0) {
    variables.where = where;
  }

  // Add static preset names (not saved filter IDs)
  const staticPresets = selectedPresets.filter((p) => {
    const preset = schema.presets.find((pr) => pr.id === p || pr.name === p);
    return preset?.source === "static";
  });
  if (staticPresets.length > 0) {
    variables.presets = staticPresets.map((p) => {
      // Use name for static presets
      const preset = schema.presets.find((pr) => pr.id === p || pr.name === p);
      return preset?.name ?? p;
    });
  }

  // Add saved filter where clauses to main where (merged)
  const savedPresets = selectedPresets.filter((p) => {
    const preset = schema.presets.find((pr) => pr.id === p);
    return preset?.source === "saved" || preset?.source === "shared";
  });
  if (savedPresets.length > 0) {
    // Merge saved filter conditions into where
    const savedConditions = savedPresets
      .map((presetId) => {
        const preset = schema.presets.find((pr) => pr.id === presetId);
        return preset?.filterJson;
      })
      .filter(Boolean);

    if (savedConditions.length > 0) {
      if (variables.where) {
        // Combine with AND
        variables.where = {
          AND: [variables.where, ...savedConditions],
        };
      } else if (savedConditions.length === 1) {
        variables.where = savedConditions[0];
      } else {
        variables.where = { AND: savedConditions };
      }
    }
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
      (ob) => ob === field || ob === `-${field}` || ob.replace(/^-/, "") === field
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
  const argsStr = args.length > 0 ? `(${args.join(", ")})` : "";

  return `
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
