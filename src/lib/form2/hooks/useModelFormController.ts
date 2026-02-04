import * as React from "react";
import { useStore } from "@tanstack/react-form";
import { toast } from "@/lib/components/ui/sonner";
import { useModelTelemetry } from "@/lib/telemetry/useModelTelemetry";
import { useAuditableAction } from "@/lib/security/useAuditableAction";
import type { FormSchema, FormBuilderProps } from "../inputs/types";
import { useModelForm } from "./useModelForm";
import type {
  ModelFormProps,
  ModelFormSectionsControl,
  ModelFormOrderingOptions,
  FieldGroup,
} from "../types";
import { parseCustomMetadata } from "../utils/metadata";
import { filterValuesBySchema } from "../utils/schema-filters";
import { applyErrorsToFormFields, isBlockingError } from "../utils/errors";
import { invokeSectionChangeHandlers } from "../utils/schema-sections";
import { useFormSchemaState } from "./useFormSchemaState";
import { useMutationFeedback } from "./useMutationFeedback";
import { useServerErrorTracking } from "./useServerErrorTracking";

export function useModelFormController<
  TFormValues extends Record<string, any> = Record<string, any>
>(props: ModelFormProps<TFormValues>) {
  const {
    submitLabel,
    resetLabel,
    layout,
    debug,
    actionSlot,
    className,
    onChange,
    isLoading: externalLoading,
    containerClassName,
    loadingMessage,
    errorMessage,
    onlyRequired = false,
    ordering,
    title,
    showSectionHeaders = true,
    sectionsControl,
    showHeading = true,
    appName,
    modelName,
    showSuccessToast = true,
    onSuccessRedirect,
    successMessage,
    mutationMode: mutationModeProp,
    layoutVariant,
    inlineCreateOverrides,
    debugValueTransformer,
    inPopup,
    disableAutoReset,
    ...rawModelFormOptions
  } = props;

  const modelFormOptions = React.useMemo(
    () =>
      ({
        ...rawModelFormOptions,
        appName,
        modelName,
      }) as Omit<typeof rawModelFormOptions, "appName" | "modelName"> & {
        appName?: string;
        modelName?: string;
      },
    [rawModelFormOptions, appName, modelName]
  );

  const {
    transformInput: userTransformInput,
    onSubmit: userOnSubmit,
    onCompleted: userOnCompleted,
    onError: userOnError,
    ...restModelFormOptions
  } = modelFormOptions as typeof modelFormOptions & {
    transformInput?: (
      values: TFormValues,
      ctx: { metadata: any }
    ) => Record<string, any>;
    onSubmit?: (
      values: TFormValues,
      ctx: any
    ) => Promise<any> | void;
    onCompleted?: (payload: any) => void;
    onError?: (error: unknown) => void;
  };

  const visibleSchemaRef = React.useRef<FormSchema<TFormValues> | null>(null);
  const sectionChangeHandlersRef = React.useRef(
    new Map<string, any>()
  );

  const transformInput = React.useCallback(
    (values: TFormValues, ctx: { metadata: any }) => {
      const nextValues = visibleSchemaRef.current
        ? (filterValuesBySchema(
            values,
            visibleSchemaRef.current
          ) as TFormValues)
        : values;

      return userTransformInput
        ? userTransformInput(nextValues, ctx)
        : nextValues;
    },
    [userTransformInput]
  );

  const handleSubmit = React.useMemo(() => {
    if (!userOnSubmit) {
      return undefined;
    }
    return (values: TFormValues, ctx: any) => {
      const nextValues = visibleSchemaRef.current
        ? (filterValuesBySchema(
            values,
            visibleSchemaRef.current
          ) as TFormValues)
        : values;
      return userOnSubmit(nextValues, ctx);
    };
  }, [userOnSubmit]);

  const mutationMode =
    mutationModeProp === undefined ? "create" : mutationModeProp;

  const resolvedAppName = modelFormOptions.appName ?? "";
  const resolvedModelName = modelFormOptions.modelName ?? "";

  const telemetry = useModelTelemetry({
    component: "ModelFormV2",
    appName: resolvedAppName,
    modelName: resolvedModelName,
    attributes: { "rail.form.mode": mutationMode },
  });
  const logAction = useAuditableAction({
    appName: resolvedAppName,
    modelName: resolvedModelName,
    component: "ModelFormV2",
    logEvent: telemetry.logEvent,
  });

  const auditHandlers = React.useMemo(
    () => ({
      onCompleted: (payload: any) => {
        logAction(
          mutationMode === "update"
            ? "form.update_success"
            : "form.create_success",
          { metadata: { payload } }
        );
        userOnCompleted?.(payload);
      },
      onError: (submitError: unknown) => {
        telemetry.recordError(submitError);
        logAction("form.submit_error", {
          success: false,
          severity: "medium",
          metadata: {
            message:
              submitError instanceof Error
                ? submitError.message
                : String(submitError),
          },
        });
        userOnError?.(submitError);
      },
    }),
    [logAction, mutationMode, telemetry, userOnCompleted, userOnError]
  );

  const useModelFormOptions = React.useMemo(
    () => ({
      ...restModelFormOptions,
      mutationMode,
      transformInput,
      onSubmit: handleSubmit,
      onCompleted: auditHandlers.onCompleted,
      onError: auditHandlers.onError,
    }),
    [
      restModelFormOptions,
      mutationMode,
      transformInput,
      handleSubmit,
      auditHandlers,
    ]
  );

  const {
    schema,
    metadata,
    form,
    loading,
    error,
    refetchMetadata,
    createState,
    updateState,
    mutationErrors,
    clearMutationErrors,
  } = useModelForm<TFormValues>(useModelFormOptions);

  const customMeta = React.useMemo(
    () => parseCustomMetadata<Record<string, any>>(metadata?.customMetadata),
    [metadata?.customMetadata]
  );

  const metadataSections = React.useMemo(() => {
    const groups = (metadata?.fieldGroups ?? []) as FieldGroup[] | undefined;
    if (!groups || groups.length === 0) return undefined;
    return groups.map((group, index) => ({
      id: group.key || `group-${index + 1}`,
      title: group.label,
      description: group.description ?? undefined,
      fields: group.fields ?? [],
    }));
  }, [metadata?.fieldGroups]);

  const metadataSectionControl = React.useMemo(() => {
    if (!metadataSections || metadataSections.length === 0) return undefined;
    return {
      sections: metadataSections,
      fallbackSection: { fields: "all" },
    } as ModelFormSectionsControl<TFormValues>;
  }, [metadataSections]);

  const resolvedSectionsControl =
    sectionsControl ??
    ((customMeta?.form?.sections || customMeta?.formConfig?.sections) && {
      sections:
        customMeta?.form?.sections ?? customMeta?.formConfig?.sections,
      fallbackSection:
        customMeta?.form?.fallbackSection ??
        customMeta?.formConfig?.fallbackSection,
    }) ??
    metadataSectionControl;

  const orderingFromMetadata: ModelFormOrderingOptions | undefined =
    customMeta?.form?.ordering ??
    customMeta?.formConfig?.ordering ??
    (customMeta?.form?.fieldOrder || customMeta?.formConfig?.fieldOrder
      ? {
          fieldOrder:
            customMeta?.form?.fieldOrder ?? customMeta?.formConfig?.fieldOrder,
          pinnedFields:
            customMeta?.form?.pinnedFields ??
            customMeta?.formConfig?.pinnedFields,
          trailingFields:
            customMeta?.form?.trailingFields ??
            customMeta?.formConfig?.trailingFields,
          sortRemainingFields:
            customMeta?.form?.sortRemainingFields ??
            customMeta?.formConfig?.sortRemainingFields,
        }
      : undefined);

  const resolvedOrdering =
    sectionsControl?.ordering ?? ordering ?? orderingFromMetadata;
  const metadataCustomOrder = orderingFromMetadata?.customFieldOrder;

  const {
    requiredSchema,
    visibleSchema,
    sectionChangeHandlers,
    resolveFieldLabel,
  } = useFormSchemaState(
    schema,
    metadata,
    resolvedOrdering,
    resolvedSectionsControl,
    inlineCreateOverrides,
    onlyRequired,
    metadataCustomOrder
  );

  React.useEffect(() => {
    visibleSchemaRef.current = visibleSchema;
  }, [visibleSchema]);

  React.useEffect(() => {
    sectionChangeHandlersRef.current = sectionChangeHandlers as any;
  }, [sectionChangeHandlers]);

  React.useEffect(() => {
    if (!mutationErrors.length) {
      return;
    }
    const blockingErrors = mutationErrors.filter(isBlockingError);
    if (!blockingErrors.length) {
      return;
    }
    applyErrorsToFormFields(blockingErrors, form);
  }, [form, mutationErrors]);

  const submitCount = useStore(
    form.store,
    (state) => (state as any).submissionAttempts ?? (state as any).submitCount ?? 0
  );
  const isValid = useStore(form.store, (state) => state.isValid);
  const isSubmitting = useStore(form.store, (state) => state.isSubmitting);
  const isValidating = useStore(form.store, (state) => state.isValidating);
  const fieldMeta = useStore(
    form.store,
    (state) => (state as any).fieldMeta ?? {}
  );
  const submitCountRef = React.useRef(submitCount);

  React.useEffect(() => {
    if (submitCount > submitCountRef.current) {
      if (isSubmitting) {
        submitCountRef.current = submitCount;
      } else if (!isValid && !isValidating) {
        toast.error("Please fill out the required fields.");
        submitCountRef.current = submitCount;
      }
    }
  }, [submitCount, isValid, isSubmitting, isValidating]);

  const headingTitle = React.useMemo(() => {
    if (title) return title;
    if (!metadata) return undefined;
    const base =
      customMeta?.form?.title ??
      customMeta?.formConfig?.title ??
      metadata.verboseName ??
      metadata.model;
    if (!base) return undefined;
    const prefix = mutationMode === "update" ? "Update" : "Create";
    return `${prefix} ${base}`;
  }, [customMeta, metadata, mutationMode, title]);

  const description =
    customMeta?.form?.description ??
    customMeta?.formConfig?.description ??
    customMeta?.description ??
    undefined;

  useMutationFeedback({
    mutationErrors,
    createState,
    updateState,
    mutationMode,
    successMessage,
    showSuccessToast,
    onSuccessRedirect,
  });

  useServerErrorTracking({
    form,
    mutationErrors,
    fieldMeta,
    clearMutationErrors,
  });

  const isMetadataLoading = loading && !requiredSchema;
  const showErrorState = Boolean(error) && !requiredSchema;
  const combinedLoading =
    Boolean(externalLoading) ||
    loading ||
    createState.loading ||
    updateState.loading;

  const handleFormChange = React.useCallback<
    NonNullable<FormBuilderProps<TFormValues>["onChange"]>
  >(
    (values, changes, formState) => {
      onChange?.(values, changes, formState);
      if (sectionChangeHandlersRef.current.size > 0) {
        invokeSectionChangeHandlers(
          values,
          changes,
          formState,
          sectionChangeHandlersRef.current
        );
      }
    },
    [onChange]
  );

  const sharedFormProps = React.useMemo(
    () => ({
      submitLabel,
      resetLabel,
      layout,
      debug,
      actionSlot,
      className,
      onChange: handleFormChange,
      debugValueTransformer,
      isLoading: combinedLoading,
      showSectionHeaders,
      inPopup,
      disableAutoReset,
    }),
    [
      submitLabel,
      resetLabel,
      layout,
      debug,
      actionSlot,
      className,
      handleFormChange,
      debugValueTransformer,
      combinedLoading,
      showSectionHeaders,
      inPopup,
      disableAutoReset,
    ]
  );

  const globalMutationErrors = React.useMemo(
    () => mutationErrors.filter((mutationError) => !mutationError.field),
    [mutationErrors]
  );

  return {
    metadata,
    schema: requiredSchema,
    form,
    loading: isMetadataLoading,
    error: showErrorState ? (error as Error) : undefined,
    refetchMetadata,
    formProps: sharedFormProps,
    layoutVariant,
    headingTitle,
    description,
    showHeading,
    showSectionHeaders,
    containerClassName,
    loadingMessage,
    errorMessage,
    mutationErrors,
    globalMutationErrors,
    resolveFieldLabel,
  };
}
