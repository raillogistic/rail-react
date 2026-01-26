import * as React from "react";
import { useStore, type UseFormReturn } from "@tanstack/react-form";
import { Button } from "@/lib/components/ui/button";
import { Card } from "@/lib/components/ui/card";
import { Skeleton } from "@/lib/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/components/ui/sonner";
import DynamicForm from "../inputs/form";
import type {
  ChangeRecord,
  FormBuilderProps,
  FormSchema,
  FormFieldConfig,
  FormSectionConfig,
  QueryChoiceFieldConfig,
  QueryChoiceInlineCreateConfig,
} from "../inputs/types";
import AccordionSectionsForm from "../complex/components/AccordionSectionsForm";
import MasterDetailPreviewForm from "../complex/components/MasterDetailPreviewForm";
import {
  applyErrorsToFormFields,
  normalizeErrorFieldPath,
  useModelForm,
  type UseModelFormOptions,
} from "./hooks";
import { toOperationField, type MutationError } from "./types/mutations";
import { ModelAccessContext, useModelAccess } from "@/lib/security/modelAccess";
import { useModelTelemetry } from "@/lib/telemetry/useModelTelemetry";
import { useAuditableAction } from "@/lib/security/useAuditableAction";
import type { model_form_metadata } from "./types/meta";

/**
 * Fallback loading state rendered while metadata is being fetched.
 */
const DEFAULT_LOADING = (
  <Card className="space-y-3 p-4">
    <Skeleton className="h-5 w-1/3" />
    <Skeleton className="h-4 w-2/3" />
    <Skeleton className="h-32 w-full" />
  </Card>
);

/**
 * Default error message displayed when metadata retrieval fails.
 */
const DEFAULT_ERROR_MESSAGE = "Impossible de charger le formulaire.";

type CustomFieldOrderValue =
  | string[]
  | ((context: { metadata: model_form_metadata }) => string[]);

/**
 * Backend hook options re-exposed by {@link ModelForm} once the ordering
 * controls have been removed (they are handled locally).
 */
type ModelFormBaseOptions<TFormValues extends Record<string, any>> = Omit<
  UseModelFormOptions<TFormValues>,
  "customFieldOrder"
>;

type AllowedFormProps<TValues extends Record<string, any>> = Omit<
  FormBuilderProps<TValues>,
  "schema" | "form"
>;

/**
 * Controls how form fields are ordered when rendering a model form.
 */
export type ModelFormOrderingOptions = {
  /**
   * Full override that returns the final ordered array of field names.
   * When provided, the other ordering hints are ignored.
   */
  customFieldOrder?: CustomFieldOrderValue;
  /**
   * Additional fields appended (in order) after `pinnedFields`.
   */
  fieldOrder?: string[];
  /**
   * Field names pinned to the very top of the form.
   */
  pinnedFields?: string[];
  /**
   * Field names placed at the end of the form.
   */
  trailingFields?: string[];
  /**
   * Determines how leftover fields (not listed above) are sorted.
   */
  sortRemainingFields?: "metadata" | "alphabetical";
};

export type ModelFormSectionChangeHandler<TValues extends Record<string, any>> =
  (
    values: TValues,
    changes: ChangeRecord[],
    form: FormBuilderProps<TValues>["form"],
    section: FormSectionConfig
  ) => void;

export type ModelFormSectionFieldDescriptor =
  | string
  | FormFieldConfig
  | "required"
  | "all";

export type ModelFormSectionDefinition<TValues extends Record<string, any>> = {
  id?: string;
  title?: string;
  description?: string;
  columns?: number;
  ordering?: ModelFormOrderingOptions;
  /** Fields rendered inside the section.
   *
   * - string entries reference metadata fields by name.
   * - passing a literal `FormFieldConfig` adds a custom field in place.
   * - the special value `"required"` inserts every remaining required field.
   */
  fields: ModelFormSectionFieldDescriptor[] | "required" | "all";
  onChange?: ModelFormSectionChangeHandler<TValues>;
  /** Field-level overrides applied to the fields inside this section. */
  overrideFieldsMeta?: Record<string, Partial<FormFieldConfig>>;
};

export type ModelFormSectionsControl<TValues extends Record<string, any>> = {
  ordering?: ModelFormOrderingOptions;
  sections?: Array<ModelFormSectionDefinition<TValues>>;
  fallbackSection?: Omit<ModelFormSectionDefinition<TValues>, "fields"> & {
    fields?: ModelFormSectionFieldDescriptor[] | "all";
  };
  sectionOverrides?: Record<
    number,
    Partial<FormSectionConfig> & {
      /** Fine-grained overrides applied to fields within the section. */
      overrideFieldsMeta?: Record<string, Partial<FormFieldConfig>>;
    }
  >;
};

/**
 * Enables richer layouts by reusing the complex form shapes.
 */
export type ModelFormLayoutVariant<TValues extends Record<string, any>> =
  | {
      /** Default DynamicForm rendering (cards + grid). */
      variant?: "default";
    }
  | {
      /** Render each section as an accordion panel. */
      variant: "accordion";
      /** Optional title displayed above the stack. */
      title?: React.ReactNode;
      /** Optional overrides forwarded to DynamicForm. */
      formProps?: Partial<AllowedFormProps<TValues>>;
    }
  | {
      /** Split layout with live preview. */
      variant: "master-detail";
      /** Optional heading displayed above the cards. */
      title?: React.ReactNode;
      /** Custom preview renderer driven by form values. */
      renderPreview: (values: TValues) => React.ReactNode;
      /** Wrapper classes for the grid container. */
      className?: string;
      /** Optional overrides for the details card. */
      detailsCardClassName?: string;
      /** Optional overrides for the preview card. */
      previewCardClassName?: string;
      /** Toolbar renderer injected in the details card header. */
      renderToolbar?: (context: {
        form: UseFormReturn<TValues>;
      }) => React.ReactNode;
      /** Optional overrides forwarded to DynamicForm. */
      formProps?: Partial<AllowedFormProps<TValues>>;
    };

type ForwardedFormProps<TFormValues extends Record<string, any>> = Pick<
  FormBuilderProps<TFormValues>,
  | "submitLabel"
  | "resetLabel"
  | "layout"
  | "debug"
  | "actionSlot"
  | "className"
  | "onChange"
  | "isLoading"
  | "showSectionHeaders"
>;

export type InlineCreateOverrides = {
  /**
   * Default toggle applied to every query-backed select when no per-field rule exists.
   */
  defaultEnabled?: boolean;
  /**
   * Per-field overrides keyed by field name. Provide a `QueryChoiceInlineCreateConfig`
   * to merge with existing config, or `false` to force-disable the inline trigger.
   */
  fields?: Record<string, QueryChoiceInlineCreateConfig | boolean>;
};

/**
 * Runtime properties accepted by {@link ModelForm}.
 */
/**
 * Props accepted by {@link ModelForm}, combining backend options with
 * UI-facing configuration such as loading placeholders or ordering hints.
 *
 * @template TFormValues Form value shape inferred from the backend metadata or provided overrides.
 * @property containerClassName Optional wrapper class applied to the outer container.
 * @property loadingMessage Custom node rendered while the metadata query is in flight.
 * @property errorMessage Custom message displayed when the metadata query fails.
 * @property ordering Declarative controls used to re-order form fields locally.
 */
