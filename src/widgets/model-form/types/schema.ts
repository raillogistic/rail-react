/**
 * Schema types for the DynamicForm system.
 *
 * Describes every field configuration, section layout, and top-level schema
 * consumed by DynamicForm and its renderers.
 *
 * @module form/types/schema
 */
import type React from "react";
import type { DocumentNode } from "graphql";
import type { FetchPolicy } from "@apollo/client";
import type { UseFormReturn } from "@tanstack/react-form";
import type { ModelFormProps } from "../types.model";

// --- Input Types -------------------------------------------------------------

export type PrimitiveFormInputType =
 | "text"
 | "textarea"
 | "rich-text"
 | "number"
 | "decimal"
 | "email"
 | "password"
 | "select"
 | "select-query"
 | "date"
 | "datetime-local"
 | "time"
 | "file"
 | "checkbox"
 | "switch"
 | "radio"
 | "slider"
 | "range"
 | "color"
 | "json"
 | "custom";

export type StructuralFormInputType = "object" | "list" | "group";

export type FormInputType = PrimitiveFormInputType | StructuralFormInputType;

// --- Validators --------------------------------------------------------------

export type ValidatorFn = (
 value: any,
 context: { values: Record<string, any>; name: string },
) => string | undefined | Promise<string | undefined>;

// --- Base Field Config -------------------------------------------------------

export interface BaseFieldConfig {
 name: string;
 type: FormInputType;
 label?: string;
 description?: string;
 placeholder?: string;
 required?: boolean;
 helpText?: string;
 defaultValue?: any;
 disabled?: boolean;
 readOnly?: boolean;
 hidden?: boolean;
 className?: string;
 colSpan?: number;
 inputProps?: Record<string, any>;
 validators?: ValidatorFn | ValidatorFn[];
 order?: number;
 /** Reactive visibility: show/hide based on current form values */
 visible?: (values: Record<string, any>) => boolean;
 /** Reactive disabled state based on current form values */
 disabledWhen?: (values: Record<string, any>) => boolean;
 /** Computed value derived from other fields (set on every change) */
 compute?: (values: Record<string, any>) => any;
 /** Fields this field depends on (triggers re-evaluation of compute/visible/disabledWhen) */
 dependsOn?: string[];
 /** Transform value before it enters the form state */
 transform?: (value: any) => any;
 /** Additional semantic metadata for rendering hints */
 meta?: Record<string, any>;
}

// --- Concrete Field Configs --------------------------------------------------

export interface TextFieldConfig extends BaseFieldConfig {
 type: "text" | "email" | "password" | "textarea" | "color" | "json";
 minLength?: number;
 maxLength?: number;
 rows?: number;
}

export interface NumberFieldConfig extends BaseFieldConfig {
 type: "number" | "decimal" | "slider" | "range";
 min?: number;
 max?: number;
 step?: number;
 precision?: number;
 format?: (value: number) => string;
}

export interface ChoiceOption {
 label: string;
 value: string | number;
 description?: string;
 disabled?: boolean;
}

export interface ChoiceFieldConfig extends BaseFieldConfig {
 type: "select" | "radio";
 options: ChoiceOption[];
 multiple?: boolean;
 searchable?: boolean;
}

export interface QueryChoiceFieldConfig extends BaseFieldConfig {
 type: "select-query";
 multiple?: boolean;
 selectedDisplay?: "badges" | "count";
 placeholder?: string;
 debounceMs?: number;
 loadOptions?: (
 search: string,
 context: { values: Record<string, any> },
 ) => Promise<ChoiceOption[]>;
 relatedModel?: string;
 graphql?: QueryChoiceGraphQLConfig;
 inlineCreate?: QueryChoiceInlineCreateConfig;
}

export type QueryChoiceVariableBuilderContext = {
 search: string;
 values: Record<string, any>;
 form: UseFormReturn<Record<string, any>>;
 field: any;
};

export type QueryChoiceRecordContext = {
 form: UseFormReturn<Record<string, any>>;
 field: any;
 search: string;
};

export interface QueryChoiceGraphQLConfig {
 relatedModel?: string;
 listFieldName?: string;
 queryName?: string;
 queryDocument?: DocumentNode | string;
 searchVariableName?: string | null;
 searchVariableType?: string;
 staticArgs?: Record<string, string | number | boolean>;
 limit?: number;
 limitVariableName?: string | null;
 includeVariableName?: string | null;
 includeVariableType?: string;
 extraFields?: string[];
 valueField?: string;
 labelField?: string;
 descriptionField?: string;
 valueKey?: string;
 labelKey?: string;
 descriptionKey?: string;
 resultPath?: string;
 initialVariables?: Record<string, any>;
 variables?:
 | Record<string, any>
 | ((ctx: QueryChoiceVariableBuilderContext) => Record<string, any>);
 fetchPolicy?: FetchPolicy;
 debounceMs?: number;
 mapResult?: (
 records: Record<string, any>[],
 data: Record<string, any>,
 ctx: QueryChoiceRecordContext,
 ) => ChoiceOption[];
 mapRecord?: (
 record: Record<string, any>,
 ctx: QueryChoiceRecordContext,
 ) => ChoiceOption | null | undefined;
 onQueryResult?: (
 payload: {
 data: Record<string, any>;
 records: Record<string, any>[];
 options: ChoiceOption[];
 },
 ctx: QueryChoiceRecordContext,
 ) => void;
}

