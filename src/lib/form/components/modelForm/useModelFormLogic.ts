import React from "react";
import { selectGeneratedSubmitOperation } from "../../mutations";
import type { FormBehaviorConfig, FormSchema } from "../../types";
import type { ModelFormContract, ModelFormContractRelation } from "../../types/generatedContract";
import type { ModelFormProps, ModelFormSubmitOutcome } from "../../types.model";
import { buildSubmitPayload } from "../../utils/buildSubmitPayload";
import { applyErrorsToFormFields, normalizeGeneratedErrorsForForm } from "../../utils/errors";
import { isRecord, mergeValidationErrors, toActionSubmitOutcome, toError } from "./modelFormUtils";
import { resolveSubmitIdentifier } from "../../utils/resolveSubmitIdentifier";

export type UseModelFormLogicOptions<TFormValues extends Record<string, unknown>> = Pick<ModelFormProps<TFormValues>,
  "generatedEnabled" | "mode" | "objectId" | "formProps" | "state" | "behavior" | "actions" | "devtools"
> & {
  contract: ModelFormContract | null;
  generated: any;
  formValidator: any;
  finalSchema: FormSchema<TFormValues>;
  editableFieldPaths: string[];
  sanitizeValuesForControlledSchema: (values: Record<string, unknown>) => Record<string, unknown>;
  relationOperationOverrides: any;
  submitRelations: ModelFormContractRelation[];
  modePermissionDenied: boolean;
  resolvedMode: "CREATE" | "UPDATE" | "VIEW";
  resolvedObjectIdValue?: string;
};

function normalizeMutationVariablesForDevtools(
  variables: Record<string, unknown>,
  identifier?: { key: string; value: string | number } | null,
) {
  const rawIdentifierName = String(identifier?.key ?? "").trim();
  if (!rawIdentifierName) return variables;
  const nextVariables: Record<string, unknown> = { ...variables };
  if (rawIdentifierName !== "id") {
    if (Object.prototype.hasOwnProperty.call(nextVariables, rawIdentifierName)) {
      nextVariables.id = nextVariables[rawIdentifierName];
      delete nextVariables[rawIdentifierName];
    } else if (nextVariables.id === undefined || nextVariables.id === null) {
      nextVariables.id = identifier?.value;
    }
  } else if (nextVariables.id === undefined || nextVariables.id === null) {
    nextVariables.id = identifier?.value;
  }
  return nextVariables;
}

export function useModelFormLogic<TFormValues extends Record<string, unknown>>(
  options: UseModelFormLogicOptions<TFormValues>
) {
  const {
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
    formProps,
    state,
    behavior,
    actions,
    devtools,
  } = options;

  const resolvedStateInput = React.useMemo(() => {
    const merged = { ...(formProps?.state ?? {}), ...(state ?? {}) };
    return Object.keys(merged).length > 0 ? merged : undefined;
  }, [formProps?.state, state]);

  const resolvedBehaviorInput = React.useMemo(() => {
    const merged = { ...(formProps?.behavior ?? {}), ...(behavior ?? {}) };
    return Object.keys(merged).length > 0 ? merged : undefined;
  }, [formProps?.behavior, behavior]);

  const resolvedActionsInput = React.useMemo(() => {
    const merged = { ...(formProps?.actions ?? {}), ...(actions ?? {}) };
    return Object.keys(merged).length > 0 ? merged : undefined;
  }, [formProps?.actions, actions]);

  const resolvedDevtoolsInput = React.useMemo(() => {
    const merged = { ...(formProps?.devtools ?? {}), ...(devtools ?? {}) };
    return Object.keys(merged).length > 0 ? merged : undefined;
  }, [formProps?.devtools, devtools]);

  const mergedBehavior = React.useMemo<FormBehaviorConfig<TFormValues> | undefined>(() => {
    const userValidate = resolvedBehaviorInput?.validate;
    const userSubmit = resolvedBehaviorInput?.onSubmit;
    const shouldUseGeneratedValidation = Boolean(generatedEnabled && contract);
    const generatedValidate = shouldUseGeneratedValidation ? formValidator : undefined;
    const shouldUseGeneratedSubmit = Boolean(
      generatedEnabled && contract && resolvedMode !== "VIEW" && !userSubmit && generated.canSubmit
    );

    if (!resolvedBehaviorInput && !generatedValidate && !shouldUseGeneratedSubmit) {
      return undefined;
    }

    const validate = (values: TFormValues) => {
      const generatedErrors = generatedValidate
        ? (generatedValidate(values as Record<string, unknown>) as Record<string, string> | undefined)
        : undefined;
      const customErrors = userValidate ? userValidate(values) : undefined;
      return mergeValidationErrors(generatedErrors, customErrors);
    };

    const mergedOnSubmit = shouldUseGeneratedSubmit
      ? async (values: TFormValues, ctx: any) => {
          const sanitizedValues = sanitizeValuesForControlledSchema(values as Record<string, unknown>);
          const outcome = await generated.submit(sanitizedValues);
          if (outcome.errors.length) {
            applyErrorsToFormFields(
              normalizeGeneratedErrorsForForm(outcome.errors, {
                formErrorKey: outcome.formErrorKey,
                visibleFieldPaths: editableFieldPaths,
              }),
              ctx.form as any
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
      isSubmitting: Boolean(resolvedStateInput?.isSubmitting || generated.submitState.isSubmitting),
    };
    if (modePermissionDenied) {
      submitAwareState.readOnly = true;
    }
    if (resolvedMode !== "VIEW") return submitAwareState;
    return {
      ...submitAwareState,
      readOnly: submitAwareState.readOnly ?? true,
    };
  }, [modePermissionDenied, resolvedMode, resolvedStateInput, generated.submitState.isSubmitting]);

  const mergedActions = React.useMemo(() => {
    const submitAwareActions = {
      ...(resolvedActionsInput ?? {}),
      isSubmitting: Boolean(resolvedActionsInput?.isSubmitting || generated.submitState.isSubmitting),
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
  }, [resolvedActionsInput, modePermissionDenied, resolvedMode, generated.submitState.isSubmitting, generated.submitState.outcome]);

  const resolvedDevtools = React.useMemo(() => {
    if (!resolvedDevtoolsInput) return undefined;
    if (!generatedEnabled || !contract || resolvedMode === "VIEW") return resolvedDevtoolsInput;

    return {
      ...resolvedDevtoolsInput,
      transformValues: (values: TFormValues) => {
        const rawFormValues = isRecord(values) ? (values as Record<string, unknown>) : {};
        try {
          const sanitizedValues = sanitizeValuesForControlledSchema(rawFormValues);
          const resolvedValues = generated.buildSubmissionValues(sanitizedValues);
          const submitMode = resolvedMode === "UPDATE" ? "UPDATE" : "CREATE";
          const operationName = selectGeneratedSubmitOperation(contract.mutationBindings, submitMode, contract.modelName);
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
            relations: submitRelations,
            relationOperationOverrides,
            baselineValues: generated.initialValues as Record<string, unknown>,
            identifier,
          });

          return {
            formValues: rawFormValues,
            mutationRequest: {
              operationName: envelope.operationName,
              variables: normalizeMutationVariablesForDevtools(
                envelope.variables,
                envelope.identifier,
              ),
            },
          };
        } catch (error) {
          return {
            formValues: rawFormValues,
            mutationRequestError: toError(error).message,
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
    submitRelations,
    sanitizeValuesForControlledSchema,
    resolvedObjectIdValue,
  ]);

  return {
    mergedBehavior,
    mergedState,
    mergedActions,
    resolvedDevtools,
  };
}