export interface ModelFormProps<
  TFormValues extends Record<string, any> = Record<string, any>
> extends Omit<ModelFormBaseOptions<TFormValues>, "appName" | "modelName">,
    ForwardedFormProps<TFormValues> {
  /** Optional title displayed above the form. */
  title?: React.ReactNode;
  /** Controls the visibility of the automatic title/description header. */
  showHeading?: boolean;
  /** Toggles section-level headings rendered inside each card. */
  showSectionHeaders?: boolean;
  containerClassName?: string;
  loadingMessage?: React.ReactNode;
  errorMessage?: React.ReactNode;
  /** When true, only required fields (and their containers) are displayed. */
  onlyRequired?: boolean;
  /** Declarative hints that influence the order of rendered fields. */
  ordering?: ModelFormOrderingOptions;
  /** Declarative controls to fully redefine sections and their behavior. */
  sectionsControl?: ModelFormSectionsControl<TFormValues>;
  /** Invoked after a successful mutation, useful for redirecting. */
  onSuccessRedirect?: (payload: any) => void;
  /** Optional custom success toast message. */
  successMessage?:
    | string
    | ((ctx: { payload: any; mode: "create" | "update" }) => string);
  /** Override the backend app used to fetch metadata. */
  appName?: string;
  /** Override the backend model used to fetch metadata. */
  modelName?: string;
  /** Suppress the default success toast when false. */
  showSuccessToast?: boolean;
  /** Choose an alternate rendering shape (accordion, master-detail, etc.). */
  layoutVariant?: ModelFormLayoutVariant<TFormValues>;
  /**
   * Inline creation controls applied to every query-backed select inside the form.
   * Useful to force-enable/disable the add button or to supply per-field overrides
   * without editing field metadata.
   */
  inlineCreateOverrides?: InlineCreateOverrides;
}

/**
 * High-level component that renders a backend-driven form for a Django model.
 * It fetches metadata, builds a schema for {@link DynamicForm}, and optionally
 * executes GraphQL mutations when submitting.
 *
 * @param props Runtime configuration for the form, see {@link ModelFormProps}.
 */
