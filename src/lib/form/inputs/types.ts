/**
 * Shared type declarations for the dynamic form system.
 *
 * These interfaces describe every configurable input, layout primitive,
 * and schema construct consumed by `DynamicForm`, backend-driven model forms,
 * and bespoke field renderers. Each export uses strict JSDoc to keep IDE
 * tooltips and downstream packages in sync.
 *
 * @module form/inputs/types
 */
import type React from "react";
import type { DocumentNode } from "graphql";
import type { FetchPolicy } from "@apollo/client";
import type { FieldApi, UseFormReturn } from "@tanstack/react-form";

/**
 * Enumerates every primitive renderer supported by the form system.
 */
export type PrimitiveFormInputType =
  | "text"
  | "textarea"
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

/**
 * Higher order structural inputs that wrap other fields.
 */
export type StructuralFormInputType = "object" | "list";

/**
 * Union covering every field renderer type.
 */
export type FormInputType = PrimitiveFormInputType | StructuralFormInputType;

/**
 * Signature for custom validator functions bound to fields.
 */
export type ValidatorFn = (
  value: any,
  context: { values: Record<string, any>; name: string }
) => string | undefined | Promise<string | undefined>;

/**
 * Baseline configuration shared by every field type.
 */
export interface BaseFieldConfig {
  /** Unique identifier used as a path inside the TanStack form */
  name: string;
  /** Field renderer type, see `PrimitiveFormInputType` and `StructuralFormInputType` */
  type: FormInputType;
  /** Human label rendered above the field */
  label?: string;
  /** Optional descriptive copy displayed under the label */
  description?: string;
  /** Input placeholder when supported by the renderer */
  placeholder?: string;
  /** Adds a required validator and renders the required marker */
  required?: boolean;
  /** Helper text rendered below the control */
  helpText?: string;
  /** Initial field value (overrides schema defaults) */
  defaultValue?: any;
  /** Disables user interactions */
  disabled?: boolean;
  /** Renders the control in read-only mode */
  readOnly?: boolean;
  /** Completely hides the field but keeps it in the form state */
  hidden?: boolean;
  /** Custom classes merged on top of the field wrapper */
  className?: string;
  /** Grid span inside section layouts */
  colSpan?: number;
  /** Extra props forwarded to the underlying input component */
  inputProps?: Record<string, any>;
  /** Custom validators executed on change (sync or async) */
  validators?: ValidatorFn | ValidatorFn[];
  /** Optional local ordering hint; lower numbers render first */
  order?: number;
}

/**
 * Configuration for textual inputs (single and multi-line).
 */
export interface TextFieldConfig extends BaseFieldConfig {
  type: "text" | "email" | "password" | "textarea" | "color" | "json";
  /** Minimum allowed character length */
  minLength?: number;
  /** Maximum allowed character length */
  maxLength?: number;
  /** Number of visible rows when using textarea-like renderers */
  rows?: number;
}

/**
 * Configuration for numeric inputs including sliders.
 */
export interface NumberFieldConfig extends BaseFieldConfig {
  type: "number" | "decimal" | "slider" | "range";
  /** Minimum allowed numeric value */
  min?: number;
  /** Maximum allowed numeric value */
  max?: number;
  /** Increment applied when nudging the value */
  step?: number;
  /** Decimal precision used when formatting */
  precision?: number;
  /** Optional formatter applied to display values */
  format?: (value: number) => string;
}

export interface ChoiceOption {
  /** User-facing label displayed inside pickers */
  label: string;
  /** Value stored in the form state when selected */
  value: string | number;
  /** Optional helper description shown below the label */
  description?: string;
  /** When true disables this particular option */
  disabled?: boolean;
}

/**
 * Static option based select / radio configuration.
 */
export interface ChoiceFieldConfig extends BaseFieldConfig {
  type: "select" | "radio";
  /** List of selectable options */
  options: ChoiceOption[];
  /** Enables multi-select mode when supported by renderer */
  multiple?: boolean;
  /** Enables built-in search UI (implementation dependent) */
  searchable?: boolean;
}

export interface QueryChoiceFieldConfig extends BaseFieldConfig {
  type: "select-query";
  /** Enables multiple selection */
  multiple?: boolean;
  /** Placeholder shown when no selection has been made */
  placeholder?: string;
  /** Debounce duration applied to search input before querying */
  debounceMs?: number;
  /** Imperative loader alternative to GraphQL configuration */
  loadOptions?: (
    search: string,
    context: { values: Record<string, any> }
  ) => Promise<ChoiceOption[]>;
  /**
   * Convenience shortcut – when defined the component will automatically build
   * a query field like `${relatedModelToken}List` and use it as the datasource.
   */
  relatedModel?: string;
  /**
   * Advanced GraphQL configuration.
   */
  graphql?: QueryChoiceGraphQLConfig;
  /**
   * Inline creation settings that render a ModelForm trigger next to the input.
   */
  inlineCreate?: QueryChoiceInlineCreateConfig;
}

