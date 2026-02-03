import type { FormFieldConfig, FormSchema, FormInputType } from "../../form/inputs/types";

export function buildDefaultsFromSchema(schema: FormSchema): Record<string, any> {
  const target: Record<string, any> = {};
  const sections = schema.sections?.length
    ? schema.sections
    : schema.fields
    ? [{ fields: schema.fields }]
    : [];
  sections.forEach((section) => {
    section.fields.forEach((field) => {
      assignDefaultValue(target, field);
    });
  });
  return target;
}

function assignDefaultValue(
  target: Record<string, any>,
  field: FormFieldConfig,
  basePath?: string
) {
  const path = basePath ? `${basePath}.${field.name}` : field.name;
  if (field.type === "object") {
    const value = buildDefaultsFromFields(field.fields);
    setValue(target, path, value);
    return;
  }
  if (field.type === "list") {
    setValue(target, path, field.defaultValue ?? []);
    return;
  }
  if (field.type === "custom") {
    setValue(target, path, field.defaultValue ?? "");
    return;
  }
  setValue(
    target,
    path,
    field.defaultValue ?? getPrimitiveDefaultValue(field.type as FormInputType)
  );
}

function buildDefaultsFromFields(fields: FormFieldConfig[]): Record<string, any> {
  const result: Record<string, any> = {};
  fields.forEach((field) => assignDefaultValue(result, field));
  return result;
}

function setValue(target: Record<string, any>, path: string, value: any) {
  const segments = path.split(".");
  let current = target;
  segments.forEach((segment, index) => {
    if (index === segments.length - 1) {
      current[segment] = value;
      return;
    }
    current[segment] = current[segment] ?? {};
    current = current[segment];
  });
}

function getPrimitiveDefaultValue(type: FormInputType) {
  switch (type) {
    case "number":
    case "decimal":
    case "slider":
    case "range":
      return 0;
    case "select":
    case "radio":
      return "";
    case "checkbox":
    case "switch":
      return false;
    case "select-query":
      return null;
    case "file":
      return null;
    default:
      return "";
  }
}