function ModelForm<
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
    ...rawModelFormOptions
  } = props;

  const modelFormOptions = React.useMemo(
    () =>
      ({
        ...rawModelFormOptions,
        appName,
        modelName,
      } as ModelFormBaseOptions<TFormValues>),
    [rawModelFormOptions, appName, modelName]
  );
  const {
    transformInput: userTransformInput,
    onSubmit: userOnSubmit,
    onCompleted: userOnCompleted,
    onError: userOnError,
    ...restModelFormOptions
  } = modelFormOptions;

  const orderingOptions = sectionsControl?.ordering ?? ordering;
  const {
    customFieldOrder: orderingOverride,
    fieldOrder,
    pinnedFields,
    trailingFields,
    sortRemainingFields = "metadata",
  } = orderingOptions ?? {};

  /**
   * Determine the ordering resolver either from a full override or from
   * the relaxed ordering hints (pinned, trailing, etc.).
   */
  const resolvedCustomFieldOrder = React.useMemo(() => {
    if (orderingOverride) {
      return orderingOverride;
    }
    const hasPreset =
      Boolean(fieldOrder?.length) ||
      Boolean(pinnedFields?.length) ||
      Boolean(trailingFields?.length) ||
      sortRemainingFields !== "metadata";
    if (!hasPreset) {
      return undefined;
    }
    return buildCustomFieldOrderFactory({
      fieldOrder,
      pinnedFields,
      trailingFields,
      sortRemaining: sortRemainingFields,
    });
  }, [
    orderingOverride,
    fieldOrder,
    pinnedFields,
    trailingFields,
    sortRemainingFields,
  ]);

  const mutationMode =
    mutationModeProp === undefined ? "create" : mutationModeProp;
  const operationAllowed = true;

  const resolvedAppName = modelFormOptions.appName ?? "";
  const resolvedModelName = modelFormOptions.modelName ?? "";
  const mutationOperationField = React.useMemo(
    () => toOperationField(resolvedModelName ?? ""),
    [resolvedModelName]
  );

  const telemetry = useModelTelemetry({
    component: "ModelForm",
    appName: resolvedAppName,
    modelName: resolvedModelName,
    attributes: { "rail.form.mode": mutationMode },
  });
  const logAction = useAuditableAction({
    appName: resolvedAppName,
    modelName: resolvedModelName,
    component: "ModelForm",
    logEvent: telemetry.logEvent,
  });

  /**

     * Compose the final options passed to the backend hook.

     */

  const visibleSchemaRef = React.useRef<FormSchema<TFormValues> | null>(null);

  const sectionChangeHandlersRef = React.useRef<
    Map<string, SectionChangeHandlerEntry<TFormValues>>
  >(new Map());

  const transformInput = React.useCallback<
    NonNullable<UseModelFormOptions<TFormValues>["transformInput"]>
  >(
    (values, ctx) => {
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

  const handleSubmit = React.useMemo<
    UseModelFormOptions<TFormValues>["onSubmit"]
  >(() => {
    if (!userOnSubmit) {
      return undefined;
    }
    return (values, ctx) => {
      const nextValues = visibleSchemaRef.current
        ? (filterValuesBySchema(
            values,
            visibleSchemaRef.current
          ) as TFormValues)
        : values;
      return userOnSubmit(nextValues, ctx);
    };
  }, [userOnSubmit]);

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

  const useModelFormOptions = React.useMemo<UseModelFormOptions<TFormValues>>(
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

  const modelAccess = useModelAccess({
    appName: resolvedAppName,
    modelName: resolvedModelName,
    formMetaOverride: metadata,
    loadTableMetadata: false,
    loadFormMetadata: !metadata,
  });

  const submitCount = useStore(form.store, (state) => state.submitCount);
  const isValid = useStore(form.store, (state) => state.isValid);
  const isSubmitting = useStore(form.store, (state) => state.isSubmitting);
  const isValidating = useStore(form.store, (state) => state.isValidating);
  const fieldMeta = useStore(
    form.store,
    (state) => (state as any).fieldMeta ?? {}
  );
  const submitCountRef = React.useRef(submitCount);
  const serverErrorFieldsRef = React.useRef<Set<string>>(new Set());
  const serverErrorValuesRef = React.useRef<Map<string, any>>(new Map());

  React.useEffect(() => {
    if (submitCount > submitCountRef.current) {
      if (isSubmitting) {
        submitCountRef.current = submitCount;
      } else if (!isValid && !isValidating) {
        toast.error(
          "Veuillez remplir tous les champs obligatoires correctement."
        );
        submitCountRef.current = submitCount;
      }
    }
  }, [submitCount, isValid, isSubmitting, isValidating]);

  const headingTitle = React.useMemo(() => {
    if (title) return title;
    if (!metadata) return undefined;
    const base =
      metadata.verbose_name ?? metadata.form_title ?? metadata.model_name;
    if (!base) return undefined;
    const prefix = mutationMode === "update" ? "Mettre à jour" : "Création";
    return `${prefix} ${base}`;
  }, [metadata, mutationMode, title]);

  const orderedSchema = React.useMemo(() => {
    if (!schema || !metadata || !resolvedCustomFieldOrder) {
      return schema;
    }
    const order = resolvedCustomFieldOrder({ metadata });
    if (!Array.isArray(order) || order.length === 0) {
      return schema;
    }
    return applyOrderingToSchema(schema, order);
  }, [schema, metadata, resolvedCustomFieldOrder]);

  const schemaForRender = orderedSchema ?? schema;

  const { schema: schemaWithSections, sectionChangeHandlers } = React.useMemo(
    () => applySectionsControl(schemaForRender, sectionsControl, metadata),
    [schemaForRender, sectionsControl, metadata]
  );

  const schemaWithOverrides = React.useMemo(() => {
    if (!schemaWithSections) {
      return schemaWithSections;
    }
    return applySchemaOverrides(
      schemaWithSections,
      sectionsControl?.sectionOverrides
    );
  }, [schemaWithSections, sectionsControl?.sectionOverrides]);

  const schemaWithInlineCreate = React.useMemo(() => {
    if (!schemaWithOverrides) {
      return schemaWithOverrides;
    }
    return applyInlineCreateControl(schemaWithOverrides, inlineCreateOverrides);
  }, [inlineCreateOverrides, schemaWithOverrides]);

  const schemaWithOrderHints = React.useMemo(() => {
    if (!schemaWithInlineCreate) {
      return schemaWithInlineCreate;
    }
    return applyFieldOrderHints(schemaWithInlineCreate);
  }, [schemaWithInlineCreate]);

  const schemaEditableOnly = React.useMemo(() => {
    if (!schemaWithOrderHints) {
      return schemaWithOrderHints;
    }
    return filterSchemaByEditability(schemaWithOrderHints);
  }, [schemaWithOrderHints]);

  const schemaWithoutHidden = React.useMemo(() => {
    if (!schemaEditableOnly) {
      return schemaEditableOnly;
    }
    return filterSchemaByVisibility(schemaEditableOnly);
  }, [schemaEditableOnly]);

  const requiredSchema = React.useMemo(() => {
    if (!schemaWithoutHidden) {
      return schemaWithoutHidden;
    }
    if (!onlyRequired) {
      return schemaWithoutHidden;
    }
    return filterSchemaToRequired(schemaWithoutHidden);
  }, [onlyRequired, schemaWithoutHidden]);

  React.useEffect(() => {
    visibleSchemaRef.current = requiredSchema ?? schemaWithOrderHints ?? null;
  }, [requiredSchema, schemaWithOrderHints]);

  React.useEffect(() => {
    sectionChangeHandlersRef.current = sectionChangeHandlers;
  }, [sectionChangeHandlers]);

  React.useEffect(() => {
    if (!mutationErrors.length) {
      return;
    }
    applyErrorsToFormFields(mutationErrors, form);
  }, [form, mutationErrors]);

  const fieldLabelMap = React.useMemo(() => {
    if (!requiredSchema) return {};
    return buildFieldLabelMap(requiredSchema);
  }, [requiredSchema]);

  const resolveFieldLabel = React.useCallback(
    (fieldName: string) => getFieldLabelFromMap(fieldLabelMap, fieldName),
    [fieldLabelMap]
  );

  const handleFormChange = React.useCallback<
    NonNullable<FormBuilderProps<TFormValues>["onChange"]>
  >(
    (values, changes, formApi) => {
      const hasSectionHandlers = sectionChangeHandlersRef.current.size > 0;
      if (!onChange && !hasSectionHandlers) {
        return;
      }
      const filtered = visibleSchemaRef.current
        ? (filterValuesBySchema(
            values,
            visibleSchemaRef.current
          ) as TFormValues)
        : values;
      if (onChange) {
        onChange(filtered, changes, formApi);
      }
      if (hasSectionHandlers) {
        invokeSectionChangeHandlers(
          filtered,
          changes,
          formApi,
          sectionChangeHandlersRef.current
        );
      }
    },
    [onChange]
  );

  const debugValueTransformer = React.useCallback(
    (values: TFormValues) =>
      visibleSchemaRef.current
        ? filterValuesBySchema(values, visibleSchemaRef.current)
        : values,
    []
  );

  const lastSuccessDataRef = React.useRef<any>(null);
  const lastNetworkErrorRef = React.useRef<unknown>(null);
  const lastServerErrorSignatureRef = React.useRef<string>("");

  const resolvePayloadFromState = React.useCallback(
    (
      data: Record<string, any> | undefined | null,
      mode: "create" | "update"
    ) => {
      if (!data) {
        return null;
      }
      const aliasPayload = data.response as
        | Record<string, any>
        | null
        | undefined;
      if (aliasPayload) {
        return aliasPayload;
      }
      const fallbackKey = `${mode}_${mutationOperationField}`;
      return (data as any)?.[fallbackKey] ?? null;
    },
    [mutationOperationField]
  );

  const successPayload = React.useMemo(() => {
    const createPayload = resolvePayloadFromState(
      createState.data as Record<string, any> | undefined,
      "create"
    );
    const updatePayload = resolvePayloadFromState(
      updateState.data as Record<string, any> | undefined,
      "update"
    );
    return createPayload ?? updatePayload ?? null;
  }, [createState.data, updateState.data, resolvePayloadFromState]);

  React.useEffect(() => {
    const isMutating = createState.loading || updateState.loading;
    if (!successPayload?.ok || isMutating || mutationErrors.length > 0) {
      return;
    }
    if (lastSuccessDataRef.current === successPayload) {
      return;
    }
    lastSuccessDataRef.current = successPayload;
    const defaultMessage =
      mutationMode === "update"
        ? "Mise à jour effectuée avec succès."
        : "Création effectuée avec succès.";
    const message =
      typeof successMessage === "function"
        ? successMessage({ payload: successPayload, mode: mutationMode })
        : successMessage ?? defaultMessage;
    if (showSuccessToast) {
      toast.success(message);
    }
    onSuccessRedirect?.(successPayload);
  }, [
    createState.loading,
    updateState.loading,
    successPayload,
    mutationErrors,
    successMessage,
    mutationMode,
    onSuccessRedirect,
    showSuccessToast,
  ]);

  React.useEffect(() => {
    const networkError = createState.error ?? updateState.error;
    if (!networkError || lastNetworkErrorRef.current === networkError) {
      return;
    }
    lastNetworkErrorRef.current = networkError;
    toast.error(
      (networkError as Error).message ??
        "Erreur réseau lors de la soumission du formulaire."
    );
  }, [createState.error, updateState.error]);

  React.useEffect(() => {
    if (mutationErrors.length === 0) {
      serverErrorFieldsRef.current = new Set();
      lastServerErrorSignatureRef.current = "";
      serverErrorValuesRef.current = new Map();
      return;
    }
    const normalizedErrorFields = mutationErrors
      .map((error) => normalizeErrorFieldPath(error.field))
      .filter((field): field is string => Boolean(field));
    serverErrorFieldsRef.current = new Set(normalizedErrorFields);
    const valuesSnapshot =
      typeof form.store.getState === "function"
        ? form.store.getState().values
        : (form.store as any).state?.values ?? {};
    const snapshot = new Map<string, any>();
    normalizedErrorFields.forEach((fieldName) => {
      snapshot.set(fieldName, getValueAtPath(valuesSnapshot, fieldName));
    });
    serverErrorValuesRef.current = snapshot;
    const signature = mutationErrors
      .map(
        (error) =>
          `${normalizeErrorFieldPath(error.field) ?? "form"}:${error.message}`
      )
      .join("|");
    if (signature === lastServerErrorSignatureRef.current) {
      return;
    }
    lastServerErrorSignatureRef.current = signature;
    toast.error("Le serveur a retourné des erreurs lors de l'enregistrement.");
  }, [mutationErrors]);

  React.useEffect(() => {
    const erroredFields = serverErrorFieldsRef.current;
    if (!erroredFields.size) {
      return;
    }
    const valuesSnapshot =
      typeof form.store.getState === "function"
        ? form.store.getState().values
        : (form.store as any).state?.values ?? {};
    Object.entries(fieldMeta).forEach(([name, meta]) => {
      const normalizedName = normalizeErrorFieldPath(name) ?? name;
      if (!erroredFields.has(normalizedName) || !meta) {
        return;
      }
      const hasChangedSinceError = hasValueChangedSinceError(
        normalizedName,
        valuesSnapshot,
        serverErrorValuesRef.current
      );
      if (hasChangedSinceError) {
        erroredFields.delete(normalizedName);
        serverErrorValuesRef.current.delete(normalizedName);
        clearMutationErrors(normalizedName);
        form.setFieldMeta(name as any, (previous) => {
          const nextErrorMap = { ...(previous?.errorMap ?? {}) };
          const serverMessage = nextErrorMap.onSubmit;
          delete nextErrorMap.onSubmit;
          const nextErrors = Array.isArray(previous?.errors)
            ? previous.errors.filter((message) => message !== serverMessage)
            : previous?.errors;
          return {
            ...previous,
            isValid: !nextErrors || nextErrors.length === 0,
            errorMap: nextErrorMap,
            errors: nextErrors,
          };
        });
      }
    });
  }, [fieldMeta, clearMutationErrors, form]);

  const isMetadataLoading = loading && !requiredSchema;
  const showErrorState = Boolean(error) && !requiredSchema;
  /**
   * Merge local loading states so form buttons can react consistently.
   */
  const combinedLoading =
    Boolean(externalLoading) ||
    loading ||
    createState.loading ||
    updateState.loading ||
    !operationAllowed;

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
    ]
  );

  const globalMutationErrors = React.useMemo(
    () => mutationErrors.filter((mutationError) => !mutationError.field),
    [mutationErrors]
  );
  React.useEffect(() => {
    if (error) {
      telemetry.recordError(error);
    }
  }, [error, telemetry]);

  if (isMetadataLoading) {
    return (
      <ModelAccessContext.Provider value={modelAccess}>
        <div className={cn("space-y-4", containerClassName)}>
          {loadingMessage ?? DEFAULT_LOADING}
        </div>
      </ModelAccessContext.Provider>
    );
  }

  if (showErrorState) {
    return (
      <ModelAccessContext.Provider value={modelAccess}>
        <div className={cn("space-y-4", containerClassName)}>
          <Card className="space-y-3 border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
            <p>{errorMessage ?? DEFAULT_ERROR_MESSAGE}</p>
            {error?.message ? (
              <p className="text-xs text-destructive/80">{error.message}</p>
            ) : null}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                void refetchMetadata();
              }}
            >
              Réessayer
            </Button>
          </Card>
        </div>
      </ModelAccessContext.Provider>
    );
  }

  if (!requiredSchema) {
    return null;
  }

  const variant = layoutVariant?.variant ?? "default";
  const formPropsForVariant =
    layoutVariant && "formProps" in layoutVariant
      ? { ...sharedFormProps, ...(layoutVariant.formProps ?? {}) }
      : sharedFormProps;
  const accordionFormProps =
    variant === "accordion"
      ? (() => {
          const { showSectionHeaders: _omit, ...rest } = formPropsForVariant;
          return { ...rest, showSectionHeaders: false };
        })()
      : formPropsForVariant;
  const bodyWrapperClass =
    variant === "master-detail"
      ? "flex-1 overflow-y-auto"
      : "flex flex-1 overflow-hidden";

  let formContent: React.ReactNode = null;
  if (variant === "accordion" && requiredSchema.sections?.length) {
    const accordion = layoutVariant as Extract<
      ModelFormLayoutVariant<TFormValues>,
      { variant: "accordion" }
    >;
    formContent = (
      <AccordionSectionsForm
        sections={requiredSchema.sections}
        form={form}
        title={accordion?.title ?? headingTitle ?? metadata?.form_title}
        formProps={accordionFormProps}
      />
    );
  } else if (
    variant === "master-detail" &&
    requiredSchema.sections?.length &&
    layoutVariant &&
    "renderPreview" in layoutVariant
  ) {
    const masterDetail = layoutVariant as Extract<
      ModelFormLayoutVariant<TFormValues>,
      { variant: "master-detail" }
    >;
    formContent = (
      <MasterDetailPreviewForm
        schema={requiredSchema}
        form={form}
        title={masterDetail.title ?? headingTitle ?? metadata?.form_title}
        className={masterDetail.className}
        detailsCardClassName={masterDetail.detailsCardClassName}
        previewCardClassName={masterDetail.previewCardClassName}
        renderToolbar={masterDetail.renderToolbar}
        renderPreview={masterDetail.renderPreview}
        formProps={formPropsForVariant}
      />
    );
  } else {
    formContent = (
      <DynamicForm
        schema={requiredSchema}
        form={form}
        {...(sharedFormProps as FormBuilderProps<TFormValues>)}
      />
    );
  }

  return (
    <ModelAccessContext.Provider value={modelAccess}>
      <div
        className={cn(
          "flex h-full flex-col gap-4  border border-border/60  p-4 py-8 shadow-sm  ",
          containerClassName
        )}
      >
        {showHeading && (headingTitle || metadata?.form_description) ? (
          <div className="space-y-1">
            {headingTitle ? (
              <h2 className="text-lg font-semibold">{headingTitle}</h2>
            ) : null}
            {metadata?.form_description ? (
              <p className="text-sm text-muted-foreground">
                {metadata.form_description}
              </p>
            ) : null}
          </div>
        ) : null}
        {globalMutationErrors.length > 0 ? (
          <MutationErrorList
            errors={globalMutationErrors}
            resolveFieldLabel={resolveFieldLabel}
          />
        ) : null}
        <div className={bodyWrapperClass}>{formContent}</div>
      </div>
    </ModelAccessContext.Provider>
  );
}

