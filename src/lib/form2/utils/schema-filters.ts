import type { FormFieldConfig, FormSchema } from "../inputs/types";

const ALWAYS_INCLUDED_FORM_FIELDS = new Set(["id"]);

export function filterSchemaToRequired<TValues extends Record<string, any>>(
  schema: FormSchema<TValues>
): FormSchema<TValues> | null {
  const filterFields = (fields: FormFieldConfig[]): FormFieldConfig[] =>
    fields
      .map((field) => {
        if (field.type === "object") {
          const childFields = filterFields(field.fields);
          if (childFields.length === 0 && !field.required) {
            return null;
          }
          return { ...field, fields: childFields };
        }
        if (field.type === "list") {
          const childFields = filterFields(field.fields);
          if (childFields.length === 0 && !field.required) {
            return null;
          }
          return { ...field, fields: childFields };
        }
        return field.required ? field : null;
      })
      .filter((field): field is FormFieldConfig => Boolean(field));

  if (schema.sections?.length) {
    const sections = schema.sections
      .map((section) => ({
        ...section,
        fields: filterFields(section.fields),
      }))
      .filter((section) => section.fields.length > 0);
    if (sections.length === 0) return null;
    return {
      ...schema,
      sections,
    };
  }
  if (schema.fields?.length) {
    const fields = filterFields(schema.fields);
    if (fields.length === 0) return null;
    return {
      ...schema,
      fields,
    };
  }
  return null;
}

export function filterSchemaByEditability<TValues extends Record<string, any>>(
  schema: FormSchema<TValues>
): FormSchema<TValues> | null {
  const filterFields = (fields: FormFieldConfig[]): FormFieldConfig[] =>
    fields
      .map((field) => {
        if (field.readOnly || field.disabled) {
          return null;
        }
        if (field.type === "object") {
          const childFields = filterFields(field.fields);
          if (childFields.length === 0) {
            return null;
          }
          return { ...field, fields: childFields };
        }
        if (field.type === "list") {
          const childFields = filterFields(field.fields);
          if (childFields.length === 0) {
            return null;
          }
          return { ...field, fields: childFields };
        }
        return field;
      })
      .filter((field): field is FormFieldConfig => Boolean(field));

  if (schema.sections?.length) {
    const sections = schema.sections
      .map((section) => ({
        ...section,
        fields: filterFields(section.fields),
      }))
      .filter((section) => section.fields.length > 0);
    if (sections.length === 0) return null;
    return {
      ...schema,
      sections,
    };
  }
  if (schema.fields?.length) {
    const fields = filterFields(schema.fields);
    if (fields.length === 0) return null;
    return {
      ...schema,
      fields,
    };
  }
  return null;
}

export function filterSchemaByVisibility<TValues extends Record<string, any>>(
  schema: FormSchema<TValues>
): FormSchema<TValues> | null {
  const filterFields = (fields: FormFieldConfig[]): FormFieldConfig[] =>
    fields
      .map((field) => {
        if ((field as any).hidden) {
          return null;
        }
        if (field.type === "object") {
          const childFields = filterFields(field.fields);
          if (childFields.length === 0 && !field.required) {
            return null;
          }
          return { ...field, fields: childFields };
        }
        if (field.type === "list") {
          const childFields = filterFields(field.fields);
          if (childFields.length === 0 && !field.required) {
            return null;
          }
          return { ...field, fields: childFields };
        }
        return field;
      })
      .filter((field): field is FormFieldConfig => Boolean(field));

  if (schema.sections?.length) {
    const sections = schema.sections
      .map((section) => ({
        ...section,
        fields: filterFields(section.fields),
      }))
      .filter((section) => section.fields.length > 0);
    if (sections.length === 0) return null;
    return {
      ...schema,
      sections,
    };
  }
  if (schema.fields?.length) {
    const fields = filterFields(schema.fields);
    if (fields.length === 0) return null;
    return {
      ...schema,
      fields,
    };
  }
  return null;
}

type FieldLabelMap = Record<string, string>;

export function buildFieldLabelMap<TValues extends Record<string, any>>(
  schema: FormSchema<TValues>
): FieldLabelMap {
  const labels: FieldLabelMap = {};

  const collect = (fields: FormFieldConfig[], prefix?: string) => {
    fields.forEach((field) => {
      const path = prefix ? `${prefix}.${field.name}` : field.name;
      labels[path] = field.label ?? field.name;
      if (field.type === "object") {
        collect(field.fields, path);
        return;
      }
      if (field.type === "list") {
        const wildcardPath = `${path}.*`;
        labels[wildcardPath] = labels[path];
        collect(field.fields, wildcardPath);
        return;
      }
    });
  };

  if (schema.sections?.length) {
    schema.sections.forEach((section) => collect(section.fields));
    return labels;
  }
  if (schema.fields?.length) {
    collect(schema.fields);
  }
  return labels;
}

export function getFieldLabelFromMap(
  map: FieldLabelMap,
  fieldName?: string | null
) {
  if (!fieldName) return undefined;
  if (map[fieldName]) return map[fieldName];
  const wildcardCandidate = fieldName.replace(/\.\d+(?=\.|$)/g, ".*");
  if (map[wildcardCandidate]) return map[wildcardCandidate];
  const segments = fieldName.split(".");
  while (segments.length > 1) {
    segments.pop();
    const candidate = segments.join(".");
    if (map[candidate]) return map[candidate];
  }
  return undefined;
}

export function filterValuesBySchema<TValues extends Record<string, any>>(
  values: TValues,
  schema: FormSchema<TValues>
) {
  const appendAlwaysIncludedFields = (
    target: Record<string, any>,
    source: Record<string, any> | undefined
  ) => {
    if (!source) {
      return target;
    }
    ALWAYS_INCLUDED_FORM_FIELDS.forEach((fieldName) => {
      const value = source[fieldName as keyof typeof source];
      if (value !== undefined) {
        target[fieldName] = value;
      }
    });
    return target;
  };

  const reduceFields = (
    fields: FormFieldConfig[],
    source: Record<string, any>
  ) => {
    const target: Record<string, any> = {};
    fields.forEach((field) => {
      const value = source?.[field.name];
      if (field.type === "object") {
        const child = reduceFields(field.fields, value ?? {});
        if (Object.keys(child).length > 0) {
          target[field.name] = child;
        }
        return;
      }
      if (field.type === "list") {
        if (Array.isArray(value)) {
          const nextList = value
            .map((item) => reduceFields(field.fields, item ?? {}))
            .filter((item) => Object.keys(item).length > 0);
          if (nextList.length > 0) {
            target[field.name] = nextList;
          }
        }
        return;
      }
      if (value !== undefined) {
        target[field.name] = value;
      }
    });
    return target;
  };

  if (schema.sections?.length) {
    const reduced = schema.sections.reduce<Record<string, any>>(
      (acc, section) => {
        const sectionValues = reduceFields(
          section.fields,
          values as Record<string, any>
        );
        return {
          ...acc,
          ...sectionValues,
        };
      },
      {}
    );
    return appendAlwaysIncludedFields(reduced, values as Record<string, any>);
  }

  if (schema.fields?.length) {
    const reduced = reduceFields(schema.fields, values as Record<string, any>);
    return appendAlwaysIncludedFields(reduced, values as Record<string, any>);
  }

  if (values && typeof values === "object") {
    const clone = { ...(values as Record<string, any>) };
    appendAlwaysIncludedFields(clone, values as Record<string, any>);
    return clone;
  }

  return values;
}
