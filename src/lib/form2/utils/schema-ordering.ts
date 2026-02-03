import type { FormSchema, FormFieldConfig } from "../../form/inputs/types";
import type { FormMetadata, InlineCreateOverrides, ModelFormOrderingOptions } from "../types";
import type { QueryChoiceFieldConfig } from "../../form/inputs/types";

export type CustomFieldOrderFactoryConfig = Omit<
  ModelFormOrderingOptions,
  "customFieldOrder" | "sortRemainingFields"
> & {
  sortRemaining: "metadata" | "alphabetical";
};

export function buildCustomFieldOrderFactory({
  fieldOrder,
  pinnedFields,
  trailingFields,
  sortRemaining,
}: CustomFieldOrderFactoryConfig) {
  return ({ metadata }: { metadata: FormMetadata }) => {
    const order: string[] = [];
    const push = (name?: string | null) => {
      if (!name) return;
      if (order.includes(name)) return;
      order.push(name);
    };

    pinnedFields?.forEach((field) => push(field));
    fieldOrder?.forEach((field) => push(field));

    const remaining = metadata.fields
      .map((field) => field.name)
      .filter((field) => !order.includes(field));

    const orderedRemaining =
      sortRemaining === "alphabetical"
        ? remaining.sort((a, b) => a.localeCompare(b))
        : remaining;

    orderedRemaining.forEach((field) => push(field));
    trailingFields?.forEach((field) => push(field));

    return order;
  };
}

export function applyOrderingToSchema<TValues extends Record<string, any>>(
  schema: FormSchema<TValues>,
  order: string[]
): FormSchema<TValues> {
  if (!order.length) return schema;

  const reorderFields = (fields: FormFieldConfig[]) =>
    sortFieldsByOrder(fields, order);

  if (schema.sections?.length) {
    return {
      ...schema,
      sections: schema.sections.map((section) => ({
        ...section,
        fields: reorderFields(section.fields),
      })),
    };
  }

  if (schema.fields?.length) {
    return {
      ...schema,
      fields: reorderFields(schema.fields),
    };
  }

  return schema;
}

function sortFieldsByOrder(
  fields: FormFieldConfig[],
  order: string[]
): FormFieldConfig[] {
  if (!order.length) return fields;
  const rank = new Map(order.map((name, index) => [name, index]));
  return [...fields].sort((a, b) => {
    const rankA = rank.get(a.name) ?? Number.MAX_SAFE_INTEGER;
    const rankB = rank.get(b.name) ?? Number.MAX_SAFE_INTEGER;
    if (rankA === rankB) return a.name.localeCompare(b.name);
    return rankA - rankB;
  });
}

export function applyInlineCreateControl<TValues extends Record<string, any>>(
  schema: FormSchema<TValues>,
  control?: InlineCreateOverrides
): FormSchema<TValues> {
  if (!control) return schema;
  const defaultEnabled = control.defaultEnabled;
  const fieldOverrides = control.fields ?? {};

  const mapField = (field: FormFieldConfig): FormFieldConfig => {
    if (field.type === "object") {
      return { ...field, fields: field.fields.map(mapField) };
    }
    if (field.type === "list") {
      return { ...field, fields: field.fields.map(mapField) };
    }
    if (field.type === "select-query") {
      const override = fieldOverrides[field.name];
      let inlineCreate = (field as QueryChoiceFieldConfig).inlineCreate;
      if (override !== undefined) {
        if (override === false) {
          inlineCreate = { ...(inlineCreate ?? {}), enabled: false };
        } else {
          inlineCreate = { ...(inlineCreate ?? {}), ...override };
        }
      } else if (defaultEnabled !== undefined) {
        inlineCreate = { ...(inlineCreate ?? {}), enabled: defaultEnabled };
      }
      return { ...(field as QueryChoiceFieldConfig), inlineCreate };
    }
    return field;
  };

  if (schema.sections?.length) {
    const nextSections = schema.sections.map((section) => ({
      ...section,
      fields: section.fields.map((field) =>
        typeof field === "string" ? field : mapField(field),
      ),
    }));
    if (arraysShallowEqual(nextSections, schema.sections)) {
      return schema;
    }
    return {
      ...schema,
      sections: nextSections,
    };
  }

  if (schema.fields?.length) {
    const nextFields = schema.fields.map((field) =>
      typeof field === "string" ? field : mapField(field),
    );
    if (arraysShallowEqual(nextFields, schema.fields)) {
      return schema;
    }
    return {
      ...schema,
      fields: nextFields,
    };
  }

  return schema;
}

export function applyFieldOrderHints<TValues extends Record<string, any>>(
  schema: FormSchema<TValues>
): FormSchema<TValues> {
  if (schema.sections?.length) {
    const originalSections = schema.sections;
    const sections = originalSections.map((section) => {
      const nextFields = sortFieldsRecursively(section.fields);
      if (nextFields === section.fields) {
        return section;
      }
      return {
        ...section,
        fields: nextFields,
      };
    });
    if (
      sections.every((section, index) => section === originalSections[index])
    ) {
      return schema;
    }
    return {
      ...schema,
      sections,
    };
  }
  if (schema.fields?.length) {
    const originalFields = schema.fields;
    const nextFields = sortFieldsRecursively(originalFields);
    if (nextFields === originalFields) {
      return schema;
    }
    return {
      ...schema,
      fields: nextFields,
    };
  }
  return schema;
}

function sortFieldsRecursively(fields: FormFieldConfig[]): FormFieldConfig[] {
  if (!fields.length) return fields;
  let childMutated = false;
  const withChildren = fields.map((field) => {
    let nextField = field;
    if (hasNestedFields(field) && field.fields?.length) {
      const nextChildFields = sortFieldsRecursively(field.fields);
      if (nextChildFields !== field.fields) {
        childMutated = true;
        nextField = {
          ...nextField,
          fields: nextChildFields,
        };
      }
    }
    return nextField;
  });
  const ordered = sortFieldsByOrderHint(withChildren);
  const orderChanged = !arraysShallowEqual(ordered, withChildren);
  if (!childMutated && !orderChanged && arraysShallowEqual(fields, withChildren)) {
    return fields;
  }
  return orderChanged ? ordered : withChildren;
}

function sortFieldsByOrderHint(fields: FormFieldConfig[]): FormFieldConfig[] {
  if (fields.length < 2) {
    return fields;
  }
  const ordered = fields
    .map((field, index) => ({ field, index }))
    .sort((a, b) => compareFieldOrder(a.field, b.field, a.index, b.index))
    .map((entry) => entry.field);
  return ordered;
}

function compareFieldOrder(
  a: FormFieldConfig,
  b: FormFieldConfig,
  indexA: number,
  indexB: number
) {
  const orderA = typeof a.order === "number" ? a.order : indexA;
  const orderB = typeof b.order === "number" ? b.order : indexB;
  if (orderA === orderB) {
    return a.name.localeCompare(b.name);
  }
  return orderA - orderB;
}

function arraysShallowEqual<T>(a: T[], b: T[]) {
  if (a === b) return true;
  if (a.length !== b.length) return false;
  for (let index = 0; index < a.length; index += 1) {
    if (a[index] !== b[index]) {
      return false;
    }
  }
  return true;
}

function hasNestedFields(
  field: FormFieldConfig
): field is FormFieldConfig & { fields: FormFieldConfig[] } {
  return field.type === "object" || field.type === "list";
}
