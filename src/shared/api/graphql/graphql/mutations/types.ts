import type {
  ApolloError,
  DocumentNode,
  FetchResult,
  MutationFunctionOptions,
  MutationHookOptions,
  OperationVariables,
  QueryHookOptions,
} from "@apollo/client";
import type {
  ModelFormContract,
  ModelFormContractField,
  ModelFormContractPermissions,
  ModelFormErrorPolicy,
  ModelFormInitialData,
  ModelFormMode,
  ModelFormMutationBindings,
} from "@/widgets/model-form/types/generatedContract";

/**
 * Supported generated model mutation modes.
 */
export type ModelMutationMode =
  | "create"
  | "update"
  | "delete"
  | "bulkCreate"
  | "bulkUpdate"
  | "bulkDelete"
  | "method";

/**
 * CRUD and bulk mutation modes.
 */
export type ModelCrudMutationMode = Exclude<ModelMutationMode, "method">;

/**
 * Variable input for generated create mutation hooks.
 */
export interface ModelCreateMutationVariablesInput {
  /**
   * Mutation input object.
   */
  input?: unknown;
  /**
   * Additional variables merged into the final payload.
   */
  extra?: Record<string, unknown>;
}

/**
 * Variable input for generated update mutation hooks.
 */
export interface ModelUpdateMutationVariablesInput {
  /**
   * Object identifier.
   */
  id: string | number;
  /**
   * Mutation input object.
   */
  input?: unknown;
  /**
   * Additional variables merged into the final payload.
   */
  extra?: Record<string, unknown>;
}

/**
 * Variable input for generated delete mutation hooks.
 */
export interface ModelDeleteMutationVariablesInput {
  /**
   * Object identifier.
   */
  id: string | number;
  /**
   * Additional variables merged into the final payload.
   */
  extra?: Record<string, unknown>;
}

/**
 * Variable input for generated bulk-create mutation hooks.
 */
export interface ModelBulkCreateMutationVariablesInput {
  /**
   * Bulk mutation inputs.
   */
  inputs?: unknown[];
  /**
   * Additional variables merged into the final payload.
   */
  extra?: Record<string, unknown>;
}

/**
 * Variable input for generated bulk-update mutation hooks.
 */
export interface ModelBulkUpdateMutationVariablesInput {
  /**
   * Bulk mutation inputs.
   */
  inputs?: unknown[];
  /**
   * Additional variables merged into the final payload.
   */
  extra?: Record<string, unknown>;
}

/**
 * Variable input for generated bulk-delete mutation hooks.
 */
export interface ModelBulkDeleteMutationVariablesInput {
  /**
   * Object identifiers to delete.
   */
  ids?: Array<string | number>;
  /**
   * Additional variables merged into the final payload.
   */
  extra?: Record<string, unknown>;
}

/**
 * Variable input for generated method mutation hooks.
 */
export interface ModelMethodMutationVariablesInput {
  /**
   * Object identifier.
   */
  id: string | number;
  /**
   * Optional method input payload.
   */
  input?: unknown;
  /**
   * Additional variables merged into the final payload.
   */
  extra?: Record<string, unknown>;
}

/**
 * Grouped identity options for generated model mutation hooks.
 */
export interface UseModelMutationIdentityOptions {
  /**
   * Optional Django app label used as context only.
   */
  app?: string;
  /**
   * Django model name.
   */
  model: string;
}

/**
 * Grouped selection options for generated model mutation hooks.
 */
export interface UseModelMutationSelectionOptions {
  /**
   * Selection used for `object`/`objects` blocks.
   */
  selection?: string;
  /**
   * Selection used for method `result` block.
   */
  resultSelection?: string;
}

/**
 * Grouped execution options for generated model mutation hooks.
 */
export interface UseModelMutationExecutionOptions {
  /**
   * Override GraphQL operation name.
   */
  operationName?: string;
  /**
   * Override backend root mutation field name.
   */
  mutationName?: string;
  /**
   * Response alias used for root mutation payload extraction.
   */
  responseAlias?: string;
  /**
   * Identifier variable name override for update/delete/method modes.
   */
  identifierVariableName?: string;
  /**
   * Identifier argument name override for update mode.
   */
  identifierArgumentName?: string;
  /**
   * Identifier variable GraphQL type override for update mode.
   */
  identifierType?: string;
  /**
   * Input type override for create/update/method modes.
   */
  inputTypeName?: string;
  /**
   * Input type override for bulk-update mode.
   */
  bulkInputTypeName?: string;
  /**
   * Method name used for method mutation generation.
   */
  methodName?: string;
  /**
   * Method field name override used for method mutations.
   */
  methodFieldName?: string;
  /**
   * Indicates whether method mutation uses an `input` argument.
   */
  includeInput?: boolean;
  /**
   * Replace generated variable definitions.
   */
  customArgumentDefinitions?: string[];
  /**
   * Replace generated mutation field assignments.
   */
  customArgumentAssignments?: string[];
  /**
   * Prefers operation names from model-form mutation bindings when available.
   */
  preferContractBindings?: boolean;
}

