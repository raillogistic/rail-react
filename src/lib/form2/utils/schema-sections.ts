import type {
  ChangeRecord,
  FormBuilderProps,
  FormFieldConfig,
  FormSchema,
  FormSectionConfig,
} from "../../form/inputs/types";
import type {
  FormMetadata,
  ModelFormOrderingOptions,
  ModelFormSectionChangeHandler,
  ModelFormSectionDefinition,
  ModelFormSectionFieldDescriptor,
  ModelFormSectionsControl,
} from "../types";

export type SectionChangeHandlerEntry<TValues extends Record<string, any>> = {
  handler: ModelFormSectionChangeHandler<TValues>;
  section: FormSectionConfig;
};

export function applySectionsControl<TValues extends Record<string, any>>(
  schema: FormSchema<TValues> | null,
  control?: ModelFormSectionsControl<TValues>,
  metadata?: FormMetadata | null
): {
  schema: FormSchema<TValues> | null;
  sectionChangeHandlers: Map<string, SectionChangeHandlerEntry<TValues>>;
} {
  const sectionChangeHandlers = new Map<
    string,
    SectionChangeHandlerEntry<TValues>
  >();
  if (!schema) {
    return {
      schema,
      sectionChangeHandlers,
    };
  }
  const customSections = control?.sections ?? [];
  if (!customSections.length) {
    return {
      schema,
      sectionChangeHandlers,
    };
  }
  const baseSections = resolveBaseSections(schema);
  if (!baseSections?.length) {
    return {
      schema,
      sectionChangeHandlers,
    };
  }
  const orderedFieldNames: string[] = [];
  const fieldLookup = new Map<string, FormFieldConfig>();
  baseSections.forEach((section) => {
    section.fields.forEach((field) => {
      orderedFieldNames.push(field.name);
      if (!fieldLookup.has(field.name)) {
        fieldLookup.set(field.name, field);
      }
    });
  });
  if (!fieldLookup.size) {
    return {
      schema,
      sectionChangeHandlers,
    };
  }
  const used = new Set<string>();
  const pluckFieldByName = (name: string) => {
    const field = fieldLookup.get(name);
    if (!field || used.has(name)) return null;
    used.add(name);
    return field;
  };

  const resolveRequiredFields = () => {
    const required: FormFieldConfig[] = [];
    baseSections.forEach((section) => {
      section.fields.forEach((field) => {
        if (field.required && !used.has(field.name)) {
          used.add(field.name);
          required.push(field);
        }
      });
    });
    return required;
  };

  const resolveRemainingFields = () => {
    const remaining: FormFieldConfig[] = [];
    orderedFieldNames.forEach((name) => {
      const field = pluckFieldByName(name);
      if (field) {
        remaining.push(field);
      }
    });
    return remaining;
  };

  const resolveSectionFieldsFromDescriptors = (
    descriptors:
      | ModelFormSectionFieldDescriptor[]
      | ModelFormSectionFieldDescriptor
  ): FormFieldConfig[] => {
    const resolved: FormFieldConfig[] = [];
    const descriptorList = Array.isArray(descriptors)
      ? descriptors
      : [descriptors];
    descriptorList.forEach((descriptor) => {
      if (typeof descriptor === "string") {
        if (descriptor === "required") {
          resolved.push(...resolveRequiredFields());
          return;
        }
        if (descriptor === "all") {
          resolved.push(...resolveRemainingFields());
          return;
        }
        const field = pluckFieldByName(descriptor);
        if (field) {
          resolved.push(field);
        }
        return;
      }
      resolved.push(descriptor);
      used.add(descriptor.name);
    });
    return resolved;
  };

  const resolveSectionFields = (
    definitionFields:
      | ModelFormSectionDefinition<TValues>["fields"]
      | ModelFormSectionFieldDescriptor[]
  ): FormFieldConfig[] => {
    if (definitionFields === "required") {
      return resolveRequiredFields();
    }
    if (definitionFields === "all") {
      return resolveRemainingFields();
    }
    if (typeof definitionFields === "string") {
      return resolveSectionFieldsFromDescriptors(definitionFields);
    }
    return resolveSectionFieldsFromDescriptors(definitionFields);
  };

  const sections: FormSectionConfig[] = [];

  customSections.forEach((definition, index) => {
    const resolvedFields = resolveSectionFields(definition.fields);
    if (!resolvedFields.length) {
      return;
    }
    const normalizedFields = definition.overrideFieldsMeta
      ? applyFieldOverrides(resolvedFields, definition.overrideFieldsMeta)
      : resolvedFields;
    const orderedFields = applySectionOrderingToFields(
      normalizedFields,
      definition.ordering,
      metadata
    );
    const section: FormSectionConfig = {
      id: definition.id ?? `custom-section-${index + 1}`,
      title: definition.title,
      description: definition.description,
      columns: definition.columns,
      fields: orderedFields,
    };
    sections.push(section);
    if (definition.onChange) {
      orderedFields.forEach((field) => {
        sectionChangeHandlers.set(field.name, {
          handler:
            definition.onChange as ModelFormSectionChangeHandler<TValues>,
          section,
        });
      });
    }
  });

  if (control?.fallbackSection) {
    const fallbackDescriptors =
      control.fallbackSection.fields && control.fallbackSection.fields.length
        ? control.fallbackSection.fields
        : orderedFieldNames.filter((name) => !used.has(name));
    const fallbackFields = applySectionOrderingToFields(
      resolveSectionFields(fallbackDescriptors),
      control.fallbackSection.ordering,
      metadata
    );
    if (fallbackFields.length) {
      const fallbackIndex = sections.length;
      const normalizedFallbackFields = control.fallbackSection
        .overrideFieldsMeta
        ? applyFieldOverrides(
            fallbackFields,
            control.fallbackSection.overrideFieldsMeta
          )
        : fallbackFields;
      const section: FormSectionConfig = {
        id: control.fallbackSection.id ?? `custom-section-${fallbackIndex + 1}`,
        title: control.fallbackSection.title,
        description: control.fallbackSection.description,
        columns: control.fallbackSection.columns,
        fields: normalizedFallbackFields,
      };
      sections.push(section);
      if (control.fallbackSection.onChange) {
        normalizedFallbackFields.forEach((field) => {
          sectionChangeHandlers.set(field.name, {
            handler: control.fallbackSection
              .onChange as ModelFormSectionChangeHandler<TValues>,
            section,
          });
        });
      }
    }
  }

  if (!sections.length) {
    return {
      schema,
      sectionChangeHandlers,
    };
  }

  return {
    schema: {
      ...schema,
      sections,
      fields: undefined,
    },
    sectionChangeHandlers,
  };
}

