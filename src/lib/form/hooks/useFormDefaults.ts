/**
 * Hook for computing and merging form default values.
 *
 * Builds defaults from the schema field definitions, merges with
 * schema.initialValues and runtime defaultValues, producing a single
 * computed defaults object.
 */
import React from "react";
import type {
  FormSchema,
  FormFieldConfig,
  ObjectFieldConfig,
  ListFieldConfig,
  FormInputType,
} from "../types/schema";

type PrimitiveField = Exclude<
  FormFieldConfig,
  ObjectFieldConfig | ListFieldConfig
>;

export function useFormDefaults<TValues extends Record<string, any>>(
  schema: FormSchema<TValues>,
  defaultValues?: Partial<TValues>,
): TValues {
  return React.useMemo(
    () =>
      deepMergeDefaults(
        buildDefaultsFromSchema(schema),
        schema.initialValues ?? {},
        defaultValues ?? {},
      ) as TValues,
    [schema, defaultValues],
  );
}

// ─── Schema → Defaults ──────────────────────────────────────────────────────

export function buildDefaultsFromSchema(
  schema: FormSchema,
): Record<string, any> {
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

export function buildDefaultsFromFields(
  fields: FormFieldConfig[],
): Record<string, any> {
  const result: Record<string, any> = {};
  fields.forEach((field) => assignDefaultValue(result, field));
  return result;
}

function assignDefaultValue(
  target: Record<string, any>,
  field: FormFieldConfig,
  basePath?: string,
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
    field.defaultValue ??
      getPrimitiveDefaultValue(field.type as PrimitiveField["type"]),
  );
}

export function getPrimitiveDefaultValue(type: FormInputType) {
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
      return [];
    case "file":
      return null;
    default:
      return "";
  }
}

// ─── Utilities ───────────────────────────────────────────────────────────────

export function setValue(
  target: Record<string, any>,
  path: string,
  value: any,
) {
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

export function deepMergeDefaults(
  ...sources: Record<string, any>[]
): Record<string, any> {
  const result: Record<string, any> = {};
  for (const source of sources) {
    if (!source || typeof source !== "object") continue;
    for (const key of Object.keys(source)) {
      const sourceValue = source[key];
      const resultValue = result[key];
      if (Array.isArray(sourceValue)) {
        result[key] = sourceValue;
      } else if (
        sourceValue &&
        typeof sourceValue === "object" &&
        !Array.isArray(sourceValue) &&
        resultValue &&
        typeof resultValue === "object" &&
        !Array.isArray(resultValue)
      ) {
        result[key] = deepMergeDefaults(resultValue, sourceValue);
      } else {
        result[key] = sourceValue;
      }
    }
  }
  return result;
}

export function deepEqual(a: any, b: any): boolean {
  if (a === b) return true;
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i += 1) {
      if (!deepEqual(a[i], b[i])) return false;
    }
    return true;
  }
  if (isPlainObject(a) && isPlainObject(b)) {
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    if (keysA.length !== keysB.length) return false;
    for (const key of keysA) {
      if (!deepEqual(a[key], (b as Record<string, any>)[key])) return false;
    }
    return true;
  }
  return false;
}

function isPlainObject(value: unknown): value is Record<string, any> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
