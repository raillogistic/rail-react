import React from "react";
import { gql, useApolloClient } from "@apollo/client";

import { cn } from "@/lib/utils";

import DynamicForm from "../inputs/form";
import { useGeneratedModelForm } from "../hooks/useGeneratedModelForm";
import { useGeneratedValidators } from "../hooks/useGeneratedValidators";
import {
  buildGeneratedMutationDocument,
  selectGeneratedSubmitOperation,
} from "../mutations";
import type { FormBehaviorConfig, FormFieldConfig, FormSchema } from "../types";
import type {
  ModelFormContractPermissions,
  ModelFormOperationPermission,
} from "../types/generatedContract";
import type { ModelFormProps } from "../types.model";
import { buildSubmitPayload } from "../utils/buildSubmitPayload";
import {
  applyErrorsToFormFields,
  normalizeGeneratedErrorsForForm,
} from "../utils/errors";
import { serializeRuntimeOverridesForQuery } from "../utils/jsonCoercion";
import { getValueByPath, setValueByPath } from "../utils/objectPath";
import { shouldEnforceOperationDeny } from "../utils/operationPermissions";
import { resolveSubmitIdentifier } from "../utils/resolveSubmitIdentifier";
import {
  mergePathLists,
  normalizeNestedControls,
  parseRelationNestedFormConfig,
} from "./modelForm/nestedSchema";
import { collectInitialDataNestedFields } from "./modelForm/queryLifecycle";
import {
  applySchemaControls,
  enforceContractSectionFieldOrder,
  hasUserOrderOverrides,
  materializeNestedRelationFields,
} from "./modelForm/schemaTransforms";
import {
  EMPTY_PATHS,
  EMPTY_RUNTIME_OVERRIDES,
  deepMergeRecords,
  getMutationPayload,
  isModelFormModeWithInitialData,
  isRecord,
  mergeValidationErrors,
  normalizeMode,
  stableHashOfValue,
  toActionSubmitOutcome,
  toError,
} from "./modelForm/modelFormUtils";
import { useModelFormQueries } from "./modelForm/useModelFormQueries";
import type { NestedMutationOperationOverrides } from "../utils/nestedMutationPayload";

const LEGACY_MODEL_FORM_PROP_KEYS = [
  "onSubmit",
  "onChange",
  "validate",
  "defaultValues",
  "readOnly",
  "disabled",
  "isLoading",
  "onFormReady",
  "showSectionHeaders",
  "inPopup",
] as const;

function assertNoLegacyModelFormProps(props: Record<string, unknown>): void {
  if (import.meta.env.PROD) return;

  const invalid = LEGACY_MODEL_FORM_PROP_KEYS.filter((key) =>
    Object.prototype.hasOwnProperty.call(props, key),
  );
  if (!invalid.length) return;

  throw new Error(
    `[ModelForm] Legacy props are not supported: ${invalid.join(
      ", ",
    )}. Use state/behavior/layout/actions/devtools or formProps.`,
  );
}

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

function filterErrorsByFieldPaths(
  errors: Record<string, unknown> | undefined,
  allowedFieldPaths: string[],
): Record<string, unknown> | undefined {
  if (!errors || typeof errors !== "object") {
    return errors;
  }

  const allowed = new Set(allowedFieldPaths);
  const filtered = Object.entries(errors).reduce<Record<string, unknown>>(
    (acc, [path, message]) => {
      if (allowed.has(path)) {
        acc[path] = message;
      }
      return acc;
    },
    {},
  );

  return Object.keys(filtered).length > 0 ? filtered : undefined;
}

function resolveContractFieldName(field: {
  name?: string | null;
  path?: string | null;
  fieldName?: string | null;
}) {
  const declaredName = String(field.name ?? "").trim();
  if (declaredName) return declaredName;
  return String(field.path ?? field.fieldName ?? "").trim();
}

function resolveRelationFieldName(relation: {
  name?: string | null;
  path?: string | null;
}) {
  const declaredName = String(relation.name ?? "").trim();
  if (declaredName) return declaredName;
  return String(relation.path ?? "").trim();
}

function resolveModeOperationPermission(
  permissions: ModelFormContractPermissions | null | undefined,
  mode: "CREATE" | "UPDATE" | "VIEW",
): ModelFormOperationPermission | null {
  if (!permissions) return null;

  const operation =
    mode === "CREATE"
      ? permissions.create
      : mode === "UPDATE"
        ? permissions.update
        : permissions.view;
  if (operation) {
    return operation;
  }

  const allowed =
    mode === "CREATE"
      ? permissions.canCreate
      : mode === "UPDATE"
        ? permissions.canUpdate
        : permissions.canView;
  if (typeof allowed === "boolean") {
    return {
      allowed,
      requiredPermissions: [],
      requiresAuthentication: false,
    };
  }

  return null;
}

