import type {
  ChoiceFieldConfig,
  ChoiceOption,
  FormFieldConfig,
  FormInputType,
  FormSchema,
  ListFieldConfig,
  NumberFieldConfig,
  QueryChoiceFieldConfig,
  TextFieldConfig,
} from "../inputs/types";
import type { FormMetadata, FieldSchema, RelationshipSchema } from "../types";
import { parseCustomMetadata } from "./metadata";

export type SchemaBuildMode = "create" | "update";

type FieldOverrideConfig = {
  readonlyFields?: Set<string>;
  excludedFields?: Set<string>;
};

export function buildFormSchema<TValues extends Record<string, any>>(
  metadata: FormMetadata,
  nestedMetadata: Record<string, FormMetadata>,
  initialValues: Partial<TValues>,
  mode: SchemaBuildMode
): FormSchema<TValues> {
  const combinedFields = collectFieldConfigs(metadata, nestedMetadata, mode);

  return {
    id: `${metadata.app}.${metadata.model}`,
    fields: combinedFields,
    initialValues,
    meta: {
      appName: metadata.app,
      modelName: metadata.model,
    },
  };
}

export function collectFieldConfigs(
  metadata: FormMetadata,
  nestedMetadata: Record<string, FormMetadata>,
  mode: SchemaBuildMode,
  overrides: FieldOverrideConfig = {}
): FormFieldConfig[] {
  const readonly = overrides.readonlyFields ?? new Set();
  const excluded = overrides.excludedFields ?? new Set();

  const primitiveFields = metadata.fields
    .filter((field) => {
      if (excluded.has(field.name) || excluded.has(field.fieldName)) {
        return false;
      }
      if (field.readable === false) {
        return false;
      }
      const nonEditable =
        field.editable === false ||
        field.writable === false ||
        field.isPrimaryKey;
      if (nonEditable) {
        return false;
      }
      return true;
    })
    .map((field) => mapFieldSchema(field, readonly))
    .filter((field): field is FormFieldConfig => Boolean(field));

  const relationshipFields = metadata.relationships
    .filter((rel) => {
      if (excluded.has(rel.name) || excluded.has(rel.fieldName)) {
        return false;
      }
      if (rel.readable === false) {
        return false;
      }
      const nonEditable = rel.editable === false || rel.writable === false;
      if (nonEditable) {
        return false;
      }
      return true;
    })
    .map((relationship) => mapRelationshipSchema(relationship, readonly))
    .filter((field): field is FormFieldConfig => Boolean(field));

  const nestedFields = Object.entries(nestedMetadata)
    .map(([fieldName, nestedMeta]) => {
      const relation = metadata.relationships.find(
        (rel) => rel.name === fieldName || rel.fieldName === fieldName,
      );
      return mapNestedMetadata(fieldName, relation, nestedMeta, mode, overrides);
    })
    .filter((field): field is FormFieldConfig => Boolean(field));

  return [...primitiveFields, ...relationshipFields, ...nestedFields];
}

