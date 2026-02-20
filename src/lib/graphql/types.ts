import type { DocumentNode, OperationVariables, QueryHookOptions } from "@apollo/client";
import type { ModelMetadata } from "@/lib/metadata/types";
import type { MetadataProfile } from "@/lib/metadata/telemetry";

/**
 * Supported generated model query modes.
 */
export type ModelQueryMode = "single" | "list" | "page";

/**
 * Recursive tree representation for GraphQL field selection.
 */
export type ModelQuerySelectionTree = {
  [key: string]: true | ModelQuerySelectionTree;
};

/**
 * Configurable field accessor entry used by generated query selection.
 */
export interface ModelQueryFieldConfig {
  /**
   * Dot or double-underscore accessor (for example `customer.name` or `customer__name`).
   */
  accessor: string;
}

/**
 * Input format for field accessors.
 */
export type ModelQueryFieldsInput = Array<string | ModelQueryFieldConfig>;

/**
 * Relation-level selection defaults for generated queries.
 */
export interface ModelQueryRelationFieldConfig {
  /**
   * Additional nested fields to include for a relation root.
   */
  fields?: string[];
  /**
   * Relation display field override.
   */
  display?: string;
  /**
   * Include relation `id` by default.
   */
  includeId?: boolean;
  /**
   * Include relation `desc` by default.
   */
  includeDesc?: boolean;
  /**
   * Include relation lookup field from metadata by default.
   */
  includeLookupField?: boolean;
}

/**
 * Base query variable input shared across list/page operations.
 */
export interface ModelCommonQueryVariablesInput {
  /**
   * Full-text style quick search value.
   */
  quick?: string;
  /**
   * Structured where payload.
   */
  where?: unknown;
  /**
   * Preset names.
   */
  presets?: unknown;
  /**
   * Distinct-on fields.
   */
  distinctOn?: unknown;
  /**
   * Order by tokens.
   */
  orderBy?: unknown;
  /**
   * Skip count flag (supported by paginated endpoints).
   */
  skipCount?: boolean;
  /**
   * Additional variables merged into final variable payload.
   */
  extra?: Record<string, unknown>;
}

/**
 * Variable input for paginated model queries.
 */
export interface ModelPageQueryVariablesInput extends ModelCommonQueryVariablesInput {
  /**
   * Requested page (1-based).
   */
  page?: number;
  /**
   * Requested page size.
   */
  perPage?: number;
}

/**
 * Variable input for list model queries.
 */
export interface ModelListQueryVariablesInput extends ModelCommonQueryVariablesInput {}

/**
 * Variable input for single model queries.
 */
export interface ModelSingleQueryVariablesInput {
  /**
   * Object identifier.
   */
  id?: string | number | null;
  /**
   * Optional where payload for custom resolver variants.
   */
  where?: unknown;
  /**
   * Additional variables merged into final variable payload.
   */
  extra?: Record<string, unknown>;
}

/**
 * Shared options for generated model query hooks.
 */
export interface UseModelQueryBaseOptions {
  /**
   * Django app label.
   */
  app: string;
  /**
   * Django model name.
   */
  model: string;
  /**
   * Optional manager suffix used by backend query generators.
   */
  managerName?: string;
  /**
   * Preloaded metadata snapshot to bypass metadata fetching.
   */
  metadata?: ModelMetadata | null;
  /**
   * Metadata profile used when metadata fetching is enabled.
   */
  metadataProfile?: MetadataProfile;
  /**
   * Disables metadata fetching.
   */
  skipMetadata?: boolean;
  /**
   * Query options passed to metadata gateway requests.
   */
  metadataQueryOptions?: Record<string, unknown>;
  /**
   * Predefined field accessors. When omitted, fields are derived from metadata.
   */
  fields?: ModelQueryFieldsInput;
  /**
   * Relation defaults used when relation roots are selected.
   */
  relations?: Record<string, ModelQueryRelationFieldConfig>;
  /**
   * Manual selection override. Accepts raw selection string or a selection tree.
   */
  selection?: string | ModelQuerySelectionTree;
  /**
   * Explicit override for `where` input type.
   */
  whereTypeName?: string;
  /**
   * Override quick-search support detection.
   */
  supportsQuick?: boolean;
  /**
   * Include row permissions block in generated selection.
   */
  includeRowPermissions?: boolean;
  /**
   * Override GraphQL operation name.
   */
  operationName?: string;
  /**
   * Override backend root query field name.
   */
  queryName?: string;
  /**
   * Replace generated variable definitions.
   */
  customArgumentDefinitions?: string[];
  /**
   * Replace generated field call arguments.
   */
  customArgumentAssignments?: string[];
  /**
   * Apollo `useQuery` options for generated query execution.
   */
  apollo?: QueryHookOptions<Record<string, unknown>, OperationVariables>;
}