function normalizeMutationVariablesForGraphQL(
  variables: Record<string, unknown>,
  identifier?: { key: string; value: string | number } | null,
) {
  const rawIdentifierName = String(identifier?.key ?? "").trim();
  if (!rawIdentifierName) {
    return variables;
  }

  const nextVariables: Record<string, unknown> = { ...variables };

  if (Object.prototype.hasOwnProperty.call(nextVariables, rawIdentifierName)) {
    nextVariables.id = nextVariables[rawIdentifierName];
    if (rawIdentifierName !== "id") {
      delete nextVariables[rawIdentifierName];
    }
  } else if (!Object.prototype.hasOwnProperty.call(nextVariables, "id")) {
    nextVariables.id = identifier?.value;
  }

  if (
    rawIdentifierName !== "id" &&
    Object.prototype.hasOwnProperty.call(nextVariables, rawIdentifierName)
  ) {
    delete nextVariables[rawIdentifierName];
  }

  if (nextVariables.id === undefined || nextVariables.id === null) {
    throw new Error("Les mutations de mise à jour nécessitent une variable `id`.");
  }
  if (typeof nextVariables.id === "string" && nextVariables.id.trim().length === 0) {
    throw new Error("Les mutations de mise à jour nécessitent une variable `id` non vide.");
  }
  if (typeof nextVariables.id === "number" && !Number.isFinite(nextVariables.id)) {
    throw new Error("Les mutations de mise à jour nécessitent une variable `id` numérique finie.");
  }

  return nextVariables;
}

export function ModelForm<
  TFormValues extends Record<string, unknown> = Record<string, unknown>,
