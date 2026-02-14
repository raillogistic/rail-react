import React from "react";
import { gql, useApolloClient } from "@apollo/client";

import { cn } from "@/lib/utils";

import DynamicForm from "../inputs/form";
import { useGeneratedModelForm } from "../hooks/useGeneratedModelForm";
import { useGeneratedValidators } from "../hooks/useGeneratedValidators";
import { buildGeneratedMutationDocument } from "../mutations";
import type { FormBehaviorConfig, FormSchema } from "../types";
import type { ModelFormProps } from "../types.model";
import {
  applyErrorsToFormFields,
  normalizeGeneratedErrorsForForm,
} from "../utils/errors";
import { serializeRuntimeOverridesForQuery } from "../utils/jsonCoercion";
import {
  mergePathLists,
  normalizeNestedControls,
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

export function ModelForm<
  TFormValues extends Record<string, unknown> = Record<string, unknown>,
>(props: ModelFormProps<TFormValues>) {
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
    resolvedOnlyRelationships,
    resolvedExcludeRelationships,
    fieldOverrides,
    sectionOverrides,
    nestedControls,
    generatedEnabled,
    contract,
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

    const mergedOnSubmit = shouldUseGeneratedSubmit
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
            schema={controlledSchema}
            state={finalState}
            behavior={mergedBehavior}
            layout={resolvedLayoutInput}
            actions={mergedActions}
            devtools={resolvedDevtoolsInput}
          />
        </div>
      </div>
    </div>
  );
}

export default ModelForm;
