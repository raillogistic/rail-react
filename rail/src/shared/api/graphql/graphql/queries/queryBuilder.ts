import { gql, type DocumentNode } from "@apollo/client";
import { buildModelQueryField } from "./naming";
import { buildModelQuerySelection } from "./selection";
import type {
  BuildModelQueryDocumentOptions,
  BuiltModelQueryDocument,
  ModelQueryMode,
} from "./types";

/**
 * Maximum number of cached GQL document entries.
 * Prevents unbounded memory growth while keeping hot queries alive.
 */
const DOCUMENT_CACHE_MAX_SIZE = 64;

/**
 * LRU cache mapping query text → parsed Apollo DocumentNode.
 *
 * When capabilities metadata arrives after bootstrap, `buildModelQueryDocument`
 * is re-invoked even though the resulting query text hasn't changed (because the
 * upstream `metadata` reference changes). Without this cache every call to
 * `gql` produces a new DocumentNode — Apollo compares documents by reference
 * and therefore treats the identical query as brand-new, firing a redundant
 * network refetch that freezes the table.
 *
 * By caching by query _string_, we return the same DocumentNode reference
 * whenever the output text is unchanged, keeping Apollo stable.
 */
const documentCache = new Map<string, DocumentNode>();

/**
 * Returns a cached DocumentNode for the given query string, creating and
 * caching one only when the text has not been seen before.
 * Implements simple LRU eviction when the cache exceeds its max size.
 */
function getOrCreateDocument(queryText: string): DocumentNode {
  const cached = documentCache.get(queryText);
  if (cached) {
    /* Move to end for LRU ordering */
    documentCache.delete(queryText);
    documentCache.set(queryText, cached);
    return cached;
  }

  const doc = gql(queryText);
  documentCache.set(queryText, doc);

  if (documentCache.size > DOCUMENT_CACHE_MAX_SIZE) {
    /* Evict oldest (first) entry */
    const firstKey = documentCache.keys().next().value;
    if (firstKey !== undefined) {
      documentCache.delete(firstKey);
    }
  }

  return doc;
}

/**
 * Resolves whether quick-search variable should be emitted.
 */
function resolveSupportsQuick(
  options: BuildModelQueryDocumentOptions,
): boolean {
  if (typeof options.supportsQuick === "boolean") {
    return options.supportsQuick;
  }
  return Boolean(options.metadata?.filterConfig?.supportsQuick);
}

/**
 * Resolves where input type name with metadata-aware fallback.
 */
function resolveWhereTypeName(options: BuildModelQueryDocumentOptions): string {
  if (options.whereTypeName) return options.whereTypeName;
  if (options.metadata?.filterConfig?.inputTypeName) {
    return options.metadata.filterConfig.inputTypeName;
  }
  return `${options.model}WhereInput`;
}

/**
 * Returns default variable definitions and field assignments by mode.
 */
function buildDefaultArguments(
  mode: ModelQueryMode,
  whereTypeName: string,
  supportsQuick: boolean,
): {
  definitions: string[];
  assignments: string[];
} {
  if (mode === "single") {
    return {
      definitions: [`$id: ID!`],
      assignments: [`id: $id`],
    };
  }

  if (mode === "list") {
    return {
      definitions: [
        `$orderBy: [String]`,
        ...(supportsQuick ? [`$quick: String`] : []),
        `$where: ${whereTypeName}`,
        `$presets: [String]`,
        `$distinctOn: [String]`,
      ],
      assignments: [
        `orderBy: $orderBy`,
        ...(supportsQuick ? [`quick: $quick`] : []),
        `where: $where`,
        `presets: $presets`,
        `distinctOn: $distinctOn`,
      ],
    };
  }

  return {
    definitions: [
      `$page: Int`,
      `$perPage: Int`,
      `$orderBy: [String]`,
      ...(supportsQuick ? [`$quick: String`] : []),
      `$where: ${whereTypeName}`,
      `$presets: [String]`,
      `$distinctOn: [String]`,
      `$skipCount: Boolean`,
    ],
    assignments: [
      `page: $page`,
      `perPage: $perPage`,
      `orderBy: $orderBy`,
      ...(supportsQuick ? [`quick: $quick`] : []),
      `where: $where`,
      `presets: $presets`,
      `distinctOn: $distinctOn`,
      `skipCount: $skipCount`,
    ],
  };
}

/**
 * Builds operation selection body for current query mode.
 */
function buildSelectionBlock(mode: ModelQueryMode, selection: string): string {
  if (mode === "page") {
    return `pageInfo {
          totalCount
          pageCount
          hasNextPage
          hasPreviousPage
        }
        items {
          ${selection}
        }`;
  }

  return selection;
}

/**
 * Builds backend-compatible GraphQL document for model queries.
 */
export function buildModelQueryDocument(
  options: BuildModelQueryDocumentOptions,
): BuiltModelQueryDocument {
  const supportsQuick = resolveSupportsQuick(options);
  const whereTypeName = resolveWhereTypeName(options);
  const queryName =
    options.queryName ||
    buildModelQueryField(
      options.model,
      options.mode === "page"
        ? "page"
        : options.mode === "list"
          ? "list"
          : "single",
      options.managerName,
    );
  const operationName = options.operationName || queryName;
  const selection = buildModelQuerySelection({
    metadata: options.metadata,
    fields: options.fields,
    includeFields: options.includeFields,
    excludeFields: options.excludeFields,
    relations: options.relations,
    includeRelations: options.includeRelations,
    excludeRelations: options.excludeRelations,
    selection: options.selection,
    includeRowPermissions: options.includeRowPermissions,
  });

  const defaultArguments = buildDefaultArguments(
    options.mode,
    whereTypeName,
    supportsQuick,
  );
  const definitions =
    options.customArgumentDefinitions || defaultArguments.definitions;
  const assignments =
    options.customArgumentAssignments || defaultArguments.assignments;

  const definitionBlock = definitions.filter(Boolean).join("\n      ");
  const assignmentBlock = assignments.filter(Boolean).join("\n        ");
  const selectionBlock = buildSelectionBlock(options.mode, selection);

  const queryText = `
    query ${operationName}(
      ${definitionBlock}
    ) {
      ${queryName}(
        ${assignmentBlock}
      ) {
        ${selectionBlock}
      }
    }
  `;

  const queryDocument = getOrCreateDocument(queryText);

  return {
    queryDocument,
    queryName,
    operationName,
  };
}