export interface QueryChoiceInlineCreateConfig {
 enabled?: boolean;
 appName?: string;
 modelName?: string;
 permissionModelName?: string;
 title?: string;
 formProps?: Partial<ModelFormProps<Record<string, any>>>;
 mapCreatedOption?: (
 payload: any,
 ctx: { valueKey?: string; labelKey?: string; descriptionKey?: string },
 ) => ChoiceOption | null | undefined;
}

export interface BooleanFieldConfig extends BaseFieldConfig {
 type: "checkbox" | "switch";
 trueLabel?: string;
 falseLabel?: string;
}

export interface DateFieldConfig extends BaseFieldConfig {
 type: "date" | "datetime-local" | "time";
 min?: string;
 max?: string;
}

export interface FileFieldConfig extends BaseFieldConfig {
 type: "file";
 accept?: string;
 multiple?: boolean;
}

export interface CustomFieldConfig extends BaseFieldConfig {
 type: "custom";
 render: (ctx: FieldRenderContext) => React.ReactNode;
}

export interface ObjectFieldConfig extends BaseFieldConfig {
 type: "object";
 fields: FormFieldConfig[];
 columns?: number;
 collapsible?: boolean;
}

export interface ListFieldConfig extends BaseFieldConfig {
 type: "list";
 itemLabel?: string;
 addLabel?: string;
 showAddButton?: boolean;
 sortable?: boolean;
 sortingMode?: "drag&drop" | "buttons";
 minItems?: number;
 maxItems?: number;
 columns?: number;
 itemGap?: number | string;
 itemClassName?: string;
 ordering?: {
 activate: boolean;
 toField: string;
 };
 relationOps?: {
 scalarListOperation?: "connect" | "set";
 removeOperation?: "disconnect" | "delete";
 };
 deleteMutation?: {
 enabled?: boolean;
 operationName?: string;
 modelName?: string;
 idPath?: string;
 selection?: string;
 };
 fields: FormFieldConfig[];
}

export interface GroupFieldConfig extends BaseFieldConfig {
 type: "group";
 fields: FormFieldConfig[];
 columns?: number;
 collapsible?: boolean;
 ui?: {
 variant?: "default" | "card" | "fieldset";
 className?: string;
 };
}

export interface RichTextFieldConfig extends BaseFieldConfig {
 type: "rich-text";
 minHeight?: string | number;
 maxHeight?: string | number;
 toolbar?: (
 | "bold"
 | "italic"
 | "strike"
 | "code"
 | "link"
 | "heading"
 | "list"
 | "quote"
 | "separator"
 )[];
}

// --- Field Union -------------------------------------------------------------

export type FormFieldConfig =
 | TextFieldConfig
 | NumberFieldConfig
 | ChoiceFieldConfig
 | QueryChoiceFieldConfig
 | BooleanFieldConfig
 | DateFieldConfig
 | FileFieldConfig
 | CustomFieldConfig
 | ObjectFieldConfig
 | ListFieldConfig
 | GroupFieldConfig
 | RichTextFieldConfig;

// --- Field Renderer Types ----------------------------------------------------

export type FieldComponentProps<
 TConfig extends FormFieldConfig = FormFieldConfig,
 TValue = any,
> = {
 config: TConfig;
 field: any;
 form: UseFormReturn<Record<string, any>>;
 disabled?: boolean;
};

export type FieldRendererComponent = React.ComponentType<FieldComponentProps>;

export type FieldRenderContext = {
 config: FormFieldConfig;
 field: any;
 form: UseFormReturn<Record<string, any>>;
};

// --- Section Config ----------------------------------------------------------

export interface FormSectionConfig<TValues = Record<string, any>> {
 id?: string;
 title?: string;
 description?: string;
 icon?: React.ReactNode;
 columns?: number;
 fields: FormFieldConfig[];
 /** Conditional section visibility */
 visible?: (values: TValues) => boolean;
 /** Section-level validation */
 validate?: (values: TValues) => Record<string, string> | undefined;
 /** Collapsible behavior */
 collapsible?: boolean | { defaultOpen?: boolean };
 /** Step metadata for wizard mode */
 step?: {
 label?: string;
 description?: string;
 optional?: boolean;
 canAdvance?: (values: TValues) => boolean | string;
 };
 ui?: {
 card?: boolean;
 accordion?: boolean;
 accordionDefaultOpen?: boolean;
 className?: string;
 bodyClassName?: string;
 fieldLayout?: "grid" | "stack" | "inline";
 };
}

// --- Schema ------------------------------------------------------------------

export type FormValidator<TValues> = (
 values: TValues,
) => Record<string, string> | undefined;

export interface FormSchema<TValues = Record<string, any>> {
 id?: string;
 meta?: Record<string, any>;
 sections?: FormSectionConfig<TValues>[];
 fields?: FormFieldConfig[];
 initialValues?: Partial<TValues>;
 validators?: FormValidator<TValues>[];
}

// --- Change Record -----------------------------------------------------------

export interface ChangeRecord {
 name: string;
 previousValue: unknown;
 nextValue: unknown;
 timestamp: number;
}
