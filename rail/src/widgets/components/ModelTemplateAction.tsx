"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery, type FetchPolicy } from "@apollo/client";
import { FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/shared/ui/kit/button";
import { cn } from "@/shared/utils";
import {
  MODEL_TEMPLATE_METADATA_QUERY,
  type TemplateInfo,
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
import type { TemplatePdfPreviewPayload } from "@/widgets/model-table/utils/templateExecution";
import {
  executeModelTemplateAction,
  buildTemplateSchema,
  hasTemplateClientFields,
  resolveTemplateErrorMessage,
  resolveTemplateLabel,
  resolveTemplateTypeLabel,
  type TemplateExecutionResult,
} from "./modelTemplateAction.helpers";

type TemplateClientData = Record<string, unknown>;

export type ModelTemplateActionData = {
  app: string;
  model: string;
  funcName?: string;
  objectId?: string | number | null;
};

export type ModelTemplateActionPopupConfig = {
  type?: "modal" | "drawer";
  title?: React.ReactNode;
  description?: React.ReactNode;
  width?: string;
  height?: string;
  drawerDirection?: "left" | "right" | "top" | "bottom";
  closeOnSuccess?: boolean;
};

export type ModelTemplateActionFormConfig = {
  defaults?: Record<string, unknown>;
  fieldOverrides?: Record<string, Partial<FormFieldConfig>>;
  layout?: FormLayoutConfig<TemplateClientData>;
  actions?: FormActionsConfig<TemplateClientData>;
  transformSchema?: (
    schema: FormSchema<TemplateClientData>,
    template: TemplateInfo,
  ) => FormSchema<TemplateClientData>;
};

export type ModelTemplateActionButtonConfig = {
  label?: React.ReactNode;
  icon?: React.ReactNode;
  variant?: React.ComponentProps<typeof Button>["variant"];
  size?: React.ComponentProps<typeof Button>["size"];
  className?: string;
  disabled?: boolean;
  loadingLabel?: React.ReactNode;
};

export type ModelTemplateActionQueryOptions = {
  skip?: boolean;
  fetchPolicy?: FetchPolicy;
  nextFetchPolicy?: FetchPolicy;
};

export type ModelTemplateActionExecutionConfig = {
  successMessage?: string;
  transformClientData?: (context: {
    clientData: Record<string, unknown>;
    template: TemplateInfo;
    data: ModelTemplateActionData;
  }) => Record<string, unknown>;
};

export type ModelTemplateActionSuccessContext = {
  template: TemplateInfo;
  clientData: Record<string, unknown>;
  result: TemplateExecutionResult;
};

export type ModelTemplateActionErrorContext = {
  template: TemplateInfo | null;
  clientData: Record<string, unknown> | null;
};

export type ModelTemplateActionProps = {
  data: ModelTemplateActionData;
  popup?: ModelTemplateActionPopupConfig;
  form?: ModelTemplateActionFormConfig;
  button?: ModelTemplateActionButtonConfig;
  queryOptions?: ModelTemplateActionQueryOptions;
  template?: ModelTemplateActionExecutionConfig;
  onSuccess?: (context: ModelTemplateActionSuccessContext) => void;
  onError?: (
    error: Error,
    context: ModelTemplateActionErrorContext,
  ) => void;
  onOpenChange?: (open: boolean) => void;
  onMetadataLoaded?: (template: TemplateInfo) => void;
  onPdfPreview?: (payload: TemplatePdfPreviewPayload) => void;
  renderTrigger?: (context: {
    run: () => void;
    disabled: boolean;
    loading: boolean;
    template: TemplateInfo | null;
  }) => React.ReactNode;
};

type ModelTemplateMetadataQueryResult = {
  modelTemplate: TemplateInfo | null;
};

function resolvePopupTitle(
  popupTitle: React.ReactNode | undefined,
  template: TemplateInfo,
): React.ReactNode {
  if (popupTitle !== undefined && popupTitle !== null) {
    return popupTitle;
  }

  return resolveTemplateLabel(template, undefined);
}

function resolvePopupDescription(
  popupDescription: React.ReactNode | undefined,
  template: TemplateInfo,
): React.ReactNode | null {
  if (popupDescription !== undefined && popupDescription !== null) {
    return popupDescription;
  }

  const description = String(template.description ?? "").trim();
  return description || null;
}

export function ModelTemplateAction({
  data,
  popup,
  form,
  button,
  queryOptions,
  template,
  onSuccess,
  onError,
  onOpenChange,
  onMetadataLoaded,
  onPdfPreview,
  renderTrigger,
}: ModelTemplateActionProps) {
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

  const { data: queryData, loading, error } =
    useQuery<ModelTemplateMetadataQueryResult>(MODEL_TEMPLATE_METADATA_QUERY, {
      variables: {
        app: data.app,
        model: data.model,
        functionName: data.funcName,
        objectId: objectIdValue,
      },
      skip: shouldSkip,
      fetchPolicy: queryOptions?.fetchPolicy,
      nextFetchPolicy: queryOptions?.nextFetchPolicy,
    });

  const templateMetadata = queryData?.modelTemplate ?? null;

  useEffect(() => {
    if (templateMetadata) {
      onMetadataLoaded?.(templateMetadata);
    }
  }, [onMetadataLoaded, templateMetadata]);

  const requiresForm = useMemo(
    () => (templateMetadata ? hasTemplateClientFields(templateMetadata) : false),
    [templateMetadata],
  );
  const generatedSchema = useMemo(() => {
    if (!templateMetadata || !requiresForm) {
      return null;
    }

    const baseSchema = buildTemplateSchema(
      templateMetadata,
      form?.fieldOverrides,
    );
    if (!baseSchema) {
      return null;
    }

    return form?.transformSchema
      ? form.transformSchema(baseSchema, templateMetadata)
      : baseSchema;
  }, [form, requiresForm, templateMetadata]);

  const defaultValues = useMemo(
    () => ({
      ...(form?.defaults ?? {}),
    }),
    [form?.defaults],
  );

  const disabledReason = useMemo(() => {
    if (button?.disabled) return "This template action is disabled.";
    if (shouldSkip) return "Template data is incomplete.";
    if (loading) return null;
    if (error) return resolveTemplateErrorMessage(error, "Template metadata failed to load.");
    if (!templateMetadata) return "Template metadata is unavailable.";
    if (templateMetadata.allowed === false) {
      return templateMetadata.denialReason || "You do not have permission to run this template.";
    }
    if (!objectIdValue) {
      return "Template execution requires objectId.";
    }
    return null;
  }, [button?.disabled, error, loading, objectIdValue, shouldSkip, templateMetadata]);

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      setOpen(nextOpen);
      onOpenChange?.(nextOpen);
    },
    [onOpenChange],
  );

  const execute = useCallback(
    async (clientData: Record<string, unknown>) => {
      if (!templateMetadata || !objectIdValue) {
        const runtimeError = new Error("Template metadata is unavailable.");
        onError?.(runtimeError, {
          template: templateMetadata,
          clientData,
        });
        throw runtimeError;
      }

      const transformedClientData = template?.transformClientData
        ? template.transformClientData({
            clientData,
            template: templateMetadata,
            data,
          })
        : clientData;

      setSubmitting(true);
      try {
        const result = await executeModelTemplateAction({
          template: templateMetadata,
          objectId: objectIdValue,
          clientData: transformedClientData,
          onPdfPreview,
        });

        const successMessage =
          template?.successMessage ||
          (result.templateType === "pdf"
            ? `Template "${templateMetadata.title}" generated.`
            : `Template "${templateMetadata.title}" downloaded.`);
        toast.success(successMessage);

        if (requiresForm && popup?.closeOnSuccess !== false) {
          handleOpenChange(false);
        }

        onSuccess?.({
          template: templateMetadata,
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
          template: templateMetadata,
          clientData: transformedClientData,
        });
        throw normalizedError;
      } finally {
        setSubmitting(false);
      }
    },
    [
      data,
      handleOpenChange,
      objectIdValue,
      onError,
      onPdfPreview,
      onSuccess,
      popup?.closeOnSuccess,
      requiresForm,
      template,
      templateMetadata,
    ],
  );

  const handleRun = useCallback(() => {
    if (disabledReason) {
      toast.error(disabledReason);
      return;
    }

    if (requiresForm) {
      handleOpenChange(true);
      return;
    }

    void execute({});
  }, [disabledReason, execute, handleOpenChange, requiresForm]);

  const overlayTitle =
    templateMetadata && requiresForm
      ? resolvePopupTitle(popup?.title, templateMetadata)
      : popup?.title ?? resolveTemplateLabel(templateMetadata, button?.label);
  const overlayDescription =
    templateMetadata && requiresForm
      ? resolvePopupDescription(popup?.description, templateMetadata)
      : popup?.description ?? null;

  const resolvedFormActions = useMemo<
    DynamicFormProps<TemplateClientData>["actions"]
  >(
    () => ({
      ...(form?.actions ?? {}),
      submitLabel:
        form?.actions?.submitLabel ||
        (templateMetadata &&
        resolveTemplateTypeLabel(templateMetadata) === "excel"
          ? "Download"
          : "Generate"),
      isSubmitting: submitting,
    }),
    [form?.actions, submitting, templateMetadata],
  );

  const resolvedFormLayout = useMemo<
    DynamicFormProps<TemplateClientData>["layout"]
  >(
    () => ({
      variant: "popup",
      ...(form?.layout ?? {}),
    }),
    [form?.layout],
  );

  const triggerDisabled =
    Boolean(button?.disabled) || Boolean(disabledReason) || submitting;
  const resolvedButtonLabel = resolveTemplateLabel(
    templateMetadata,
    button?.label,
  );

  return (
    <>
      {renderTrigger ? (
        renderTrigger({
          run: handleRun,
          disabled: triggerDisabled,
          loading,
          template: templateMetadata,
        })
      ) : (
        <Button
          type="button"
          variant={button?.variant ?? "default"}
          size={button?.size ?? "sm"}
          className={cn("gap-2", button?.className)}
          disabled={triggerDisabled}
          onClick={handleRun}
          title={disabledReason ?? undefined}
        >
          {loading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            button?.icon ?? <FileText className="size-4" />
          )}
          {loading ? button?.loadingLabel ?? resolvedButtonLabel : resolvedButtonLabel}
        </Button>
      )}

      {templateMetadata && requiresForm && generatedSchema ? (
        <FormOverlay
          mode={popup?.type ?? "modal"}
          open={open}
          onOpenChange={handleOpenChange}
          title={overlayTitle}
          width={popup?.width}
          height={popup?.height}
          drawerDirection={popup?.drawerDirection ?? "right"}
        >
          <div className="space-y-4">
            {overlayDescription ? (
              <p className="text-sm leading-relaxed text-muted-foreground">
                {overlayDescription}
              </p>
            ) : null}
            <DynamicForm
              key={templateMetadata.key}
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
        </FormOverlay>
      ) : null}
    </>
  );
}
