/**
 * Model-form level types (ModelFormProps and related).
 *
 * ModelForm wraps DynamicForm with generated contract loading, initial-data
 * retrieval, and runtime override controls.
 */
import type React from "react";
import type {
 DynamicFormProps,
 FormFieldPath,
 FormFieldConfig,
 FormSchema,
 PrimitiveFormValue,
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

type ModelFormRelationIdentifier = string | number;
type ModelFormNil = null | undefined;
type ModelFormRelationIdOf<T> = Extract<
 T extends { id?: infer TId } ? NonNullable<TId> : never,
 ModelFormRelationIdentifier
>;
type ModelFormArrayElementValue<T> =
 ModelFormRelationIdOf<NonNullable<T>> extends never
 ? ModelFormValueShape<T>
 : ModelFormRelationIdOf<NonNullable<T>>;

export type ModelFormValueShape<T> = T extends PrimitiveFormValue
 ? T
 : T extends Array<infer TValue>
   ? Array<ModelFormArrayElementValue<TValue>>
   : T extends ReadonlyArray<infer TValue>
     ? ReadonlyArray<ModelFormArrayElementValue<TValue>>
     : T extends object
       ? { [K in keyof T]: ModelFormFieldValue<T[K]> }
       : T;

export type ModelFormFieldValue<T> =
 ModelFormRelationIdOf<NonNullable<T>> extends never
 ? ModelFormValueShape<T>
 : ModelFormRelationIdOf<NonNullable<T>> | Extract<T, ModelFormNil>;

export type ModelFormFieldPath<TValues extends Record<string, unknown>> =
 FormFieldPath<TValues>;

export type ModelFormFieldOverrideResult<
 TValues extends Record<string, unknown> = Record<string, unknown>,
 TPath extends ModelFormFieldPath<TValues> = ModelFormFieldPath<TValues>,
> =
 | Partial<FormFieldConfig>
 | FormFieldConfig
 | null
 | undefined;

export type ModelFormSectionOverrideResult<TValues extends Record<string, unknown>> =
 | Partial<FormSectionConfig<TValues>>
 | FormSectionConfig<TValues>
 | null
 | undefined;

export type ModelFormFieldOverride<
 TValues extends Record<string, unknown> = Record<string, unknown>,
 TPath extends ModelFormFieldPath<TValues> = ModelFormFieldPath<TValues>,
> = (
 field: FormFieldConfig,
) => ModelFormFieldOverrideResult<TValues, TPath>;

export type ModelFormSectionOverride<TValues extends Record<string, unknown>> = (
 section: FormSectionConfig<TValues>,
) => ModelFormSectionOverrideResult<TValues>;

export type ModelFormFieldOverrideValue<
 TValues extends Record<string, unknown> = Record<string, unknown>,
 TPath extends ModelFormFieldPath<TValues> = ModelFormFieldPath<TValues>,
> =
 | Partial<FormFieldConfig>
 | ModelFormFieldOverride<TValues, TPath>;

export type ModelFormSectionOverrideValue<TValues extends Record<string, unknown>> =
 | Partial<FormSectionConfig<TValues>>
 | ModelFormSectionOverride<TValues>;

export type ModelFormFieldOverrides<TValues extends Record<string, unknown>> =
 Partial<Record<string, ModelFormFieldOverrideValue<TValues>>> &
 Partial<{
  [TPath in ModelFormFieldPath<TValues>]: ModelFormFieldOverrideValue<
   TValues,
   TPath
  >;
 }>;

export type ModelFormSectionOverrides<TValues extends Record<string, unknown>> =
 Record<string, ModelFormSectionOverrideValue<TValues>>;

export type ModelFormGeneratedSectionField<
 TValues extends Record<string, unknown> = Record<string, unknown>,
> = ModelFormFieldPath<TValues> | FormFieldConfig;

export type ModelFormGeneratedSection<
 TValues extends Record<string, unknown> = Record<string, unknown>,
> = Omit<FormSectionConfig<TValues>, "fields"> & {
 fields: ModelFormGeneratedSectionField<TValues>[];
};

export type ModelFormRelationshipSelector<
 TSource extends object,
> = Extract<keyof TSource, string>;

type ModelFormNestedRelationSourceValue<T> = T extends Array<infer TValue>
 ? NonNullable<TValue>
 : T extends ReadonlyArray<infer TValue>
   ? NonNullable<TValue>
   : NonNullable<T>;

export type ModelFormNestedFieldPath<
 TSource extends object,
 TRelationKey extends ModelFormRelationshipSelector<TSource>,
> = string extends keyof TSource
 ? string
 : Extract<
    ModelFormValueShape<ModelFormNestedRelationSourceValue<TSource[TRelationKey]>>,
    Record<string, unknown>
   > extends infer TNestedValues
   ? [TNestedValues] extends [never]
     ? string
     : TNestedValues extends Record<string, unknown>
       ? ModelFormFieldPath<TNestedValues>
       : string
   : string;

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

export type ModelFormNestedDefinition<
 TSource extends object,
 TRelationKey extends ModelFormRelationshipSelector<TSource> = ModelFormRelationshipSelector<TSource>,
> = {
 enabled?: boolean;
 title?: string;
 description?: string;
 fields?: ModelFormNestedFieldPath<TSource, TRelationKey>[];
 onlyFields?: ModelFormNestedFieldPath<TSource, TRelationKey>[];
 excludeFields?: ModelFormNestedFieldPath<TSource, TRelationKey>[];
 /** Render only required nested fields. */
 onlyRequired?: boolean;
 fieldsOrder?: ModelFormNestedFieldsOrderMode;
 customOrder?: ModelFormNestedFieldPath<TSource, TRelationKey>[];
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
 * - "connect": additive semantics (pair with`removeOperation` if needed)
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
 fieldOverrides?: ModelFormFieldOverrides<Record<string, unknown>>;
 sectionOverrides?: ModelFormSectionOverrides<Record<string, unknown>>;
};

export type ModelFormNestedConfig<TSource extends object> =
 | ModelFormRelationshipSelector<TSource>[]
 | Partial<
    Record<
      ModelFormRelationshipSelector<TSource>,
      ModelFormNestedDefinition<TSource>
    >
   >;

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
 TSource extends object = TFormValues,
> extends Omit<Partial<DynamicFormProps<TFormValues>>, "mode"> {
 app?: string;
 model?: string;
 mode?: ModelFormModeInput;
 objectId?: string | number | null;

 generatedEnabled?: boolean;
 includeNested?: boolean;
 nested?: ModelFormNestedConfig<TSource>;
 runtimeOverrides?: ModelFormRuntimeOverride[];

 onlyFields?: ModelFormFieldPath<TFormValues>[];
 excludeFields?: ModelFormFieldPath<TFormValues>[];
 /** Render and submit only required fields. */
 onlyRequired?: boolean;
 /**
 * Restrict relation paths (first path segment of nested fields) that are
 * allowed to render.
 */
 onlyRelationships?: Extract<keyof TFormValues, string>[];
 /** Exclude relation paths (first path segment of nested fields). */
 excludeRelationships?: Extract<keyof TFormValues, string>[];
 fieldOverrides?: ModelFormFieldOverrides<TFormValues>;
 sectionOverrides?: ModelFormSectionOverrides<TFormValues>;
 generatedSections?: ModelFormGeneratedSection<TFormValues>[];

 validatorExtensions?: GeneratedValidatorExtensionMap;
 legacySchema?: FormSchema<TFormValues>;

 /**
 * Optional grouped DynamicForm overrides. Explicit top-level`state`,
 *`behavior`,`layout`,`actions`,`devtools` props still take precedence.
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
 /**
 * Invoked after each generated submit attempt with normalized mutation outcome.
 */
 onSubmitResult?: (result: ModelFormMutationOutcome) => void;
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
