/**
 * FilterTree - Schema Context Resolution
 *
 * Utilities for resolving schema context along tree paths.
 */

import type {
  FilterCondition,
  FilterGroup,
  UnifiedFilterSchema,
  RelationFilter,
  FilterableField,
} from "../types";
import type {
  TreePath,
  SchemaContext,
  FilterTreeNode,
} from "./types";
import { walkTree, findByPath } from "./operations";

/**
 * Cache for resolved schema contexts to avoid repeated lookups.
 */
const schemaContextCache = new WeakMap<
  UnifiedFilterSchema,
  Map<string, SchemaContext>
>();

/**
 * Clear the schema context cache for a schema.
 */
export function clearSchemaContextCache(schema: UnifiedFilterSchema): void {
  schemaContextCache.delete(schema);
}

/**
 * Get or create the context cache for a schema.
 */
function getContextCache(schema: UnifiedFilterSchema): Map<string, SchemaContext> {
  let cache = schemaContextCache.get(schema);
  if (!cache) {
    cache = new Map();
    schemaContextCache.set(schema, cache);
  }
  return cache;
}

/**
 * Resolve the schema context for a field path.
 *
 * @param rootSchema - The root schema
 * @param fieldPath - Path of field/relation names (e.g., ["category", "parent", "name"])
 * @returns The resolved schema context, or null if the path is invalid
 */
export function resolveSchemaContext(
  rootSchema: UnifiedFilterSchema,
  fieldPath: readonly string[]
): SchemaContext | null {
  const cacheKey = fieldPath.join(".");
  const cache = getContextCache(rootSchema);

  if (cache.has(cacheKey)) {
    return cache.get(cacheKey)!;
  }

  let currentSchema: UnifiedFilterSchema = rootSchema;
  const relationPath: string[] = [];
  let parentRelation: RelationFilter | undefined;

  // Traverse through relations to find the final schema context
  for (let i = 0; i < fieldPath.length - 1; i++) {
    const segment = fieldPath[i];
    const relation = currentSchema.relationFilters.find(
      (r) => r.name === segment || r.fieldName === segment
    );

    if (!relation) {
      // Not a relation, might be the field itself
      break;
    }

    relationPath.push(segment);
    parentRelation = relation;

    if (relation.nestedSchema) {
      currentSchema = relation.nestedSchema;
    } else {
      // Schema not loaded - return context with loading indicator
      const context: SchemaContext = {
        schema: currentSchema,
        relationPath: [...relationPath],
        parentRelation,
        isLoading: true,
      };
      cache.set(cacheKey, context);
      return context;
    }
  }

  // Find the final field
  const fieldName = fieldPath[fieldPath.length - 1];
  const field = currentSchema.fields.find(
    (f) => f.name === fieldName || f.fieldName === fieldName
  );

  const context: SchemaContext = {
    schema: currentSchema,
    relationPath: [...relationPath],
    parentRelation,
    field,
  };

  cache.set(cacheKey, context);
  return context;
}

/**
 * Resolve schema context for a condition.
 */
export function resolveConditionContext(
  rootSchema: UnifiedFilterSchema,
  condition: FilterCondition
): SchemaContext | null {
  return resolveSchemaContext(rootSchema, condition.fieldPath);
}

/**
 * Create a FilterTreeNode with resolved schema context.
 */
export function createTreeNode<T extends FilterCondition | FilterGroup>(
  node: T,
  path: TreePath,
  depth: number,
  rootSchema: UnifiedFilterSchema,
  parent?: FilterTreeNode<FilterGroup>
): FilterTreeNode<T> {
  let schemaContext: SchemaContext;

  if (node.type === "condition") {
    const condition = node as FilterCondition;
    schemaContext = resolveSchemaContext(rootSchema, condition.fieldPath) ?? {
      schema: rootSchema,
      relationPath: [],
    };
  } else {
    // Groups inherit parent's schema context or use root
    schemaContext = parent?.schemaContext ?? {
      schema: rootSchema,
      relationPath: [],
    };
  }

  return {
    node,
    path,
    depth,
    parent,
    schemaContext,
  };
}

/**
 * Build a complete tree of FilterTreeNodes with schema context.
 */
export function buildContextTree(
  root: FilterGroup,
  rootSchema: UnifiedFilterSchema
): FilterTreeNode<FilterGroup> {
  function buildNode(
    node: FilterCondition | FilterGroup,
    path: TreePath,
    depth: number,
    parent?: FilterTreeNode<FilterGroup>
  ): FilterTreeNode<FilterCondition | FilterGroup> {
    const treeNode = createTreeNode(node, path, depth, rootSchema, parent);

    if (node.type === "group") {
      const groupNode = treeNode as FilterTreeNode<FilterGroup>;
      // Note: We don't store children directly, but they can be resolved on demand
      return groupNode;
    }

    return treeNode;
  }

  return buildNode(root, [], 0) as FilterTreeNode<FilterGroup>;
}

