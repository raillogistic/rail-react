import React from "react";
import { gql, useApolloClient, useQuery } from "@apollo/client";

import {
  MODEL_FORM_CONTRACT_QUERY,
  MODEL_FORM_INITIAL_DATA_QUERY,
} from "@/graphql/modelFormContract";
import { cn } from "@/lib/utils";

import DynamicForm from "../inputs/form";
import { useGeneratedModelForm } from "../hooks/useGeneratedModelForm";
import { useGeneratedValidators } from "../hooks/useGeneratedValidators";
import { buildGeneratedMutationDocument } from "../mutations";
import type {
  FormBehaviorConfig,
  FormFieldConfig,
  FormSchema,
  FormSectionConfig,
} from "../types";
import type {
  ModelFormContract,
  ModelFormInitialData,
  ModelFormMutationOutcome,
  ModelFormMode,
  ModelFormRuntimeOverride,
} from "../types/generatedContract";
import type {
  ModelFormFieldOverrideValue,
  ModelFormNestedConfig,
  ModelFormNestedDefinition,
  ModelFormProps,
  ModelFormSectionOverrideValue,
} from "../types.model";
import {
  applyErrorsToFormFields,
  normalizeGeneratedErrorsForForm,
} from "../utils/errors";
import { serializeRuntimeOverridesForQuery } from "../utils/jsonCoercion";

type ContractQueryData = {
  modelFormContract: ModelFormContract | null;
};

type ContractQueryVariables = {
  appLabel: string;
  modelName: string;
  mode: ModelFormMode;
  includeNested: boolean;
};

type InitialDataQueryData = {
  modelFormInitialData: ModelFormInitialData | null;
};

type InitialDataQueryVariables = {
  appLabel: string;
  modelName: string;
  objectId: string;
  includeNested: boolean;
  runtimeOverrides?: Array<Record<string, unknown>>;
};

type GeneratedMutationPayload = {
  ok?: boolean;
  errors?: unknown;
  conflict?: boolean;
  formErrorKey?: string;
};

type NestedControlMap<TValues extends Record<string, unknown>> = Record<
  string,
  ModelFormNestedDefinition<TValues>
>;

const EMPTY_RUNTIME_OVERRIDES: ModelFormRuntimeOverride[] = [];
const EMPTY_PATHS: string[] = [];

function normalizeMode(mode?: string | null): ModelFormMode {
  const normalized = String(mode ?? "CREATE").toUpperCase();
  if (normalized === "UPDATE" || normalized === "VIEW") {
    return normalized;
  }
  return "CREATE";
}

function isModelFormModeWithInitialData(mode: ModelFormMode): boolean {
  return mode === "UPDATE" || mode === "VIEW";
}

function toError(value: unknown): Error {
  if (value instanceof Error) return value;
  return new Error(String(value ?? "Unknown ModelForm error."));
}

function normalizeNestedControls<TValues extends Record<string, unknown>>(
  nested?: ModelFormNestedConfig<TValues>,
): NestedControlMap<TValues> | null {
  if (!nested) return null;
  if (Array.isArray(nested)) {
    if (nested.length === 0) return null;
    return nested.reduce<NestedControlMap<TValues>>((acc, relationPath) => {
      if (!relationPath) return acc;
      acc[relationPath] = { enabled: true };
      return acc;
    }, {});
  }

  const controls: NestedControlMap<TValues> = {};
  for (const [relationPath, definition] of Object.entries(nested)) {
    if (!relationPath) continue;
    controls[relationPath] = definition ?? { enabled: true };
  }
  return Object.keys(controls).length > 0 ? controls : null;
}

function mergePathLists(...lists: Array<string[] | undefined>): string[] {
  const merged = new Set<string>();
  for (const list of lists) {
    if (!Array.isArray(list)) continue;
    for (const value of list) {
      if (!value) continue;
      const normalized = String(value).trim();
      if (!normalized) continue;
      merged.add(normalized);
    }
  }
  return Array.from(merged);
}

