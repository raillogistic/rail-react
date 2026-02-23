/**
 * Model-form level types (ModelFormProps and related).
 *
 * ModelForm wraps DynamicForm with generated contract loading, initial-data
 * retrieval, and runtime override controls.
 */
import type React from "react";
import type {
  DynamicFormProps,
  FormFieldConfig,
  FormSchema,
  FormSectionConfig,
} from "./types";
import type {
  ModelFormContract,
  ModelFormInitialData,
  ModelFormMutationOutcome,
  NormalizedModelFormError,
  ModelFormMode,
  ModelFormRuntimeOverride,
} from "./types/generatedContract";
import type { GeneratedValidatorExtensionMap } from "./hooks/useGeneratedValidators";

export type { MutationError } from "./mutations";

export type ModelFormModeInput =
  | ModelFormMode
  | "create"
  | "update"
  | "view";

export type ModelFormFieldOverrideResult =
  | Partial<FormFieldConfig>
  | FormFieldConfig
  | null
  | undefined;

export type ModelFormSectionOverrideResult<TValues extends Record<string, unknown>> =
  | Partial<FormSectionConfig<TValues>>
  | FormSectionConfig<TValues>
  | null
  | undefined;

export type ModelFormFieldOverride = (
  field: FormFieldConfig,
) => ModelFormFieldOverrideResult;

export type ModelFormSectionOverride<TValues extends Record<string, unknown>> = (
  section: FormSectionConfig<TValues>,
) => ModelFormSectionOverrideResult<TValues>;

export type ModelFormFieldOverrideValue =
  | Partial<FormFieldConfig>
  | ModelFormFieldOverride;

export type ModelFormSectionOverrideValue<TValues extends Record<string, unknown>> =
  | Partial<FormSectionConfig<TValues>>
  | ModelFormSectionOverride<TValues>;

export type ModelFormFieldOverrides = Record<string, ModelFormFieldOverrideValue>;

export type ModelFormSectionOverrides<TValues extends Record<string, unknown>> =
  Record<string, ModelFormSectionOverrideValue<TValues>>;

export type ModelFormNestedAddButtonConfig =
  | boolean
  | string
  | {
      enabled?: boolean;
      label?: string;
    };

export type ModelFormNestedSortableConfig =
  | boolean
  | {
      enabled?: boolean;
      orderField?: string;
      mode?: "drag&drop" | "buttons";
    };

export type ModelFormNestedFieldsOrderMode =
  | "contract"
  | "fields"
  | "custom";

export type ModelFormNestedScalarListOperation = "connect" | "set";
export type ModelFormNestedRemoveOperation = "disconnect" | "delete";

export type ModelFormNestedDeleteMutationConfig = {
  enabled?: boolean;
  operationName?: string;
  modelName?: string;
  idPath?: string;
  selection?: string;
};

export type ModelFormNestedDefinition<TValues extends Record<string, unknown>> = {
  enabled?: boolean;
  title?: string;
  description?: string;
  fields?: string[];
  onlyFields?: string[];
  excludeFields?: string[];
  fieldsOrder?: ModelFormNestedFieldsOrderMode;
  customOrder?: string[];
  includeSections?: string[];
  excludeSections?: string[];
  columns?: number;
  itemLabel?: string;
  addButton?: ModelFormNestedAddButtonConfig;
  sortable?: ModelFormNestedSortableConfig;
  minItems?: number;
  maxItems?: number;
  collapsible?: boolean;
  /**
   * Override inferred scalar-list action for to-many relations in UPDATE mode.
   * - "set": replacement semantics (default generated behavior)
   * - "connect": additive semantics (pair with `removeOperation` if needed)
   */
  scalarListOperation?: ModelFormNestedScalarListOperation;
  /**
   * Override action used for persisted rows removed from nested to-many lists.
   */
  removeOperation?: ModelFormNestedRemoveOperation;
  /**
   * Optional direct delete mutation triggered by nested list remove button.
   */
  deleteMutation?: ModelFormNestedDeleteMutationConfig;
  fieldOverrides?: ModelFormFieldOverrides;
  sectionOverrides?: ModelFormSectionOverrides<TValues>;
};

export type ModelFormNestedConfig<TValues extends Record<string, unknown>> =
  | string[]
  | Record<string, ModelFormNestedDefinition<TValues>>;

export type ModelFormErrorFallbackContext = {
  error: Error;
  stage: "contract" | "initialData";
  app: string;
  model: string;
  mode: ModelFormMode;
  objectId?: string;
};

export interface ModelFormProps<
  TFormValues extends Record<string, unknown> = Record<string, unknown>,
> extends Partial<DynamicFormProps<TFormValues>> {
  app?: string;
  model?: string;
  mode?: ModelFormModeInput;
  objectId?: string | number | null;

  generatedEnabled?: boolean;
  includeNested?: boolean;
  nested?: ModelFormNestedConfig<TFormValues>;
  runtimeOverrides?: ModelFormRuntimeOverride[];

  onlyFields?: string[];
  excludeFields?: string[];
  /** Render and submit only required fields. */
  onlyRequired?: boolean;
  /**
   * Restrict relation paths (first path segment of nested fields) that are
   * allowed to render.
   */
  onlyRelationships?: string[];
  /** Exclude relation paths (first path segment of nested fields). */
  excludeRelationships?: string[];
  fieldOverrides?: ModelFormFieldOverrides;
  sectionOverrides?: ModelFormSectionOverrides<TFormValues>;

  validatorExtensions?: GeneratedValidatorExtensionMap;
  legacySchema?: FormSchema<TFormValues>;

  /**
   * Optional grouped DynamicForm overrides. Explicit top-level `state`,
   * `behavior`, `layout`, `actions`, `devtools` props still take precedence.
   */
  formProps?: Partial<DynamicFormProps<TFormValues>>;

  title?: React.ReactNode;
  description?: React.ReactNode;
  showHeading?: boolean;
  containerClassName?: string;
  contentClassName?: string;

  loadingFallback?: React.ReactNode;
  emptySchemaFallback?: React.ReactNode;
  errorFallback?:
    | React.ReactNode
    | ((ctx: ModelFormErrorFallbackContext) => React.ReactNode);

  requireObjectIdForUpdate?: boolean;

  onContractLoaded?: (contract: ModelFormContract) => void;
  onInitialDataLoaded?: (initialData: ModelFormInitialData) => void;
  onLoadError?: (error: Error, stage: "contract" | "initialData") => void;
}

export type ModelFormSubmitLifecycle =
  | "IDLE"
  | "SUBMITTING"
  | "SUCCEEDED"
  | "FAILED_VALIDATION"
  | "FAILED_CONFLICT"
  | "FAILED_EXECUTION";

export type ModelFormSubmitState = {
  status: ModelFormSubmitLifecycle;
  isSubmitting: boolean;
  lockActive: boolean;
  outcome: ModelFormMutationOutcome | null;
};

export type ModelFormConflictState = {
  conflict: boolean;
  requiresRefresh: boolean;
  message?: string;
};

export type ModelFormSubmitResult = ModelFormMutationOutcome & {
  status: Exclude<ModelFormSubmitLifecycle, "IDLE" | "SUBMITTING">;
  normalizedErrors: NormalizedModelFormError[];
  conflictState: ModelFormConflictState;
};