/**
 * Grouped model-form options for generated mutation hooks.
 */
export interface UseModelMutationModelFormOptions {
  /**
   * Preloaded model-form contract used to bypass contract fetching.
   */
  contract?: ModelFormContract | null;
  /**
   * Preloaded model-form initial data used to bypass initial-data fetching.
   */
  initialData?: ModelFormInitialData | null;
  /**
   * Contract mode used by `modelFormContract` query.
   */
  contractMode?: ModelFormMode;
  /**
   * Enables nested relation contract/initial-data semantics.
   */
  includeNested?: boolean;
  /**
   * Object identifier used by `modelFormInitialData` query.
   */
  objectId?: string | number | null;
  /**
   * Limits nested initial-data payload to selected nested fields.
   */
  initialDataNestedFields?: string[];
  /**
   * Runtime overrides forwarded to `modelFormInitialData`.
   */
  runtimeOverrides?: Array<Record<string, unknown>>;
  /**
   * Skips contract and initial-data queries.
   */
  skipModelForm?: boolean;
  /**
   * Skips `modelFormInitialData` query while keeping contract query enabled.
   */
  skipInitialData?: boolean;
  /**
   * Query options forwarded to `modelFormContract`.
   */
  contractQueryOptions?: QueryHookOptions<
    Record<string, unknown>,
    OperationVariables
  >;
  /**
   * Query options forwarded to `modelFormInitialData`.
   */
  initialDataQueryOptions?: QueryHookOptions<
    Record<string, unknown>,
    OperationVariables
  >;
}

/**
 * Shared options for generated model mutation hooks.
 */
export interface UseModelMutationBaseOptions {
  /**
   * Identity options grouped by purpose.
   */
  identity?: UseModelMutationIdentityOptions;
  /**
   * Selection options grouped by purpose.
   */
  selectionOptions?: UseModelMutationSelectionOptions;
  /**
   * Mutation execution options grouped by purpose.
   */
  executionOptions?: UseModelMutationExecutionOptions;
  /**
   * Model-form options grouped by purpose.
   */
  modelFormOptions?: UseModelMutationModelFormOptions;
  /**
   * Apollo options forwarded to `useMutation`.
   */
  apollo?: MutationHookOptions<Record<string, unknown>, OperationVariables>;
  /**
   * Legacy flat app label. Prefer `identity.app`.
   */
  app?: string;
  /**
   * Legacy flat model name. Prefer `identity.model`.
   */
  model?: string;
  /**
   * Legacy flat selection. Prefer `selectionOptions.selection`.
   */
  selection?: string;
  /**
   * Legacy flat result selection. Prefer `selectionOptions.resultSelection`.
   */
  resultSelection?: string;
  /**
   * Legacy flat operation override. Prefer `executionOptions.operationName`.
   */
  operationName?: string;
  /**
   * Legacy flat mutation name override. Prefer `executionOptions.mutationName`.
   */
  mutationName?: string;
  /**
   * Legacy flat response alias override. Prefer `executionOptions.responseAlias`.
   */
  responseAlias?: string;
  /**
   * Legacy flat identifier variable override.
   */
  identifierVariableName?: string;
  /**
   * Legacy flat identifier argument override.
   */
  identifierArgumentName?: string;
  /**
   * Legacy flat identifier type override.
   */
  identifierType?: string;
  /**
   * Legacy flat input type override.
   */
  inputTypeName?: string;
  /**
   * Legacy flat bulk input type override.
   */
  bulkInputTypeName?: string;
  /**
   * Legacy flat method name.
   */
  methodName?: string;
  /**
   * Legacy flat method field name override.
   */
  methodFieldName?: string;
  /**
   * Legacy flat include-input flag.
   */
  includeInput?: boolean;
  /**
   * Legacy flat variable definitions override.
   */
  customArgumentDefinitions?: string[];
  /**
   * Legacy flat field assignment override.
   */
  customArgumentAssignments?: string[];
  /**
   * Legacy flat contract-binding preference.
   */
  preferContractBindings?: boolean;
  /**
   * Legacy flat model-form contract.
   */
  contract?: ModelFormContract | null;
  /**
   * Legacy flat model-form initial data.
   */
  initialData?: ModelFormInitialData | null;
  /**
   * Legacy flat contract mode.
   */
  contractMode?: ModelFormMode;
  /**
   * Legacy flat nested-contract flag.
   */
  includeNested?: boolean;
  /**
   * Legacy flat object identifier used for initial-data fetch.
   */
  objectId?: string | number | null;
  /**
   * Legacy flat nested-fields filter for initial data.
   */
  initialDataNestedFields?: string[];
  /**
   * Legacy flat runtime overrides for initial-data fetch.
   */
  runtimeOverrides?: Array<Record<string, unknown>>;
  /**
   * Legacy flat skip flag for model-form query execution.
   */
  skipModelForm?: boolean;
  /**
   * Legacy flat skip flag for model-form initial-data query.
   */
  skipInitialData?: boolean;
  /**
   * Legacy flat query options for model-form contract query.
   */
  contractQueryOptions?: QueryHookOptions<
    Record<string, unknown>,
    OperationVariables
  >;
  /**
   * Legacy flat query options for model-form initial-data query.
   */
  initialDataQueryOptions?: QueryHookOptions<
    Record<string, unknown>,
    OperationVariables
  >;
}

