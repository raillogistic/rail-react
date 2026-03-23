"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useApolloClient, useQuery } from "@apollo/client";
import { ChevronDown, Loader2, Zap } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/shared/ui/kit/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/ui/kit/dropdown-menu";
import { cn } from "@/shared/utils";
import {
  CUSTOM_MUTATIONS_METADATA_QUERY,
  type MutationMetadata,
} from "@/shared/api/graphql/graphql/metadata";
import type {
  DynamicFormProps,
  FormFieldConfig,
} from "@/widgets/model-form/inputs/types";
import DynamicForm from "@/widgets/model-form/inputs/form";
import { FormOverlay } from "@/widgets/model-table/components/ModelTableOverlays";
import type {
  CustomMutationActionButtonConfig,
  CustomMutationActionErrorContext,
  CustomMutationActionFormConfig,
  CustomMutationActionMutationConfig,
  CustomMutationActionPopupConfig,
  CustomMutationActionQueryOptions,
  CustomMutationActionSuccessContext,
} from "./CustomMutationAction";
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

export type CustomMutationsDropdownPopupConfig =
  CustomMutationActionPopupConfig & {
    message?: React.ReactNode;
    confirmLabel?: React.ReactNode;
    cancelLabel?: React.ReactNode;
    confirmVariant?: React.ComponentProps<typeof Button>["variant"];
  };

export type CustomMutationsDropdownItemOverride = {
  hidden?: boolean;
  disabled?: boolean;
  label?: React.ReactNode;
  popup?: CustomMutationsDropdownPopupConfig;
  form?: CustomMutationActionFormConfig;
  mutation?: CustomMutationActionMutationConfig;
};

export type CustomMutationsDropdownActionsConfig = {
  include?: string[];
  exclude?: string[];
  order?: string[];
  overrides?: Record<string, CustomMutationsDropdownItemOverride>;
  emptyLabel?: React.ReactNode;
};

export type CustomMutationsDropdownMenuConfig = {
  align?: "start" | "center" | "end";
  contentClassName?: string;
  loadingLabel?: React.ReactNode;
};

export type CustomMutationsDropdownProps = {
  data: {
    app: string;
    model: string;
    funcName?: string;
    objectId?: string | number | null;
  };
  button?: CustomMutationActionButtonConfig;
  menu?: CustomMutationsDropdownMenuConfig;
  popup?: CustomMutationsDropdownPopupConfig;
  form?: CustomMutationActionFormConfig;
  mutation?: CustomMutationActionMutationConfig;
  actions?: CustomMutationsDropdownActionsConfig;
  queryOptions?: CustomMutationActionQueryOptions;
  onSuccess?: (context: CustomMutationActionSuccessContext) => void;
  onError?: (
    error: Error,
    context: CustomMutationActionErrorContext,
  ) => void;
  onOpenChange?: (open: boolean) => void;
  onMetadataLoaded?: (mutations: MutationMetadata[]) => void;
  renderTrigger?: (context: {
    open: boolean;
    disabled: boolean;
    loading: boolean;
    mutations: MutationMetadata[];
  }) => React.ReactNode;
};

type CustomMutationsMetadataQueryResult = {
  customMutations: MutationMetadata[] | null;
};

type ResolvedMutationEntry = {
  mutation: MutationMetadata;
  override: CustomMutationsDropdownItemOverride;
  label: React.ReactNode;
  disabledReason: string | null;
};

function resolveActionKeys(mutation: MutationMetadata): string[] {
  return [mutation.methodName, mutation.name]
    .map((value) => String(value ?? "").trim())
    .filter(Boolean);
}

function resolveItemOverride(
  overrides: Record<string, CustomMutationsDropdownItemOverride> | undefined,
  mutation: MutationMetadata,
): CustomMutationsDropdownItemOverride {
  if (!overrides) return {};

  for (const key of resolveActionKeys(mutation)) {
    const entry = overrides[key];
    if (entry) return entry;
  }

  return {};
}