/**
 * Renders API errors returned by GraphQL mutations in a dedicated card.
 */
const MutationErrorList: React.FC<{
  errors: MutationError[];
  resolveFieldLabel?: (fieldName: string) => string | undefined;
}> = ({ errors, resolveFieldLabel }) => (
  <Card className="space-y-2 border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
    <p className="font-semibold">Le serveur a retourné des erreurs :</p>
    <ul className="list-disc space-y-1 pl-5">
      {errors.map((error, index) => (
        <li key={`${error.field ?? "form"}-${index}`}>
          {error.field ? (
            <span className="font-medium">
              {resolveFieldLabel?.(error.field) ?? error.field}:{" "}
            </span>
          ) : null}
          {error.message}
        </li>
      ))}
    </ul>
  </Card>
);

type CustomFieldOrderFactoryConfig = Omit<
  ModelFormOrderingOptions,
  "customFieldOrder" | "sortRemainingFields"
> & {
  sortRemaining: "metadata" | "alphabetical";
};

/**
 * Builds a resolver function that merges the different ordering hints into
 * a single ordered array of field names.
 */
function buildCustomFieldOrderFactory({
  fieldOrder,
  pinnedFields,
  trailingFields,
  sortRemaining,
}: CustomFieldOrderFactoryConfig) {
  return ({ metadata }: { metadata: model_form_metadata }) => {
    const order: string[] = [];
    const push = (name?: string | null) => {
      if (!name) return;
      if (order.includes(name)) return;
      order.push(name);
    };

    pinnedFields?.forEach(push);
    fieldOrder?.forEach(push);

    const backendOrder = metadata.field_order ?? [];
    backendOrder.forEach(push);

    const primitiveNames = metadata.fields.map((field) => field.name);
    const relationshipNames =
      metadata.relationships?.map((rel) => rel.name) ?? [];
    const nestedNames =
      metadata.nested
        ?.map((nested) => nested.name ?? nested.field_name ?? nested.model_name)
        .filter((value): value is string => Boolean(value)) ?? [];

    // Gather the remaining field names that were not explicitly mentioned.
    const aggregate = [...primitiveNames, ...relationshipNames, ...nestedNames];
    if (sortRemaining === "alphabetical") {
      Array.from(new Set(aggregate.filter((name) => !order.includes(name))))
        .sort((a, b) => a.localeCompare(b))
        .forEach(push);
    } else {
      aggregate.forEach(push);
    }

    trailingFields?.forEach((name) => {
      if (!name) return;
      const index = order.indexOf(name);
      if (index !== -1) {
        order.splice(index, 1);
      }
      push(name);
    });

    return order;
  };
}