/**
 * Context passed when building GraphQL variables for query-backed selects.
 */
export type QueryChoiceVariableBuilderContext = {
  /** Current search value being sent to the server */
  search: string;
  /** Full set of form values for contextual filtering */
  values: Record<string, any>;
  /** Parent TanStack form instance */
  form: UseFormReturn<Record<string, any>>;
  /** Field API backing the query choice input */
  field: FieldApi<Record<string, any>, any, any, any>;
};

/**
 * Context received when mapping query results into options.
 */
export type QueryChoiceRecordContext = {
  /** TanStack form instance */
  form: UseFormReturn<Record<string, any>>;
  /** Field API for the select-query field */
  field: FieldApi<Record<string, any>, any, any, any>;
  /** Current search phrase */
  search: string;
};

/**
 * Fine-grained GraphQL configuration for `select-query` fields.
 */
export interface QueryChoiceGraphQLConfig {
  /** Model name used when auto-building query names */
  relatedModel?: string;
  /** Override for the collection field queried on the server */
  listFieldName?: string;
  /** Explicit GraphQL operation name */
  queryName?: string;
  /**
   * Provide a fully custom query if you do not want the helper to build one.
   * Accepts either a parsed DocumentNode or a raw string.
   */
  queryDocument?: DocumentNode | string;
  /**
   * Controls which variable name (and type) receives the search value.
   * Set to `null` to avoid injecting the search term in variables.
   */
  searchVariableName?: string | null;
  /** GraphQL type for the injected search variable */
  searchVariableType?: string;
  /**
   * Optional default GraphQL arguments appended to the generated field.
   * Example: `{ limit: 10 }`.
   */
  /** Static arguments appended to the generated field */
  staticArgs?: Record<string, string | number | boolean>;
  /**
   * Limits the number of returned items when auto-generating the query.
   * Defaults to 100.
   */
  /** Maximum number of items fetched by default */
  limit?: number;
  /**
   * Override the variable name used for the limit.
   * Set to `null` to disable automatic limit injection.
   */
  /** Variable name used for the limit argument */
  limitVariableName?: string | null;
  /**
   * Override the variable name used to include default/selected ids.
   * Defaults to `include`. Set to `null` to disable automatic injection.
   */
  /** Variable name used to pre-load selected ids */
  includeVariableName?: string | null;
  /**
   * Customize the GraphQL type for the include variable (defaults to `[ID]`).
   */
  /** GraphQL type used for the include variable */
  includeVariableType?: string;
  /**
   * When using auto-generated queries, you can request additional fields.
   */
  /** Additional field selections appended to the query */
  extraFields?: string[];
  /**
   * Field selections (with optional GraphQL aliases) used when an automatic
   * query is generated.
   */
  /** GraphQL field used as the option value */
  valueField?: string;
  /** GraphQL field used as the option label */
  labelField?: string;
  /** GraphQL field used as the option description */
  descriptionField?: string;
  /**
   * Property names (dot notation supported) used to extract option metadata
   * from the GraphQL response.
   */
  /** Dot-notation path to extract the option value */
  valueKey?: string;
  /** Dot-notation path to extract the option label */
  labelKey?: string;
  /** Dot-notation path to extract the option description */
  descriptionKey?: string;
  /**
   * Override the array path holding the records.
   */
  /** Path within the response holding the result array */
  resultPath?: string;
  /**
   * Static variables merged into every request.
   */
  /** Static variables merged into every query execution */
  initialVariables?: Record<string, any>;
  /** Function or object returning dynamic variables per request */
  variables?:
    | Record<string, any>
    | ((ctx: QueryChoiceVariableBuilderContext) => Record<string, any>);
  /** Apollo fetch policy override */
  fetchPolicy?: FetchPolicy;
  /** Debounce override specific to this field */
  debounceMs?: number;
  /**
   * Transform the raw array into options. If provided, `mapRecord` is ignored.
   */
  /** Map the full record array into dropdown options */
  mapResult?: (
    records: Record<string, any>[],
    data: Record<string, any>,
    ctx: QueryChoiceRecordContext
  ) => ChoiceOption[];
  /**
   * Map each record to a choice option. Return `null` to skip an entry.
   */
  /** Map a single record into a dropdown option */
  mapRecord?: (
    record: Record<string, any>,
    ctx: QueryChoiceRecordContext
  ) => ChoiceOption | null | undefined;
  /**
   * Lifecycle hook fired with the full query payload.
   */
  /** Side-effect hook invoked with the raw Apollo response */
  onQueryResult?: (
    payload: {
      data: Record<string, any>;
      records: Record<string, any>[];
      options: ChoiceOption[];
    },
    ctx: QueryChoiceRecordContext
  ) => void;
}