export function invokeSectionChangeHandlers<TValues extends Record<string, any>>(
  values: TValues,
  changes: ChangeRecord[],
  form: FormBuilderProps<TValues>["form"],
  registry: Map<string, SectionChangeHandlerEntry<TValues>>
) {
  if (!changes.length || registry.size === 0) {
    return;
  }
  const groupedChanges = new Map<
    ModelFormSectionChangeHandler<TValues>,
    { section: FormSectionConfig; changes: ChangeRecord[] }
  >();
  changes.forEach((change) => {
    const entry = registry.get(change.name);
    if (!entry) {
      return;
    }
    const bucket = groupedChanges.get(entry.handler);
    if (bucket) {
      bucket.changes.push(change);
      return;
    }
    groupedChanges.set(entry.handler, {
      section: entry.section,
      changes: [change],
    });
  });
  groupedChanges.forEach(({ section, changes: sectionChanges }, handler) => {
    handler(values, sectionChanges, form, section);
  });
}

function resolveBaseSections<TValues extends Record<string, any>>(
  schema: FormSchema<TValues>
): FormSectionConfig[] | null {
  if (schema.sections?.length) {
    return schema.sections;
  }
  if (schema.fields?.length) {
    return [
      {
        id: schema.id ? `${schema.id}-generated-section` : undefined,
        fields: schema.fields,
      },
    ];
  }
  return null;
}

type SectionOverrideConfig = Partial<FormSectionConfig> & {
  overrideFieldsMeta?: Record<string, Partial<FormFieldConfig>>;
};