/**
 * Options for generated create mutation hook.
 */
export type UseModelCreateMutationOptions = UseModelMutationBaseOptions;

/**
 * Options for generated update mutation hook.
 */
export type UseModelUpdateMutationOptions = UseModelMutationBaseOptions;

/**
 * Options for generated delete mutation hook.
 */
export type UseModelDeleteMutationOptions = UseModelMutationBaseOptions;

/**
 * Options for generated bulk-create mutation hook.
 */
export type UseModelBulkCreateMutationOptions = UseModelMutationBaseOptions;

/**
 * Options for generated bulk-update mutation hook.
 */
export type UseModelBulkUpdateMutationOptions = UseModelMutationBaseOptions;

/**
 * Options for generated bulk-delete mutation hook.
 */
export type UseModelBulkDeleteMutationOptions = UseModelMutationBaseOptions;

/**
 * Options for generated method mutation hook.
 */
export type UseModelMethodMutationOptions = UseModelMutationBaseOptions;

/**
 * Input used by mutation document builder.
 */
export interface BuildModelMutationDocumentOptions {
  /**
   * Mutation mode.
   */
  mode: ModelMutationMode;
  /**
   * Model identity.
   */
  model: string;
  /**
   * Optional app context (ignored for naming).
   */
  app?: string;
  /**
   * Selection used for `object`/`objects` blocks.
   */
  selection?: string;
  /**
   * Selection used for method `result` block.
   */
  resultSelection?: string;
  /**
   * Method name used for method mutation generation.
   */
  methodName?: string;
  /**
   * Indicates whether method mutation should use an input object.
   */
  includeInput?: boolean;
  /**
   * Input type override for create/update/method modes.
   */
  inputTypeName?: string;
  /**
   * Input type override for bulk-update mode.
   */
  bulkInputTypeName?: string;
  /**
   * Identifier variable name override for update/delete/method modes.
   */
  identifierVariableName?: string;
  /**
   * Identifier argument name override for update mode.
   */
  identifierArgumentName?: string;
  /**
   * Identifier variable GraphQL type override for update mode.
   */
  identifierType?: string;
  /**
   * GraphQL operation name override.
   */
  operationName?: string;
  /**
   * Root mutation field name override.
   */
  mutationName?: string;
  /**
   * Method field name override used for method mode.
   */
  methodFieldName?: string;
  /**
   * Root response alias used inside operation selection.
   */
  responseAlias?: string;
  /**
   * Replace generated variable definitions.
   */
  customArgumentDefinitions?: string[];
  /**
   * Replace generated field argument mappings.
   */
  customArgumentAssignments?: string[];
}

/**
 * Result metadata for generated mutation document.
 */
export interface BuiltModelMutationDocument {
  /**
   * GraphQL document node.
   */
  mutationDocument: DocumentNode;
  /**
   * Root mutation field name.
   */
  mutationName: string;
  /**
   * GraphQL operation name.
   */
  operationName: string;
  /**
   * Root response alias used in operation payload.
   */
  responseAlias: string;
}

