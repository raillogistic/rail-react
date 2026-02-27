/**
 * Dynamic Filters - State Management
 *
 * Re-exports from tree module for creating filter state.
 */

import type { FilterFormState, FilterGroup } from "./types";
import { createGroup, getTreeStats } from "./tree/operations";

// Re-export from tree module
export { generateId } from "./tree/operations";

/**
 * Create initial empty filter state.
 */
export function createInitialFilterState(): FilterFormState {
  return {
    root: createGroup(),
    selectedPresets: [],
    distinctOn: [],
    orderBy: [],
    relationFunctions: [],
  };
}

/**
 * Count active conditions in a filter group.
 */
export function countConditions(group: FilterGroup): number {
  return getTreeStats(group).activeConditionCount;
}

/**
 * Validate filter state for common issues.
 */
export function validateFilterState(state: FilterFormState): string[] {
  const errors: string[] = [];

  function checkEmptyGroups(group: FilterGroup, path: string[] = []): void {
    if (group.conditions.length === 0 && path.length > 0) {
      errors.push(`Empty group at ${path.join(" > ")}`);
    }
    group.conditions.forEach((item, index) => {
      if (item.type === "group") {
        checkEmptyGroups(item, [...path, `Group ${index + 1}`]);
      }
    });
  }

  checkEmptyGroups(state.root);

  if (state.distinctOn.length > 0) {
    for (let i = 0; i < state.distinctOn.length; i++) {
      const distinctField = state.distinctOn[i];
      const orderByField = state.orderBy[i];

      if (!orderByField) {
        errors.push(
          `distinctOn field "${distinctField}" requires matching orderBy at position ${i}`
        );
      } else {
        const normalizedOrderBy = orderByField.replace(/^-/, "");
        if (normalizedOrderBy !== distinctField) {
          errors.push(
            `orderBy[${i}] must be "${distinctField}" (got "${normalizedOrderBy}")`
          );
        }
      }
    }
  }

  return errors;
}