function applySectionOrderingToFields(
  fields: FormFieldConfig[],
  ordering?: ModelFormOrderingOptions,
  metadata?: model_form_metadata | null
): FormFieldConfig[] {
  if (!ordering || fields.length === 0) {
    return fields;
  }
  let orderNames: string[] | undefined;
  if (ordering.customFieldOrder) {
    if (Array.isArray(ordering.customFieldOrder)) {
      orderNames = ordering.customFieldOrder;
    } else if (metadata) {
      orderNames = ordering.customFieldOrder({ metadata });
    }
  }
  if (!orderNames) {
    const hintsOrder = buildSectionOrderFromHints(fields, ordering);
    if (hintsOrder.length) {
      orderNames = hintsOrder;
    }
  }
  if (!orderNames?.length) {
    return fields;
  }
  const rank = new Map(orderNames.map((name, index) => [name, index]));
  return [...fields].sort((a, b) => {
    const rankA = rank.get(a.name) ?? Number.MAX_SAFE_INTEGER;
    const rankB = rank.get(b.name) ?? Number.MAX_SAFE_INTEGER;
    if (rankA === rankB) {
      return a.name.localeCompare(b.name);
    }
    return rankA - rankB;
  });
}

function buildSectionOrderFromHints(
  fields: FormFieldConfig[],
  ordering: ModelFormOrderingOptions
): string[] {
  const {
    fieldOrder,
    pinnedFields,
    trailingFields,
    sortRemainingFields = "metadata",
  } = ordering;
  const availableNames = fields.map((field) => field.name);
  const order: string[] = [];
  const push = (name?: string | null) => {
    if (!name || !availableNames.includes(name) || order.includes(name)) {
      return;
    }
    order.push(name);
  };
  pinnedFields?.forEach(push);
  fieldOrder?.forEach(push);
  const remaining = availableNames.filter((name) => !order.includes(name));
  const remainingOrdered =
    sortRemainingFields === "alphabetical"
      ? [...remaining].sort((a, b) => a.localeCompare(b))
      : remaining;
  order.push(...remainingOrdered);
  trailingFields?.forEach((name) => {
    if (!name || !availableNames.includes(name)) return;
    const existingIndex = order.indexOf(name);
    if (existingIndex !== -1) {
      order.splice(existingIndex, 1);
    }
    push(name);
  });
  return order;
}

function applyOrderingToSchema<TValues extends Record<string, any>>(
  schema: FormSchema<TValues>,
  order: string[]
): FormSchema<TValues> {
  if (!order.length) {
    return schema;
  }
  const rank = new Map(order.map((name, index) => [name, index]));
  const reorder = (fields: FormFieldConfig[]) =>
    [...fields].sort((a, b) => {
      const rankA = rank.get(a.name) ?? Number.MAX_SAFE_INTEGER;
      const rankB = rank.get(b.name) ?? Number.MAX_SAFE_INTEGER;
      if (rankA === rankB) {
        return a.name.localeCompare(b.name);
      }
      return rankA - rankB;
    });

  if (schema.sections?.length) {
    return {
      ...schema,
      sections: schema.sections.map((section) => ({
        ...section,
        fields: reorder(section.fields),
      })),
    };
  }
  if (schema.fields?.length) {
    return {
      ...schema,
      fields: reorder(schema.fields),
    };
  }
  return schema;
}

type SectionChangeHandlerEntry<TValues extends Record<string, any>> = {
  handler: ModelFormSectionChangeHandler<TValues>;
  section: FormSectionConfig;
};