>(props: ModelFormProps<TFormValues>) {
  assertNoLegacyModelFormProps(props as Record<string, unknown>);
  const apolloClient = useApolloClient();

  const {
    app,
    model,
    mode,
    objectId,
    includeNested,
    nested,
    generatedEnabled = true,
    runtimeOverrides,
    onlyFields,
    excludeFields,
    onlyRequired,
    onlyRelationships,
    excludeRelationships,
    fieldOverrides,
    sectionOverrides,
    validatorExtensions,
    legacySchema,
    formProps,
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

  const resolvedApp = app ?? "";
  const resolvedModel = model ?? "";
  const resolvedMode = normalizeMode(mode);
  const resolvedObjectId = objectId;
  const resolvedObjectIdValue = resolvedObjectId?.toString();
  const resolvedNested = nested;
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
    () => mergePathLists(resolvedOnlyFieldsInput),
    [resolvedOnlyFieldsInput],
  );
  const resolvedExcludeFields = React.useMemo(
    () => mergePathLists(resolvedExcludeFieldsInput),
    [resolvedExcludeFieldsInput],
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
    };
    return Object.keys(merged).length > 0 ? merged : undefined;
  }, [formProps?.state, state]);

  const resolvedBehaviorInput = React.useMemo(() => {
    const merged = {
      ...(formProps?.behavior ?? {}),
      ...(behavior ?? {}),
    };
    return Object.keys(merged).length > 0 ? merged : undefined;
  }, [formProps?.behavior, behavior]);

  const resolvedLayoutInput = React.useMemo(() => {
    const merged = {
      ...(formProps?.layout ?? {}),
      ...(layout ?? {}),
    };
    return Object.keys(merged).length > 0 ? merged : undefined;
  }, [formProps?.layout, layout]);

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

  const initialDataNestedFields = React.useMemo(() => {
    return collectInitialDataNestedFields(
      nestedControls,
      resolvedOnlyRelationships,
      resolvedExcludeRelationships,
    );
  }, [nestedControls, resolvedOnlyRelationships, resolvedExcludeRelationships]);

  const updateRequiresObjectId =
    resolvedMode === "UPDATE" &&
    requireObjectIdForUpdate &&
    !resolvedObjectIdValue;

  const shouldFetchInitialData =
    generatedEnabled &&
    isModelFormModeWithInitialData(resolvedMode) &&
    Boolean(resolvedObjectIdValue);

  const {
    contractQuery,
    initialDataQuery,
    nestedRelationContractsQuery,
    contract,
    initialData,
    nestedRelationModelRefs,
    relatedContractsByModel,
  } = useModelFormQueries({
    generatedEnabled,
    resolvedApp,
    resolvedModel,
    resolvedMode,
    shouldIncludeNested,
    shouldFetchInitialData,
    resolvedObjectIdValue,
    initialDataNestedFields,
    runtimeOverridesForQuery,
    nestedControls,
    onContractLoaded,
    onInitialDataLoaded,
    onLoadError,
  });

  const relationOperationOverrides = React.useMemo<NestedMutationOperationOverrides>(
    () => {
      if (!contract) return {};
      const overrides: NestedMutationOperationOverrides = {};

      for (const relation of contract.relations ?? []) {
        const relationFieldName = resolveRelationFieldName(relation);
        const nestedControl =
          nestedControls?.[relationFieldName] ?? nestedControls?.[relation.path];
        const nestedFormConfig = parseRelationNestedFormConfig(relation.nestedForm);

        const scalarListOperation =
          nestedControl?.scalarListOperation ?? nestedFormConfig.scalarListOperation;
        const removeOperation =
          nestedControl?.removeOperation ?? nestedFormConfig.removeOperation;
        const deleteMutationEnabled = Boolean(
          nestedControl?.deleteMutation?.enabled ??
            nestedFormConfig.deleteMutation?.enabled,
        );

        if (!scalarListOperation && !removeOperation && !deleteMutationEnabled) continue;

        const overrideEntry = {
          ...(scalarListOperation ? { scalarListOperation } : {}),
          ...(removeOperation ? { removeOperation } : {}),
          ...(deleteMutationEnabled ? { deleteMutationEnabled } : {}),
        };

        if (relationFieldName) {
          overrides[relationFieldName] = overrideEntry;
        }
        if (relation.path) {
          overrides[relation.path] = overrideEntry;
        }
      }

      return overrides;
    },
    [contract, nestedControls],
  );

  const executeGeneratedMutation = React.useCallback(
    async (
      operationName: string,
      variables: Record<string, unknown>,
      envelope: { identifier?: { key: string; value: string | number } | null },
    ) => {
      const mutationMode = envelope.identifier ? "update" : "create";

      const graphqlVariables = normalizeMutationVariablesForGraphQL(
        variables,
        envelope.identifier,
      );

      const mutation = gql(
        buildGeneratedMutationDocument(
          mutationMode,
          operationName,
          resolvedModel,
          "id",
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
    relationOperationOverrides,
    executeMutation: executeGeneratedMutation,
  });

  const modePermissionDenied = React.useMemo(() => {
    const permissions = contract?.permissions;
    if (!permissions) return false;
    if (resolvedMode === "CREATE") {
      return shouldEnforceOperationDeny(
        resolveModeOperationPermission(permissions, "CREATE"),
        "CREATE",
      );
    }
    if (resolvedMode === "UPDATE") {
      return shouldEnforceOperationDeny(
        resolveModeOperationPermission(permissions, "UPDATE"),
        "UPDATE",
      );
    }
    if (resolvedMode === "VIEW") {
      return shouldEnforceOperationDeny(
        resolveModeOperationPermission(permissions, "VIEW"),
        "VIEW",
      );
    }
    return false;
  }, [contract?.permissions, resolvedMode]);

  const { formValidator } = useGeneratedValidators(
    contract,
    validatorExtensions,
  );

  const schemaWithNestedRelations = React.useMemo(() => {
    return materializeNestedRelationFields(
      generated.schema as FormSchema<TFormValues>,
      {
        contract,
        nestedControls,
        relatedContractsByModel,
      },
    );
  }, [generated.schema, contract, nestedControls, relatedContractsByModel]);

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
      enforceListFieldsAtEnd: !(generatedEnabled && contract),
    });

    const shouldEnforceContractOrder =
      Boolean(generatedEnabled && contract) &&
      !hasUserOrderOverrides(fieldOverrides);

    if (!shouldEnforceContractOrder || !contract) {
      return controlled;
    }

    return enforceContractSectionFieldOrder(controlled, contract);
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
        ? filterErrorsByFieldPaths(
            generatedValidate(values as Record<string, unknown>) as
              | Record<string, unknown>
              | undefined,
            editableFieldPaths,
          )
        : undefined;
      const customErrors = userValidate ? userValidate(values) : undefined;
      return mergeValidationErrors(generatedErrors, customErrors);
    };

    const mergedOnSubmit = shouldUseGeneratedSubmit
      ? async (
          values: TFormValues,
          ctx: Parameters<
            NonNullable<FormBehaviorConfig<TFormValues>["onSubmit"]>
          >[1],
        ) => {
          const sanitizedValues = sanitizeValuesForControlledSchema(
            values as Record<string, unknown>,
          );
          const outcome = await generated.submit(
            sanitizedValues,
          );
          if (outcome.errors.length) {
            applyErrorsToFormFields(
              normalizeGeneratedErrorsForForm(outcome.errors, {
                formErrorKey: outcome.formErrorKey,
                visibleFieldPaths: editableFieldPaths,
              }),
              ctx.form as any,
            );
          }
        }
      : userSubmit;

    return {
      ...(resolvedBehaviorInput ?? {}),
      validate,
      ...(mergedOnSubmit ? { onSubmit: mergedOnSubmit } : {}),
    };
  }, [
    resolvedBehaviorInput,
    generatedEnabled,
    contract,
    formValidator,
    generated.canSubmit,
    generated.submit,
    resolvedMode,
    sanitizeValuesForControlledSchema,
    editableFieldPaths,
  ]);

  const mergedState = React.useMemo(() => {
    const submitAwareState = {
      ...(resolvedStateInput ?? {}),
      isSubmitting: Boolean(
        resolvedStateInput?.isSubmitting || generated.submitState.isSubmitting,
      ),
    };
    if (modePermissionDenied) {
      submitAwareState.readOnly = true;
    }
    if (resolvedMode !== "VIEW") return submitAwareState;
    return {
      ...submitAwareState,
      readOnly: submitAwareState.readOnly ?? true,
    };
  }, [
    modePermissionDenied,
    resolvedMode,
    resolvedStateInput,
    generated.submitState.isSubmitting,
  ]);

  const mergedActions = React.useMemo(() => {
    const submitAwareActions = {
      ...(resolvedActionsInput ?? {}),
      isSubmitting: Boolean(
        resolvedActionsInput?.isSubmitting ||
        generated.submitState.isSubmitting,
      ),
      submitOutcome: toActionSubmitOutcome(generated.submitState.outcome),
    };
    if (modePermissionDenied) {
      submitAwareActions.hidden = true;
    }
    if (resolvedMode !== "VIEW") return submitAwareActions;
    return {
      ...submitAwareActions,
      hidden: submitAwareActions.hidden ?? true,
    };
  }, [
    resolvedActionsInput,
    modePermissionDenied,
    resolvedMode,
    generated.submitState.isSubmitting,
    generated.submitState.outcome,
  ]);

  const resolvedDevtools = React.useMemo(() => {
    if (!resolvedDevtoolsInput) {
      return undefined;
    }

    if (!generatedEnabled || !contract || resolvedMode === "VIEW") {
      return resolvedDevtoolsInput;
    }

    return {
      ...resolvedDevtoolsInput,
      transformValues: (values: TFormValues) => {
        const rawFormValues = isRecord(values)
          ? (values as Record<string, unknown>)
          : {};

        try {
          const sanitizedValues = sanitizeValuesForControlledSchema(rawFormValues);
          const resolvedValues = generated.buildSubmissionValues(sanitizedValues);
          const submitMode = resolvedMode === "UPDATE" ? "UPDATE" : "CREATE";
          const operationName = selectGeneratedSubmitOperation(
            contract.mutationBindings,
            submitMode,
            contract.modelName,
          );
          const identifier = resolveSubmitIdentifier({
            mode: submitMode,
            values: resolvedValues,
            objectId: resolvedObjectIdValue,
            mutationBindings: contract.mutationBindings,
          });
          const envelope = buildSubmitPayload({
            mode: submitMode,
            operationName,
            resolvedValues,
            relations: contract.relations,
            relationOperationOverrides,
            baselineValues: generated.initialValues as Record<string, unknown>,
            identifier,
          });

          return {
            formValues: rawFormValues,
            mutationRequest: {
              operationName: envelope.operationName,
              variables: normalizeMutationVariablesForGraphQL(
                envelope.variables,
                envelope.identifier,
              ),
            },
            mutationRequestHints: {
              jsonFieldPaths: (contract.fields ?? [])
                .filter((field) => field.kind === "JSON")
                .map((field) => resolveContractFieldName(field))
                .filter(Boolean),
            },
          };
        } catch (error) {
          return {
            formValues: rawFormValues,
            mutationRequestError: toError(error).message,
            mutationRequestHints: {
              jsonFieldPaths: (contract.fields ?? [])
                .filter((field) => field.kind === "JSON")
                .map((field) => resolveContractFieldName(field))
                .filter(Boolean),
            },
          };
        }
      },
    };
  }, [
    resolvedDevtoolsInput,
    generatedEnabled,
    contract,
    resolvedMode,
    generated.buildSubmissionValues,
    generated.initialValues,
    relationOperationOverrides,
    sanitizeValuesForControlledSchema,
    resolvedObjectIdValue,
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
    return sanitizeValuesForControlledSchema(
      generated.initialValues as Record<string, unknown>,
    ) as Partial<TFormValues>;
  }, [
    shouldFetchInitialData,
    initialDataQuery.loading,
    generated.initialValues,
    sanitizeValuesForControlledSchema,
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
      baseState.defaultValues = sanitizeValuesForControlledSchema(
        mergedDefaultValues,
      ) as Partial<TFormValues>;
    }

    if (shouldFetchInitialData && hydratedDefaultValues !== undefined) {
      baseState.disableAutoReset = true;
    }

    return Object.keys(baseState).length > 0 ? baseState : undefined;
  }, [
    mergedState,
    hydratedDefaultValues,
    shouldFetchInitialData,
    sanitizeValuesForControlledSchema,
  ]);

  const dynamicFormKey = React.useMemo(() => {
    const baseKey = `${resolvedApp}:${resolvedModel}:${resolvedMode}:${
      resolvedObjectIdValue ?? "new"
    }`;
    const schemaHash = stableHashOfValue({
      sections: controlledSchema.sections ?? [],
      fields: controlledSchema.fields ?? [],
    });

    if (!shouldFetchInitialData) {
      return `${baseKey}:standard:${schemaHash}`;
    }

    if (initialDataQuery.loading) {
      return `${baseKey}:loading:${schemaHash}`;
    }

    return `${baseKey}:hydrated:${schemaHash}:${stableHashOfValue(
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
    controlledSchema.sections,
    controlledSchema.fields,
  ]);

  const contractError = contractQuery.error
    ? toError(contractQuery.error)
    : null;
  const initialDataError = initialDataQuery.error
    ? toError(initialDataQuery.error)
    : null;
  const shouldWaitForNestedRelationContracts =
    generatedEnabled && nestedRelationModelRefs.length > 0;

  const isLoading =
    (generatedEnabled && contractQuery.loading) ||
    (shouldFetchInitialData && initialDataQuery.loading) ||
    (shouldWaitForNestedRelationContracts &&
      nestedRelationContractsQuery.loading);

  const hasRenderableFields = Boolean(
    finalSchema.sections?.some((section) => section.fields.length > 0) ||
    finalSchema.fields?.length,
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
      new Error("ModelForm nécessite les props `app` et `model`."),
      "contract",
    );
  }

  if (updateRequiresObjectId) {
    return renderError(
      new Error("ModelForm nécessite `objectId` lorsque le mode est UPDATE."),
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
          Chargement du contrat du formulaire...
        </div>
      )
    );
  }

  if (!hasRenderableFields) {
    return (
      emptySchemaFallback ?? (
        <div className="rounded-md border p-3 text-sm text-muted-foreground">
          Aucun champ n'est disponible pour ce formulaire.
        </div>
      )
    );
  }

  return (
    <div
      className={cn(
        "group/model-form relative w-full transition-all duration-500",
        containerClassName,
      )}
    >
      {showHeading && (title || description) ? (
        <header className="mb-8 space-y-3 px-1">
          {title ? (
            <div className="flex items-center gap-4">
              <div className="h-8 w-1.5 rounded-full bg-primary/80 shadow-[0_0_15px_rgba(var(--primary),0.3)]" />
              <h2 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
                {title}
              </h2>
            </div>
          ) : null}
          {description ? (
            <p className="max-w-3xl text-sm font-medium leading-relaxed text-muted-foreground/80 sm:text-base">
              {description}
            </p>
          ) : null}
        </header>
      ) : null}

      <div
        className={cn(
          "relative overflow-hidden rounded-3xl border border-border/40 bg-card/30 backdrop-blur-sm transition-all duration-300 hover:border-border/60 hover:shadow-2xl hover:shadow-black/5",
          contentClassName,
        )}
      >
        <div className="absolute inset-0 -z-10 bg-linear-to-br from-primary/5 via-transparent to-transparent opacity-50" />

        <div className="p-1">
          <DynamicForm<TFormValues>
            key={dynamicFormKey}
            schema={finalSchema}
            state={finalState}
            behavior={mergedBehavior}
            layout={resolvedLayoutInput}
            actions={mergedActions}
            devtools={resolvedDevtools}
          />
        </div>
      </div>
    </div>
  );
}

export default ModelForm;
