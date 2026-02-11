/**
 * Field ordering helpers extracted from the old DynamicForm monolith.
 */
import type {
  FormFieldConfig,
  ObjectFieldConfig,
  ListFieldConfig,
} from "../types/schema";

export function normalizeFieldOrder(
  fields: FormFieldConfig[],
): FormFieldConfig[] {
  if (!fields.length) return fields;

  let childMutated = false;
  const withChildren = fields.map((field) => {
    let nextField = field;
    if (fieldHasChildFields(field) && field.fields?.length) {
      const nestedFields = normalizeFieldOrder(field.fields);
      if (nestedFields !== field.fields) {
        childMutated = true;
        nextField = {
          ...nextField,
          fields: nestedFields,
        } as FormFieldConfig;
      }
    }
    return nextField;
  });

  const ordered = sortFieldsByOrderHint(withChildren);
  const orderChanged = !arraysShallowEqual(ordered, withChildren);

  if (
    !childMutated &&
    !orderChanged &&
    arraysShallowEqual(fields, withChildren)
  ) {
    return fields;
  }
  return orderChanged ? ordered : withChildren;
}

function sortFieldsByOrderHint(
  fields: FormFieldConfig[],
): FormFieldConfig[] {
  if (fields.length < 2) return fields;
  return fields
    .map((field, index) => ({ field, index }))
    .sort((a, b) => compareFieldOrder(a.field, b.field, a.index, b.index))
    .map((entry) => entry.field);
}

function compareFieldOrder(
  a: FormFieldConfig,
  b: FormFieldConfig,
  indexA: number,
  indexB: number,
) {
  const orderA = typeof a.order === "number" ? a.order : indexA;
  const orderB = typeof b.order === "number" ? b.order : indexB;
  if (orderA === orderB) return a.name.localeCompare(b.name);
  return orderA - orderB;
}

function arraysShallowEqual(a: FormFieldConfig[], b: FormFieldConfig[]) {
  if (a === b) return true;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i += 1) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

function fieldHasChildFields(
  field: FormFieldConfig,
): field is ObjectFieldConfig | ListFieldConfig {
  return field.type === "object" || field.type === "list";
}