function applySectionsControl<TValues extends Record<string, any>>(
  schema: FormSchema<TValues> | null,
  control?: ModelFormSectionsControl<TValues>,
  metadata?: model_form_metadata | null
): {
  schema: FormSchema<TValues> | null;
  sectionChangeHandlers: Map<string, SectionChangeHandlerEntry<TValues>>;
} {
  const sectionChangeHandlers = new Map<
    string,
    SectionChangeHandlerEntry<TValues>
  >();
  if (!schema) {
    return {
      schema,
      sectionChangeHandlers,
    };
  }
  const customSections = control?.sections ?? [];
  if (!customSections.length) {
    return {
      schema,
      sectionChangeHandlers,
    };
  }
  const baseSections = resolveBaseSections(schema);
  if (!baseSections?.length) {
    return {
      schema,
      sectionChangeHandlers,
    };
  }
  const orderedFieldNames: string[] = [];
  const fieldLookup = new Map<string, FormFieldConfig>();
  baseSections.forEach((section) => {
    section.fields.forEach((field) => {
      orderedFieldNames.push(field.name);
      if (!fieldLookup.has(field.name)) {
        fieldLookup.set(field.name, field);
      }
    });
  });
  if (!fieldLookup.size) {
    return {
      schema,
      sectionChangeHandlers,
    };
  }
  const used = new Set<string>();
  const pluckFieldByName = (name: string) => {
    const field = fieldLookup.get(name);
    if (!field || used.has(name)) return null;
    used.add(name);
    return field;
  };

  const resolveRequiredFields = () => {
    const required: FormFieldConfig[] = [];
    baseSections.forEach((section) => {
      section.fields.forEach((field) => {
        if (field.required && !used.has(field.name)) {
          used.add(field.name);
          required.push(field);
        }
      });
    });
    return required;
  };

  const resolveRemainingFields = () => {
    const remaining: FormFieldConfig[] = [];
    orderedFieldNames.forEach((name) => {
      const field = pluckFieldByName(name);
      if (field) {
        remaining.push(field);
      }
    });
    return remaining;
  };

  const resolveSectionFieldsFromDescriptors = (
    descriptors:
      | ModelFormSectionFieldDescriptor[]
      | ModelFormSectionFieldDescriptor
  ): FormFieldConfig[] => {
    const resolved: FormFieldConfig[] = [];
    const descriptorList = Array.isArray(descriptors)
      ? descriptors
      : [descriptors];
    descriptorList.forEach((descriptor) => {
      if (typeof descriptor === "string") {
        if (descriptor === "required") {
          resolved.push(...resolveRequiredFields());
          return;
        }
        if (descriptor === "all") {
          resolved.push(...resolveRemainingFields());
          return;
        }
        const field = pluckFieldByName(descriptor);
        if (field) {
          resolved.push(field);
        }
        return;
      }
      resolved.push(descriptor);
      used.add(descriptor.name);
    });
    return resolved;
  };

  const resolveSectionFields = (
    definitionFields:
      | ModelFormSectionDefinition<TValues>["fields"]
      | ModelFormSectionFieldDescriptor[]
  ): FormFieldConfig[] => {
    if (definitionFields === "required") {
      return resolveRequiredFields();
    }
    if (definitionFields === "all") {
      return resolveRemainingFields();
    }
    if (typeof definitionFields === "string") {
      return resolveSectionFieldsFromDescriptors(definitionFields);
    }
    return resolveSectionFieldsFromDescriptors(definitionFields);
  };

  const sections: FormSectionConfig[] = [];

  customSections.forEach((definition, index) => {
    const resolvedFields = resolveSectionFields(definition.fields);
    if (!resolvedFields.length) {
      return;
    }
    const normalizedFields = definition.overrideFieldsMeta
      ? applyFieldOverrides(resolvedFields, definition.overrideFieldsMeta)
      : resolvedFields;
    const orderedFields = applySectionOrderingToFields(
      normalizedFields,
      definition.ordering,
      metadata
    );
    const section: FormSectionConfig = {
      id: definition.id ?? `custom-section-${index + 1}`,
      title: definition.title,
      description: definition.description,
      columns: definition.columns,
      fields: orderedFields,
    };
    sections.push(section);
    if (definition.onChange) {
      orderedFields.forEach((field) => {
        sectionChangeHandlers.set(field.name, {
          handler:
            definition.onChange as ModelFormSectionChangeHandler<TValues>,
          section,
        });
      });
    }
  });

  if (control?.fallbackSection) {
    const fallbackDescriptors =
      control.fallbackSection.fields && control.fallbackSection.fields.length
        ? control.fallbackSection.fields
        : orderedFieldNames.filter((name) => !used.has(name));
    const fallbackFields = applySectionOrderingToFields(
      resolveSectionFields(fallbackDescriptors),
      control.fallbackSection.ordering,
      metadata
    );
    if (fallbackFields.length) {
      const fallbackIndex = sections.length;
      const normalizedFallbackFields = control.fallbackSection
        .overrideFieldsMeta
        ? applyFieldOverrides(
            fallbackFields,
            control.fallbackSection.overrideFieldsMeta
          )
        : fallbackFields;
      const section: FormSectionConfig = {
        id: control.fallbackSection.id ?? `custom-section-${fallbackIndex + 1}`,
        title: control.fallbackSection.title,
        description: control.fallbackSection.description,
        columns: control.fallbackSection.columns,
        fields: normalizedFallbackFields,
      };
      sections.push(section);
      if (control.fallbackSection.onChange) {
        normalizedFallbackFields.forEach((field) => {
          sectionChangeHandlers.set(field.name, {
            handler: control.fallbackSection
              .onChange as ModelFormSectionChangeHandler<TValues>,
            section,
          });
        });
      }
    }
  }

  if (!sections.length) {
    return {
      schema,
      sectionChangeHandlers,
    };
  }

  return {
    schema: {
      ...schema,
      sections,
      fields: undefined,
    },
    sectionChangeHandlers,
  };
}

function invokeSectionChangeHandlers<TValues extends Record<string, any>>(
  values: TValues,
  changes: ChangeRecord[],
  form: FormBuilderProps<TValues>["form"],
  registry: Map<string, SectionChangeHandlerEntry<TValues>>
) {
  if (!changes.length || registry.size === 0) {
    return;
  }
  const groupedChanges = new Map<
    ModelFormSectionChangeHandler<TValues>,
    { section: FormSectionConfig; changes: ChangeRecord[] }
  >();
  changes.forEach((change) => {
    const entry = registry.get(change.name);
    if (!entry) {
      return;
    }
    const bucket = groupedChanges.get(entry.handler);
    if (bucket) {
      bucket.changes.push(change);
      return;
    }
    groupedChanges.set(entry.handler, {
      section: entry.section,
      changes: [change],
    });
  });
  groupedChanges.forEach(({ section, changes: sectionChanges }, handler) => {
    handler(values, sectionChanges, form, section);
  });
}

function resolveBaseSections<TValues extends Record<string, any>>(
  schema: FormSchema<TValues>
): FormSectionConfig[] | null {
  if (schema.sections?.length) {
    return schema.sections;
  }
  if (schema.fields?.length) {
    return [
      {
        id: schema.id ? `${schema.id}-generated-section` : undefined,
        fields: schema.fields,
      },
    ];
  }
  return null;
}

type SectionOverrideConfig = Partial<FormSectionConfig> & {
  overrideFieldsMeta?: Record<string, Partial<FormFieldConfig>>;
};

function applySchemaOverrides<TValues extends Record<string, any>>(
  schema: FormSchema<TValues>,
  overrides?: Record<number, SectionOverrideConfig>
): FormSchema<TValues> {
  if (!overrides) {
    return schema;
  }

  if (schema.sections?.length) {
    let mutated = false;
    const sections = schema.sections.map((section, index) => {
      const override = overrides?.[index + 1];
      let nextSection = section;
      let overrideFieldsMeta:
        | Record<string, Partial<FormFieldConfig>>
        | undefined;
      if (override) {
        mutated = true;
        const { overrideFieldsMeta: fieldsMeta, ...sectionOverride } = override;
        overrideFieldsMeta = fieldsMeta;
        nextSection = {
          ...nextSection,
          ...sectionOverride,
        };
      }
      if (overrideFieldsMeta && nextSection.fields?.length) {
        const nextFields = applyFieldOverrides(
          nextSection.fields,
          overrideFieldsMeta
        );
        if (nextFields !== nextSection.fields) {
          mutated = true;
          nextSection = {
            ...nextSection,
            fields: nextFields,
          };
        }
      }
      return nextSection;
    });
    return mutated
      ? {
          ...schema,
          sections,
        }
      : schema;
  }

  return schema;
}
function applyFieldOverrides(
  fields: FormFieldConfig[],
  overrides: Record<string, Partial<FormFieldConfig>>
): FormFieldConfig[] {
  let mutated = false;
  const nextFields = fields.map((field) => {
    let nextField = field;
    const override = overrides[field.name];
    if (override) {
      nextField = {
        ...nextField,
        ...override,
      } as FormFieldConfig;
    }
    if (hasNestedFields(nextField) && nextField.fields?.length) {
      const nestedOverrides = Object.entries(overrides)
        .filter(([key]) => key.startsWith(`${nextField.name}.`))
        .reduce<Record<string, Partial<FormFieldConfig>>>(
          (acc, [key, value]) => {
            acc[key.replace(`${nextField.name}.`, "")] = value;
            return acc;
          },
          {}
        );
      if (Object.keys(nestedOverrides).length) {
        const nestedFields = applyFieldOverrides(
          nextField.fields,
          nestedOverrides
        );
        if (nestedFields !== nextField.fields) {
          nextField = {
            ...nextField,
            fields: nestedFields,
          } as FormFieldConfig;
        }
      }
    }
    if (nextField !== field) {
      mutated = true;
    }
    return nextField;
  });
  return mutated ? nextFields : fields;
}