/**
 * Get all tree nodes with their schema contexts.
 */
export function getAllTreeNodes(
  root: FilterGroup,
  rootSchema: UnifiedFilterSchema
): FilterTreeNode[] {
  const nodes: FilterTreeNode[] = [];
  const parentStack: FilterTreeNode<FilterGroup>[] = [];

  walkTree(root, (node, path, depth) => {
    // Adjust parent stack
    while (parentStack.length > 0 && parentStack.length >= depth) {
      parentStack.pop();
    }

    const parent = parentStack.length > 0 ? parentStack[parentStack.length - 1] : undefined;
    const treeNode = createTreeNode(node, path, depth, rootSchema, parent);

    nodes.push(treeNode);

    if (node.type === "group") {
      parentStack.push(treeNode as FilterTreeNode<FilterGroup>);
    }
  });

  return nodes;
}

/**
 * Find all relations that need their schemas loaded.
 */
export function findUnloadedRelations(
  root: FilterGroup,
  rootSchema: UnifiedFilterSchema
): Array<{ path: string[]; relation: RelationFilter }> {
  const unloaded: Array<{ path: string[]; relation: RelationFilter }> = [];
  const checked = new Set<string>();

  walkTree(root, (node) => {
    if (node.type !== "condition") return;

    const condition = node as FilterCondition;
    const { fieldPath } = condition;

    // Check each segment of the path for unloaded relation schemas
    let currentSchema: UnifiedFilterSchema | undefined = rootSchema;
    const pathSoFar: string[] = [];

    for (let i = 0; i < fieldPath.length - 1; i++) {
      const segment = fieldPath[i];
      pathSoFar.push(segment);
      const key = pathSoFar.join(".");

      if (checked.has(key)) continue;
      checked.add(key);

      const relation = currentSchema?.relationFilters.find(
        (r) => r.name === segment || r.fieldName === segment
      );

      if (relation) {
        if (!relation.nestedSchema) {
          unloaded.push({ path: [...pathSoFar], relation });
        } else {
          currentSchema = relation.nestedSchema;
        }
      } else {
        break;
      }
    }
  });

  return unloaded;
}

/**
 * Get available fields at a given relation path.
 */
export function getFieldsAtPath(
  rootSchema: UnifiedFilterSchema,
  relationPath: readonly string[]
): FilterableField[] {
  let currentSchema: UnifiedFilterSchema = rootSchema;

  for (const segment of relationPath) {
    const relation = currentSchema.relationFilters.find(
      (r) => r.name === segment || r.fieldName === segment
    );

    if (!relation?.nestedSchema) {
      return [];
    }

    currentSchema = relation.nestedSchema;
  }

  return currentSchema.fields;
}

/**
 * Get available relations at a given relation path.
 */
export function getRelationsAtPath(
  rootSchema: UnifiedFilterSchema,
  relationPath: readonly string[]
): RelationFilter[] {
  let currentSchema: UnifiedFilterSchema = rootSchema;

  for (const segment of relationPath) {
    const relation = currentSchema.relationFilters.find(
      (r) => r.name === segment || r.fieldName === segment
    );

    if (!relation?.nestedSchema) {
      return [];
    }

    currentSchema = relation.nestedSchema;
  }

  return currentSchema.relationFilters;
}

/**
 * Validate that a field path is valid for the given schema.
 */
export function validateFieldPath(
  rootSchema: UnifiedFilterSchema,
  fieldPath: readonly string[],
  maxDepth: number = Infinity
): { valid: boolean; error?: string } {
  if (fieldPath.length === 0) {
    return { valid: false, error: "Field path cannot be empty" };
  }

  if (fieldPath.length - 1 > maxDepth) {
    return { valid: false, error: `Path exceeds maximum depth of ${maxDepth}` };
  }

  let currentSchema: UnifiedFilterSchema = rootSchema;

  for (let i = 0; i < fieldPath.length - 1; i++) {
    const segment = fieldPath[i];
    const relation = currentSchema.relationFilters.find(
      (r) => r.name === segment || r.fieldName === segment
    );

    if (!relation) {
      return {
        valid: false,
        error: `Relation "${segment}" not found at depth ${i}`,
      };
    }

    if (!relation.nestedSchema) {
      return {
        valid: false,
        error: `Schema for relation "${segment}" not loaded`,
      };
    }

    currentSchema = relation.nestedSchema;
  }

  const fieldName = fieldPath[fieldPath.length - 1];
  const field = currentSchema.fields.find(
    (f) => f.name === fieldName || f.fieldName === fieldName
  );

  if (!field) {
    return {
      valid: false,
      error: `Field "${fieldName}" not found in schema`,
    };
  }

  return { valid: true };
}
