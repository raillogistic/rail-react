/**
 * FilterTree - Core Utilities
 *
 * Immutable tree operations for filter state management.
 */

import type { FilterCondition, FilterGroup } from "../types";
import type {
  TreePath,
  FindResult,
  TreeMapper,
  TreeFilter,
  TreeWalker,
  TraversalOptions,
  TraversalResult,
  UpdateResult,
  TreeStats,
  MutationOptions,
} from "./types";

// ============================================================================
// Path Utilities
// ============================================================================

/**
 * Compare two tree paths for equality.
 */
export function pathEquals(a: TreePath, b: TreePath): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

/**
 * Check if path `a` is an ancestor of path `b`.
 */
export function isAncestor(ancestor: TreePath, descendant: TreePath): boolean {
  if (ancestor.length >= descendant.length) return false;
  for (let i = 0; i < ancestor.length; i++) {
    if (ancestor[i] !== descendant[i]) return false;
  }
  return true;
}

/**
 * Check if path `a` is a descendant of path `b`.
 */
export function isDescendant(descendant: TreePath, ancestor: TreePath): boolean {
  return isAncestor(ancestor, descendant);
}

/**
 * Get the parent path of a given path.
 */
export function parentPath(path: TreePath): TreePath {
  return path.slice(0, -1);
}

/**
 * Get the last index of a path.
 */
export function lastIndex(path: TreePath): number {
  return path[path.length - 1];
}

/**
 * Create a path string representation.
 */
export function pathToString(path: TreePath): string {
  return path.join(".");
}

/**
 * Parse a path string into a TreePath.
 */
export function stringToPath(str: string): TreePath {
  if (!str) return [];
  return str.split(".").map((s) => parseInt(s, 10));
}

// ============================================================================
// Node Finding
// ============================================================================

/**
 * Find a node by its path.
 */
export function findByPath(
  root: FilterGroup,
  path: TreePath
): FindResult | null {
  if (path.length === 0) {
    return { node: root, path: [], depth: 0, index: -1 };
  }

  let current: FilterGroup = root;
  let depth = 0;

  for (let i = 0; i < path.length; i++) {
    const index = path[i];
    const isLast = i === path.length - 1;

    if (index < 0 || index >= current.conditions.length) {
      return null;
    }

    const node = current.conditions[index];

    if (isLast) {
      return {
        node,
        path,
        depth: depth + 1,
        parent: current,
        index,
      };
    }

    if (node.type !== "group") {
      return null;
    }

    current = node;
    depth++;
  }

  return null;
}

/**
 * Find a node by its ID.
 */
export function findById(
  root: FilterGroup,
  id: string
): FindResult | null {
  let result: FindResult | null = null;

  walkTree(root, (node, path, depth) => {
    if (node.id === id) {
      const parentResult = path.length > 0 ? findByPath(root, parentPath(path)) : null;
      result = {
        node,
        path,
        depth,
        parent: parentResult?.node?.type === "group" ? parentResult.node as FilterGroup : undefined,
        index: path.length > 0 ? lastIndex(path) : -1,
      };
      return false; // Stop traversal
    }
  });

  return result;
}

/**
 * Find all nodes matching a predicate.
 */
export function findAll(
  root: FilterGroup,
  predicate: TreeFilter,
  options: TraversalOptions = {}
): FindResult[] {
  const results: FindResult[] = [];

  walkTree(
    root,
    (node, path, depth) => {
      if (predicate(node, path, depth)) {
        const parentResult = path.length > 0 ? findByPath(root, parentPath(path)) : null;
        results.push({
          node,
          path,
          depth,
          parent: parentResult?.node?.type === "group" ? parentResult.node as FilterGroup : undefined,
          index: path.length > 0 ? lastIndex(path) : -1,
        });
      }
    },
    options
  );

  return results;
}

// ============================================================================
// Tree Traversal
// ============================================================================

/**
 * Walk the tree, calling the walker function for each node.
 * Return `false` from the walker to stop traversal.
 */
