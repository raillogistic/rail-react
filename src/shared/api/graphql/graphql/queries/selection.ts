import type {
  BuildModelQuerySelectionOptions,
  ModelQueryFieldConfig,
  ModelQueryFieldsInput,
  ModelQueryRelationFieldConfig,
  ModelQuerySelectionTree,
} from "./types";
import type { ModelMetadata } from "@/shared/api/graphql/graphql/metadata/types";
import { toCamelCase, toGraphqlFieldName, toSnakeCase } from "./naming";

interface SelectionTreeNode {
  [key: string]: SelectionTreeNode | true;
}

/**
 * Returns true when a value is a valid field config object.
 */
function isFieldConfig(value: unknown): value is ModelQueryFieldConfig {
  return !!value && typeof value === "object" && "accessor" in value;
}

/**
 * Normalizes fields input to plain accessor list.
 */
function normalizeFieldAccessors(fields?: ModelQueryFieldsInput): string[] {
  if (!Array.isArray(fields)) return [];
  return fields
    .map((entry) => (isFieldConfig(entry) ? entry.accessor : entry))
    .map((entry) => String(entry || "").trim())
    .filter(Boolean);
}

/**
 * Normalizes string array input by trimming empty values.
 */
function normalizeStringArray(values?: string[]): string[] {
  if (!Array.isArray(values)) return [];
  return values.map((value) => String(value || "").trim()).filter(Boolean);
}

/**
 * Registers all naming variants for a canonical key in lookup maps.
 */
function registerCanonical(
  lookup: Map<string, string>,
  canonical: string,
  key?: string,
): void {
  const value = String(key || "").trim();
  if (!value) return;
  lookup.set(value, canonical);
  lookup.set(toGraphqlFieldName(value), canonical);
  lookup.set(toSnakeCase(value), canonical);
  lookup.set(toCamelCase(value), canonical);
}

/**
 * Builds root canonical lookup tables for fields and relations.
 */
function buildRootLookup(metadata?: ModelMetadata | null): {
  fieldCanonicalByKey: Map<string, string>;
  relationCanonicalByKey: Map<string, string>;
} {
  const fieldCanonicalByKey = new Map<string, string>();
  const relationCanonicalByKey = new Map<string, string>();

  metadata?.fields?.forEach((field) => {
    const canonical = toGraphqlFieldName(field.name || field.fieldName || "");
    if (!canonical) return;
    registerCanonical(fieldCanonicalByKey, canonical, field.name);
    registerCanonical(fieldCanonicalByKey, canonical, field.fieldName);
    registerCanonical(fieldCanonicalByKey, canonical, canonical);
  });

  metadata?.relationships?.forEach((relation) => {
    const canonical = toGraphqlFieldName(
      relation.name || relation.fieldName || "",
    );
    if (!canonical) return;
    registerCanonical(relationCanonicalByKey, canonical, relation.name);
    registerCanonical(relationCanonicalByKey, canonical, relation.fieldName);
    registerCanonical(relationCanonicalByKey, canonical, canonical);
  });

  return { fieldCanonicalByKey, relationCanonicalByKey };
}

/**
 * Canonicalizes an accessor string to GraphQL dotted path format.
 */
function canonicalizeAccessor(
  accessor: string,
  metadata?: ModelMetadata | null,
): string {
  const parts = String(accessor || "")
    .replace(/__/g, ".")
    .split(".")
    .filter(Boolean);
  if (parts.length === 0) return "";

  const { fieldCanonicalByKey, relationCanonicalByKey } = buildRootLookup(
    metadata,
  );

  const [root, ...rest] = parts;
  const canonicalRoot =
    relationCanonicalByKey.get(root) ??
    fieldCanonicalByKey.get(root) ??
    (metadata ? "" : toGraphqlFieldName(root));
  if (!canonicalRoot) return "";

  const canonicalRest = rest
    .map((segment) => toGraphqlFieldName(segment))
    .filter(Boolean);
  return [canonicalRoot, ...canonicalRest].join(".");
}

/**
 * Checks whether a canonical root accessor maps to a relationship.
 */
function isRelationRoot(root: string, metadata?: ModelMetadata | null): boolean {
  if (!metadata) return false;
  const canonical = toGraphqlFieldName(root);
  return (metadata.relationships || []).some((relation) => {
    const relationCanonical = toGraphqlFieldName(
      relation.name || relation.fieldName || "",
    );
    return relationCanonical === canonical;
  });
}

