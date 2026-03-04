import React from "react";
import { gql, useApolloClient } from "@apollo/client";
import { cn } from "@/shared/utils";

import DynamicForm from "../inputs/form";
import { useGeneratedModelForm } from "../hooks/useGeneratedModelForm";
import { useGeneratedValidators } from "../hooks/useGeneratedValidators";
import { buildGeneratedMutationDocument } from "../mutations";
import type { FormFieldConfig, FormSchema } from "../types";
import type {
  ModelFormContractPermissions,
  ModelFormOperationPermission,
} from "../types/generatedContract";
import type { ModelFormProps } from "../types.model";
import { parseRelationNestedFormConfig } from "./modelForm/nestedSchema";
import {
  EMPTY_RUNTIME_OVERRIDES,
  deepMergeRecords,
  getMutationPayload,
  isModelFormModeWithInitialData,
  isRecord,
  normalizeMode,
  toError,
} from "./modelForm/modelFormUtils";
import { useModelFormQueries } from "./modelForm/useModelFormQueries";
import { useModelFormConfig } from "./modelForm/useModelFormConfig";
import { useModelFormSchema } from "./modelForm/useModelFormSchema";
import { useModelFormLogic } from "./modelForm/useModelFormLogic";
import { buildSubmitRelationsFromContracts } from "./modelForm/submitRelations";
import { shouldEnforceOperationDeny } from "../utils/operationPermissions";
import { serializeRuntimeOverridesForQuery } from "../utils/jsonCoercion";
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
    `[ModelForm] Legacy props are not supported: ${invalid.join(", ")}. Use state/behavior/layout/actions/devtools or formProps.`,
  );
}

function resolveRelationFieldName(relation: {
  name?: string | null;
  path?: string | null;
}) {
  const name = String(relation.name ?? "").trim();
  if (name) return name;
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
  if (operation) return operation;
  const allowed =
    mode === "CREATE"
      ? permissions.canCreate
      : mode === "UPDATE"
        ? permissions.canUpdate
        : permissions.canView;
  if (typeof allowed === "boolean") {
    return { allowed, requiredPermissions: [], requiresAuthentication: false };
  }
  return null;
}