export function walkTree(
  root: FilterGroup,
  walker: TreeWalker,
  options: TraversalOptions = {}
): void {
  const {
    maxDepth = Infinity,
    includeRoot = true,
    order = "preorder",
  } = options;

  if (order === "breadth-first") {
    walkBreadthFirst(root, walker, includeRoot, maxDepth);
  } else if (order === "postorder") {
    walkPostOrder(root, walker, includeRoot, maxDepth, [], 0);
  } else {
    walkPreOrder(root, walker, includeRoot, maxDepth, [], 0);
  }
}

function walkPreOrder(
  node: FilterCondition | FilterGroup,
  walker: TreeWalker,
  includeRoot: boolean,
  maxDepth: number,
  path: TreePath,
  depth: number
): boolean {
  if (depth > maxDepth) return true;

  if (includeRoot || path.length > 0) {
    const result = walker(node, path, depth);
    if (result === false) return false;
  }

  if (node.type === "group") {
    for (let i = 0; i < node.conditions.length; i++) {
      const childPath = [...path, i] as const;
      if (!walkPreOrder(node.conditions[i], walker, true, maxDepth, childPath, depth + 1)) {
        return false;
      }
    }
  }

  return true;
}

function walkPostOrder(
  node: FilterCondition | FilterGroup,
  walker: TreeWalker,
  includeRoot: boolean,
  maxDepth: number,
  path: TreePath,
  depth: number
): boolean {
  if (depth > maxDepth) return true;

  if (node.type === "group") {
    for (let i = 0; i < node.conditions.length; i++) {
      const childPath = [...path, i] as const;
      if (!walkPostOrder(node.conditions[i], walker, true, maxDepth, childPath, depth + 1)) {
        return false;
      }
    }
  }

  if (includeRoot || path.length > 0) {
    const result = walker(node, path, depth);
    if (result === false) return false;
  }

  return true;
}

function walkBreadthFirst(
  root: FilterGroup,
  walker: TreeWalker,
  includeRoot: boolean,
  maxDepth: number
): void {
  const queue: Array<{ node: FilterCondition | FilterGroup; path: TreePath; depth: number }> = [];

  if (includeRoot) {
    queue.push({ node: root, path: [], depth: 0 });
  } else {
    for (let i = 0; i < root.conditions.length; i++) {
      queue.push({ node: root.conditions[i], path: [i], depth: 1 });
    }
  }

  while (queue.length > 0) {
    const { node, path, depth } = queue.shift()!;

    if (depth > maxDepth) continue;

    const result = walker(node, path, depth);
    if (result === false) return;

    if (node.type === "group") {
      for (let i = 0; i < node.conditions.length; i++) {
        queue.push({
          node: node.conditions[i],
          path: [...path, i],
          depth: depth + 1,
        });
      }
    }
  }
}

/**
 * Map over all nodes in the tree, creating a new tree.
 */
export function mapTree<T extends FilterCondition | FilterGroup>(
  root: FilterGroup,
  mapper: TreeMapper<T>,
  options: TraversalOptions = {}
): FilterGroup {
  const { maxDepth = Infinity } = options;

  function mapNode(
    node: FilterCondition | FilterGroup,
    path: TreePath,
    depth: number
  ): FilterCondition | FilterGroup {
    if (depth > maxDepth) return node;

    const mapped = mapper(node, path, depth);

    if (mapped.type === "group") {
      const group = mapped as FilterGroup;
      return {
        ...group,
        conditions: group.conditions.map((child, i) =>
          mapNode(child, [...path, i], depth + 1)
        ),
      };
    }

    return mapped;
  }

  return mapNode(root, [], 0) as FilterGroup;
}

/**
 * Filter nodes from the tree based on a predicate.
 */
export function filterTree(
  root: FilterGroup,
  predicate: TreeFilter
): FilterGroup {
  function filterNode(
    node: FilterCondition | FilterGroup,
    path: TreePath,
    depth: number
  ): (FilterCondition | FilterGroup) | null {
    if (!predicate(node, path, depth)) {
      return null;
    }

    if (node.type === "group") {
      const filteredConditions: (FilterCondition | FilterGroup)[] = [];
      for (let i = 0; i < node.conditions.length; i++) {
        const result = filterNode(node.conditions[i], [...path, i], depth + 1);
        if (result !== null) {
          filteredConditions.push(result);
        }
      }
      return { ...node, conditions: filteredConditions };
    }

    return node;
  }

  return filterNode(root, [], 0) as FilterGroup;
}