/**
 * Controls the inline creation workflow attached to a `select-query` input.
 */
export interface QueryChoiceInlineCreateConfig {
  /**
   * Toggles the inline creation trigger. Defaults to `true` when a related
   * model can be resolved.
   */
  enabled?: boolean;
  /**
   * Explicit backend app name used by the spawned `ModelForm`.
   * When omitted, the value is derived from `relatedModel` when available.
   */
  appName?: string;
  /**
   * Backend model name consumed by the inline `ModelForm`. When missing, the
   * name is extracted from `relatedModel`.
   */
  modelName?: string;
  /**
   * Model identifier sent to the permission endpoint. Useful when permission
   * lookup differs from the metadata/app pair (for example, aliased models).
   */
  permissionModelName?: string;
  /** Optional title rendered above the inline creation form. */
  title?: string;
  /**
   * Overrides forwarded to the inline `ModelForm` (layout, defaults, etc.).
   * `appName` and `modelName` are injected automatically and should not be set here.
   */
  formProps?: Record<string, any>;
  /**
   * Custom mapper used to turn the creation payload into a dropdown option.
   * When omitted, the component falls back to the value/label keys of the query.
   */
  mapCreatedOption?: (
    payload: any,
    ctx: { valueKey?: string; labelKey?: string; descriptionKey?: string }
  ) => ChoiceOption | null | undefined;
}

/**
 * Toggle / boolean configuration.
 */
export interface BooleanFieldConfig extends BaseFieldConfig {
  type: "checkbox" | "switch";
  /** Label displayed when the value is true */
  trueLabel?: string;
  /** Label displayed when the value is false */
  falseLabel?: string;
}

/**
 * Date / time configuration.
 */
export interface DateFieldConfig extends BaseFieldConfig {
  type: "date" | "datetime-local" | "time";
  /** Minimum allowed ISO date/time value */
  min?: string;
  /** Maximum allowed ISO date/time value */
  max?: string;
}

/**
 * File input configuration.
 */
export interface FileFieldConfig extends BaseFieldConfig {
  type: "file";
  /** Accept attribute controlling allowed MIME types/extensions */
  accept?: string;
  /** Allows uploading multiple files */
  multiple?: boolean;
}

/**
 * Custom renderer configuration.
 */
export interface CustomFieldConfig extends BaseFieldConfig {
  type: "custom";
  /** Render prop responsible for drawing the field UI */
  render: (ctx: FieldRenderContext) => React.ReactNode;
}

/**
 * Nested object configuration.
 */
export interface ObjectFieldConfig extends BaseFieldConfig {
  type: "object";
  /** Nested field definitions rendered inside the object */
  fields: FormFieldConfig[];
  /** Responsive columns used when rendering nested fields */
  columns?: number;
  /** When true allows the nested block to be collapsed */
  collapsible?: boolean;
}

/**
 * Repeatable list configuration.
 */
export interface ListFieldConfig extends BaseFieldConfig {
  type: "list";
  /** Label shown on each list item header */
  itemLabel?: string;
  /** Label used for the add item button */
  addLabel?: string;
  /** Minimum number of list entries required */
  minItems?: number;
  /** Maximum number of list entries allowed */
  maxItems?: number;
  /** Responsive column count used inside each list item */
  columns?: number;
  /** Custom gap applied between fields inside a list item */
  itemGap?: number | string;
  /** Extra classes merged onto the list item grid */
  itemClassName?: string;
  /** Controls automatic ordering values pushed into child fields */
  ordering?: {
    /** Enables automatic ordering */
    activate: boolean;
    /** Target field name receiving the generated index */
    toField: string;
  };
  /** Field definitions used to render each list item */
  fields: FormFieldConfig[];
}

/**
 * Master union covering every concrete field configuration.
 */
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
  | ListFieldConfig;

/**
 * Props handed to low-level field renderer components.
 */
export type FieldComponentProps<
  TConfig extends FormFieldConfig = FormFieldConfig,
  TValue = any