function hasNestedFields(
  field: FormFieldConfig
): field is FormFieldConfig & { fields: FormFieldConfig[] } {
  return field.type === "object" || field.type === "list";
}

function applyInlineCreateControl<TValues extends Record<string, any>>(
  schema: FormSchema<TValues>,
  control?: InlineCreateOverrides
): FormSchema<TValues> {
  if (!control) return schema;
  const defaultEnabled = control.defaultEnabled;
  const fieldOverrides = control.fields ?? {};

  const mapField = (field: FormFieldConfig): FormFieldConfig => {
    if (field.type === "object") {
      return { ...field, fields: field.fields.map(mapField) };
    }
    if (field.type === "list") {
      return { ...field, fields: field.fields.map(mapField) };
    }
    if (field.type === "select-query") {
      const override = fieldOverrides[field.name];
      let inlineCreate = (field as QueryChoiceFieldConfig).inlineCreate;
      if (override !== undefined) {
        if (override === false) {
          inlineCreate = { ...(inlineCreate ?? {}), enabled: false };
        } else {
          inlineCreate = { ...(inlineCreate ?? {}), ...override };
        }
      } else if (defaultEnabled !== undefined) {
        inlineCreate = { ...(inlineCreate ?? {}), enabled: defaultEnabled };
      }
      return { ...(field as QueryChoiceFieldConfig), inlineCreate };
    }
    return field;
  };

  if (schema.sections?.length) {
    const nextSections = schema.sections.map((section) => ({
      ...section,
      fields: section.fields.map((field) =>
        typeof field === "string" ? field : mapField(field)
      ),
    }));
    if (arraysShallowEqual(nextSections, schema.sections)) {
      return schema;
    }
    return {
      ...schema,
      sections: nextSections,
    };
  }

  if (schema.fields?.length) {
    const nextFields = schema.fields.map((field) =>
      typeof field === "string" ? field : mapField(field)
    );
    if (arraysShallowEqual(nextFields, schema.fields)) {
      return schema;
    }
    return {
      ...schema,
      fields: nextFields,
    };
  }

  return schema;
}

function applyFieldOrderHints<TValues extends Record<string, any>>(
  schema: FormSchema<TValues>
): FormSchema<TValues> {
  if (schema.sections?.length) {
    const originalSections = schema.sections;
    const sections = originalSections.map((section) => {
      const nextFields = sortFieldsRecursively(section.fields);
      if (nextFields === section.fields) {
        return section;
      }
      return {
        ...section,
        fields: nextFields,
      };
    });
    if (
      sections.every((section, index) => section === originalSections[index])
    ) {
      return schema;
    }
    return {
      ...schema,
      sections,
    };
  }
  if (schema.fields?.length) {
    const originalFields = schema.fields;
    const nextFields = sortFieldsRecursively(originalFields);
    if (nextFields === originalFields) {
      return schema;
    }
    return {
      ...schema,
      fields: nextFields,
    };
  }
  return schema;
}

function sortFieldsRecursively(fields: FormFieldConfig[]): FormFieldConfig[] {
  if (!fields.length) return fields;
  let childMutated = false;
  const withChildren = fields.map((field) => {
    let nextField = field;
    if (hasNestedFields(field) && field.fields?.length) {
      const nextChildFields = sortFieldsRecursively(field.fields);
      if (nextChildFields !== field.fields) {
        childMutated = true;
        nextField = {
          ...nextField,
          fields: nextChildFields,
        };
      }
    }
    return nextField;
  });
  const ordered = sortFieldsByOrderHint(withChildren);
  const orderChanged = !arraysShallowEqual(ordered, withChildren);
  if (
    !childMutated &&
    !orderChanged &&
    arraysShallowEqual(fields, withChildren)
  ) {
    return fields;
  }
  return orderChanged ? ordered : withChildren;
}

function sortFieldsByOrderHint(fields: FormFieldConfig[]): FormFieldConfig[] {
  if (fields.length < 2) {
    return fields;
  }
  const ordered = fields
    .map((field, index) => ({ field, index }))
    .sort((a, b) => compareFieldOrder(a.field, b.field, a.index, b.index))
    .map((entry) => entry.field);
  return ordered;
}

function compareFieldOrder(
  a: FormFieldConfig,
  b: FormFieldConfig,
  indexA: number,
  indexB: number
) {
  const orderA = typeof a.order === "number" ? a.order : indexA;
  const orderB = typeof b.order === "number" ? b.order : indexB;
  if (orderA === orderB) {
    return a.name.localeCompare(b.name);
  }
  return orderA - orderB;
}

function arraysShallowEqual(a: FormFieldConfig[], b: FormFieldConfig[]) {
  if (a === b) return true;
  if (a.length !== b.length) return false;
  for (let index = 0; index < a.length; index += 1) {
    if (a[index] !== b[index]) {
      return false;
    }
  }
  return true;
}

function toSnakeCase(value: string) {
  return value
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .replace(/[-\s]+/g, "_")
    .replace(/_{2,}/g, "_")
    .replace(/^_|_$/g, "")
    .toLowerCase();
}

function filterSchemaToRequired<TValues extends Record<string, any>>(
  schema: FormSchema<TValues>
): FormSchema<TValues> | null {
  const filterFields = (fields: FormFieldConfig[]): FormFieldConfig[] =>
    fields
      .map((field) => {
        if (field.type === "object") {
          const childFields = filterFields(field.fields);
          if (childFields.length === 0 && !field.required) {
            return null;
          }
          return { ...field, fields: childFields };
        }
        if (field.type === "list") {
          const childFields = filterFields(field.fields);
          if (childFields.length === 0 && !field.required) {
            return null;
          }
          return { ...field, fields: childFields };
        }
        return field.required ? field : null;
      })
      .filter((field): field is FormFieldConfig => Boolean(field));

  if (schema.sections?.length) {
    const sections = schema.sections
      .map((section) => ({
        ...section,
        fields: filterFields(section.fields),
      }))
      .filter((section) => section.fields.length > 0);
    if (sections.length === 0) return null;
    return {
      ...schema,
      sections,
    };
  }
  if (schema.fields?.length) {
    const fields = filterFields(schema.fields);
    if (fields.length === 0) return null;
    return {
      ...schema,
      fields,
    };
  }
  return null;
}