function mapFieldSchema(
  field: FieldSchema,
  readonlyFields: Set<string>
): FormFieldConfig | null {
  const custom = parseCustomMetadata<Record<string, any>>(field.customMetadata);
  const inputType = resolveInputType(field, custom);
  const placeholder = custom?.placeholder;
  const className = custom?.className ?? custom?.class;
  const dataAttributes = custom?.dataAttributes ?? custom?.data_attributes;
  const order = typeof custom?.order === "number" ? custom.order : undefined;

  const visibility = String(field.visibility ?? "").toLowerCase();
  const hiddenFromVisibility =
    visibility === "hidden" || visibility === "redacted";
  const hiddenOverride = custom?.hidden ?? custom?.hide;
  const isJsonField = Boolean(field.isJson) || field.fieldType === "JSONField";
  const hidden =
    hiddenFromVisibility ||
    (hiddenOverride !== undefined ? Boolean(hiddenOverride) : isJsonField);
  const readOnlyOverride =
    custom?.readOnly ?? custom?.readonly;
  const resolvedReadOnly =
    readOnlyOverride !== undefined
      ? readOnlyOverride
      : readonlyFields.has(field.name) ||
        !field.editable ||
        field.writable === false;

  const base = {
    name: field.name,
    label: field.verboseName || field.name,
    description: field.helpText || undefined,
    placeholder: placeholder || undefined,
    required: field.required,
    defaultValue: field.defaultValue,
    disabled: custom?.disabled ?? !field.editable,
    readOnly: resolvedReadOnly,
    className,
    dataAttributes,
    order,
    hidden: hidden || field.readable === false,
  };

  const choiceOptions = normalizeChoiceOptions(field.choices);
  if (choiceOptions.length) {
    const multiple = Boolean(custom?.multiple || custom?.multi || custom?.multiselect);
    const config: ChoiceFieldConfig = {
      ...base,
      type: inputType === "radio" ? "radio" : "select",
      options: choiceOptions,
      multiple,
    };
    if (config.multiple && config.defaultValue === undefined) {
      config.defaultValue = [];
    }
    return config;
  }

  if (
    inputType === "number" ||
    inputType === "decimal" ||
    inputType === "slider" ||
    inputType === "range"
  ) {
    const config: NumberFieldConfig = {
      ...base,
      type: inputType,
      min: field.minValue ?? undefined,
      max: field.maxValue ?? undefined,
      step: inferDecimalStep(field.decimalPlaces, inputType),
    };
    return config;
  }

  if (
    inputType === "text" ||
    inputType === "textarea" ||
    inputType === "email" ||
    inputType === "password" ||
    inputType === "json"
  ) {
    const config: TextFieldConfig = {
      ...base,
      type: inputType,
      minLength: field.minLength ?? undefined,
      maxLength: field.maxLength ?? undefined,
    };
    return config;
  }

  if (inputType === "checkbox" || inputType === "switch") {
    return {
      ...base,
      type: inputType,
      defaultValue:
        typeof base.defaultValue === "boolean" ? base.defaultValue : false,
    };
  }

  if (inputType === "file") {
    return {
      ...base,
      type: inputType,
    };
  }

  return {
    ...base,
    type: inputType,
  };
}

function normalizeChoiceOptions(
  choices: FieldSchema["choices"],
): ChoiceOption[] {
  if (!Array.isArray(choices) || choices.length === 0) {
    return [];
  }
  return choices
    .map((choice) => {
      if (!choice) return null;
      const rawValue = (choice as { value?: unknown }).value;
      if (rawValue === undefined || rawValue === null) {
        return null;
      }
      const value =
        typeof rawValue === "string" || typeof rawValue === "number"
          ? rawValue
          : String(rawValue);
      const label =
        typeof choice.label === "string" && choice.label.length > 0
          ? choice.label
          : String(value);
      return {
        value,
        label,
        disabled: choice.disabled,
      } satisfies ChoiceOption;
    })
    .filter((option): option is ChoiceOption => Boolean(option));
}

function mapRelationshipSchema(
  relationship: RelationshipSchema,
  readonlyFields: Set<string>
): FormFieldConfig | null {
  const relatedModel = relationship.relatedApp
    ? `${relationship.relatedApp}.${relationship.relatedModel}`
    : relationship.relatedModel;
  const custom = parseCustomMetadata<Record<string, any>>(
    relationship.customMetadata,
  );
  const inlineCreate = resolveInlineCreateConfig(relationship, custom);
  const readOnlyOverride =
    custom?.readOnly ?? custom?.readonly;
  const resolvedReadOnly =
    readOnlyOverride !== undefined
      ? readOnlyOverride
      : readonlyFields.has(relationship.name) ||
        !relationship.editable ||
        relationship.writable === false;

  const config: QueryChoiceFieldConfig = {
    name: relationship.name,
    label: relationship.verboseName || relationship.name,
    description: relationship.helpText || undefined,
    type: "select-query",
    multiple: relationship.isToMany,
    required: relationship.required,
    defaultValue: relationship.isToMany ? [] : null,
    placeholder: custom?.placeholder || undefined,
    relatedModel,
    disabled: custom?.disabled ?? !relationship.editable,
    readOnly: resolvedReadOnly,
    className: custom?.className ?? custom?.class,
    inlineCreate: inlineCreate ?? undefined,
    hidden: relationship.readable === false,
  };
  return config;
}

