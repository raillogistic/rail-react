"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  useApolloClient,
  useQuery,
  type FetchPolicy,
  type FetchResult,
} from "@apollo/client";
import { Loader2, Zap } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/shared/ui/kit/button";
import { cn } from "@/shared/utils";
import {
  CUSTOM_MUTATION_METADATA_QUERY,
  type MutationMetadata,
} from "@/shared/api/graphql/graphql/metadata";
import type {
  DynamicFormProps,
  FormActionsConfig,
  FormFieldConfig,
  FormLayoutConfig,
  FormSchema,
} from "@/widgets/model-form/inputs/types";
import DynamicForm from "@/widgets/model-form/inputs/form";
import { FormOverlay } from "@/widgets/model-table/components/ModelTableOverlays";
import {
  applyFieldOverrides,
  buildMutationDefaults,
  buildMutationSchema,
  executeCustomMutationAction,
  getErrorMessage,
  humanizeLabel,
  normalizeMutationInputFields,
  parseJsonObject,
  resolveMutationActionMode,
  type MutationActionIdentifierConfig,
} from "./customMutationAction.helpers";

type CustomMutationValues = Record<string, unknown>;

export type CustomMutationActionData = {
  app: string;
  model: string;
  funcName?: string;
  objectId?: string | number | null;
};

export type CustomMutationActionPopupConfig = {
  type?: "modal" | "drawer";
  title?: React.ReactNode;
  description?: React.ReactNode;
  width?: string;
  height?: string;
  drawerDirection?: "left" | "right" | "top" | "bottom";
  closeOnSuccess?: boolean;
};

export type CustomMutationActionFormConfig = {
  defaults?: Record<string, unknown>;
  fieldOverrides?: Record<string, Partial<FormFieldConfig>>;
  layout?: FormLayoutConfig<CustomMutationValues>;
  actions?: FormActionsConfig<CustomMutationValues>;
  transformSchema?: (
    schema: FormSchema<CustomMutationValues>,
    mutation: MutationMetadata,
  ) => FormSchema<CustomMutationValues>;
};

export type CustomMutationActionButtonConfig = {
  label?: React.ReactNode;
  icon?: React.ReactNode;
  variant?: React.ComponentProps<typeof Button>["variant"];
  size?: React.ComponentProps<typeof Button>["size"];
  className?: string;
  disabled?: boolean;
  loadingLabel?: React.ReactNode;
};

export type CustomMutationActionQueryOptions = {
  skip?: boolean;
  fetchPolicy?: FetchPolicy;
  nextFetchPolicy?: FetchPolicy;
};

export type CustomMutationActionMutationConfig = {
  successMessage?: string;
  identifier?: Omit<MutationActionIdentifierConfig, "value">;
  transformPayload?: (context: {
    payload: Record<string, unknown>;
    mutation: MutationMetadata;
    data: CustomMutationActionData;
  }) => Record<string, unknown>;
  buildVariables?: (context: {
    baseVariables: Record<string, unknown>;
    payload: Record<string, unknown>;
    useInputObject: boolean;
    operationName: string;
    mutation: MutationMetadata;
    data: CustomMutationActionData;
  }) => Record<string, unknown>;
};

export type CustomMutationActionSuccessContext = {
  mutation: MutationMetadata;
  payload: Record<string, unknown>;
  result: FetchResult<Record<string, unknown>>;
};

export type CustomMutationActionErrorContext = {
  mutation: MutationMetadata | null;
  payload: Record<string, unknown> | null;
};

export type CustomMutationActionProps = {
  data: CustomMutationActionData;
  popup?: CustomMutationActionPopupConfig;
  form?: CustomMutationActionFormConfig;
  button?: CustomMutationActionButtonConfig;
  queryOptions?: CustomMutationActionQueryOptions;
  mutation?: CustomMutationActionMutationConfig;
  onSuccess?: (context: CustomMutationActionSuccessContext) => void;
  onError?: (error: Error, context: CustomMutationActionErrorContext) => void;
  onOpenChange?: (open: boolean) => void;
  onMetadataLoaded?: (mutation: MutationMetadata) => void;
  renderTrigger?: (context: {
    open: () => void;
    disabled: boolean;
    loading: boolean;
    mutation: MutationMetadata | null;
  }) => React.ReactNode;
};