function filterSchemaByEditability<TValues extends Record<string, any>>(
  schema: FormSchema<TValues>
): FormSchema<TValues> | null {
  const filterFields = (fields: FormFieldConfig[]): FormFieldConfig[] =>
    fields
      .map((field) => {
        if (field.readOnly || field.disabled) {
          return null;
        }
        if (field.type === "object") {
          const childFields = filterFields(field.fields);
          if (childFields.length === 0) {
            return null;
          }
          return { ...field, fields: childFields };
        }
        if (field.type === "list") {
          const childFields = filterFields(field.fields);
          if (childFields.length === 0) {
            return null;
          }
          return { ...field, fields: childFields };
        }
        return field;
      })
      .filter((field): field is FormFieldConfig => Boolean(field));

  if (schema.sections?.length) {
    const sections = schema.sections
      .map((section) => ({
        ...section,
        fields: filterFields(section.fields),
      }))
      .filter((section) => section.fields.length > 0);
    if (sections.length === 0) return null;
    return {
      ...schema,
      sections,
    };
  }
  if (schema.fields?.length) {
    const fields = filterFields(schema.fields);
    if (fields.length === 0) return null;
    return {
      ...schema,
      fields,
    };
  }
  return null;
}

function filterSchemaByVisibility<TValues extends Record<string, any>>(
  schema: FormSchema<TValues>
): FormSchema<TValues> | null {
  const filterFields = (fields: FormFieldConfig[]): FormFieldConfig[] =>
    fields
      .map((field) => {
        if ((field as any).hidden) {
          return null;
        }
        if (field.type === "object") {
          const childFields = filterFields(field.fields);
          if (childFields.length === 0 && !field.required) {
            return null;
          }
          return { ...field, fields: childFields };
        }
        if (field.type === "list") {
          const childFields = filterFields(field.fields);
          if (childFields.length === 0 && !field.required) {
            return null;
          }
          return { ...field, fields: childFields };
        }
        return field;
      })
      .filter((field): field is FormFieldConfig => Boolean(field));

  if (schema.sections?.length) {
    const sections = schema.sections
      .map((section) => ({
        ...section,
        fields: filterFields(section.fields),
      }))
      .filter((section) => section.fields.length > 0);
    if (sections.length === 0) return null;
    return {
      ...schema,
      sections,
    };
  }
  if (schema.fields?.length) {
    const fields = filterFields(schema.fields);
    if (fields.length === 0) return null;
    return {
      ...schema,
      fields,
    };
  }
  return null;
}

type FieldLabelMap = Record<string, string>;

const ALWAYS_INCLUDED_FORM_FIELDS = new Set(["id"]);

function buildFieldLabelMap<TValues extends Record<string, any>>(
  schema: FormSchema<TValues>
): FieldLabelMap {
  const labels: FieldLabelMap = {};

  const collect = (fields: FormFieldConfig[], prefix?: string) => {
    fields.forEach((field) => {
      const path = prefix ? `${prefix}.${field.name}` : field.name;
      labels[path] = field.label ?? field.name;
      if (field.type === "object") {
        collect(field.fields, path);
        return;
      }
      if (field.type === "list") {
        const wildcardPath = `${path}.*`;
        labels[wildcardPath] = labels[path];
        collect(field.fields, wildcardPath);
        return;
      }
    });
  };

  if (schema.sections?.length) {
    schema.sections.forEach((section) => collect(section.fields));
    return labels;
  }
  if (schema.fields?.length) {
    collect(schema.fields);
  }
  return labels;
}

function getFieldLabelFromMap(map: FieldLabelMap, fieldName?: string | null) {
  if (!fieldName) return undefined;
  if (map[fieldName]) return map[fieldName];
  const wildcardCandidate = fieldName.replace(/\.\d+(?=\.|$)/g, ".*");
  if (map[wildcardCandidate]) return map[wildcardCandidate];
  const segments = fieldName.split(".");
  while (segments.length > 1) {
    segments.pop();
    const candidate = segments.join(".");
    if (map[candidate]) return map[candidate];
  }
  return undefined;
}

function filterValuesBySchema<TValues extends Record<string, any>>(
  values: TValues,
  schema: FormSchema<TValues>
) {
  const appendAlwaysIncludedFields = (
    target: Record<string, any>,
    source: Record<string, any> | undefined
  ) => {
    if (!source) {
      return target;
    }
    ALWAYS_INCLUDED_FORM_FIELDS.forEach((fieldName) => {
      const value = source[fieldName as keyof typeof source];
      if (value !== undefined) {
        target[fieldName] = value;
      }
    });
    return target;
  };

  const reduceFields = (
    fields: FormFieldConfig[],
    source: Record<string, any>
  ) => {
    const target: Record<string, any> = {};
    fields.forEach((field) => {
      const value = source?.[field.name];
      if (field.type === "object") {
        const child = reduceFields(field.fields, value ?? {});
        if (Object.keys(child).length > 0) {
          target[field.name] = child;
        }
        return;
      }
      if (field.type === "list") {
        if (Array.isArray(value)) {
          const nextList = value
            .map((item) => reduceFields(field.fields, item ?? {}))
            .filter((item) => Object.keys(item).length > 0);
          if (nextList.length > 0) {
            target[field.name] = nextList;
          }
        }
        return;
      }
      if (value !== undefined) {
        target[field.name] = value;
      }
    });
    return target;
  };

  if (schema.sections?.length) {
    const reduced = schema.sections.reduce<Record<string, any>>(
      (acc, section) => {
        const sectionValues = reduceFields(
          section.fields,
          values as Record<string, any>
        );
        return {
          ...acc,
          ...sectionValues,
        };
      },
      {}
    );
    return appendAlwaysIncludedFields(reduced, values as Record<string, any>);
  }

  if (schema.fields?.length) {
    const reduced = reduceFields(schema.fields, values as Record<string, any>);
    return appendAlwaysIncludedFields(reduced, values as Record<string, any>);
  }

  if (values && typeof values === "object") {
    const clone = { ...(values as Record<string, any>) };
    appendAlwaysIncludedFields(clone, values as Record<string, any>);
    return clone;
  }

  return values;
}

function getValueAtPath(source: Record<string, any>, path: string) {
  if (!path) return undefined;
  const segments = path.split(".");
  let current: any = source;
  for (const segment of segments) {
    if (current === undefined || current === null) {
      return undefined;
    }
    const isIndex = /^\d+$/.test(segment);
    if (isIndex) {
      const index = Number(segment);
      current = Array.isArray(current) ? current[index] : undefined;
    } else {
      current = current?.[segment];
    }
  }
  return current;
}

function hasValueChangedSinceError(
  fieldName: string,
  values: Record<string, any>,
  errorSnapshots: Map<string, any>
) {
  const previous = errorSnapshots.get(fieldName);
  const current = getValueAtPath(values, fieldName);
  return !deepEqual(previous, current);
}

function deepEqual(a: any, b: any): boolean {
  if (a === b) {
    return true;
  }
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    for (let index = 0; index < a.length; index += 1) {
      if (!deepEqual(a[index], b[index])) {
        return false;
      }
    }
    return true;
  }
  if (a && b && typeof a === "object" && typeof b === "object") {
    const keysA = Object.keys(a);
    const keysB = Object.keys(b as Record<string, any>);
    if (keysA.length !== keysB.length) {
      return false;
    }
    for (const key of keysA) {
      if (!deepEqual(a[key], (b as Record<string, any>)[key])) {
        return false;
      }
    }
    return true;
  }
  return false;
}

export default ModelForm;
