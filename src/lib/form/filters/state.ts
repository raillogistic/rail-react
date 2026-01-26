/**
 * Dynamic Filters - State Management
 * 
 * Helpers for creating and managing filter form state.
 */

import type { FilterFormState, FilterGroup } from "./types";

/**
 * Create initial empty filter state.
 */
export function createInitialFilterState(): FilterFormState {
  return {
    root: {
      id: generateId(),
      type: "group",
      logic: "AND",
      conditions: [],
      negated: false,
    },
    selectedPresets: [],
    distinctOn: [],
    orderBy: [],
  };
}

/**
 * Generate unique ID for filter nodes.
 */
export function generateId(): string {
  return `f_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Count active conditions in a filter group.
 * Only counts conditions with actual values (non-empty).
 */
export function countConditions(group: FilterGroup): number {
  return group.conditions.reduce((acc, item) => {
    if (item.type === "condition") {
      // Only count if value is not undefined/empty
      const hasValue = 
        item.value !== undefined && 
        item.value !== "" && 
        item.value !== null &&
        !(Array.isArray(item.value) && item.value.length === 0);
      return acc + (hasValue ? 1 : 0);
    }
    // Recursively count nested groups
    return acc + countConditions(item);
  }, 0);
}

/**
 * Deep clone a filter group (for immutable updates).
 */
export function cloneFilterGroup(group: FilterGroup): FilterGroup {
  return {
    ...group,
    conditions: group.conditions.map((item) => {
      if (item.type === "condition") {
        return { ...item };
      }
      return cloneFilterGroup(item);
    }),
  };
}

/**
 * Find an item by ID in the filter tree.
 */
export function findItemById(
  group: FilterGroup,
  id: string
): FilterGroup | FilterCondition | null {
  if (group.id === id) {
    return group;
  }

  for (const item of group.conditions) {
    if (item.id === id) {
      return item;
    }
    if (item.type === "group") {
      const found = findItemById(item, id);
      if (found) return found;
    }
  }

  return null;
}

/**
 * Remove an item by ID from the filter tree.
 */
export function removeItemById(group: FilterGroup, id: string): FilterGroup {
  return {
    ...group,
    conditions: group.conditions
      .filter((item) => item.id !== id)
      .map((item) => {
        if (item.type === "group") {
          return removeItemById(item, id);
        }
        return item;
      }),
  };
}

/**
 * Update an item by ID in the filter tree.
 */
export function updateItemById(
  group: FilterGroup,
  id: string,
  updater: (item: FilterGroup | FilterCondition) => FilterGroup | FilterCondition
): FilterGroup {
  if (group.id === id) {
    return updater(group) as FilterGroup;
  }

  return {
    ...group,
    conditions: group.conditions.map((item) => {
      if (item.id === id) {
        return updater(item);
      }
      if (item.type === "group") {
        return updateItemById(item, id, updater);
      }
      return item;
    }),
  };
}

/**
 * Validate filter state for common issues.
 */
export function validateFilterState(state: FilterFormState): string[] {
  const errors: string[] = [];

  // Check for empty groups
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

  // Check distinctOn vs orderBy compatibility
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