/**
 * Resolves relation config by checking canonical/snake/camel variants.
 */
function resolveRelationConfig(
  relationRoot: string,
  relationConfig: Record<string, ModelQueryRelationFieldConfig>,
): ModelQueryRelationFieldConfig | undefined {
  const candidates = [
    relationRoot,
    toSnakeCase(relationRoot),
    toCamelCase(relationRoot),
    toGraphqlFieldName(relationRoot),
  ].filter(Boolean);

  for (const candidate of candidates) {
    const resolved = relationConfig[candidate];
    if (resolved) return resolved;
  }
  return undefined;
}

/**
 * Builds default relation nested fields for selected relation roots.
 */
function getRelationDefaults(
  relationRoot: string,
  metadata?: ModelMetadata | null,
  relationConfig: Record<string, ModelQueryRelationFieldConfig> = {},
): string[] {
  const config = resolveRelationConfig(relationRoot, relationConfig);
  const defaults = new Set<string>();

  if (config?.includeId !== false) defaults.add("id");
  if (config?.includeDesc !== false) defaults.add("desc");
  if (config?.display) defaults.add(config.display);
  (config?.fields || []).forEach((entry) => defaults.add(entry));
  (config?.include || []).forEach((entry) => defaults.add(entry));

  const relation = (metadata?.relationships || []).find((entry) => {
    const canonical = toGraphqlFieldName(entry.name || entry.fieldName || "");
    return canonical === relationRoot;
  });

  if (
    config?.includeLookupField === true &&
    relation?.lookupField &&
    relation.lookupField !== "id" &&
    relation.lookupField !== "__str__"
  ) {
    defaults.add(relation.lookupField);
  }

  const excluded = new Set(
    (config?.exclude || []).map((entry) => toGraphqlFieldName(entry)),
  );

  return Array.from(defaults)
    .map((entry) => toGraphqlFieldName(entry))
    .filter((entry) => !excluded.has(entry))
    .filter(Boolean);
}

/**
 * Returns canonical accessor list from raw accessor strings.
 */
function normalizeCanonicalAccessors(
  accessors: string[],
  metadata?: ModelMetadata | null,
): string[] {
  return accessors
    .map((entry) => canonicalizeAccessor(entry, metadata))
    .filter(Boolean);
}

/**
 * Resolves canonical relation roots from raw relation names.
 */
function normalizeRelationRoots(
  relationNames: string[],
  metadata?: ModelMetadata | null,
): Set<string> {
  const roots = new Set<string>();
  relationNames.forEach((entry) => {
    const canonical = canonicalizeAccessor(entry, metadata);
    if (!canonical) return;
    const root = canonical.split(".")[0];
    if (root) {
      roots.add(root);
    }
  });
  return roots;
}

/**
 * Returns true when a canonical accessor should be filtered out.
 */
function isAccessorExcluded(
  canonicalAccessor: string,
  excludedAccessors: Set<string>,
  excludedRelationRoots: Set<string>,
): boolean {
  const root = canonicalAccessor.split(".")[0];
  if (root && excludedRelationRoots.has(root)) {
    return true;
  }

  if (excludedAccessors.has(canonicalAccessor)) {
    return true;
  }

  for (const excluded of excludedAccessors) {
    if (canonicalAccessor.startsWith(`${excluded}.`)) {
      return true;
    }
  }

  return false;
}

/**
 * Ensures a tree child node exists and returns it.
 */
function ensureNode(tree: SelectionTreeNode, key: string): SelectionTreeNode {
  if (!tree[key] || tree[key] === true) {
    tree[key] = {};
  }
  return tree[key] as SelectionTreeNode;
}

/**
 * Adds a dotted path to selection tree.
 */
function addPath(tree: SelectionTreeNode, path: string): void {
  const parts = path.split(".").filter(Boolean);
  if (parts.length === 0) return;
  let cursor = tree;
  parts.forEach((part, index) => {
    if (index === parts.length - 1) {
      cursor[part] = true;
      return;
    }
    cursor = ensureNode(cursor, part);
  });
}

/**
 * Recursively serializes a selection tree.
 */
function serializeTree(tree: SelectionTreeNode): string {
  return Object.keys(tree)
    .sort()
    .map((key) => {
      const child = tree[key];
      if (child === true) return key;
      return `${key} {\n        ${serializeTree(child)}\n      }`;
    })
    .join("\n      ");
}