function matchesActionToken(token: string, mutation: MutationMetadata): boolean {
  const wanted = token.trim().toLowerCase();
  if (!wanted) return false;

  return resolveActionKeys(mutation).some(
    (candidate) => candidate.trim().toLowerCase() === wanted,
  );
}

function resolveDisplayLabel(
  mutation: MutationMetadata,
  overrideLabel: React.ReactNode | undefined,
): React.ReactNode {
  if (overrideLabel !== undefined && overrideLabel !== null) {
    return overrideLabel;
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

function mergePopupConfig(
  base: CustomMutationsDropdownPopupConfig | undefined,
  extra: CustomMutationsDropdownPopupConfig | undefined,
): CustomMutationsDropdownPopupConfig {
  return {
    ...(base ?? {}),
    ...(extra ?? {}),
  };
}

function mergeFormConfig(
  base: CustomMutationActionFormConfig | undefined,
  extra: CustomMutationActionFormConfig | undefined,
): CustomMutationActionFormConfig {
  return {
    ...(base ?? {}),
    ...(extra ?? {}),
    defaults: {
      ...(base?.defaults ?? {}),
      ...(extra?.defaults ?? {}),
    },
    fieldOverrides: {
      ...(base?.fieldOverrides ?? {}),
      ...(extra?.fieldOverrides ?? {}),
    },
    layout: {
      ...(base?.layout ?? {}),
      ...(extra?.layout ?? {}),
    },
    actions: {
      ...(base?.actions ?? {}),
      ...(extra?.actions ?? {}),
    },
    transformSchema: extra?.transformSchema ?? base?.transformSchema,
  };
}

function mergeMutationConfig(
  base: CustomMutationActionMutationConfig | undefined,
  extra: CustomMutationActionMutationConfig | undefined,
): CustomMutationActionMutationConfig {
  return {
    ...(base ?? {}),
    ...(extra ?? {}),
    identifier: {
      ...(base?.identifier ?? {}),
      ...(extra?.identifier ?? {}),
    },
  };
}

function resolvePopupTitle(
  popup: CustomMutationsDropdownPopupConfig,
  mutation: MutationMetadata,
): React.ReactNode {
  if (popup.title !== undefined && popup.title !== null) {
    return popup.title;
  }

  const actionPayload = parseJsonObject(mutation.action);
  if (typeof actionPayload?.title === "string" && actionPayload.title.trim()) {
    return actionPayload.title.trim();
  }

  return resolveDisplayLabel(mutation, undefined);
}

function resolvePopupDescription(
  popup: CustomMutationsDropdownPopupConfig,
  mutation: MutationMetadata,
  mode: "confirm" | "form",
): React.ReactNode | null {
  if (popup.description !== undefined && popup.description !== null) {
    return popup.description;
  }
  if (popup.message !== undefined && popup.message !== null) {
    return popup.message;
  }

  const actionPayload = parseJsonObject(mutation.action);
  if (typeof actionPayload?.message === "string" && actionPayload.message.trim()) {
    return actionPayload.message.trim();
  }
  if (typeof mutation.description === "string" && mutation.description.trim()) {
    return mutation.description.trim();
  }

  return mode === "confirm" ? "Do you want to execute this action?" : null;
}

function resolveConfirmLabel(
  popup: CustomMutationsDropdownPopupConfig,
  mutation: MutationMetadata,
): React.ReactNode {
  if (popup.confirmLabel !== undefined && popup.confirmLabel !== null) {
    return popup.confirmLabel;
  }

  const actionPayload = parseJsonObject(mutation.action);
  if (
    typeof actionPayload?.confirm_label === "string" &&
    actionPayload.confirm_label.trim()
  ) {
    return actionPayload.confirm_label.trim();
  }

  return "Confirm";
}

function resolveCancelLabel(
  popup: CustomMutationsDropdownPopupConfig,
  mutation: MutationMetadata,
): React.ReactNode {
  if (popup.cancelLabel !== undefined && popup.cancelLabel !== null) {
    return popup.cancelLabel;
  }

  const actionPayload = parseJsonObject(mutation.action);
  if (
    typeof actionPayload?.cancel_label === "string" &&
    actionPayload.cancel_label.trim()
  ) {
    return actionPayload.cancel_label.trim();
  }

  return "Cancel";
}

export function CustomMutationsDropdown({
  data,
  button,
  menu,
  popup,
  form,
  mutation,
  actions,
  queryOptions,
  onSuccess,
  onError,
  onOpenChange,
  onMetadataLoaded,
  renderTrigger,
}: CustomMutationsDropdownProps) {
  const apolloClient = useApolloClient();
  const [overlayOpen, setOverlayOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [activeMutationName, setActiveMutationName] = useState<string | null>(null);

  const objectIdValue =
    data.objectId === undefined || data.objectId === null
      ? null
      : String(data.objectId);
  const shouldSkip =
    queryOptions?.skip === true ||
    !data.app.trim() ||
    !data.model.trim() ||
    !objectIdValue;

  const { data: queryData, loading, error } =
    useQuery<CustomMutationsMetadataQueryResult>(CUSTOM_MUTATIONS_METADATA_QUERY, {
      variables: {
        app: data.app,
        model: data.model,
        objectId: objectIdValue,
      },
      skip: shouldSkip,
      fetchPolicy: queryOptions?.fetchPolicy,
      nextFetchPolicy: queryOptions?.nextFetchPolicy,
    });

  const sourceMutations = useMemo(
    () =>
      Array.isArray(queryData?.customMutations)
        ? queryData.customMutations.filter(Boolean)
        : [],
    [queryData?.customMutations],
  );

  useEffect(() => {
    if (sourceMutations.length > 0) {
      onMetadataLoaded?.(sourceMutations);
    }
  }, [onMetadataLoaded, sourceMutations]);

  const resolvedEntries = useMemo<ResolvedMutationEntry[]>(() => {
    const include = actions?.include ?? [];
    const exclude = actions?.exclude ?? [];
    const overrides = actions?.overrides;

    const filtered = sourceMutations
      .filter((item) => {
        if (include.length > 0 && !include.some((token) => matchesActionToken(token, item))) {
          return false;
        }
        if (exclude.some((token) => matchesActionToken(token, item))) {
          return false;
        }
        const override = resolveItemOverride(overrides, item);
        return override.hidden !== true;
      })
      .map((item) => {
        const override = resolveItemOverride(overrides, item);
        const disabledReason =
          override.disabled === true
            ? "This action is disabled."
            : item.allowed === false
              ? item.reason || "You do not have permission to run this action."
              : null;

        return {
          mutation: item,
          override,
          label: resolveDisplayLabel(item, override.label),
          disabledReason,
        } satisfies ResolvedMutationEntry;
      });

    const order = actions?.order ?? [];
    if (order.length === 0) {
      return filtered;
    }

    const rankFor = (item: MutationMetadata) => {
      const index = order.findIndex((token) => matchesActionToken(token, item));
      return index === -1 ? Number.MAX_SAFE_INTEGER : index;
    };

    return [...filtered].sort((left, right) => {
      const leftRank = rankFor(left.mutation);
      const rightRank = rankFor(right.mutation);
      if (leftRank !== rightRank) return leftRank - rightRank;
      return String(left.mutation.name ?? "").localeCompare(
        String(right.mutation.name ?? ""),
      );
    });
  }, [
    actions?.exclude,
    actions?.include,
    actions?.order,
    actions?.overrides,
    sourceMutations,
  ]);

  const activeEntry = useMemo(
    () =>
      resolvedEntries.find((item) => item.mutation.name === activeMutationName) ??
      null,
    [activeMutationName, resolvedEntries],
  );
  const activeMutation = activeEntry?.mutation ?? null;
  const activeFields = useMemo(
    () => (activeMutation ? normalizeMutationInputFields(activeMutation) : []),
    [activeMutation],
  );
  const activeMode = useMemo(
    () =>
      activeMutation
        ? resolveMutationActionMode(activeMutation, activeFields)
        : null,
    [activeFields, activeMutation],
  );
  const activePopup = useMemo(
    () => mergePopupConfig(popup, activeEntry?.override.popup),
    [activeEntry?.override.popup, popup],
  );
  const activeForm = useMemo(
    () => mergeFormConfig(form, activeEntry?.override.form),
    [activeEntry?.override.form, form],
  );
  const activeMutationConfig = useMemo(
    () => mergeMutationConfig(mutation, activeEntry?.override.mutation),
    [activeEntry?.override.mutation, mutation],
  );

  const generatedSchema = useMemo(() => {
    if (!activeMutation || activeMode !== "form") {
      return null;
    }

    const baseSchema = buildMutationSchema(activeFields);
    const mergedSchema = applyFieldOverrides(
      baseSchema,
      activeForm.fieldOverrides,
    );
    if (!mergedSchema) {
      return null;
    }

    return activeForm.transformSchema
      ? activeForm.transformSchema(mergedSchema, activeMutation)
      : mergedSchema;
  }, [activeFields, activeForm, activeMode, activeMutation]);

  const defaultValues = useMemo(
    () => ({
      ...buildMutationDefaults(activeFields),
      ...(activeForm.defaults ?? {}),
    }),
    [activeFields, activeForm.defaults],
  );

  const overlayTitle =
    activeMutation && activeMode
      ? resolvePopupTitle(activePopup, activeMutation)
      : button?.label ?? "Actions";
  const overlayDescription =
    activeMutation && activeMode
      ? resolvePopupDescription(activePopup, activeMutation, activeMode)
      : null;

  const resolvedFormActions = useMemo<
    DynamicFormProps<CustomMutationValues>["actions"]
  >(() => {
    const actionPayload = parseJsonObject(activeMutation?.action);
    const submitLabel =
      activeForm.actions?.submitLabel ||
      (typeof actionPayload?.submit_label === "string" &&
      actionPayload.submit_label.trim()
        ? actionPayload.submit_label.trim()
        : "Execute");
    const resetLabel =
      activeForm.actions?.resetLabel ||
      (typeof actionPayload?.cancel_label === "string" &&
      actionPayload.cancel_label.trim()
        ? actionPayload.cancel_label.trim()
        : undefined);

    return {
      ...(activeForm.actions ?? {}),
      submitLabel,
      ...(resetLabel ? { resetLabel } : {}),
      isSubmitting: submitting,
    };
  }, [activeForm.actions, activeMutation?.action, submitting]);

  const resolvedFormLayout = useMemo<
    DynamicFormProps<CustomMutationValues>["layout"]
  >(
    () => ({
      variant: "popup",
      ...(activeForm.layout ?? {}),
    }),
    [activeForm.layout],
  );

  const handleOverlayOpenChange = useCallback(
    (nextOpen: boolean) => {
      setOverlayOpen(nextOpen);
      onOpenChange?.(nextOpen);
      if (!nextOpen && !submitting) {
        setActiveMutationName(null);
      }
    },
    [onOpenChange, submitting],
  );

  const openEntry = useCallback((entry: ResolvedMutationEntry) => {
    if (entry.disabledReason) {
      toast.error(entry.disabledReason);
      return;
    }

    setActiveMutationName(entry.mutation.name);
    handleOverlayOpenChange(true);
  }, [handleOverlayOpenChange]);

  const execute = useCallback(
    async (payload: Record<string, unknown>) => {
      if (!activeMutation) {
        const runtimeError = new Error("Action metadata is unavailable.");
        onError?.(runtimeError, { mutation: null, payload });
        throw runtimeError;
      }

      const transformedPayload = activeMutationConfig.transformPayload
        ? activeMutationConfig.transformPayload({
            payload,
            mutation: activeMutation,
            data,
          })
        : payload;

      const identifier = activeMutationConfig.identifier ?? {};
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
          mutation: activeMutation,
          modelName: data.model,
          payload: transformedPayload,
          identifier: identifierConfig,
          buildVariables: activeMutationConfig.buildVariables
            ? (context) =>
                activeMutationConfig.buildVariables?.({
                  ...context,
                  data,
                }) ?? context.baseVariables
            : undefined,
        });

        toast.success(
          activeMutationConfig.successMessage ||
            activeMutation.successMessage ||
            "Action executed successfully.",
        );

        if (activePopup.closeOnSuccess !== false) {
          handleOverlayOpenChange(false);
        }

        onSuccess?.({
          mutation: activeMutation,
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
          mutation: activeMutation,
          payload: transformedPayload,
        });
        throw normalizedError;
      } finally {
        setSubmitting(false);
      }
    },
    [
      activeMutation,
      activeMutationConfig,
      activePopup.closeOnSuccess,
      apolloClient,
      data,
      handleOverlayOpenChange,
      objectIdValue,
      onError,
      onSuccess,
    ],
  );

  const triggerDisabled =
    Boolean(button?.disabled) ||
    shouldSkip ||
    Boolean(error) ||
    resolvedEntries.length === 0;
  const triggerLabel = button?.label ?? "Actions";

  return (
    <>
      <DropdownMenu>
        {renderTrigger ? (
          <DropdownMenuTrigger asChild>
            <span>
              {renderTrigger({
                open: overlayOpen,
                disabled: triggerDisabled,
                loading,
                mutations: resolvedEntries.map((item) => item.mutation),
              })}
            </span>
          </DropdownMenuTrigger>
        ) : (
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant={button?.variant ?? "outline"}
              size={button?.size ?? "sm"}
              className={cn("gap-2", button?.className)}
              disabled={triggerDisabled}
              title={
                shouldSkip
                  ? "app, model and objectId are required."
                  : error
                    ? getErrorMessage(error, "Action metadata failed to load.")
                    : undefined
              }
            >
              {loading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                button?.icon ?? <Zap className="size-4" />
              )}
              {loading ? menu?.loadingLabel ?? triggerLabel : triggerLabel}
              <ChevronDown className="size-4 opacity-70" />
            </Button>
          </DropdownMenuTrigger>
        )}

        <DropdownMenuContent
          align={menu?.align ?? "end"}
          className={cn("min-w-56", menu?.contentClassName)}
        >
          {resolvedEntries.length > 0 ? (
            resolvedEntries.map((entry) => (
              <DropdownMenuItem
                key={entry.mutation.name}
                disabled={Boolean(entry.disabledReason)}
                onClick={() => openEntry(entry)}
              >
                {entry.label}
              </DropdownMenuItem>
            ))
          ) : (
            <DropdownMenuItem disabled>
              {actions?.emptyLabel ?? "No actions available."}
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {activeMutation && activeMode ? (
        <FormOverlay
          mode={activePopup.type ?? "modal"}
          open={overlayOpen}
          onOpenChange={handleOverlayOpenChange}
          title={overlayTitle}
          width={activePopup.width}
          height={activePopup.height}
          drawerDirection={activePopup.drawerDirection ?? "right"}
        >
          {activeMode === "confirm" ? (
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
                  onClick={() => handleOverlayOpenChange(false)}
                  disabled={submitting}
                >
                  {resolveCancelLabel(activePopup, activeMutation)}
                </Button>
                <Button
                  type="button"
                  variant={activePopup.confirmVariant ?? "default"}
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
                  ) : (
                    resolveConfirmLabel(activePopup, activeMutation)
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
                key={activeMutation.name}
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
