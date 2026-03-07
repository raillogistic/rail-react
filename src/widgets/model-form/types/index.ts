/**
 * Re-exports all form type definitions from a single entry point.
 *
 * @module form/types
 */

// Schema & field types
export type {
 PrimitiveFormInputType,
 StructuralFormInputType,
 FormInputType,
 ValidatorFn,
 BaseFieldConfig,
 TextFieldConfig,
 NumberFieldConfig,
 ChoiceOption,
 ChoiceFieldConfig,
 QueryChoiceFieldConfig,
 QueryChoiceVariableBuilderContext,
 QueryChoiceRecordContext,
 QueryChoiceGraphQLConfig,
 QueryChoiceInlineCreateConfig,
 BooleanFieldConfig,
 DateFieldConfig,
 FileFieldConfig,
 CustomFieldConfig,
 ObjectFieldConfig,
 ListFieldConfig,
 FormFieldConfig,
 FieldComponentProps,
 FieldRendererComponent,
 FieldRenderContext,
 FormSectionConfig,
 FormValidator,
 FormSchema,
 ChangeRecord,
} from "./schema";

// Behavior types
export type {
 FormSubmitContext,
 FieldConditionMap,
 ComputedFieldMap,
 FieldDependencyEffect,
 FieldDependencyMap,
 FormErrors,
 FormAutosaveConfig,
 FormBehaviorConfig,
} from "./behavior";

// Layout types
export type {
 FormLayoutMode,
 FormLayoutConfig,
 FormFieldOrderingPlacement,
 FormFieldOrderingRule,
 FormFieldOrderingConfig,
} from "./layout";

// Actions types
export type { FormActionsConfig } from "./actions";

// Props types
export type {
 FormStateConfig,
 FormDefaultValues,
 DeepPartialFormValue,
 FormFieldPath,
 FormFieldPathValue,
 FormDevtoolsConfig,
 DynamicFormProps,
} from "./props";
