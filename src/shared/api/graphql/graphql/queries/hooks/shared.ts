import { gql } from "@apollo/client";
import type {
  BuiltModelQueryDocument,
  ModelQueryFieldsInput,
  ModelQueryRelationFieldConfig,
  ModelQuerySelectionTree,
  UseModelQueryBaseOptions,
} from "../types";
import type { MetadataProfile } from "@/shared/api/graphql/graphql/metadata/telemetry";
import type { ModelMetadata } from "@/shared/api/graphql/graphql/metadata/types";

/**
 * Skip-safe fallback query document used when generated query is unavailable.
 */
export const MODEL_QUERY_SKIP_DOCUMENT = gql`
  query ModelQuerySkip {
    __typename
  }
`;

/**
 * Returns `true` when metadata is required to build query document.
 */
export function requiresMetadataForQuery(
  selection: unknown,
  fields: unknown,
  includeFields?: unknown,
  includeRelations?: unknown,
): boolean {
  if (typeof selection === "string" && selection.trim()) return false;
  if (selection && typeof selection === "object") return false;
  if (Array.isArray(fields) && fields.length > 0) return false;
  if (Array.isArray(includeFields) && includeFields.length > 0) return false;
  if (Array.isArray(includeRelations) && includeRelations.length > 0) return false;
  return true;
}

/**
 * Resolves active document used by Apollo query execution.
 */
export function resolveActiveDocument(
  built: BuiltModelQueryDocument | null,
) {
  return built?.queryDocument ?? MODEL_QUERY_SKIP_DOCUMENT;
}

/**
 * Normalized query options consumed by generated query hooks.
 */
export interface ResolvedModelQueryOptions {
  app: string;
  model: string;
  managerName?: string;
  metadata?: ModelMetadata | null;
  metadataProfile?: MetadataProfile;
  skipMetadata?: boolean;
  metadataQueryOptions?: Record<string, unknown>;
  fields?: ModelQueryFieldsInput;
  includeFields?: ModelQueryFieldsInput;
  excludeFields?: string[];
  relations?: Record<string, ModelQueryRelationFieldConfig>;
  includeRelations?: string[];
  excludeRelations?: string[];
  selection?: string | ModelQuerySelectionTree;
  includeRowPermissions?: boolean;
  whereTypeName?: string;
  supportsQuick?: boolean;
  operationName?: string;
  queryName?: string;
  customArgumentDefinitions?: string[];
  customArgumentAssignments?: string[];
}

/**
 * Resolves grouped query options with backward-compatible flat fallback.
 */
export function resolveModelQueryOptions(
  options: UseModelQueryBaseOptions,
): ResolvedModelQueryOptions {
  const identity = options.identity || {};
  const metadataOptions = options.metadataOptions || {};
  const selectionOptions = options.selectionOptions || {};
  const executionOptions = options.executionOptions || {};

  return {
    app: identity.app ?? options.app ?? "",
    model: identity.model ?? options.model ?? "",
    managerName: identity.managerName ?? options.managerName,
    metadata: metadataOptions.metadata ?? options.metadata,
    metadataProfile: metadataOptions.metadataProfile ?? options.metadataProfile,
    skipMetadata: metadataOptions.skipMetadata ?? options.skipMetadata,
    metadataQueryOptions:
      metadataOptions.metadataQueryOptions ?? options.metadataQueryOptions,
    fields: selectionOptions.fields ?? options.fields,
    includeFields: selectionOptions.includeFields ?? options.includeFields,
    excludeFields: selectionOptions.excludeFields ?? options.excludeFields,
    relations: selectionOptions.relations ?? options.relations,
    includeRelations:
      selectionOptions.includeRelations ?? options.includeRelations,
    excludeRelations:
      selectionOptions.excludeRelations ?? options.excludeRelations,
    selection: selectionOptions.selection ?? options.selection,
    includeRowPermissions:
      selectionOptions.includeRowPermissions ?? options.includeRowPermissions,
    whereTypeName: executionOptions.whereTypeName ?? options.whereTypeName,
    supportsQuick: executionOptions.supportsQuick ?? options.supportsQuick,
    operationName: executionOptions.operationName ?? options.operationName,
    queryName: executionOptions.queryName ?? options.queryName,
    customArgumentDefinitions:
      executionOptions.customArgumentDefinitions ??
      options.customArgumentDefinitions,
    customArgumentAssignments:
      executionOptions.customArgumentAssignments ??
      options.customArgumentAssignments,
  };
}

