"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery } from "@apollo/client";
import { ChevronDown, FileText, Loader2 } from "lucide-react";
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
  MODEL_TEMPLATES_METADATA_QUERY,
  type TemplateInfo,
} from "@/shared/api/graphql/graphql/metadata";
import type { DynamicFormProps, FormFieldConfig } from "@/widgets/model-form/inputs/types";
import DynamicForm from "@/widgets/model-form/inputs/form";
import { FormOverlay } from "@/widgets/model-table/components/ModelTableOverlays";
import type { TemplatePdfPreviewPayload } from "@/widgets/model-table/utils/templateExecution";
import type {
  ModelTemplateActionButtonConfig,
  ModelTemplateActionErrorContext,
  ModelTemplateActionExecutionConfig,
  ModelTemplateActionFormConfig,
  ModelTemplateActionPopupConfig,
  ModelTemplateActionQueryOptions,
  ModelTemplateActionSuccessContext,
} from "./ModelTemplateAction";
import {
  buildTemplateSchema,
  executeModelTemplateAction,
  hasTemplateClientFields,
  matchesTemplateToken,
  resolveTemplateErrorMessage,
  resolveTemplateLabel,
  resolveTemplateTypeLabel,
} from "./modelTemplateAction.helpers";

type TemplateClientData = Record<string, unknown>;

export type ModelTemplatesDropdownItemOverride = {
  hidden?: boolean;
  disabled?: boolean;
  label?: React.ReactNode;
  popup?: ModelTemplateActionPopupConfig;
  form?: ModelTemplateActionFormConfig;
  template?: ModelTemplateActionExecutionConfig;
};

export type ModelTemplatesDropdownActionsConfig = {
  include?: string[];
  exclude?: string[];
  order?: string[];
  overrides?: Record<string, ModelTemplatesDropdownItemOverride>;
  emptyLabel?: React.ReactNode;
};

export type ModelTemplatesDropdownMenuConfig = {
  align?: "start" | "center" | "end";
  contentClassName?: string;
  loadingLabel?: React.ReactNode;
};

export type ModelTemplatesDropdownProps = {
  data: {
    app: string;
    model: string;
    objectId?: string | number | null;
  };
  button?: ModelTemplateActionButtonConfig;
  menu?: ModelTemplatesDropdownMenuConfig;
  popup?: ModelTemplateActionPopupConfig;
  form?: ModelTemplateActionFormConfig;
  template?: ModelTemplateActionExecutionConfig;
  actions?: ModelTemplatesDropdownActionsConfig;
  queryOptions?: ModelTemplateActionQueryOptions;
  onSuccess?: (context: ModelTemplateActionSuccessContext) => void;
  onError?: (
    error: Error,
    context: ModelTemplateActionErrorContext,
  ) => void;
  onOpenChange?: (open: boolean) => void;
  onMetadataLoaded?: (templates: TemplateInfo[]) => void;
  onPdfPreview?: (payload: TemplatePdfPreviewPayload) => void;
  renderTrigger?: (context: {
    open: boolean;
    disabled: boolean;
    loading: boolean;
    templates: TemplateInfo[];
  }) => React.ReactNode;
};

type ModelTemplatesMetadataQueryResult = {
  modelTemplates: TemplateInfo[] | null;
};

type ResolvedTemplateEntry = {
  template: TemplateInfo;
  override: ModelTemplatesDropdownItemOverride;
  label: React.ReactNode;
  disabledReason: string | null;
};

function resolveTemplateOverride(
  overrides: Record<string, ModelTemplatesDropdownItemOverride> | undefined,
  template: TemplateInfo,
): ModelTemplatesDropdownItemOverride {
  if (!overrides) return {};

  const direct = [template.key, template.urlPath]
    .map((value) => String(value ?? "").trim())
    .filter(Boolean);
  for (const key of direct) {
    const entry = overrides[key];
    if (entry) return entry;
  }

  const tail = String(template.urlPath ?? "")
    .split("/")
    .filter(Boolean)
    .at(-1);
  if (tail && overrides[tail]) {
    return overrides[tail];
  }

  return {};
}