/**
 * Collect all values from a tree traversal.
 */
export function collectTree<T>(
  root: FilterGroup,
  collector: TreeMapper<T>,
  options: TraversalOptions = {}
): TraversalResult<T>[] {
  const results: TraversalResult<T>[] = [];

  walkTree(
    root,
    (node, path, depth) => {
      results.push({
        node,
        path,
        depth,
        value: collector(node, path, depth),
      });
    },
    options
  );

  return results;
}

// ============================================================================
// Tree Mutations (Immutable)
// ============================================================================

/**
 * Update a node at a specific path.
 */
export function updateByPath(
  root: FilterGroup,
  path: TreePath,
  updater: (node: FilterCondition | FilterGroup) => FilterCondition | FilterGroup
): UpdateResult {
  if (path.length === 0) {
    const updated = updater(root);
    if (updated.type !== "group") {
      return { root, success: false, error: "Cannot replace root with a condition" };
    }
    return { root: updated as FilterGroup, success: true, path };
  }

  function updateNode(
    node: FilterGroup,
    remainingPath: TreePath
  ): FilterGroup {
    const [index, ...rest] = remainingPath;

    if (index < 0 || index >= node.conditions.length) {
      throw new Error(`Invalid path index: ${index}`);
    }

    if (rest.length === 0) {
      // Update the target node
      const updatedConditions = [...node.conditions];
      updatedConditions[index] = updater(node.conditions[index]);
      return { ...node, conditions: updatedConditions };
    }

    // Recurse into child group
    const child = node.conditions[index];
    if (child.type !== "group") {
      throw new Error("Path leads through a condition, not a group");
    }

    const updatedConditions = [...node.conditions];
    updatedConditions[index] = updateNode(child as FilterGroup, rest);
    return { ...node, conditions: updatedConditions };
  }

  try {
    const updated = updateNode(root, [...path]);
    return { root: updated, success: true, path };
  } catch (error) {
    return { root, success: false, error: (error as Error).message };
  }
}

/**
 * Update a node by its ID.
 */
export function updateById(
  root: FilterGroup,
  id: string,
  updater: (node: FilterCondition | FilterGroup) => FilterCondition | FilterGroup
): UpdateResult {
  const found = findById(root, id);
  if (!found) {
    return { root, success: false, error: `Node with ID "${id}" not found` };
  }
  return updateByPath(root, found.path, updater);
}

/**
 * Remove a node at a specific path.
 */
export function removeByPath(root: FilterGroup, path: TreePath): UpdateResult {
  if (path.length === 0) {
    return { root, success: false, error: "Cannot remove root node" };
  }

  const parentP = parentPath(path);
  const index = lastIndex(path);

  return updateByPath(root, parentP, (parent) => {
    if (parent.type !== "group") {
      throw new Error("Parent is not a group");
    }
    const group = parent as FilterGroup;
    return {
      ...group,
      conditions: group.conditions.filter((_, i) => i !== index),
    };
  });
}

/**
 * Remove a node by its ID.
 */
export function removeById(root: FilterGroup, id: string): UpdateResult {
  const found = findById(root, id);
  if (!found) {
    return { root, success: false, error: `Node with ID "${id}" not found` };
  }
  return removeByPath(root, found.path);
}

/**
 * Insert a node at a specific path and index.
 */
export function insertAt(
  root: FilterGroup,
  parentPath: TreePath,
  index: number,
  node: FilterCondition | FilterGroup,
  options: MutationOptions = {}
): UpdateResult {
  const { generateIds = false } = options;

  const nodeToInsert = generateIds ? regenerateIds(node) : node;

  return updateByPath(root, parentPath, (parent) => {
    if (parent.type !== "group") {
      throw new Error("Parent is not a group");
    }
    const group = parent as FilterGroup;
    const newConditions = [...group.conditions];
    const insertIndex = Math.max(0, Math.min(index, newConditions.length));
    newConditions.splice(insertIndex, 0, nodeToInsert);
    return { ...group, conditions: newConditions };
  });
}

/**
 * Append a node to a parent group.
 */