export function applySchemaOverrides<TValues extends Record<string, any>>(
  schema: FormSchema<TValues>,
  overrides?: Record<number, SectionOverrideConfig>
): FormSchema<TValues> {
  if (!overrides) {
    return schema;
  }

  if (schema.sections?.length) {
    let mutated = false;
    const sections = schema.sections.map((section, index) => {
      const override = overrides?.[index + 1];
      let nextSection = section;
      let overrideFieldsMeta:
        | Record<string, Partial<FormFieldConfig>>
        | undefined;
      if (override) {
        mutated = true;
        const { overrideFieldsMeta: fieldsMeta, ...sectionOverride } = override;
        overrideFieldsMeta = fieldsMeta;
        nextSection = {
          ...nextSection,
          ...sectionOverride,
        };
      }
      if (overrideFieldsMeta && nextSection.fields?.length) {
        const nextFields = applyFieldOverrides(
          nextSection.fields,
          overrideFieldsMeta
        );
        if (nextFields !== nextSection.fields) {
          mutated = true;
          nextSection = {
            ...nextSection,
            fields: nextFields,
          };
        }
      }
      return nextSection;
    });
    return mutated
      ? {
          ...schema,
          sections,
        }
      : schema;
  }

  return schema;
}

function applySectionOrderingToFields(
  fields: FormFieldConfig[],
  ordering: ModelFormOrderingOptions | undefined,
  metadata: FormMetadata | null | undefined
): FormFieldConfig[] {
  if (!ordering) return fields;
  const orderNames = resolveOrdering(ordering, fields, metadata);
  if (!orderNames?.length) {
    return fields;
  }
  const rank = new Map(orderNames.map((name, index) => [name, index]));
  return [...fields].sort((a, b) => {
    const rankA = rank.get(a.name) ?? Number.MAX_SAFE_INTEGER;
    const rankB = rank.get(b.name) ?? Number.MAX_SAFE_INTEGER;
    if (rankA === rankB) {
      return a.name.localeCompare(b.name);
    }
    return rankA - rankB;
  });
}

function resolveOrdering(
  ordering: ModelFormOrderingOptions,
  fields: FormFieldConfig[],
  metadata: FormMetadata | null | undefined
): string[] {
  const override = ordering.customFieldOrder;
  if (override) {
    return typeof override === "function" && metadata
      ? override({ metadata })
      : override;
  }
  return buildSectionOrderFromHints(fields, ordering);
}

function buildSectionOrderFromHints(
  fields: FormFieldConfig[],
  ordering: ModelFormOrderingOptions
): string[] {
  const {
    fieldOrder,
    pinnedFields,
    trailingFields,
    sortRemainingFields = "metadata",
  } = ordering;
  const availableNames = fields.map((field) => field.name);
  const order: string[] = [];
  const push = (name?: string | null) => {
    if (!name || !availableNames.includes(name) || order.includes(name)) {
      return;
    }
    order.push(name);
  };
  pinnedFields?.forEach(push);
  fieldOrder?.forEach(push);
  const remaining = availableNames.filter((name) => !order.includes(name));
  const remainingOrdered =
    sortRemainingFields === "alphabetical"
      ? [...remaining].sort((a, b) => a.localeCompare(b))
      : remaining;
  order.push(...remainingOrdered);
  trailingFields?.forEach((name) => {
    if (!name || !availableNames.includes(name)) return;
    const existingIndex = order.indexOf(name);
    if (existingIndex !== -1) {
      order.splice(existingIndex, 1);
    }
    push(name);
  });
  return order;
}

function applyFieldOverrides(
  fields: FormFieldConfig[],
  overrides: Record<string, Partial<FormFieldConfig>>
): FormFieldConfig[] {
  let mutated = false;
  const nextFields = fields.map((field) => {
    let nextField = field;
    const override = overrides[field.name];
    if (override) {
      nextField = {
        ...nextField,
        ...override,
      } as FormFieldConfig;
    }
    if (hasNestedFields(nextField) && nextField.fields?.length) {
      const nestedOverrides = Object.entries(overrides)
        .filter(([key]) => key.startsWith(`${nextField.name}.`))
        .reduce<Record<string, Partial<FormFieldConfig>>>(
          (acc, [key, value]) => {
            acc[key.replace(`${nextField.name}.`, "")] = value;
            return acc;
          },
          {}
        );
      if (Object.keys(nestedOverrides).length) {
        const nestedFields = applyFieldOverrides(
          nextField.fields,
          nestedOverrides
        );
        if (nestedFields !== nextField.fields) {
          nextField = {
            ...nextField,
            fields: nestedFields,
          } as FormFieldConfig;
        }
      }
    }
    if (nextField !== field) {
      mutated = true;
    }
    return nextField;
  });
  return mutated ? nextFields : fields;
}

function hasNestedFields(
  field: FormFieldConfig
): field is FormFieldConfig & { fields: FormFieldConfig[] } {
  return field.type === "object" || field.type === "list";
}