function mapNestedMetadata(
  fieldName: string,
  relation: RelationshipSchema | undefined,
  nestedMeta: FormMetadata,
  mode: SchemaBuildMode,
  overrides: FieldOverrideConfig
): FormFieldConfig | null {
  const nestedFields = collectFieldConfigs(
    nestedMeta,
    {},
    mode,
    overrides,
  );
  if (nestedFields.length === 0) {
    return null;
  }
  const label = nestedMeta.verboseName || fieldName;
  const description = undefined;
  const multiple = relation?.isToMany ?? false;
  if (multiple) {
    const config: ListFieldConfig = {
      name: fieldName,
      label,
      description,
      type: "list",
      fields: nestedFields,
      defaultValue: [],
      required: relation?.required ?? false,
      addLabel: label ? `Add ${label}` : undefined,
      itemLabel: label || undefined,
    };
    return config;
  }
  return {
    name: fieldName,
    label,
    description,
    type: "object",
    fields: nestedFields,
    required: relation?.required ?? false,
  };
}

function resolveInlineCreateConfig(
  relationship: RelationshipSchema,
  custom: Record<string, any> | null
) {
  if (custom?.inlineCreate === false) {
    return { enabled: false };
  }
  if (custom?.inlineCreate && typeof custom.inlineCreate === "object") {
    return { ...custom.inlineCreate };
  }
  if (relationship.canCreateInline) {
    return { enabled: true };
  }
  return null;
}

function resolveInputType(
  field: FieldSchema,
  custom: Record<string, any> | null
): FormInputType {
  const customType = custom?.inputType ?? custom?.input_type;
  if (customType) {
    return customType as FormInputType;
  }
  const widget = custom?.widget ?? custom?.widgetType ?? custom?.widget_type;
  if (field.choices?.length) {
    if (widget === "radio") return "radio";
    return "select";
  }
  switch (widget) {
    case "textarea":
      return "textarea";
    case "checkbox":
      return "checkbox";
    case "number":
      return field.fieldType === "DecimalField" ? "decimal" : "number";
    case "date":
      return "date";
    case "datetime-local":
      return "datetime-local";
    case "multiselect":
      return "select";
    case "email":
      return "email";
    case "url":
      return "text";
    default:
      break;
  }
  switch (field.fieldType) {
    case "DecimalField":
    case "FloatField":
      return "decimal";
    case "IntegerField":
    case "SmallIntegerField":
    case "PositiveSmallIntegerField":
    case "PositiveIntegerField":
    case "BigIntegerField":
    case "BigAutoField":
    case "AutoField":
      return "number";
    case "DateField":
      return "date";
    case "TimeField":
      return "time";
    case "DateTimeField":
      return "datetime-local";
    case "BooleanField":
    case "NullBooleanField":
      return "switch";
    case "JSONField":
      return "json";
    case "TextField":
      return "textarea";
    case "EmailField":
      return "email";
    case "URLField":
      return "text";
    case "FileField":
    case "ImageField":
      return "file";
    default:
      return "text";
  }
}

function inferDecimalStep(
  decimalPlaces?: number | null,
  type?: FormInputType
) {
  if (
    type === "decimal" &&
    typeof decimalPlaces === "number" &&
    decimalPlaces > 0
  ) {
    return Number((1 / 10 ** decimalPlaces).toFixed(decimalPlaces));
  }
  if (type === "range" || type === "slider") {
    return 1;
  }
  return undefined;
}
