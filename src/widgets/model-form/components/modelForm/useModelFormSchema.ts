import React from "react";
import type { FormFieldConfig, FormSchema } from "../../types";
import type { ModelFormContract } from "../../types/generatedContract";
import type { ModelFormProps } from "../../types.model";
import { getValueByPath, setValueByPath } from "../../utils/objectPath";
import { mergePathLists } from "./nestedSchema";
import {
  applySchemaControls,
  enforceContractSectionFieldOrder,
  enforceTrailingComplexFieldOrder,
  hasUserOrderOverrides,
  materializeNestedRelationFields,
} from "./schemaTransforms";
import { EMPTY_PATHS, isRecord } from "./modelFormUtils";

const NESTED_IDENTITY_KEYS = ["id", "pk", "objectId", "object_id"] as const;

export type UseModelFormSchemaOptions<
  TFormValues extends Record<string, unknown>,
> = Pick<
  ModelFormProps<TFormValues>,
  | "onlyFields"
  | "excludeFields"
  | "onlyRequired"
  | "fieldOverrides"
  | "sectionOverrides"
  | "generatedEnabled"
> & {
  contract: ModelFormContract | null;
  generatedSchema: FormSchema<Record<string, unknown>>;
  relatedContractsByModel: Map<string, ModelFormContract>;
  nestedControls: any;
  resolvedOnlyRelationships: string[];
  resolvedExcludeRelationships: string[];
};

function collectEditableFieldPaths(schema: FormSchema<any>): string[] {
  const sections = schema.sections?.length
    ? schema.sections
    : schema.fields
      ? [{ fields: schema.fields }]
      : [];
  const paths = new Set<string>();

  sections.forEach((section) => {
    section.fields.forEach((field) => {
      const name = String((field as FormFieldConfig).name ?? "").trim();
      if (!name || field.readOnly) {
        return;
      }
      paths.add(name);
    });
  });

  return Array.from(paths);
}

function stripNonEditableField(field: FormFieldConfig): FormFieldConfig | null {
  const name = String(field.name ?? "").trim();
  if (!name || field.readOnly) {
    return null;
  }

  if (
    field.type === "object" ||
    field.type === "list" ||
    field.type === "group"
  ) {
    const nestedFields = (field as { fields?: FormFieldConfig[] }).fields ?? [];
    const nextNestedFields = nestedFields
      .map((nestedField) => stripNonEditableField(nestedField))
      .filter((nestedField): nestedField is FormFieldConfig =>
        Boolean(nestedField),
      );
    if (!nextNestedFields.length) {
      return null;
    }
    return {
      ...field,
      fields: nextNestedFields,
    } as FormFieldConfig;
  }

  return field;
}

function stripNonEditableFields<TValues extends Record<string, unknown>>(
  schema: FormSchema<TValues>,
): FormSchema<TValues> {
  const nextSections = (schema.sections ?? [])
    .map((section) => ({
      ...section,
      fields: section.fields
        .map((field) => stripNonEditableField(field))
        .filter((field): field is FormFieldConfig => Boolean(field)),
    }))
    .filter((section) => section.fields.length > 0);

  const nextFields = (schema.fields ?? [])
    .map((field) => stripNonEditableField(field))
    .filter((field): field is FormFieldConfig => Boolean(field));

  return {
    ...schema,
    sections: schema.sections ? nextSections : undefined,
    fields: schema.fields ? nextFields : undefined,
  };
}

function preserveNestedIdentityValues(
  values: Record<string, unknown>,
  target: Record<string, unknown>,
): Record<string, unknown> {
  const nextTarget = { ...target };
  for (const key of NESTED_IDENTITY_KEYS) {
    const candidate = values[key];
    if (candidate !== undefined) {
      nextTarget[key] = candidate;
    }
  }
  return nextTarget;
}

function sanitizeRecordByFieldConfigs(
  values: Record<string, unknown>,
  fields: FormFieldConfig[],
  options?: { preserveIdentityKeys?: boolean },
): Record<string, unknown> {
  const sanitized = fields.reduce<Record<string, unknown>>((acc, field) => {
    const path = String(field.name ?? "").trim();
    if (!path || field.readOnly) return acc;
    const resolved = getValueByPath(values, path);
    const nextValue = sanitizeFieldValueByConfig(resolved, field);
    if (nextValue === undefined) return acc;
    return setValueByPath(acc, path, nextValue);
  }, {});

  if (options?.preserveIdentityKeys) {
    return preserveNestedIdentityValues(values, sanitized);
  }

  return sanitized;
}