export function appendChild(
  root: FilterGroup,
  parentPath: TreePath,
  node: FilterCondition | FilterGroup,
  options: MutationOptions = {}
): UpdateResult {
  const found = findByPath(root, parentPath);
  if (!found || found.node.type !== "group") {
    return { root, success: false, error: "Parent is not a group" };
  }
  const parent = found.node as FilterGroup;
  return insertAt(root, parentPath, parent.conditions.length, node, options);
}

/**
 * Move a node from one location to another.
 */
export function moveNode(
  root: FilterGroup,
  fromPath: TreePath,
  toParentPath: TreePath,
  toIndex: number
): UpdateResult {
  // Find the node to move
  const found = findByPath(root, fromPath);
  if (!found) {
    return { root, success: false, error: "Source node not found" };
  }

  // Remove from original location
  const removeResult = removeByPath(root, fromPath);
  if (!removeResult.success) {
    return removeResult;
  }

  // Adjust target path if needed (if target is after source in same parent)
  let adjustedToIndex = toIndex;
  const fromParent = parentPath(fromPath);
  const fromIndex = lastIndex(fromPath);

  if (pathEquals(fromParent, toParentPath) && fromIndex < toIndex) {
    adjustedToIndex--;
  }

  // Insert at new location
  return insertAt(removeResult.root, toParentPath, adjustedToIndex, found.node);
}

// ============================================================================
// Tree Statistics
// ============================================================================

/**
 * Get statistics about the tree.
 */
export function getTreeStats(root: FilterGroup): TreeStats {
  let nodeCount = 0;
  let conditionCount = 0;
  let groupCount = 0;
  let maxDepth = 0;
  let activeConditionCount = 0;

  walkTree(root, (node, _path, depth) => {
    nodeCount++;
    if (node.type === "condition") {
      conditionCount++;
      const condition = node as FilterCondition;
      if (hasValue(condition.value)) {
        activeConditionCount++;
      }
    } else {
      groupCount++;
    }
    if (depth > maxDepth) {
      maxDepth = depth;
    }
  });

  return {
    nodeCount,
    conditionCount,
    groupCount,
    maxDepth,
    activeConditionCount,
  };
}

/**
 * Check if a value is considered "active" (non-empty).
 */
function hasValue(value: unknown): boolean {
  if (value === undefined || value === null || value === "") {
    return false;
  }
  if (Array.isArray(value) && value.length === 0) {
    return false;
  }
  return true;
}

// ============================================================================
// ID Management
// ============================================================================

let idCounter = 0;

/**
 * Generate a unique ID for a filter node.
 */
export function generateId(): string {
  return `f_${Date.now().toString(36)}_${(++idCounter).toString(36)}_${Math.random().toString(36).substring(2, 7)}`;
}

/**
 * Regenerate IDs for a node and all its descendants.
 */
export function regenerateIds<T extends FilterCondition | FilterGroup>(node: T): T {
  if (node.type === "condition") {
    return { ...node, id: generateId() };
  }

  const group = node as FilterGroup;
  return {
    ...group,
    id: generateId(),
    conditions: group.conditions.map((child) => regenerateIds(child)),
  } as T;
}

// ============================================================================
// Tree Creation Helpers
// ============================================================================

/**
 * Create an empty filter group.
 */
export function createGroup(
  logic: "AND" | "OR" = "AND",
  negated: boolean = false
): FilterGroup {
  return {
    id: generateId(),
    type: "group",
    logic,
    conditions: [],
    negated,
  };
}

/**
 * Create a filter condition.
 */
export function createCondition(
  fieldPath: string[],
  fieldName: string,
  operator: string,
  value?: unknown,
  relationOperator?: string
): FilterCondition {
  return {
    id: generateId(),
    type: "condition",
    fieldPath,
    fieldName,
    operator,
    value,
    relationOperator,
  };
}

/**
 * Create a deep clone of a node.
 */
export function cloneNode<T extends FilterCondition | FilterGroup>(
  node: T,
  regenerate: boolean = false
): T {
  if (node.type === "condition") {
    const cloned = { ...node };
    if (regenerate) {
      cloned.id = generateId();
    }
    return cloned;
  }

  const group = node as FilterGroup;
  const cloned: FilterGroup = {
    ...group,
    id: regenerate ? generateId() : group.id,
    conditions: group.conditions.map((child) => cloneNode(child, regenerate)),
  };
  return cloned as T;
}