type CustomMutationMetadataQueryResult = {
  customMutation: MutationMetadata | null;
};

function resolveDisplayLabel(
  mutation: MutationMetadata | null,
  buttonLabel: React.ReactNode | undefined,
): React.ReactNode {
  if (buttonLabel !== undefined && buttonLabel !== null) {
    return buttonLabel;
  }
  if (!mutation) {
    return "Action";
  }

  const actionPayload = parseJsonObject(mutation.action);
  const buttonTitle = actionPayload?.button_title ?? actionPayload?.buttonTitle;
  if (typeof buttonTitle === "string" && buttonTitle.trim()) {
    return buttonTitle.trim();
  }
  const title = actionPayload?.title;
  if (typeof title === "string" && title.trim()) {
    return title.trim();
  }

  return humanizeLabel(mutation.methodName || mutation.name || "Action");
}

function resolvePopupTitle(
  popupTitle: React.ReactNode | undefined,
  mutation: MutationMetadata,
): React.ReactNode {
  if (popupTitle !== undefined && popupTitle !== null) {
    return popupTitle;
  }

  const actionPayload = parseJsonObject(mutation.action);
  if (typeof actionPayload?.title === "string" && actionPayload.title.trim()) {
    return actionPayload.title.trim();
  }

  return resolveDisplayLabel(mutation, undefined);
}

function resolvePopupDescription(
  popupDescription: React.ReactNode | undefined,
  mutation: MutationMetadata,
  mode: "confirm" | "form",
): React.ReactNode | null {
  if (popupDescription !== undefined && popupDescription !== null) {
    return popupDescription;
  }

  const actionPayload = parseJsonObject(mutation.action);
  if (
    typeof actionPayload?.message === "string" &&
    actionPayload.message.trim()
  ) {
    return actionPayload.message.trim();
  }
  if (typeof mutation.description === "string" && mutation.description.trim()) {
    return mutation.description.trim();
  }

  return mode === "confirm" ? "Do you want to execute this action?" : null;
}