function sanitizeFieldValueByConfig(
  value: unknown,
  field: FormFieldConfig,
): unknown {
  if (value === undefined || field.readOnly) {
    return undefined;
  }

  if (field.type === "object" || field.type === "group") {
    if (value === null) return null;
    if (!isRecord(value)) return undefined;
    const nestedFields = (field as { fields?: FormFieldConfig[] }).fields ?? [];
    return sanitizeRecordByFieldConfigs(
      value as Record<string, unknown>,
      nestedFields,
      { preserveIdentityKeys: true },
    );
  }

  if (field.type === "list") {
    if (value === null) return null;
    if (!Array.isArray(value)) return undefined;
    const nestedFields = (field as { fields?: FormFieldConfig[] }).fields ?? [];
    return value.map((item) => {
      if (item === undefined || item === null) return item;
      if (!isRecord(item)) return item;
      return sanitizeRecordByFieldConfigs(
        item as Record<string, unknown>,
        nestedFields,
        { preserveIdentityKeys: true },
      );
    });
  }

  return value;
}

function sanitizeValuesBySchema(
  values: Record<string, unknown>,
  schema: FormSchema<any>,
): Record<string, unknown> {
  const sections = schema.sections?.length
    ? schema.sections
    : schema.fields
      ? [{ fields: schema.fields }]
      : [];
  const rootFields = sections.flatMap((section) => section.fields);
  if (!rootFields.length) {
    return {};
  }

  return sanitizeRecordByFieldConfigs(values, rootFields);
}

export function useModelFormSchema<TFormValues extends Record<string, unknown>>(
  options: UseModelFormSchemaOptions<TFormValues>,
) {
  const {
    onlyFields,
    excludeFields,
    onlyRequired,
    fieldOverrides,
    sectionOverrides,
    generatedEnabled,
    contract,
    generatedSchema,
    relatedContractsByModel,
    nestedControls,
    resolvedOnlyRelationships,
    resolvedExcludeRelationships,
  } = options;

  const resolvedOnlyFieldsInput = onlyFields ?? EMPTY_PATHS;
  const resolvedExcludeFieldsInput = excludeFields ?? EMPTY_PATHS;

  const resolvedOnlyFields = React.useMemo(
    () => mergePathLists(resolvedOnlyFieldsInput),
    [resolvedOnlyFieldsInput],
  );
  const resolvedExcludeFields = React.useMemo(
    () => mergePathLists(resolvedExcludeFieldsInput),
    [resolvedExcludeFieldsInput],
  );

  const schemaWithNestedRelations = React.useMemo(() => {
    return materializeNestedRelationFields(
      generatedSchema as FormSchema<TFormValues>,
      {
        contract,
        nestedControls,
        relatedContractsByModel,
      },
    );
  }, [generatedSchema, contract, nestedControls, relatedContractsByModel]);

  const controlledSchema = React.useMemo(() => {
    const controlled = applySchemaControls(schemaWithNestedRelations, {
      onlyFields: resolvedOnlyFields,
      excludeFields: resolvedExcludeFields,
      onlyRequired,
      onlyRelationships: resolvedOnlyRelationships,
      excludeRelationships: resolvedExcludeRelationships,
      fieldOverrides,
      sectionOverrides,
      nestedControls: nestedControls ?? null,
      enforceListFieldsAtEnd: true,
    });

    const shouldEnforceContractOrder =
      Boolean(generatedEnabled && contract) &&
      !hasUserOrderOverrides(fieldOverrides);

    if (!shouldEnforceContractOrder || !contract) {
      return controlled;
    }

    return enforceTrailingComplexFieldOrder(
      enforceContractSectionFieldOrder(controlled, contract),
    );
  }, [
    schemaWithNestedRelations,
    resolvedOnlyFields,
    resolvedExcludeFields,
    onlyRequired,
    resolvedOnlyRelationships,
    resolvedExcludeRelationships,
    fieldOverrides,
    sectionOverrides,
    nestedControls,
    generatedEnabled,
    contract,
  ]);

  const editableSchema = React.useMemo(
    () => stripNonEditableFields(controlledSchema),
    [controlledSchema],
  );

  const editableFieldPaths = React.useMemo(
    () => collectEditableFieldPaths(editableSchema),
    [editableSchema],
  );

  const sanitizeValuesForControlledSchema = React.useCallback(
    (values: Record<string, unknown>) =>
      sanitizeValuesBySchema(values, editableSchema),
    [editableSchema],
  );

  const finalSchema = React.useMemo(() => {
    if (!isRecord(editableSchema.initialValues)) {
      return editableSchema;
    }

    return {
      ...editableSchema,
      initialValues: sanitizeValuesForControlledSchema(
        editableSchema.initialValues as Record<string, unknown>,
      ) as Partial<TFormValues>,
    };
  }, [editableSchema, sanitizeValuesForControlledSchema]);

  return {
    finalSchema,
    editableFieldPaths,
    sanitizeValuesForControlledSchema,
  };
}
