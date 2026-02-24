import React from "react";
import type { FormFieldConfig, FormSchema } from "../../types";
import type { ModelFormContract } from "../../types/generatedContract";
import type { ModelFormProps } from "../../types.model";
import { getValueByPath, setValueByPath } from "../../utils/objectPath";
import {
  mergePathLists,
} from "./nestedSchema";
import {
  applySchemaControls,
  enforceContractSectionFieldOrder,
  enforceTrailingComplexFieldOrder,
  hasUserOrderOverrides,
  materializeNestedRelationFields,
} from "./schemaTransforms";
import {
  EMPTY_PATHS,
  isRecord,
} from "./modelFormUtils";

export type UseModelFormSchemaOptions<TFormValues extends Record<string, unknown>> = Pick<ModelFormProps<TFormValues>, 
  "onlyFields" | "excludeFields" | "onlyRequired" | "fieldOverrides" | "sectionOverrides" | "generatedEnabled"
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

function sanitizeValuesByFieldPaths(
  values: Record<string, unknown>,
  editableFieldPaths: string[],
): Record<string, unknown> {
  if (!editableFieldPaths.length) {
    return {};
  }

  return editableFieldPaths.reduce<Record<string, unknown>>((acc, path) => {
    const resolved = getValueByPath(values, path);
    if (resolved === undefined) {
      return acc;
    }
    return setValueByPath(acc, path, resolved);
  }, {});
}

export function useModelFormSchema<TFormValues extends Record<string, unknown>>(
  options: UseModelFormSchemaOptions<TFormValues>
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

  const editableFieldPaths = React.useMemo(
    () => collectEditableFieldPaths(controlledSchema),
    [controlledSchema],
  );

  const sanitizeValuesForControlledSchema = React.useCallback(
    (values: Record<string, unknown>) =>
      sanitizeValuesByFieldPaths(values, editableFieldPaths),
    [editableFieldPaths],
  );

  const finalSchema = React.useMemo(() => {
    if (!isRecord(controlledSchema.initialValues)) {
      return controlledSchema;
    }

    return {
      ...controlledSchema,
      initialValues: sanitizeValuesForControlledSchema(
        controlledSchema.initialValues as Record<string, unknown>,
      ) as Partial<TFormValues>,
    };
  }, [controlledSchema, sanitizeValuesForControlledSchema]);

  return {
    finalSchema,
    editableFieldPaths,
    sanitizeValuesForControlledSchema,
  };
}