function mergePopupConfig(
  base: ModelTemplateActionPopupConfig | undefined,
  extra: ModelTemplateActionPopupConfig | undefined,
): ModelTemplateActionPopupConfig {
  return {
    ...(base ?? {}),
    ...(extra ?? {}),
  };
}

function mergeFormConfig(
  base: ModelTemplateActionFormConfig | undefined,
  extra: ModelTemplateActionFormConfig | undefined,
): ModelTemplateActionFormConfig {
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

function mergeExecutionConfig(
  base: ModelTemplateActionExecutionConfig | undefined,
  extra: ModelTemplateActionExecutionConfig | undefined,
): ModelTemplateActionExecutionConfig {
  return {
    ...(base ?? {}),
    ...(extra ?? {}),
  };
}

function resolvePopupTitle(
  popup: ModelTemplateActionPopupConfig,
  template: TemplateInfo,
): React.ReactNode {
  if (popup.title !== undefined && popup.title !== null) {
    return popup.title;
  }

  return resolveTemplateLabel(template, undefined);
}

function resolvePopupDescription(
  popup: ModelTemplateActionPopupConfig,
  template: TemplateInfo,
): React.ReactNode | null {
  if (popup.description !== undefined && popup.description !== null) {
    return popup.description;
  }

  const description = String(template.description ?? "").trim();
  return description || null;
}

export function ModelTemplatesDropdown({
  data,
  button,
  menu,
  popup,
  form,
  template,
  actions,
  queryOptions,
  onSuccess,
  onError,
  onOpenChange,
  onMetadataLoaded,
  onPdfPreview,
  renderTrigger,
}: ModelTemplatesDropdownProps) {
  const [overlayOpen, setOverlayOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [activeTemplateKey, setActiveTemplateKey] = useState<string | null>(null);

  const objectIdValue =
    data.objectId === undefined || data.objectId === null
      ? null
      : String(data.objectId);
  const shouldSkip =
    queryOptions?.skip === true ||
    !data.app.trim() ||
    !data.model.trim();

  const { data: queryData, loading, error } =
    useQuery<ModelTemplatesMetadataQueryResult>(MODEL_TEMPLATES_METADATA_QUERY, {
      variables: {
        app: data.app,
        model: data.model,
        objectId: objectIdValue,
      },
      skip: shouldSkip,
      fetchPolicy: queryOptions?.fetchPolicy,
      nextFetchPolicy: queryOptions?.nextFetchPolicy,
    });

  const sourceTemplates = useMemo(
    () =>
      Array.isArray(queryData?.modelTemplates)
        ? queryData.modelTemplates.filter(Boolean)
        : [],
    [queryData?.modelTemplates],
  );

  useEffect(() => {
    if (sourceTemplates.length > 0) {
      onMetadataLoaded?.(sourceTemplates);
    }
  }, [onMetadataLoaded, sourceTemplates]);

  const resolvedEntries = useMemo<ResolvedTemplateEntry[]>(() => {
    const include = actions?.include ?? [];
    const exclude = actions?.exclude ?? [];
    const overrides = actions?.overrides;

    const filtered = sourceTemplates
      .filter((item) => {
        if (include.length > 0 && !include.some((token) => matchesTemplateToken(token, item))) {
          return false;
        }
        if (exclude.some((token) => matchesTemplateToken(token, item))) {
          return false;
        }

        const override = resolveTemplateOverride(overrides, item);
        return override.hidden !== true;
      })
      .map((item) => {
        const override = resolveTemplateOverride(overrides, item);
        const disabledReason =
          override.disabled === true
            ? "This template is disabled."
            : item.allowed === false
              ? item.denialReason || "You do not have permission to run this template."
              : !objectIdValue
                ? "Template execution requires objectId."
                : null;

        return {
          template: item,
          override,
          label: resolveTemplateLabel(item, override.label),
          disabledReason,
        } satisfies ResolvedTemplateEntry;
      });

    const order = actions?.order ?? [];
    if (order.length === 0) {
      return filtered;
    }

    const rankFor = (item: TemplateInfo) => {
      const index = order.findIndex((token) => matchesTemplateToken(token, item));
      return index === -1 ? Number.MAX_SAFE_INTEGER : index;
    };

    return [...filtered].sort((left, right) => {
      const leftRank = rankFor(left.template);
      const rightRank = rankFor(right.template);
      if (leftRank !== rightRank) return leftRank - rightRank;
      return String(left.template.key ?? "").localeCompare(
        String(right.template.key ?? ""),
      );
    });
  }, [
    actions?.exclude,
    actions?.include,
    actions?.order,
    actions?.overrides,
    objectIdValue,
    sourceTemplates,
  ]);

  const activeEntry = useMemo(
    () =>
      resolvedEntries.find((item) => item.template.key === activeTemplateKey) ??
      null,
    [activeTemplateKey, resolvedEntries],
  );
  const activeTemplate = activeEntry?.template ?? null;
  const activeRequiresForm = useMemo(
    () => (activeTemplate ? hasTemplateClientFields(activeTemplate) : false),
    [activeTemplate],
  );
  const activePopup = useMemo(
    () => mergePopupConfig(popup, activeEntry?.override.popup),
    [activeEntry?.override.popup, popup],
  );
  const activeForm = useMemo(
    () => mergeFormConfig(form, activeEntry?.override.form),
    [activeEntry?.override.form, form],
  );
  const activeExecutionConfig = useMemo(
    () => mergeExecutionConfig(template, activeEntry?.override.template),
    [activeEntry?.override.template, template],
  );

  const generatedSchema = useMemo(() => {
    if (!activeTemplate || !activeRequiresForm) {
      return null;
    }

    const baseSchema = buildTemplateSchema(
      activeTemplate,
      activeForm.fieldOverrides as Record<string, Partial<FormFieldConfig>> | undefined,
    );
    if (!baseSchema) {
      return null;
    }

    return activeForm.transformSchema
      ? activeForm.transformSchema(baseSchema, activeTemplate)
      : baseSchema;
  }, [activeForm, activeRequiresForm, activeTemplate]);

  const defaultValues = useMemo(
    () => ({
      ...(activeForm.defaults ?? {}),
    }),
    [activeForm.defaults],
  );

  const handleOverlayOpenChange = useCallback(
    (nextOpen: boolean) => {
      setOverlayOpen(nextOpen);
      onOpenChange?.(nextOpen);
      if (!nextOpen && !submitting) {
        setActiveTemplateKey(null);
      }
    },
    [onOpenChange, submitting],
  );

  const execute = useCallback(
    async (
      templateEntry: TemplateInfo,
      clientData: Record<string, unknown>,
      closeOnSuccess: boolean,
      executionConfig: ModelTemplateActionExecutionConfig,
    ) => {
      if (!objectIdValue) {
        const runtimeError = new Error("Template execution requires objectId.");
        onError?.(runtimeError, { template: templateEntry, clientData });
        throw runtimeError;
      }

      const transformedClientData = executionConfig.transformClientData
        ? executionConfig.transformClientData({
            clientData,
            template: templateEntry,
            data,
          })
        : clientData;

      setSubmitting(true);
      try {
        const result = await executeModelTemplateAction({
          template: templateEntry,
          objectId: objectIdValue,
          clientData: transformedClientData,
          onPdfPreview,
        });

        toast.success(
          executionConfig.successMessage ||
            (result.templateType === "pdf"
              ? `Template "${templateEntry.title}" generated.`
              : `Template "${templateEntry.title}" downloaded.`),
        );

        if (closeOnSuccess) {
          handleOverlayOpenChange(false);
        }

        onSuccess?.({
          template: templateEntry,
          clientData: transformedClientData,
          result,
        });

        return result;
      } catch (executionError) {
        const normalizedError =
          executionError instanceof Error
            ? executionError
            : new Error(
                resolveTemplateErrorMessage(
                  executionError,
                  "Template execution failed.",
                ),
              );
        toast.error(normalizedError.message);
        onError?.(normalizedError, {
          template: templateEntry,
          clientData: transformedClientData,
        });
        throw normalizedError;
      } finally {
        setSubmitting(false);
      }
    },
    [
      data,
      handleOverlayOpenChange,
      objectIdValue,
      onError,
      onPdfPreview,
      onSuccess,
    ],
  );

  const openEntry = useCallback(
    (entry: ResolvedTemplateEntry) => {
      if (entry.disabledReason) {
        toast.error(entry.disabledReason);
        return;
      }

      const entryExecutionConfig = mergeExecutionConfig(
        template,
        entry.override.template,
      );

      if (hasTemplateClientFields(entry.template)) {
        setActiveTemplateKey(entry.template.key);
        handleOverlayOpenChange(true);
        return;
      }

      void execute(entry.template, {}, false, entryExecutionConfig);
    },
    [execute, handleOverlayOpenChange, template],
  );

  const overlayTitle =
    activeTemplate && activeRequiresForm
      ? resolvePopupTitle(activePopup, activeTemplate)
      : button?.label ?? "Templates";
  const overlayDescription =
    activeTemplate && activeRequiresForm
      ? resolvePopupDescription(activePopup, activeTemplate)
      : null;

  const resolvedFormActions = useMemo<
    DynamicFormProps<TemplateClientData>["actions"]
  >(
    () => ({
      ...(activeForm.actions ?? {}),
      submitLabel:
        activeForm.actions?.submitLabel ||
        (activeTemplate && resolveTemplateTypeLabel(activeTemplate) === "excel"
          ? "Download"
          : "Generate"),
      isSubmitting: submitting,
    }),
    [activeForm.actions, activeTemplate, submitting],
  );

  const resolvedFormLayout = useMemo<
    DynamicFormProps<TemplateClientData>["layout"]
  >(
    () => ({
      variant: "popup",
      ...(activeForm.layout ?? {}),
    }),
    [activeForm.layout],
  );

  const triggerDisabled =
    Boolean(button?.disabled) ||
    shouldSkip ||
    Boolean(error) ||
    !objectIdValue ||
    resolvedEntries.length === 0;
  const triggerLabel = button?.label ?? "Templates";

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
                templates: resolvedEntries.map((item) => item.template),
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
                  ? "app and model are required."
                  : !objectIdValue
                    ? "objectId is required."
                    : error
                      ? resolveTemplateErrorMessage(
                          error,
                          "Template metadata failed to load.",
                        )
                      : undefined
              }
            >
              {loading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                button?.icon ?? <FileText className="size-4" />
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
                key={entry.template.key}
                disabled={Boolean(entry.disabledReason)}
                onClick={() => openEntry(entry)}
              >
                {entry.label}
              </DropdownMenuItem>
            ))
          ) : (
            <DropdownMenuItem disabled>
              {actions?.emptyLabel ?? "No templates available."}
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {activeTemplate && activeRequiresForm && generatedSchema ? (
        <FormOverlay
          mode={activePopup.type ?? "modal"}
          open={overlayOpen}
          onOpenChange={handleOverlayOpenChange}
          title={overlayTitle}
          width={activePopup.width}
          height={activePopup.height}
          drawerDirection={activePopup.drawerDirection ?? "right"}
        >
          <div className="space-y-4">
            {overlayDescription ? (
              <p className="text-sm leading-relaxed text-muted-foreground">
                {overlayDescription}
              </p>
            ) : null}
            <DynamicForm
              key={activeTemplate.key}
              schema={generatedSchema}
              state={{
                defaultValues,
                disableAutoReset: true,
                isLoading: submitting,
              }}
              behavior={{
                onSubmit: async (values) => {
                  await execute(
                    activeTemplate,
                    values as Record<string, unknown>,
                    activePopup.closeOnSuccess !== false,
                    activeExecutionConfig,
                  );
                },
              }}
              actions={resolvedFormActions}
              layout={resolvedFormLayout}
            />
          </div>
        </FormOverlay>
      ) : null}
    </>
  );
}