/**
 * Converts public selection-tree type to internal tree node.
 */
function normalizePublicTree(tree: ModelQuerySelectionTree): SelectionTreeNode {
  const output: SelectionTreeNode = {};
  Object.entries(tree || {}).forEach(([key, value]) => {
    const canonicalKey = toGraphqlFieldName(key);
    if (!canonicalKey) return;
    if (value === true) {
      output[canonicalKey] = true;
      return;
    }
    output[canonicalKey] = normalizePublicTree(value);
  });
  return output;
}

/**
 * Returns default accessors from metadata for visible and readable fields.
 */
function getDefaultMetadataAccessors(metadata?: ModelMetadata | null): string[] {
  if (!metadata) return [];
  const fieldAccessors = (metadata.fields || [])
    .filter(
      (field) => field.visibility !== "hidden" && field.readable !== false,
    )
    .map((field) => toGraphqlFieldName(field.name || field.fieldName || ""))
    .filter(Boolean);

  const relationAccessors = (metadata.relationships || [])
    .filter((relation) => relation.readable !== false)
    .map((relation) =>
      toGraphqlFieldName(relation.name || relation.fieldName || ""),
    )
    .filter(Boolean);

  return [...fieldAccessors, ...relationAccessors];
}

/**
 * Builds the row-permissions selection block.
 */
function getRowPermissionsSelection(): string {
  return `rowPermissions {
        canUpdate
        canDelete
        updateReason
        deleteReason
      }`;
}

/**
 * Builds the final GraphQL selection for generated model queries.
 */
export function buildModelQuerySelection(
  options: BuildModelQuerySelectionOptions,
): string {
  if (typeof options.selection === "string" && options.selection.trim()) {
    return options.selection.trim();
  }

  if (
    options.selection &&
    typeof options.selection === "object" &&
    !Array.isArray(options.selection)
  ) {
    const treeSelection = serializeTree(normalizePublicTree(options.selection));
    if (options.includeRowPermissions === false) return treeSelection;
    return [treeSelection, getRowPermissionsSelection()].filter(Boolean).join(
      "\n      ",
    );
  }

  const relationConfig = options.relations || {};
  const accessors = normalizeFieldAccessors(options.fields);
  const includeAccessors = normalizeFieldAccessors(options.includeFields);
  const includeRelations = normalizeStringArray(options.includeRelations);
  const excludeAccessorsRaw = normalizeStringArray(options.excludeFields);
  const excludeRelationsRaw = normalizeStringArray(options.excludeRelations);

  const baseAccessors =
    accessors.length > 0
      ? accessors
      : getDefaultMetadataAccessors(options.metadata);
  const resolvedAccessors = Array.from(
    new Set([...baseAccessors, ...includeAccessors, ...includeRelations]),
  );

  const excludedAccessors = new Set(
    normalizeCanonicalAccessors(excludeAccessorsRaw, options.metadata),
  );
  const excludedRelationRoots = normalizeRelationRoots(
    excludeRelationsRaw,
    options.metadata,
  );
  const explicitlyIncludedRelationRoots = normalizeRelationRoots(
    includeRelations,
    options.metadata,
  );

  const tree: SelectionTreeNode = {};
  resolvedAccessors.forEach((entry) => {
    const canonical = canonicalizeAccessor(entry, options.metadata);
    if (!canonical) return;
    if (isAccessorExcluded(canonical, excludedAccessors, excludedRelationRoots)) {
      return;
    }

    const parts = canonical.split(".").filter(Boolean);
    if (parts.length === 0) return;
    const [root, ...rest] = parts;
    if (!root) return;

    if (
      rest.length === 0 &&
      (isRelationRoot(root, options.metadata) ||
        explicitlyIncludedRelationRoots.has(root))
    ) {
      getRelationDefaults(root, options.metadata, relationConfig).forEach(
        (field) => addPath(tree, `${root}.${field}`),
      );
      return;
    }

    if (rest.length > 0) {
      getRelationDefaults(root, options.metadata, relationConfig).forEach(
        (field) => addPath(tree, `${root}.${field}`),
      );
    }

    addPath(tree, canonical);
  });

  if (!tree.id) {
    tree.id = true;
  }

  const baseSelection = serializeTree(tree);
  if (options.includeRowPermissions === false) return baseSelection;

  return [baseSelection, getRowPermissionsSelection()].filter(Boolean).join(
    "\n      ",
  );
}

