import type {
  ApolloError,
  DocumentNode,
  FetchResult,
  MutationFunctionOptions,
  MutationHookOptions,
  OperationVariables,
} from "@apollo/client";

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
   * Default identifier value mapped to `id` or custom identifier variable.
   */
  id?: string | number | null;
  /**
   * Explicit identifier alias with higher precedence than `id`.
   */
  identifier?: string | number | null;
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
   * Default identifier value mapped to `id` or custom identifier variable.
   */
  id?: string | number | null;
  /**
   * Explicit identifier alias with higher precedence than `id`.
   */
  identifier?: string | number | null;
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
   * Default identifier value mapped to `id` or custom identifier variable.
   */
  id?: string | number | null;
  /**
   * Explicit identifier alias with higher precedence than `id`.
   */
  identifier?: string | number | null;
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
}

/**
 * Options for generated create mutation hook.
 */
export interface UseModelCreateMutationOptions extends UseModelMutationBaseOptions {
  /**
   * Default variables used when `execute` is called without payload.
   */
  variables?: ModelCreateMutationVariablesInput;
}

/**
 * Options for generated update mutation hook.
 */
export interface UseModelUpdateMutationOptions extends UseModelMutationBaseOptions {
  /**
   * Default variables used when `execute` is called without payload.
   */
  variables?: ModelUpdateMutationVariablesInput;
}

/**
 * Options for generated delete mutation hook.
 */
export interface UseModelDeleteMutationOptions extends UseModelMutationBaseOptions {
  /**
   * Default variables used when `execute` is called without payload.
   */
  variables?: ModelDeleteMutationVariablesInput;
}

/**
 * Options for generated bulk-create mutation hook.
 */
export interface UseModelBulkCreateMutationOptions
  extends UseModelMutationBaseOptions {
  /**
   * Default variables used when `execute` is called without payload.
   */
  variables?: ModelBulkCreateMutationVariablesInput;
}

/**
 * Options for generated bulk-update mutation hook.
 */
export interface UseModelBulkUpdateMutationOptions
  extends UseModelMutationBaseOptions {
  /**
   * Default variables used when `execute` is called without payload.
   */
  variables?: ModelBulkUpdateMutationVariablesInput;
}

/**
 * Options for generated bulk-delete mutation hook.
 */
export interface UseModelBulkDeleteMutationOptions
  extends UseModelMutationBaseOptions {
  /**
   * Default variables used when `execute` is called without payload.
   */
  variables?: ModelBulkDeleteMutationVariablesInput;
}

/**
 * Options for generated method mutation hook.
 */
export interface UseModelMethodMutationOptions extends UseModelMutationBaseOptions {
  /**
   * Method name used to generate default method mutation field name.
   */
  methodName?: string;
  /**
   * Default variables used when `execute` is called without payload.
   */
  variables?: ModelMethodMutationVariablesInput;
}

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
  "mutation"
>;

/**
 * Shared result shape returned by generated model mutation hooks.
 */
export interface UseModelMutationResult {
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
   * Executes mutation with merged default and call-time variables.
   */
  execute: (
    variables?: Record<string, unknown>,
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
