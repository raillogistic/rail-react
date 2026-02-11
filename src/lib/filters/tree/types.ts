/**
 * FilterTree - Core Type Definitions
 *
 * Tree-based types for efficient nested filter handling.
 */

import type {
  FilterCondition,
  FilterGroup,
  UnifiedFilterSchema,
  RelationFilter,
  FilterableField,
} from "../types";

/**
 * Path to a node in the filter tree.
 * Each number represents an index in the conditions array at that level.
 */
export type TreePath = readonly number[];

/**
 * Node identifier that can be either a path or an ID.
 */
export type NodeRef = TreePath | string;

/**
 * Base interface for all tree nodes.
 */
export interface TreeNodeBase {
  id: string;
  type: "condition" | "group";
}

/**
 * Filter tree node with schema context.
 * Wraps a condition or group with its resolved schema information.
 */
export interface FilterTreeNode<T extends FilterCondition | FilterGroup = FilterCondition | FilterGroup> {
  /** The underlying filter node */
  node: T;
  /** Path to this node from root */
  path: TreePath;
  /** Depth in the tree (0 = root) */
  depth: number;
  /** Parent node, if any */
  parent?: FilterTreeNode<FilterGroup>;
  /** Schema context at this node level */
  schemaContext: SchemaContext;
}

/**
 * Schema context for a tree node.
 * Contains resolved schema information for the current path.
 */
export interface SchemaContext {
  /** Current schema at this depth */
  schema: UnifiedFilterSchema;
  /** Path of relation names traversed to reach this context */
  relationPath: readonly string[];
  /** The relation that led to this context (if any) */
  parentRelation?: RelationFilter;
  /** Resolved field for conditions */
  field?: FilterableField;
  /** Whether the schema is loading */
  isLoading?: boolean;
  /** Error loading schema */
  error?: Error;
}

/**
 * Result of a tree traversal operation.
 */
export interface TraversalResult<T> {
  node: FilterCondition | FilterGroup;
  path: TreePath;
  depth: number;
  value: T;
}

/**
 * Options for tree traversal.
 */
export interface TraversalOptions {
  /** Maximum depth to traverse (default: Infinity) */
  maxDepth?: number;
  /** Whether to include the root node (default: true) */
  includeRoot?: boolean;
  /** Traversal order (default: "preorder") */
  order?: "preorder" | "postorder" | "breadth-first";
  /** Filter function to skip nodes */
  filter?: (node: FilterCondition | FilterGroup, path: TreePath) => boolean;
}

/**
 * Result of finding a node.
 */
export interface FindResult {
  node: FilterCondition | FilterGroup;
  path: TreePath;
  depth: number;
  parent?: FilterGroup;
  index: number;
}

/**
 * Options for tree mutation operations.
 */
export interface MutationOptions {
  /** Validate the mutation before applying */
  validate?: boolean;
  /** Generate new IDs for duplicated nodes */
  generateIds?: boolean;
}

/**
 * Callback for tree mapping operations.
 */
export type TreeMapper<T = FilterCondition | FilterGroup> = (
  node: FilterCondition | FilterGroup,
  path: TreePath,
  depth: number
) => T;

/**
 * Callback for tree filtering operations.
 */
export type TreeFilter = (
  node: FilterCondition | FilterGroup,
  path: TreePath,
  depth: number
) => boolean;

/**
 * Callback for tree walking operations.
 */
export type TreeWalker = (
  node: FilterCondition | FilterGroup,
  path: TreePath,
  depth: number
) => void | false;

/**
 * Result of a tree update operation.
 */
export interface UpdateResult {
  /** The updated tree */
  root: FilterGroup;
  /** Whether the update was successful */
  success: boolean;
  /** Path to the updated node */
  path?: TreePath;
  /** Error message if failed */
  error?: string;
}

/**
 * Tree statistics.
 */
export interface TreeStats {
  /** Total number of nodes */
  nodeCount: number;
  /** Number of conditions */
  conditionCount: number;
  /** Number of groups */
  groupCount: number;
  /** Maximum depth reached */
  maxDepth: number;
  /** Number of conditions with values */
  activeConditionCount: number;
}
