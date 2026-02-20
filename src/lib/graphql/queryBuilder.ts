import { gql } from "@apollo/client";
import { buildModelQueryField } from "./naming";
import { buildModelQuerySelection } from "./selection";
import type {
  BuildModelQueryDocumentOptions,
  BuiltModelQueryDocument,
  ModelQueryMode,
} from "./types";

/**
 * Resolves whether quick-search variable should be emitted.
 */
function resolveSupportsQuick(options: BuildModelQueryDocumentOptions): boolean {
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
      definitions: [`$id: ID!`, `$where: ${whereTypeName}`],
      assignments: [`id: $id`, `where: $where`],
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
function buildSelectionBlock(
  mode: ModelQueryMode,
  selection: string,
): string {
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
    relations: options.relations,
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

  const queryDocument = gql`
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

  return {
    queryDocument,
    queryName,
    operationName,
  };
}