/**
 * Options for generated paginated query hook.
 */
export interface UseModelPageQueryOptions extends UseModelQueryBaseOptions {
  /**
   * Variables for paginated model query.
   */
  variables?: ModelPageQueryVariablesInput;
}

/**
 * Options for generated list query hook.
 */
export interface UseModelListQueryOptions extends UseModelQueryBaseOptions {
  /**
   * Variables for list model query.
   */
  variables?: ModelListQueryVariablesInput;
}

/**
 * Options for generated single query hook.
 */
export interface UseModelSingleQueryOptions extends UseModelQueryBaseOptions {
  /**
   * Variables for single model query.
   */
  variables?: ModelSingleQueryVariablesInput;
  /**
   * Indicates whether `id` is required to run the query.
   */
  requireId?: boolean;
}

/**
 * Result metadata for generated query document.
 */
export interface BuiltModelQueryDocument {
  /**
   * GraphQL document node.
   */
  queryDocument: DocumentNode;
  /**
   * Root query field name.
   */
  queryName: string;
  /**
   * GraphQL operation name.
   */
  operationName: string;
}

/**
 * Input used by document builder.
 */
export interface BuildModelQueryDocumentOptions {
  /**
   * Query mode.
   */
  mode: ModelQueryMode;
  /**
   * Model identity.
   */
  model: string;
  /**
   * Optional manager suffix.
   */
  managerName?: string;
  /**
   * Metadata snapshot used for where type and supportsQuick.
   */
  metadata?: ModelMetadata | null;
  /**
   * Manual selection override.
   */
  selection?: string | ModelQuerySelectionTree;
  /**
   * Predefined field list.
   */
  fields?: ModelQueryFieldsInput;
  /**
   * Relation defaults.
   */
  relations?: Record<string, ModelQueryRelationFieldConfig>;
  /**
   * Explicit where input type override.
   */
  whereTypeName?: string;
  /**
   * Quick search support override.
   */
  supportsQuick?: boolean;
  /**
   * Include rowPermissions selection.
   */
  includeRowPermissions?: boolean;
  /**
   * Operation name override.
   */
  operationName?: string;
  /**
   * Root query field name override.
   */
  queryName?: string;
  /**
   * Replace generated variable definitions.
   */
  customArgumentDefinitions?: string[];
  /**
   * Replace generated field call arguments.
   */
  customArgumentAssignments?: string[];
}

/**
 * Input for generated selection builder.
 */
export interface BuildModelQuerySelectionOptions {
  /**
   * Metadata snapshot used for default field discovery.
   */
  metadata?: ModelMetadata | null;
  /**
   * Predefined field accessors.
   */
  fields?: ModelQueryFieldsInput;
  /**
   * Relation defaults.
   */
  relations?: Record<string, ModelQueryRelationFieldConfig>;
  /**
   * Manual selection override.
   */
  selection?: string | ModelQuerySelectionTree;
  /**
   * Include rowPermissions block.
   */
  includeRowPermissions?: boolean;
}

/**
 * Input for normalized variable builders.
 */
export interface BuildModelQueryVariablesOptions {
  /**
   * Metadata snapshot used to normalize `orderBy` and `quick`.
   */
  metadata?: ModelMetadata | null;
  /**
   * Quick search support override.
   */
  supportsQuick?: boolean;
}

/**
 * Metadata hook result for model query generation.
 */
export interface UseModelQueryMetadataResult {
  /**
   * Resolved metadata.
   */
  metadata: ModelMetadata | null;
  /**
   * Metadata loading status.
   */
  loading: boolean;
  /**
   * Metadata error state.
   */
  error: Error | undefined;
  /**
   * Metadata refetch callback.
   */
  refetch: () => Promise<ModelMetadata | null>;
}

/**
 * Shared result shape returned by generated model query hooks.
 */
export interface UseModelQueryResult {
  /**
   * Data extracted from root query field.
   */
  data: unknown;
  /**
   * Raw Apollo result data object.
   */
  rawData: Record<string, unknown> | undefined;
  /**
   * Query loading status.
   */
  loading: boolean;
  /**
   * Query or metadata error.
   */
  error: Error | undefined;
  /**
   * Query refetch function.
   */
  refetch: (variables?: Record<string, unknown>) => Promise<unknown>;
  /**
   * Generated query document currently used by hook.
   */
  queryDocument: DocumentNode;
  /**
   * Computed variables used by query execution.
   */
  variables: Record<string, unknown>;
  /**
   * Resolved root query field name.
   */
  queryName: string;
  /**
   * Resolved metadata snapshot.
   */
  metadata: ModelMetadata | null;
  /**
   * Metadata loading status.
   */
  metadataLoading: boolean;
  /**
   * Metadata error, if present.
   */
  metadataError: Error | undefined;
}