function inferRelationPath(path: string): string | null {
  const index = path.lastIndexOf(".");
  if (index <= 0) return null;
  return path.slice(0, index);
}

function isFieldSelectorMatch(
  selector: string,
  fullPath: string,
  relationPath: string | null,
): boolean {
  if (selector === fullPath) return true;
  if (!relationPath) return false;

  // For nested fields, we allow matching the field name alone if we are in
  // the context of that relation (relative matching).
  const relationPrefix = `${relationPath}.`;
  if (!fullPath.startsWith(relationPrefix)) return false;
  const relativePath = fullPath.slice(relationPrefix.length);
  return selector === relativePath;
}

function matchFieldSelectors(
  selectors: string[] | undefined,
  fullPath: string,
  relationPath: string | null,
): boolean {
  if (!selectors || selectors.length === 0) return true;
  return selectors.some((selector) =>
    isFieldSelectorMatch(selector, fullPath, relationPath),
  );
}

function resolveFieldOverride(
  overrides: Record<string, ModelFormFieldOverrideValue> | undefined,
  fullPath: string,
  relationPath: string | null,
): ModelFormFieldOverrideValue | undefined {
  if (!overrides) return undefined;
  if (fullPath in overrides) return overrides[fullPath];
  if (!relationPath) return undefined;
  const relationPrefix = `${relationPath}.`;
  if (!fullPath.startsWith(relationPrefix)) return undefined;
  const relativePath = fullPath.slice(relationPrefix.length);
  return overrides[relativePath];
}

function resolveSectionOverride<TValues extends Record<string, unknown>>(
  overrides: Record<string, ModelFormSectionOverrideValue<TValues>> | undefined,
  sectionId: string | undefined,
): ModelFormSectionOverrideValue<TValues> | undefined {
  if (!sectionId || !overrides) return undefined;
  return overrides[sectionId];
}

function applyFieldOverride(
  field: FormFieldConfig,
  override: ModelFormFieldOverrideValue | undefined,
): FormFieldConfig | null {
  if (!override) return field;

  if (typeof override === "function") {
    const output = override(field);
    if (output == null) return null;
    if ("name" in output && "type" in output) {
      return output as FormFieldConfig;
    }
    return { ...field, ...output } as FormFieldConfig;
  }

  return { ...field, ...override } as FormFieldConfig;
}

function applySectionOverride<TValues extends Record<string, unknown>>(
  section: FormSectionConfig<TValues>,
  override: ModelFormSectionOverrideValue<TValues> | undefined,
): FormSectionConfig<TValues> | null {
  if (!override) return section;

  if (typeof override === "function") {
    const output = override(section);
    if (output == null) return null;
    if ("fields" in output) {
      return output as FormSectionConfig<TValues>;
    }
    return { ...section, ...output };
  }

  return { ...section, ...override };
}