> = {
  /** Field configuration driving the renderer */
  config: TConfig;
  /** Field API instance supplied by TanStack Form */
  field: FieldApi<Record<string, any>, TValue, TValue, TValue>;
  /** Parent form instance */
  form: UseFormReturn<Record<string, any>>;
  /** Optional flag used to disable the renderer */
  disabled?: boolean;
};

/** React component type used to render fields. */
export type FieldRendererComponent = React.ComponentType<FieldComponentProps>;

/**
 * Describes a section grouping of fields (grid layout with optional title).
 */
export interface FormSectionConfig<TValues = Record<string, any>> {
  /** Explicit identifier to help React track sections */
  id?: string;
  /** Optional section title */
  title?: string;
  /** Descriptive copy rendered under the title */
  description?: string;
  /** Grid column count for the section; defaults to the global layout */
  columns?: number;
  /** Field definitions rendered inside this section */
  fields: FormFieldConfig[];
  /** UI overrides for the section container/body */
  ui?: {
    /**
     * Wrap the section inside a Card container.
     * @default false
     */
    card?: boolean;
    /**
     * Whether the section should behave as an accordion panel.
     * @default false
     */
    accordion?: boolean;
    /**
     * Initial open state when the section is rendered as an accordion.
     * @default true
     */
    accordionDefaultOpen?: boolean;
    className?: string;
    bodyClassName?: string;
  };
}

/**
 * Top-level schema describing every section/field and defaults.
 */
export interface FormSchema<TValues = Record<string, any>> {
  /** Identifier stored on the schema (useful for analytics or storage) */
  id?: string;
  /** Misc metadata you want to attach to the schema */
  meta?: Record<string, any>;
  /** List of field sections. If omitted, `fields` is used instead. */
  sections?: FormSectionConfig<TValues>[];
  /** Flat field list (used when `sections` is empty) */
  fields?: FormFieldConfig[];
  /** Default values merged with the schema-derived defaults */
  initialValues?: Partial<TValues>;
}

/**
 * Entry describing a value change reported by the form.
 */
export interface ChangeRecord {
  /** Field name that changed */
  name: string;
  /** Previous value before the change */
  previousValue: unknown;
  /** New value after the change */
  nextValue: unknown;
  /** Unix timestamp of when the change was recorded */
  timestamp: number;
}

/**
 * Props accepted by the `DynamicForm` component.
 */
export interface FormBuilderProps<TValues = Record<string, any>> {
  /** Declarative schema describing the sections and fields */
  schema: FormSchema<TValues>;
  /** Optional external TanStack form instance (when managing state outside) */
  form?: UseFormReturn<TValues>;
  /** Invoked once a form instance (internal or external) is ready. */
  onFormReady?: (form: UseFormReturn<TValues>) => void;
  /** Runtime defaults merged with schema defaults */
  /** Runtime defaults merged over schema defaults */
  defaultValues?: Partial<TValues>;
  /**
   * When true, adapts spacing/borders so the form fits inside a modal/drawer
   * without redundant chrome.
   */
  inPopup?: boolean;
  onSubmit?: (
    values: TValues,
    ctx: { form: UseFormReturn<TValues>; isInternal: boolean }
  ) => Promise<void> | void;
  onChange?: (
    values: TValues,
    changes: ChangeRecord[],
    form: UseFormReturn<TValues>
  ) => void;
  /** Submit button label */
  submitLabel?: string;
  /** Reset button label */
  resetLabel?: string;
  /** Enables debug panel rendering */
  debug?: boolean;
  /** Allows transforming debug values before rendering them. */
  debugValueTransformer?: (values: TValues) => any;
  /** Extra class names applied to the wrapping form element */
  className?: string;
  layout?: {
    /** Default number of columns used per section */
    columns?: number;
    /** Vertical spacing (Tailwind gap value) between rows */
    gap?: number;
  };
  /** Toggles the section header block (title + description) inside cards. */
  showSectionHeaders?: boolean;
  /** Slot rendered near submit/reset buttons */
  actionSlot?: React.ReactNode;
  /** Overall loading state that disables controls/buttons */
  isLoading?: boolean;
  /**
   * When true, skips automatic resets triggered when defaults change.
   * Useful for multi-step or conditional layouts using an external form.
   */
  disableAutoReset?: boolean;
}

/**
 * Runtime context provided to custom field renderers.
 */
export type FieldRenderContext = {
  /** Field configuration driving the renderer */
  config: FormFieldConfig;
  /** TanStack Field API instance bound to this control */
  field: FieldApi<Record<string, any>, any, any, any>;
  /** Parent form API */
  form: UseFormReturn<Record<string, any>>;
};