/**
 * Input for generated mutation variable builders.
 */
export interface BuildModelMutationVariablesOptions {
  /**
   * Identifier variable name used by update/delete/method normalizers.
   */
  identifierVariableName?: string;
}

/**
 * Additional per-call options accepted by generated mutation `execute`.
 */
export type ExecuteModelMutationOptions = Omit<
  MutationFunctionOptions<Record<string, unknown>, OperationVariables>,
  "mutation" | "variables"
>;

/**
 * Shared form metadata context returned by generated mutation hooks.
 */
export interface UseModelMutationModelFormResult {
  /**
   * Contract fields from model-form metadata.
   */
  fields: ModelFormContractField[];
  /**
   * Contract permissions block.
   */
  permissions: ModelFormContractPermissions | null;
  /**
   * Contract mutation bindings used for operation resolution.
   */
  mutationBindings: ModelFormMutationBindings | null;
  /**
   * Contract error policy.
   */
  errorPolicy: ModelFormErrorPolicy | null;
  /**
   * Initial values payload from model-form initial data.
   */
  initialValues: Record<string, unknown> | null;
  /**
   * Read-only values payload from model-form initial data.
   */
  readonlyValues: Record<string, unknown> | null;
  /**
   * Combined model-form loading state.
   */
  formLoading: boolean;
  /**
   * Contract query loading state.
   */
  contractLoading: boolean;
  /**
   * Initial-data query loading state.
   */
  initialDataLoading: boolean;
  /**
   * Combined model-form error state.
   */
  formError: Error | undefined;
  /**
   * Contract query error state.
   */
  contractError: Error | undefined;
  /**
   * Initial-data query error state.
   */
  initialDataError: Error | undefined;
  /**
   * Refetch callback for model-form contract.
   */
  refetchContract: () => Promise<ModelFormContract | null>;
  /**
   * Refetch callback for model-form initial data.
   */
  refetchInitialData: () => Promise<ModelFormInitialData | null>;
}

/**
 * Shared result shape returned by generated model mutation hooks.
 */
export interface UseModelMutationResult<TVariables>
  extends UseModelMutationModelFormResult {
  /**
   * Response payload extracted from mutation alias.
   */
  data: unknown;
  /**
   * Raw Apollo response object.
   */
  rawData: Record<string, unknown> | undefined;
  /**
   * Mutation loading state.
   */
  loading: boolean;
  /**
   * Mutation error state.
   */
  error: ApolloError | undefined;
  /**
   * Indicates whether mutation has been executed at least once.
   */
  called: boolean;
  /**
   * Resets mutation state.
   */
  reset: () => void;
  /**
   * Executes mutation with call-time variables.
   */
  execute: (
    variables: TVariables,
    options?: ExecuteModelMutationOptions,
  ) => Promise<FetchResult<Record<string, unknown>>>;
  /**
   * Generated mutation document currently used by hook.
   */
  mutationDocument: DocumentNode;
  /**
   * Resolved root mutation field name.
   */
  mutationName: string;
  /**
   * Resolved GraphQL operation name.
   */
  operationName: string;
}

/**
 * Result returned by generated create mutation hook.
 */
export type UseModelCreateMutationResult =
  UseModelMutationResult<ModelCreateMutationVariablesInput>;

/**
 * Result returned by generated update mutation hook.
 */
export type UseModelUpdateMutationResult =
  UseModelMutationResult<ModelUpdateMutationVariablesInput>;

/**
 * Result returned by generated delete mutation hook.
 */
export type UseModelDeleteMutationResult =
  UseModelMutationResult<ModelDeleteMutationVariablesInput>;

/**
 * Result returned by generated bulk-create mutation hook.
 */
export type UseModelBulkCreateMutationResult =
  UseModelMutationResult<ModelBulkCreateMutationVariablesInput>;

/**
 * Result returned by generated bulk-update mutation hook.
 */
export type UseModelBulkUpdateMutationResult =
  UseModelMutationResult<ModelBulkUpdateMutationVariablesInput>;

/**
 * Result returned by generated bulk-delete mutation hook.
 */
export type UseModelBulkDeleteMutationResult =
  UseModelMutationResult<ModelBulkDeleteMutationVariablesInput>;

/**
 * Result returned by generated method mutation hook.
 */
export type UseModelMethodMutationResult =
  UseModelMutationResult<ModelMethodMutationVariablesInput>;