function applySchemaControls<TValues extends Record<string, unknown>>(
  schema: FormSchema<TValues>,
  options: {
    onlyFields?: string[];
    excludeFields?: string[];
    onlyRelationships?: string[];
    excludeRelationships?: string[];
    fieldOverrides?: Record<string, ModelFormFieldOverrideValue>;
    sectionOverrides?: Record<string, ModelFormSectionOverrideValue<TValues>>;
    nestedControls: NestedControlMap<TValues> | null;
  },
): FormSchema<TValues> {
  const sections = schema.sections ?? [];
  if (sections.length === 0) return schema;
  const includedRelations = options.onlyRelationships?.length
    ? new Set(options.onlyRelationships)
    : null;
  const excludedRelations = options.excludeRelationships?.length
    ? new Set(options.excludeRelationships)
    : null;

  const nextSections = sections
    .map((section) => {
      const filteredFields = section.fields
        .map((field) => {
          const relationPath = inferRelationPath(field.name);

          if (
            options.onlyFields?.length &&
            !matchFieldSelectors(options.onlyFields, field.name, relationPath)
          ) {
            return null;
          }

          if (
            options.excludeFields?.length &&
            options.excludeFields.some((path) =>
              isFieldSelectorMatch(path, field.name, relationPath),
            )
          ) {
            return null;
          }

          if (
            relationPath &&
            includedRelations &&
            !includedRelations.has(relationPath)
          ) {
            return null;
          }

          if (relationPath && excludedRelations?.has(relationPath)) {
            return null;
          }

          let currentField = field;

          if (relationPath && options.nestedControls) {
            const nestedControl = options.nestedControls[relationPath];
            if (!nestedControl || nestedControl.enabled === false) {
              return null;
            }

            if (
              section.id &&
              nestedControl.includeSections?.length &&
              !nestedControl.includeSections.includes(section.id)
            ) {
              return null;
            }

            if (
              section.id &&
              nestedControl.excludeSections?.includes(section.id)
            ) {
              return null;
            }

            const includeNestedSelectors =
              nestedControl.onlyFields ?? nestedControl.fields;
            if (
              includeNestedSelectors?.length &&
              !matchFieldSelectors(
                includeNestedSelectors,
                field.name,
                relationPath,
              )
            ) {
              return null;
            }

            if (
              nestedControl.excludeFields?.length &&
              nestedControl.excludeFields.some((selector) =>
                isFieldSelectorMatch(selector, field.name, relationPath),
              )
            ) {
              return null;
            }

            currentField =
              applyFieldOverride(
                currentField,
                resolveFieldOverride(
                  nestedControl.fieldOverrides,
                  field.name,
                  relationPath,
                ),
              ) ?? currentField;
          }

          return applyFieldOverride(
            currentField,
            resolveFieldOverride(
              options.fieldOverrides,
              field.name,
              relationPath,
            ),
          );
        })
        .filter(Boolean) as FormFieldConfig[];

      if (filteredFields.length === 0) return null;

      let nextSection: FormSectionConfig<TValues> = {
        ...section,
        fields: filteredFields,
      };

      const relationPaths = new Set(
        filteredFields
          .map((item) => inferRelationPath(item.name))
          .filter(Boolean) as string[],
      );

      if (options.nestedControls && section.id) {
        for (const relationPath of relationPaths) {
          const nestedControl = options.nestedControls[relationPath];
          if (!nestedControl) continue;

          const nestedSectionOverride = resolveSectionOverride(
            nestedControl.sectionOverrides,
            section.id,
          );
          const overridden = applySectionOverride(
            nextSection,
            nestedSectionOverride,
          );
          if (!overridden) return null;
          nextSection = overridden;
        }
      }

      const globalSectionOverride = resolveSectionOverride(
        options.sectionOverrides,
        section.id,
      );
      const globallyOverridden = applySectionOverride(
        nextSection,
        globalSectionOverride,
      );
      if (!globallyOverridden) return null;

      return globallyOverridden.fields.length > 0 ? globallyOverridden : null;
    })
    .filter(Boolean) as FormSectionConfig<TValues>[];

  return {
    ...schema,
    sections: nextSections,
  };
}

function mergeValidationErrors(
  baseErrors: Record<string, string> | undefined,
  customErrors: Record<string, string> | undefined,
): Record<string, string> | undefined {
  const merged = {
    ...(baseErrors ?? {}),
    ...(customErrors ?? {}),
  };
  return Object.keys(merged).length > 0 ? merged : undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function deepMergeRecords(
  ...sources: Array<Record<string, unknown> | undefined>
): Record<string, unknown> | undefined {
  let hasSource = false;
  const result: Record<string, unknown> = {};

  for (const source of sources) {
    if (!source) continue;
    hasSource = true;

    for (const [key, sourceValue] of Object.entries(source)) {
      const existingValue = result[key];

      if (Array.isArray(sourceValue)) {
        result[key] = [...sourceValue];
        continue;
      }

      if (isRecord(sourceValue)) {
        if (isRecord(existingValue)) {
          result[key] =
            deepMergeRecords(existingValue, sourceValue) ?? sourceValue;
          continue;
        }
        result[key] = deepMergeRecords(sourceValue) ?? sourceValue;
        continue;
      }

      result[key] = sourceValue;
    }
  }

  return hasSource ? result : undefined;
}

function sortSerializableValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => sortSerializableValue(item));
  }

  if (!isRecord(value)) {
    return value;
  }

  const sorted: Record<string, unknown> = {};
  for (const key of Object.keys(value).sort()) {
    sorted[key] = sortSerializableValue(value[key]);
  }
  return sorted;
}