export function CustomMutationAction({
  data,
  popup,
  form,
  button,
  queryOptions,
  mutation,
  onSuccess,
  onError,
  onOpenChange,
  onMetadataLoaded,
  renderTrigger,
}: CustomMutationActionProps) {
  const apolloClient = useApolloClient();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const objectIdValue =
    data.objectId === undefined || data.objectId === null
      ? null
      : String(data.objectId);
  const shouldSkip =
    queryOptions?.skip === true ||
    !data.app.trim() ||
    !data.model.trim() ||
    !data.funcName.trim();

  const {
    data: queryData,
    loading,
    error,
  } = useQuery<CustomMutationMetadataQueryResult>(
    CUSTOM_MUTATION_METADATA_QUERY,
    {
      variables: {
        app: data.app,
        model: data.model,
        functionName: data.funcName,
        objectId: objectIdValue,
      },
      skip: shouldSkip,
      fetchPolicy: queryOptions?.fetchPolicy,
      nextFetchPolicy: queryOptions?.nextFetchPolicy,
    },
  );

  const mutationMetadata = queryData?.customMutation ?? null;

  useEffect(() => {
    if (mutationMetadata) {
      onMetadataLoaded?.(mutationMetadata);
    }
  }, [mutationMetadata, onMetadataLoaded]);

  const inputFields = useMemo(
    () =>
      mutationMetadata ? normalizeMutationInputFields(mutationMetadata) : [],
    [mutationMetadata],
  );
  const actionMode = useMemo(
    () =>
      mutationMetadata
        ? resolveMutationActionMode(mutationMetadata, inputFields)
        : null,
    [inputFields, mutationMetadata],
  );
  const actionPayload = useMemo(
    () => parseJsonObject(mutationMetadata?.action),
    [mutationMetadata],
  );

  const generatedSchema = useMemo(() => {
    if (!mutationMetadata || actionMode !== "form") {
      return null;
    }

    const baseSchema = buildMutationSchema(inputFields);
    const mergedSchema = applyFieldOverrides(baseSchema, form?.fieldOverrides);
    if (!mergedSchema) {
      return null;
    }

    return form?.transformSchema
      ? form.transformSchema(mergedSchema, mutationMetadata)
      : mergedSchema;
  }, [actionMode, form, inputFields, mutationMetadata]);

  const defaultValues = useMemo(
    () => ({
      ...buildMutationDefaults(inputFields),
      ...(form?.defaults ?? {}),
    }),
    [form?.defaults, inputFields],
  );

  const resolvedButtonLabel = useMemo(
    () => resolveDisplayLabel(mutationMetadata, button?.label),
    [button?.label, mutationMetadata],
  );

  const disabledReason = useMemo(() => {
    if (button?.disabled) return "This action is disabled.";
    if (shouldSkip) return "Action data is incomplete.";
    if (loading) return null;
    if (error) return getErrorMessage(error, "Action metadata failed to load.");
    if (!mutationMetadata) return "Action metadata is unavailable.";
    if (mutationMetadata.allowed === false) {
      return (
        mutationMetadata.reason ||
        "You do not have permission to run this action."
      );
    }
    return null;
  }, [button?.disabled, error, loading, mutationMetadata, shouldSkip]);

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      setOpen(nextOpen);
      onOpenChange?.(nextOpen);
    },
    [onOpenChange],
  );

  const openOverlay = useCallback(() => {
    if (disabledReason) {
      toast.error(disabledReason);
      return;
    }

    handleOpenChange(true);
  }, [disabledReason, handleOpenChange]);

  const closeOverlay = useCallback(() => {
    if (submitting) return;
    handleOpenChange(false);
  }, [handleOpenChange, submitting]);

  const execute = useCallback(
    async (payload: Record<string, unknown>) => {
      if (!mutationMetadata) {
        const runtimeError = new Error("Action metadata is unavailable.");
        onError?.(runtimeError, { mutation: null, payload });
        throw runtimeError;
      }

      const transformedPayload = mutation?.transformPayload
        ? mutation.transformPayload({
            payload,
            mutation: mutationMetadata,
            data,
          })
        : payload;

      const identifier = mutation?.identifier ?? {};
      const identifierConfig: MutationActionIdentifierConfig | undefined =
        objectIdValue || identifier.variableName || identifier.argumentName
          ? {
              argumentName: identifier.argumentName,
              variableName: identifier.variableName,
              variableType: identifier.variableType,
              value: objectIdValue,
            }
          : undefined;
      setSubmitting(true);
      try {
        const result = await executeCustomMutationAction({
          client: apolloClient,
          mutation: mutationMetadata,
          modelName: data.model,
          payload: transformedPayload,
          identifier: identifierConfig,
          buildVariables: mutation?.buildVariables
            ? (context) =>
                mutation.buildVariables?.({
                  ...context,
                  data,
                }) ?? context.baseVariables
            : undefined,
        });

        toast.success(
          mutation?.successMessage ||
            mutationMetadata.successMessage ||
            "Action executed successfully.",
        );

        if (popup?.closeOnSuccess !== false) {
          handleOpenChange(false);
        }

        onSuccess?.({
          mutation: mutationMetadata,
          payload: transformedPayload,
          result,
        });

        return result;
      } catch (error) {
        const normalizedError =
          error instanceof Error
            ? error
            : new Error(getErrorMessage(error, "Action execution failed."));
        toast.error(normalizedError.message);
        onError?.(normalizedError, {
          mutation: mutationMetadata,
          payload: transformedPayload,
        });
        throw normalizedError;
      } finally {
        setSubmitting(false);
      }
    },
    [
      apolloClient,
      data,
      handleOpenChange,
      mutation,
      mutationMetadata,
      objectIdValue,
      onError,
      onSuccess,
      popup?.closeOnSuccess,
    ],
  );

  const overlayTitle =
    mutationMetadata && actionMode
      ? resolvePopupTitle(popup?.title, mutationMetadata)
      : (popup?.title ?? resolvedButtonLabel);
  const overlayDescription =
    mutationMetadata && actionMode
      ? resolvePopupDescription(
          popup?.description,
          mutationMetadata,
          actionMode,
        )
      : (popup?.description ?? null);

  const resolvedFormActions = useMemo<
    DynamicFormProps<CustomMutationValues>["actions"]
  >(() => {
    const submitLabel =
      form?.actions?.submitLabel ||
      (typeof actionPayload?.submit_label === "string" &&
      actionPayload.submit_label.trim()
        ? actionPayload.submit_label.trim()
        : "Execute");
    const resetLabel =
      form?.actions?.resetLabel ||
      (typeof actionPayload?.cancel_label === "string" &&
      actionPayload.cancel_label.trim()
        ? actionPayload.cancel_label.trim()
        : undefined);

    return {
      ...(form?.actions ?? {}),
      submitLabel,
      ...(resetLabel ? { resetLabel } : {}),
      isSubmitting: submitting,
    };
  }, [actionPayload, form?.actions, submitting]);

  const resolvedFormLayout = useMemo<
    DynamicFormProps<CustomMutationValues>["layout"]
  >(
    () => ({
      variant: "popup",
      ...(form?.layout ?? {}),
    }),
    [form?.layout],
  );

  const triggerDisabled =
    Boolean(button?.disabled) || Boolean(disabledReason) || submitting;

  return (
    <>
      {renderTrigger ? (
        renderTrigger({
          open: openOverlay,
          disabled: triggerDisabled,
          loading,
          mutation: mutationMetadata,
        })
      ) : (
        <Button
          type="button"
          variant={button?.variant ?? "default"}
          size={button?.size ?? "sm"}
          className={cn("gap-2", button?.className)}
          disabled={triggerDisabled}
          onClick={openOverlay}
          title={disabledReason ?? undefined}
        >
          {loading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            (button?.icon ?? <Zap className="size-4" />)
          )}
          {loading
            ? (button?.loadingLabel ?? resolvedButtonLabel)
            : resolvedButtonLabel}
        </Button>
      )}

      {mutationMetadata && actionMode ? (
        <FormOverlay
          mode={popup?.type ?? "modal"}
          open={open}
          onOpenChange={handleOpenChange}
          title={overlayTitle}
          width={popup?.width}
          height={popup?.height}
          drawerDirection={popup?.drawerDirection ?? "right"}
        >
          {actionMode === "confirm" ? (
            <div className="space-y-4">
              {overlayDescription ? (
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {overlayDescription}
                </p>
              ) : null}
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={closeOverlay}
                  disabled={submitting}
                >
                  {typeof actionPayload?.cancel_label === "string" &&
                  actionPayload.cancel_label.trim()
                    ? actionPayload.cancel_label.trim()
                    : "Cancel"}
                </Button>
                <Button
                  type="button"
                  variant={
                    actionPayload?.severity === "destructive"
                      ? "destructive"
                      : "default"
                  }
                  onClick={() => {
                    void execute({});
                  }}
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Executing...
                    </>
                  ) : typeof actionPayload?.confirm_label === "string" &&
                    actionPayload.confirm_label.trim() ? (
                    actionPayload.confirm_label.trim()
                  ) : (
                    "Confirm"
                  )}
                </Button>
              </div>
            </div>
          ) : generatedSchema ? (
            <div className="space-y-4">
              {overlayDescription ? (
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {overlayDescription}
                </p>
              ) : null}
              <DynamicForm
                key={mutationMetadata.name}
                schema={generatedSchema}
                state={{
                  defaultValues,
                  disableAutoReset: true,
                  isLoading: submitting,
                }}
                behavior={{
                  onSubmit: async (values) => {
                    await execute(values as Record<string, unknown>);
                  },
                }}
                actions={resolvedFormActions}
                layout={resolvedFormLayout}
              />
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">
              This action did not provide a usable form schema.
            </div>
          )}
        </FormOverlay>
      ) : null}
    </>
  );
}
