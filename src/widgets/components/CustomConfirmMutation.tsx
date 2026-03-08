"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useApolloClient, useQuery } from "@apollo/client";
import { Loader2, Zap } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/shared/ui/kit/button";
import { cn } from "@/shared/utils";
import {
  CUSTOM_MUTATION_METADATA_QUERY,
  type MutationMetadata,
} from "@/shared/api/graphql/graphql/metadata";
import { FormOverlay } from "@/widgets/model-table/components/ModelTableOverlays";
import type {
  CustomMutationActionButtonConfig,
  CustomMutationActionData,
  CustomMutationActionErrorContext,
  CustomMutationActionMutationConfig,
  CustomMutationActionQueryOptions,
  CustomMutationActionSuccessContext,
} from "./CustomMutationAction";
import {
  executeCustomMutationAction,
  getErrorMessage,
  humanizeLabel,
  normalizeMutationInputFields,
  parseJsonObject,
  type MutationActionIdentifierConfig,
} from "./customMutationAction.helpers";

export type CustomConfirmMutationPopupConfig = {
  type?: "modal" | "drawer";
  title?: React.ReactNode;
  message?: React.ReactNode;
  description?: React.ReactNode;
  confirmLabel?: React.ReactNode;
  cancelLabel?: React.ReactNode;
  confirmVariant?: React.ComponentProps<typeof Button>["variant"];
  width?: string;
  height?: string;
  drawerDirection?: "left" | "right" | "top" | "bottom";
  closeOnSuccess?: boolean;
};

export type CustomConfirmMutationProps = {
  data: CustomMutationActionData;
  popup?: CustomConfirmMutationPopupConfig;
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
  mutation: MutationMetadata,
  popup?: CustomConfirmMutationPopupConfig,
): React.ReactNode {
  if (popup?.title !== undefined && popup.title !== null) {
    return popup.title;
  }

  const actionPayload = parseJsonObject(mutation.action);
  if (typeof actionPayload?.title === "string" && actionPayload.title.trim()) {
    return actionPayload.title.trim();
  }

  return resolveDisplayLabel(mutation, undefined);
}

function resolvePopupMessage(
  mutation: MutationMetadata,
  popup?: CustomConfirmMutationPopupConfig,
): React.ReactNode {
  if (popup?.message !== undefined && popup.message !== null) {
    return popup.message;
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

  return "Do you want to execute this action?";
}

function resolvePopupDescription(
  mutation: MutationMetadata,
  popup?: CustomConfirmMutationPopupConfig,
): React.ReactNode | null {
  if (popup?.description !== undefined && popup.description !== null) {
    return popup.description;
  }

  const actionPayload = parseJsonObject(mutation.action);
  if (
    typeof actionPayload?.description === "string" &&
    actionPayload.description.trim()
  ) {
    return actionPayload.description.trim();
  }

  return null;
}

export function CustomConfirmMutation({
  data,
  popup,
  button,
  queryOptions,
  mutation,
  onSuccess,
  onError,
  onOpenChange,
  onMetadataLoaded,
  renderTrigger,
}: CustomConfirmMutationProps) {
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
  console.log(queryData);

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
  const actionPayload = useMemo(
    () => parseJsonObject(mutationMetadata?.action),
    [mutationMetadata],
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
    if (inputFields.length > 0) {
      return "This mutation requires form inputs. Use CustomMutationAction instead.";
    }
    return null;
  }, [
    button?.disabled,
    error,
    inputFields.length,
    loading,
    mutationMetadata,
    shouldSkip,
  ]);

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

  const execute = useCallback(async () => {
    if (!mutationMetadata) {
      const runtimeError = new Error("Action metadata is unavailable.");
      onError?.(runtimeError, { mutation: null, payload: {} });
      throw runtimeError;
    }

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
        payload: {},
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
        payload: {},
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
        payload: {},
      });
      throw normalizedError;
    } finally {
      setSubmitting(false);
    }
  }, [
    apolloClient,
    data,
    handleOpenChange,
    mutation,
    mutationMetadata,
    objectIdValue,
    onError,
    onSuccess,
    popup?.closeOnSuccess,
  ]);

  const triggerDisabled =
    Boolean(button?.disabled) || Boolean(disabledReason) || submitting;
  const resolvedButtonLabel = resolveDisplayLabel(
    mutationMetadata,
    button?.label,
  );
  const popupTitle = mutationMetadata
    ? resolvePopupTitle(mutationMetadata, popup)
    : popup?.title;
  const popupMessage = mutationMetadata
    ? resolvePopupMessage(mutationMetadata, popup)
    : popup?.message;
  const popupDescription = mutationMetadata
    ? resolvePopupDescription(mutationMetadata, popup)
    : popup?.description;
  const confirmLabel =
    popup?.confirmLabel ||
    (typeof actionPayload?.confirm_label === "string" &&
    actionPayload.confirm_label.trim()
      ? actionPayload.confirm_label.trim()
      : "Confirm");
  const cancelLabel =
    popup?.cancelLabel ||
    (typeof actionPayload?.cancel_label === "string" &&
    actionPayload.cancel_label.trim()
      ? actionPayload.cancel_label.trim()
      : "Cancel");

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

      {mutationMetadata ? (
        <FormOverlay
          mode={popup?.type ?? "modal"}
          open={open}
          onOpenChange={handleOpenChange}
          title={popupTitle ?? resolvedButtonLabel}
          width={popup?.width}
          height={popup?.height}
          drawerDirection={popup?.drawerDirection ?? "right"}
        >
          <div className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm leading-relaxed text-foreground">
                {popupMessage}
              </p>
              {popupDescription ? (
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {popupDescription}
                </p>
              ) : null}
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={closeOverlay}
                disabled={submitting}
              >
                {cancelLabel}
              </Button>
              <Button
                type="button"
                variant={popup?.confirmVariant ?? "default"}
                onClick={() => {
                  void execute();
                }}
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Executing...
                  </>
                ) : (
                  confirmLabel
                )}
              </Button>
            </div>
          </div>
        </FormOverlay>
      ) : null}
    </>
  );
}