function normalizeMutationVariablesForGraphQL(
  variables: Record<string, unknown>,
  identifier?: { key: string; value: string | number } | null,
) {
  const rawIdentifierName = String(identifier?.key ?? "").trim();
  if (!rawIdentifierName) return variables;
  const nextVariables: Record<string, unknown> = { ...variables };
  if (rawIdentifierName !== "id") {
    if (
      Object.prototype.hasOwnProperty.call(nextVariables, rawIdentifierName)
    ) {
      nextVariables.id = nextVariables[rawIdentifierName];
      delete nextVariables[rawIdentifierName];
    } else if (nextVariables.id === undefined || nextVariables.id === null) {
      nextVariables.id = identifier?.value;
    }
  } else if (nextVariables.id === undefined || nextVariables.id === null) {
    nextVariables.id = identifier?.value;
  }
  if (nextVariables.id === undefined || nextVariables.id === null) {
    throw new Error(
      "Les mutations de mise à jour nécessitent une variable`id`.",
    );
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
    onSubmitResult,
    onLoadError,
  } = props;

  const resolvedApp = app ?? "";
  const resolvedModel = model ?? "";
  const resolvedMode = normalizeMode(mode);
  const resolvedObjectIdValue = objectId?.toString();
  const resolvedRuntimeOverrides = runtimeOverrides ?? EMPTY_RUNTIME_OVERRIDES;

  const runtimeOverridesForQuery = React.useMemo(
    () => serializeRuntimeOverridesForQuery(resolvedRuntimeOverrides),
    [resolvedRuntimeOverrides],
  );

  const {
    nestedControls,
    shouldIncludeNested,
    initialDataNestedFields,
    resolvedOnlyRelationships,
    resolvedExcludeRelationships,
  } = useModelFormConfig({
    nested,
    includeNested,
    onlyRelationships,
    excludeRelationships,
  });

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

  const relationOperationOverrides =
    React.useMemo<NestedMutationOperationOverrides>(() => {
      if (!contract) return {};
      const overrides: NestedMutationOperationOverrides = {};
      for (const relation of contract.relations ?? []) {
        const relationFieldName = resolveRelationFieldName(relation);
        const nestedControl =
          nestedControls?.[relationFieldName] ??
          nestedControls?.[relation.path];
        const nestedFormConfig = parseRelationNestedFormConfig(
          relation.nestedForm,
        );
        const scalarListOperation =
          nestedControl?.scalarListOperation ??
          nestedFormConfig.scalarListOperation;
        const removeOperation =
          nestedControl?.removeOperation ?? nestedFormConfig.removeOperation;
        const deleteMutationEnabled = Boolean(
          nestedControl?.deleteMutation?.enabled ??
          nestedFormConfig.deleteMutation?.enabled,
        );
        if (!scalarListOperation && !removeOperation && !deleteMutationEnabled)
          continue;
        const overrideEntry = {
          ...(scalarListOperation ? { scalarListOperation } : {}),
          ...(removeOperation ? { removeOperation } : {}),
          ...(deleteMutationEnabled ? { deleteMutationEnabled } : {}),
        };
        if (relationFieldName) overrides[relationFieldName] = overrideEntry;
        if (relation.path) overrides[relation.path] = overrideEntry;
      }
      return overrides;
    }, [contract, nestedControls]);

  const submitRelations = React.useMemo(
    () =>
      buildSubmitRelationsFromContracts({
        contract,
        nestedControls,
        relatedContractsByModel,
      }),
    [contract, nestedControls, relatedContractsByModel],
  );

  const executeGeneratedMutation = React.useCallback(
    async (
      operationName: string,
      variables: Record<string, unknown>,
      envelope: any,
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
        result.data as Record<string, unknown>,
      );
    },
    [apolloClient, resolvedModel],
  );

  const generated = useGeneratedModelForm({
    contract,
    initialData,
    runtimeOverrides: resolvedRuntimeOverrides,
    generatedEnabled,
    legacySchema: legacySchema as any,
    submitMode: resolvedMode,
    objectId: resolvedObjectIdValue,
    relationOperationOverrides,
    submissionRelations: submitRelations,
    executeMutation: executeGeneratedMutation,
  });

  const modePermissionDenied = React.useMemo(() => {
    const permissions = contract?.permissions;
    if (!permissions) return false;
    const opPerm = resolveModeOperationPermission(permissions, resolvedMode);
    return shouldEnforceOperationDeny(opPerm, resolvedMode as any);
  }, [contract?.permissions, resolvedMode]);

  const { formValidator } = useGeneratedValidators(
    contract,
    validatorExtensions,
  );

  const { finalSchema, editableFieldPaths, sanitizeValuesForControlledSchema } =
    useModelFormSchema({
      onlyFields,
      excludeFields,
      onlyRequired,
      fieldOverrides,
      sectionOverrides,
      generatedEnabled,
      contract,
      generatedSchema: generated.schema as any,
      relatedContractsByModel,
      nestedControls,
      resolvedOnlyRelationships,
      resolvedExcludeRelationships,
    });

  const resolvedLayout = React.useMemo(() => {
    const merged = { ...(formProps?.layout ?? {}), ...(layout ?? {}) };
    return Object.keys(merged).length > 0 ? merged : undefined;
  }, [formProps?.layout, layout]);
  const isPopupLayoutVariant = React.useMemo(() => {
    const variant = String(
      (resolvedLayout as Record<string, unknown> | undefined)?.variant ?? "",
    )
      .trim()
      .toLowerCase();
    return variant === "popup" || variant === "compact";
  }, [resolvedLayout]);

  const { mergedBehavior, mergedState, mergedActions, resolvedDevtools } =
    useModelFormLogic({
      generatedEnabled,
      contract,
      generated,
      formValidator,
      editableFieldPaths,
      sanitizeValuesForControlledSchema,
      relationOperationOverrides,
      submitRelations,
      modePermissionDenied,
      resolvedMode,
      resolvedObjectIdValue,
      finalSchema,
      formProps,
      state,
      behavior,
      actions,
      devtools,
      onSubmitResult,
    });

  const hydratedDefaultValues = React.useMemo<
    Partial<TFormValues> | undefined
  >(() => {
    if (!shouldFetchInitialData || initialDataQuery.loading) return undefined;
    if (!isRecord(generated.initialValues)) return {} as any;
    return sanitizeValuesForControlledSchema(
      generated.initialValues as any,
    ) as any;
  }, [
    shouldFetchInitialData,
    initialDataQuery.loading,
    generated.initialValues,
    sanitizeValuesForControlledSchema,
  ]);

  const finalState = React.useMemo(() => {
    const baseState = { ...(mergedState ?? {}) };
    const mergedDefaultValues = deepMergeRecords(
      isRecord(baseState.defaultValues)
        ? (baseState.defaultValues as any)
        : undefined,
      isRecord(hydratedDefaultValues)
        ? (hydratedDefaultValues as any)
        : undefined,
    );
    if (mergedDefaultValues)
      baseState.defaultValues = sanitizeValuesForControlledSchema(
        mergedDefaultValues,
      ) as any;
    if (shouldFetchInitialData && hydratedDefaultValues !== undefined)
      baseState.disableAutoReset = true;
    return Object.keys(baseState).length > 0 ? baseState : undefined;
  }, [
    mergedState,
    hydratedDefaultValues,
    shouldFetchInitialData,
    sanitizeValuesForControlledSchema,
  ]);

  const contractError = contractQuery.error
    ? toError(contractQuery.error)
    : null;
  const initialDataError = initialDataQuery.error
    ? toError(initialDataQuery.error)
    : null;
  const isLoading =
    (generatedEnabled && contractQuery.loading) ||
    (shouldFetchInitialData && initialDataQuery.loading) ||
    (generatedEnabled &&
      nestedRelationModelRefs.length > 0 &&
      nestedRelationContractsQuery.loading);
  const hasRenderableFields = Boolean(
    finalSchema.sections?.some((section) => section.fields.length > 0) ||
    finalSchema.fields?.length,
  );

  const renderError = (error: Error, stage: "contract" | "initialData") => {
    if (typeof errorFallback === "function")
      return errorFallback({
        error,
        stage,
        app: resolvedApp,
        model: resolvedModel,
        mode: resolvedMode,
        objectId: resolvedObjectIdValue,
      });
    return (
      errorFallback ?? (
        <div className="border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
          {error.message}
        </div>
      )
    );
  };

  if (!resolvedApp || !resolvedModel)
    return renderError(
      new Error("ModelForm nécessite les props`app` and`model`."),
      "contract",
    );
  if (updateRequiresObjectId)
    return renderError(
      new Error("ModelForm nécessite`objectId` lorsque le mode est UPDATE."),
      "initialData",
    );
  if (contractError) return renderError(contractError, "contract");
  if (initialDataError) return renderError(initialDataError, "initialData");
  if (isLoading)
    return (
      loadingFallback ?? (
        <div className="border p-3 text-sm text-muted-foreground">
          Chargement du contrat du formulaire...
        </div>
      )
    );
  if (!hasRenderableFields)
    return (
      emptySchemaFallback ?? (
        <div className="border p-3 text-sm text-muted-foreground">
          Aucun champ n'est disponible pour ce formulaire.
        </div>
      )
    );

  return (
    <div
      data-slot="model-form"
      className={cn(
        "group/model-form relative w-full transition-all duration-500",
        !isPopupLayoutVariant &&
          "bg-background shadow-sm border-foreground p-6 md:p-10  dark:shadow-[8px_8px_0_0_#333]", // Wait, user said "no shadow and no rounded". I'll remove shadow.
        containerClassName,
      ).replace(/shadow-\[.*\]/g, "")}
    >
      {showHeading && (title || description) ? (
        <header className="mb-10 space-y-4 px-2">
          {title && (
            <div className="flex items-center gap-4">
              <div className="h-10 w-3 bg-primary" />
              <h2 className="text-3xl font-black uppercase tracking-widest text-foreground sm:text-4xl">
                {title}
              </h2>
            </div>
          )}
          {description && (
            <p className="max-w-3xl text-sm font-bold uppercase tracking-wide leading-relaxed text-muted-foreground sm:text-base border-l-4 border-muted pl-4">
              {description}
            </p>
          )}
        </header>
      ) : null}
      <div
        className={cn(
          isPopupLayoutVariant
            ? "relative transition-transform duration-300"
            : "relative bg-background transition-transform duration-300 border-t-4 border-border pt-6",
          contentClassName,
        )}
      >
        <DynamicForm<TFormValues>
          schema={finalSchema}
          state={finalState}
          behavior={mergedBehavior}
          layout={{
            ...resolvedLayout,
            // Pass border-0 to avoid double borders inside the main ModelForm card
            className: cn(
              resolvedLayout?.className,
              !isPopupLayoutVariant && "border-0 p-0",
            ),
          }}
          actions={mergedActions}
          devtools={resolvedDevtools}
        />
      </div>
    </div>
  );
}

export default ModelForm;
