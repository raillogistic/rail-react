/**
 * Re-exports all form field and schema types from the canonical location.
 *
 * Input components should import from here for backwards compatibility.
 *
 * @module form/inputs/types
 */
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
  RichTextFieldConfig,
  FormFieldConfig,
  FieldComponentProps,
  FieldRendererComponent,
  FieldRenderContext,
  FormSectionConfig,
  FormValidator,
  FormSchema,
  ChangeRecord,
} from "../types/schema";

export type {
  FormSubmitContext,
  FieldConditionMap,
  ComputedFieldMap,
  FieldDependencyEffect,
  FieldDependencyMap,
  FormErrors,
  FormAutosaveConfig,
  FormBehaviorConfig,
} from "../types/behavior";

export type { FormLayoutMode, FormLayoutConfig } from "../types/layout";
export type { FormActionsConfig } from "../types/actions";
export type {
  FormStateConfig,
  FormDevtoolsConfig,
  DynamicFormProps,
} from "../types/props";