function hashString(value: string): string {
  let hash = 5381;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 33) ^ value.charCodeAt(index);
  }
  return (hash >>> 0).toString(36);
}

function stableHashOfValue(value: unknown): string {
  try {
    const serialized = JSON.stringify(sortSerializableValue(value));
    return hashString(serialized);
  } catch {
    return "0";
  }
}

function getMutationPayload(
  operationName: string,
  data: Record<string, unknown> | null | undefined,
): GeneratedMutationPayload {
  if (!data || typeof data !== "object") {
    return {};
  }
  const response = data.response;
  if (response && typeof response === "object") {
    return response as GeneratedMutationPayload;
  }
  const byOperationName = data[operationName];
  if (byOperationName && typeof byOperationName === "object") {
    return byOperationName as GeneratedMutationPayload;
  }
  return {};
}

function toActionSubmitOutcome(outcome: ModelFormMutationOutcome | null) {
  if (!outcome) return null;
  return {
    ok: Boolean(outcome.ok),
    conflict: Boolean(outcome.conflict),
    errorCount: Array.isArray(outcome.errors) ? outcome.errors.length : 0,
  };
}

export function ModelForm<
  TFormValues extends Record<string, unknown> = Record<string, unknown>,
>(props: ModelFormProps<TFormValues>) {
  const apolloClient = useApolloClient();

  const {
    app,
    model,
    appName,
    modelName,
    mode,
    mutationMode,
    objectId,
    mutationId,
    includeNested,
    nested,
    nestedFields,
    generatedEnabled = true,
    runtimeOverrides,
    onlyFields,
    excludeFields,
    only,
    exclude,
    onlyRelationships,
    excludeRelationships,
    fieldOverrides,
    sectionOverrides,
    validatorExtensions,
    legacySchema,
    formProps,
    onSubmit,
    onChange,
    validate,
    defaultValues,
    readOnly,
    disabled,
    isLoading: externalLoading,
    onFormReady,
    showSectionHeaders,
    inPopup,
    state,
    behavior,
    layout,
    actions,
    devtools,
    title,
    description,
    showHeading = true,
    containerClassName,
    contentClassName,
    loadingFallback,
    emptySchemaFallback,
    errorFallback,
    requireObjectIdForUpdate = true,
    onContractLoaded,
    onInitialDataLoaded,
    onLoadError,
  } = props;

  const resolvedApp = app ?? appName ?? "";
  const resolvedModel = model ?? modelName ?? "";
  const resolvedMode = normalizeMode(mode ?? mutationMode ?? undefined);
  const resolvedObjectId = objectId ?? mutationId;
  const resolvedObjectIdValue = resolvedObjectId?.toString();
  const resolvedNested = nested ?? nestedFields;
  const resolvedRuntimeOverrides = runtimeOverrides ?? EMPTY_RUNTIME_OVERRIDES;
  const runtimeOverridesForQuery = React.useMemo(
    () => serializeRuntimeOverridesForQuery(resolvedRuntimeOverrides),
    [resolvedRuntimeOverrides],
  );
  const resolvedOnlyFieldsInput = onlyFields ?? EMPTY_PATHS;
  const resolvedExcludeFieldsInput = excludeFields ?? EMPTY_PATHS;
  const resolvedOnlyRelationshipsInput = onlyRelationships ?? EMPTY_PATHS;
  const resolvedExcludeRelationshipsInput = excludeRelationships ?? EMPTY_PATHS;
  const resolvedOnlyFields = React.useMemo(
    () => mergePathLists(resolvedOnlyFieldsInput, only),
    [resolvedOnlyFieldsInput, only],
  );
  const resolvedExcludeFields = React.useMemo(
    () => mergePathLists(resolvedExcludeFieldsInput, exclude),
    [resolvedExcludeFieldsInput, exclude],
  );
  const resolvedOnlyRelationships = React.useMemo(
    () => mergePathLists(resolvedOnlyRelationshipsInput),
    [resolvedOnlyRelationshipsInput],
  );
  const resolvedExcludeRelationships = React.useMemo(
    () => mergePathLists(resolvedExcludeRelationshipsInput),
    [resolvedExcludeRelationshipsInput],
  );

  const nestedControls = React.useMemo(
    () => normalizeNestedControls(resolvedNested),
    [resolvedNested],
  );

  const resolvedStateInput = React.useMemo(() => {
    const merged = {
      ...(formProps?.state ?? {}),
      ...(state ?? {}),
      ...(defaultValues !== undefined ? { defaultValues } : {}),
      ...(readOnly !== undefined ? { readOnly } : {}),
      ...(disabled !== undefined ? { disabled } : {}),
      ...(externalLoading !== undefined ? { isLoading: externalLoading } : {}),
      ...(onFormReady ? { onReady: onFormReady } : {}),
    };
    return Object.keys(merged).length > 0 ? merged : undefined;
  }, [
    formProps?.state,
    state,
    defaultValues,
    readOnly,
    disabled,
    externalLoading,
    onFormReady,
  ]);
  const resolvedBehaviorInput = React.useMemo(() => {
    const merged = {
      ...(formProps?.behavior ?? {}),
      ...(behavior ?? {}),
      ...(onSubmit ? { onSubmit } : {}),
      ...(onChange ? { onChange } : {}),
      ...(validate ? { validate } : {}),
    };
    return Object.keys(merged).length > 0 ? merged : undefined;
  }, [formProps?.behavior, behavior, onSubmit, onChange, validate]);

  const resolvedLayoutInput = React.useMemo(() => {
    const merged = {
      ...(formProps?.layout ?? {}),
      ...(layout ?? {}),
      ...(showSectionHeaders !== undefined ? { showSectionHeaders } : {}),
    };

    if (inPopup && (merged as { variant?: string }).variant === undefined) {
      (merged as { variant?: string }).variant = "popup";
    }

    return Object.keys(merged).length > 0 ? merged : undefined;
  }, [formProps?.layout, layout, showSectionHeaders, inPopup]);

  const resolvedActionsInput = React.useMemo(() => {
    const merged = {
      ...(formProps?.actions ?? {}),
      ...(actions ?? {}),
    };
    return Object.keys(merged).length > 0 ? merged : undefined;
  }, [formProps?.actions, actions]);

  const resolvedDevtoolsInput = React.useMemo(() => {
    const merged = {
      ...(formProps?.devtools ?? {}),
      ...(devtools ?? {}),
    };
    return Object.keys(merged).length > 0 ? merged : undefined;
  }, [formProps?.devtools, devtools]);

  const shouldIncludeNested =
    includeNested ??
    Boolean(
      nestedControls ||
      resolvedOnlyRelationships.length > 0 ||
      resolvedExcludeRelationships.length > 0,
    );
  const updateRequiresObjectId =
    resolvedMode === "UPDATE" &&
    requireObjectIdForUpdate &&
    !resolvedObjectIdValue;
  const shouldFetchInitialData =
    generatedEnabled &&
    isModelFormModeWithInitialData(resolvedMode) &&
    Boolean(resolvedObjectIdValue);

  const contractQuery = useQuery<ContractQueryData, ContractQueryVariables>(
    MODEL_FORM_CONTRACT_QUERY,
    {
      variables: {
        appLabel: resolvedApp,
        modelName: resolvedModel,
        mode: resolvedMode,
        includeNested: shouldIncludeNested,
      },
      skip: !generatedEnabled || !resolvedApp || !resolvedModel,
      fetchPolicy: "cache-and-network",
    },
  );

  const initialDataQuery = useQuery<
    InitialDataQueryData,
    InitialDataQueryVariables
  >(MODEL_FORM_INITIAL_DATA_QUERY, {
    variables: {
      appLabel: resolvedApp,
      modelName: resolvedModel,
      objectId: resolvedObjectIdValue ?? "",
      includeNested: shouldIncludeNested,
      runtimeOverrides: runtimeOverridesForQuery,
    },
    skip: !shouldFetchInitialData,
    fetchPolicy: "network-only",
  });

  const contract = contractQuery.data?.modelFormContract ?? null;
  const initialData = shouldFetchInitialData
    ? (initialDataQuery.data?.modelFormInitialData ?? null)
    : null;

  React.useEffect(() => {
    if (!contract || !onContractLoaded) return;
    onContractLoaded(contract);
  }, [contract, onContractLoaded]);

  React.useEffect(() => {
    if (!initialData || typeof onInitialDataLoaded !== "function") return;
    onInitialDataLoaded(initialData);
  }, [initialData, onInitialDataLoaded]);

  React.useEffect(() => {
    if (!contractQuery.error || !onLoadError) return;
    onLoadError(toError(contractQuery.error), "contract");
  }, [contractQuery.error, onLoadError]);

  React.useEffect(() => {
    if (!initialDataQuery.error || !onLoadError) return;
    onLoadError(toError(initialDataQuery.error), "initialData");
  }, [initialDataQuery.error, onLoadError]);

  const executeGeneratedMutation = React.useCallback(
    async (
      operationName: string,
      variables: Record<string, unknown>,
      envelope: { identifier?: { key: string; value: string | number } | null },
    ) => {
      const mutationMode = envelope.identifier ? "update" : "create";
      const rawIdentifierName = envelope.identifier?.key;
      const identifierName =
        rawIdentifierName === "objectId" ? "id" : rawIdentifierName;

      const graphqlVariables =
        rawIdentifierName &&
        identifierName &&
        rawIdentifierName !== identifierName &&
        Object.prototype.hasOwnProperty.call(variables, rawIdentifierName)
          ? {
              ...variables,
              [identifierName]: variables[rawIdentifierName],
            }
          : variables;

      if (
        rawIdentifierName &&
        identifierName &&
        rawIdentifierName !== identifierName
      ) {
        delete (graphqlVariables as Record<string, unknown>)[rawIdentifierName];
      }

      const mutation = gql(
        buildGeneratedMutationDocument(
          mutationMode,
          operationName,
          resolvedModel,
          "id",
          identifierName
            ? {
                identifierVariableName: identifierName,
                identifierArgumentName: identifierName,
              }
            : {},
        ),
      );

      const result = await apolloClient.mutate({
        mutation,
        variables: graphqlVariables,
      });

      return getMutationPayload(
        operationName,
        result.data as Record<string, unknown> | null | undefined,
      );
    },
    [apolloClient, resolvedModel],
  );

  const generated = useGeneratedModelForm({
    contract,
    initialData,
    runtimeOverrides: resolvedRuntimeOverrides,
    generatedEnabled,
    legacySchema: legacySchema as
      | FormSchema<Record<string, unknown>>
      | undefined,
    submitMode: resolvedMode,
    objectId: resolvedObjectIdValue,
    executeMutation: executeGeneratedMutation,
  });

  const { formValidator } = useGeneratedValidators(
    contract,
    validatorExtensions,
  );

  const controlledSchema = React.useMemo(() => {
    return applySchemaControls(generated.schema as FormSchema<TFormValues>, {
      onlyFields: resolvedOnlyFields,
      excludeFields: resolvedExcludeFields,
      onlyRelationships: resolvedOnlyRelationships,
      excludeRelationships: resolvedExcludeRelationships,
      fieldOverrides,
      sectionOverrides,
      nestedControls,
    });
  }, [
    generated.schema,
    resolvedOnlyFields,
    resolvedExcludeFields,
    resolvedOnlyRelationships,
    resolvedExcludeRelationships,
    fieldOverrides,
    sectionOverrides,
    nestedControls,
  ]);

  const mergedBehavior = React.useMemo<
    FormBehaviorConfig<TFormValues> | undefined
  >(() => {
    const userValidate = resolvedBehaviorInput?.validate;
    const userSubmit = resolvedBehaviorInput?.onSubmit;
    const shouldUseGeneratedValidation = Boolean(generatedEnabled && contract);
    const generatedValidate = shouldUseGeneratedValidation
      ? formValidator
      : undefined;
    const shouldUseGeneratedSubmit = Boolean(
      generatedEnabled &&
      contract &&
      resolvedMode !== "VIEW" &&
      !userSubmit &&
      generated.canSubmit,
    );

    if (
      !resolvedBehaviorInput &&
      !generatedValidate &&
      !shouldUseGeneratedSubmit
    ) {
      return undefined;
    }

    const validate = (values: TFormValues) => {
      const generatedErrors = generatedValidate
        ? generatedValidate(values as Record<string, unknown>)
        : undefined;
      const customErrors = userValidate ? userValidate(values) : undefined;
      return mergeValidationErrors(generatedErrors, customErrors);
    };

    const onSubmit = shouldUseGeneratedSubmit
      ? async (
          values: TFormValues,
          ctx: Parameters<
            NonNullable<FormBehaviorConfig<TFormValues>["onSubmit"]>
          >[1],
        ) => {
          const outcome = await generated.submit(
            values as Record<string, unknown>,
          );
          if (outcome.errors.length) {
            applyErrorsToFormFields(
              normalizeGeneratedErrorsForForm(outcome.errors, {
                formErrorKey: outcome.formErrorKey,
              }),
              ctx.form as any,
            );
          }
        }
      : userSubmit;

    return {
      ...(resolvedBehaviorInput ?? {}),
      validate,
      ...(onSubmit ? { onSubmit } : {}),
    };
  }, [
    resolvedBehaviorInput,
    generatedEnabled,
    contract,
    formValidator,
    generated.canSubmit,
    generated.submit,
    resolvedMode,
  ]);

  const mergedState = React.useMemo(() => {
    const submitAwareState = {
      ...(resolvedStateInput ?? {}),
      isSubmitting: Boolean(
        resolvedStateInput?.isSubmitting || generated.submitState.isSubmitting,
      ),
    };
    if (resolvedMode !== "VIEW") return submitAwareState;
    return {
      ...submitAwareState,
      readOnly: submitAwareState.readOnly ?? true,
    };
  }, [resolvedMode, resolvedStateInput, generated.submitState.isSubmitting]);

  const mergedActions = React.useMemo(() => {
    const submitAwareActions = {
      ...(resolvedActionsInput ?? {}),
      isSubmitting: Boolean(
        resolvedActionsInput?.isSubmitting ||
        generated.submitState.isSubmitting,
      ),
      submitOutcome: toActionSubmitOutcome(generated.submitState.outcome),
    };
    if (resolvedMode !== "VIEW") return submitAwareActions;
    return {
      ...submitAwareActions,
      hidden: submitAwareActions.hidden ?? true,
    };
  }, [
    resolvedActionsInput,
    resolvedMode,
    generated.submitState.isSubmitting,
    generated.submitState.outcome,
  ]);

  const hydratedDefaultValues = React.useMemo<
    Partial<TFormValues> | undefined
  >(() => {
    if (!shouldFetchInitialData || initialDataQuery.loading) {
      return undefined;
    }
    if (!isRecord(generated.initialValues)) {
      return {} as Partial<TFormValues>;
    }
    return generated.initialValues as Partial<TFormValues>;
  }, [
    shouldFetchInitialData,
    initialDataQuery.loading,
    generated.initialValues,
  ]);

  const finalState = React.useMemo(() => {
    const baseState = { ...(mergedState ?? {}) };
    const stateDefaultValues = isRecord(baseState.defaultValues)
      ? (baseState.defaultValues as Record<string, unknown>)
      : undefined;
    const hydratedValues = isRecord(hydratedDefaultValues)
      ? (hydratedDefaultValues as Record<string, unknown>)
      : undefined;

    const mergedDefaultValues = deepMergeRecords(
      stateDefaultValues,
      hydratedValues,
    );

    if (mergedDefaultValues) {
      baseState.defaultValues = mergedDefaultValues as Partial<TFormValues>;
    }

    if (shouldFetchInitialData && hydratedDefaultValues !== undefined) {
      baseState.disableAutoReset = true;
    }

    return Object.keys(baseState).length > 0 ? baseState : undefined;
  }, [mergedState, hydratedDefaultValues, shouldFetchInitialData]);

  const dynamicFormKey = React.useMemo(() => {
    const baseKey = `${resolvedApp}:${resolvedModel}:${resolvedMode}:${
      resolvedObjectIdValue ?? "new"
    }`;

    if (!shouldFetchInitialData) {
      return `${baseKey}:standard`;
    }

    if (initialDataQuery.loading) {
      return `${baseKey}:loading`;
    }

    return `${baseKey}:hydrated:${stableHashOfValue(
      hydratedDefaultValues ?? {},
    )}`;
  }, [
    resolvedApp,
    resolvedModel,
    resolvedMode,
    resolvedObjectIdValue,
    shouldFetchInitialData,
    initialDataQuery.loading,
    hydratedDefaultValues,
  ]);

  const contractError = contractQuery.error
    ? toError(contractQuery.error)
    : null;
  const initialDataError = initialDataQuery.error
    ? toError(initialDataQuery.error)
    : null;

  const isLoading =
    (generatedEnabled && contractQuery.loading) ||
    (shouldFetchInitialData && initialDataQuery.loading);

  const hasRenderableFields = Boolean(
    controlledSchema.sections?.some((section) => section.fields.length > 0) ||
    controlledSchema.fields?.length,
  );

  const renderError = (error: Error, stage: "contract" | "initialData") => {
    if (typeof errorFallback === "function") {
      return errorFallback({
        error,
        stage,
        app: resolvedApp,
        model: resolvedModel,
        mode: resolvedMode,
        objectId: resolvedObjectIdValue,
      });
    }
    return (
      errorFallback ?? (
        <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
          {error.message}
        </div>
      )
    );
  };

  if (!resolvedApp || !resolvedModel) {
    return renderError(
      new Error("ModelForm requires both `app` and `model` props."),
      "contract",
    );
  }

  if (updateRequiresObjectId) {
    return renderError(
      new Error("ModelForm requires `objectId` when mode is UPDATE."),
      "initialData",
    );
  }

  if (contractError) {
    return renderError(contractError, "contract");
  }

  if (initialDataError) {
    return renderError(initialDataError, "initialData");
  }

  if (isLoading) {
    return (
      loadingFallback ?? (
        <div className="rounded-md border p-3 text-sm text-muted-foreground">
          Loading model form contract...
        </div>
      )
    );
  }

  if (!hasRenderableFields) {
    return (
      emptySchemaFallback ?? (
        <div className="rounded-md border p-3 text-sm text-muted-foreground">
          No fields are available for this model form.
        </div>
      )
    );
  }
  console.log(finalState);

  return (
    <div className={cn("space-y-4", containerClassName)}>
      {showHeading && (title || description) ? (
        <header className="space-y-1">
          {title ? <h2 className="text-lg font-semibold">{title}</h2> : null}
          {description ? (
            <p className="text-sm text-muted-foreground">{description}</p>
          ) : null}
        </header>
      ) : null}
      <div className={contentClassName}>
        <DynamicForm<TFormValues>
          key={dynamicFormKey}
          schema={controlledSchema}
          state={finalState}
          behavior={mergedBehavior}
          layout={resolvedLayoutInput}
          actions={mergedActions}
          devtools={resolvedDevtoolsInput}
        />
      </div>
    </div>
  );
}

export default ModelForm;
