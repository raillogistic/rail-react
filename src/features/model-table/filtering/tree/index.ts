/**
 * FilterTree - Module Index
 *
 * Re-exports all tree utilities for convenient imports.
 */

// Types
export type {
  TreePath,
  NodeRef,
  TreeNodeBase,
  FilterTreeNode,
  SchemaContext,
  TraversalResult,
  TraversalOptions,
  FindResult,
  MutationOptions,
  TreeMapper,
  TreeFilter,
  TreeWalker,
  UpdateResult,
  TreeStats,
} from "./types";

// Core Operations
export {
  // Path utilities
  pathEquals,
  isAncestor,
  isDescendant,
  parentPath,
  lastIndex,
  pathToString,
  stringToPath,
  // Finding
  findByPath,
  findById,
  findAll,
  // Traversal
  walkTree,
  mapTree,
  filterTree,
  collectTree,
  // Mutations
  updateByPath,
  updateById,
  removeByPath,
  removeById,
  insertAt,
  appendChild,
  moveNode,
  // Statistics
  getTreeStats,
  // ID Management
  generateId,
  regenerateIds,
  // Creation
  createGroup,
  createCondition,
  cloneNode,
} from "./operations";

// Schema Context
export {
  clearSchemaContextCache,
  resolveSchemaContext,
  resolveConditionContext,
  createTreeNode,
  buildContextTree,
  getAllTreeNodes,
  findUnloadedRelations,
  getFieldsAtPath,
  getRelationsAtPath,
  validateFieldPath,
} from "./schemaContext";
