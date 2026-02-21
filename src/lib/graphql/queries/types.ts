import type { DocumentNode, OperationVariables, QueryHookOptions } from "@apollo/client";
import type { ModelMetadata } from "@/lib/graphql/metadata/types";
import type { MetadataProfile } from "@/lib/graphql/metadata/telemetry";

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
   * Additional nested fields to include for a relation root.
   * Alias of `fields` for include-oriented configuration.
   */
  include?: string[];
  /**
   * Nested fields to remove from the relation selection.
   */
  exclude?: string[];
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
export type ModelListQueryVariablesInput = ModelCommonQueryVariablesInput;

/**
 * Grouped identity options for generated model query hooks.
 */
export interface UseModelQueryIdentityOptions {
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
}

/**
 * Grouped metadata options for generated model query hooks.
 */
export interface UseModelQueryMetadataOptions {
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
}

/**
 * Grouped selection options for generated model query hooks.
 */
export interface UseModelQuerySelectionOptions {
  /**
   * Predefined field accessors. When omitted, fields are derived from metadata.
   */
  fields?: ModelQueryFieldsInput;
  /**
   * Field accessors to include in addition to default/generated field list.
   */
  includeFields?: ModelQueryFieldsInput;
  /**
   * Field accessors to remove from the final selection.
   */
  excludeFields?: string[];
  /**
   * Relation defaults used when relation roots are selected.
   */
  relations?: Record<string, ModelQueryRelationFieldConfig>;
  /**
   * Relation roots to include in the final selection.
   */
  includeRelations?: string[];
  /**
   * Relation roots to remove from the final selection.
   */
  excludeRelations?: string[];
  /**
   * Manual selection override. Accepts raw selection string or a selection tree.
   */
  selection?: string | ModelQuerySelectionTree;
  /**
   * Include row permissions block in generated selection.
   */
  includeRowPermissions?: boolean;
}

/**
 * Grouped execution options for generated model query hooks.
 */
export interface UseModelQueryExecutionOptions {
  /**
   * Explicit override for `where` input type.
   */
  whereTypeName?: string;
  /**
   * Override quick-search support detection.
   */
  supportsQuick?: boolean;
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
}

/**
 * Shared options for generated model query hooks.
 */
export interface UseModelQueryBaseOptions {
  /**
   * Identity options grouped by purpose.
   */
  identity?: UseModelQueryIdentityOptions;
  /**
   * Metadata options grouped by purpose.
   */
  metadataOptions?: UseModelQueryMetadataOptions;
  /**
   * Selection options grouped by purpose.
   */
  selectionOptions?: UseModelQuerySelectionOptions;
  /**
   * Query execution options grouped by purpose.
   */
  executionOptions?: UseModelQueryExecutionOptions;
  /**
   * Apollo `useQuery` options for generated query execution.
   */
  apollo?: QueryHookOptions<Record<string, unknown>, OperationVariables>;
  /**
   * Legacy flat app label. Prefer `identity.app`.
   */
  app?: string;
  /**
   * Legacy flat model name. Prefer `identity.model`.
   */
  model?: string;
  /**
   * Legacy flat manager name. Prefer `identity.managerName`.
   */
  managerName?: string;
  /**
   * Legacy flat metadata override. Prefer `metadataOptions.metadata`.
   */
  metadata?: ModelMetadata | null;
  /**
   * Legacy flat metadata profile. Prefer `metadataOptions.metadataProfile`.
   */
  metadataProfile?: MetadataProfile;
  /**
   * Legacy flat skip metadata flag. Prefer `metadataOptions.skipMetadata`.
   */
  skipMetadata?: boolean;
  /**
   * Legacy flat metadata query options. Prefer `metadataOptions.metadataQueryOptions`.
   */
  metadataQueryOptions?: Record<string, unknown>;
  /**
   * Legacy flat fields. Prefer `selectionOptions.fields`.
   */
  fields?: ModelQueryFieldsInput;
  /**
   * Legacy flat included fields. Prefer `selectionOptions.includeFields`.
   */
  includeFields?: ModelQueryFieldsInput;
  /**
   * Legacy flat excluded fields. Prefer `selectionOptions.excludeFields`.
   */
  excludeFields?: string[];
  /**
   * Legacy flat relations config. Prefer `selectionOptions.relations`.
   */
  relations?: Record<string, ModelQueryRelationFieldConfig>;
  /**
   * Legacy flat included relations. Prefer `selectionOptions.includeRelations`.
   */
  includeRelations?: string[];
  /**
   * Legacy flat excluded relations. Prefer `selectionOptions.excludeRelations`.
   */
  excludeRelations?: string[];
  /**
   * Legacy flat selection override. Prefer `selectionOptions.selection`.
   */
  selection?: string | ModelQuerySelectionTree;
  /**
   * Legacy flat row permissions flag. Prefer `selectionOptions.includeRowPermissions`.
   */
  includeRowPermissions?: boolean;
  /**
   * Legacy flat where type override. Prefer `executionOptions.whereTypeName`.
   */
  whereTypeName?: string;
  /**
   * Legacy flat quick support override. Prefer `executionOptions.supportsQuick`.
   */
  supportsQuick?: boolean;
  /**
   * Legacy flat operation name override. Prefer `executionOptions.operationName`.
   */
  operationName?: string;
  /**
   * Legacy flat query name override. Prefer `executionOptions.queryName`.
   */
  queryName?: string;
  /**
   * Legacy flat custom argument definitions. Prefer `executionOptions.customArgumentDefinitions`.
   */
  customArgumentDefinitions?: string[];
  /**
   * Legacy flat custom argument assignments. Prefer `executionOptions.customArgumentAssignments`.
   */
  customArgumentAssignments?: string[];
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
   * Object identifier used by default single query signature.
   */
  id?: string | number | null;
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
   * Field accessors to include in addition to defaults/explicit fields.
   */
  includeFields?: ModelQueryFieldsInput;
  /**
   * Field accessors to exclude from the generated selection.
   */
  excludeFields?: string[];
  /**
   * Relation defaults.
   */
  relations?: Record<string, ModelQueryRelationFieldConfig>;
  /**
   * Relation roots to include in addition to defaults.
   */
  includeRelations?: string[];
  /**
   * Relation roots to exclude from the generated selection.
   */
  excludeRelations?: string[];
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
   * Field accessors to include in addition to base/default fields.
   */
  includeFields?: ModelQueryFieldsInput;
  /**
   * Field accessors to exclude from the final selection.
   */
  excludeFields?: string[];
  /**
   * Relation defaults.
   */
  relations?: Record<string, ModelQueryRelationFieldConfig>;
  /**
   * Relation roots to include in the final selection.
   */
  includeRelations?: string[];
  /**
   * Relation roots to exclude from the final selection.
   */
  excludeRelations?: string[];
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
 * Development timing metrics for generated query hooks.
 */
export interface UseModelQueryDevMetrics {
  /**
   * Time spent resolving metadata for the current request, in milliseconds.
   */
  metadataFetchMs: number | null;
  /**
   * Time spent resolving GraphQL data for the current request, in milliseconds.
   */
  dataFetchMs: number | null;
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
  /**
   * Development metrics for metadata/data fetch durations.
   */
  dev: UseModelQueryDevMetrics;
}

