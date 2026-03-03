/**
 * DynamicForm — the main form component.
 *
 * Thin orchestrator that wires up hooks and delegates rendering
 * to the appropriate mode component based on layout configuration.
 */
import React from "react";
import { useForm, type UseFormReturn, useStore } from "@tanstack/react-form";
import { cn } from "@/shared/utils";
import { Loader2 } from "lucide-react";
import type { DynamicFormProps } from "../types/props";
import type { FormFieldConfig, FormSectionConfig } from "../types/schema";
import { useFormDefaults } from "../hooks/useFormDefaults";
import { useFormAutoReset } from "../hooks/useFormAutoReset";
import { useFormChangeTracking } from "../hooks/useFormChangeTracking";
import { useFormConditions } from "../hooks/useFormConditions";
import { useFormComputed } from "../hooks/useFormComputed";
import { useFormDependencies } from "../hooks/useFormDependencies";
import { useFormValidation } from "../hooks/useFormValidation";
import { useFormPersistence } from "../hooks/useFormPersistence";
import { useFormHistory } from "../hooks/useFormHistory";
import { ActionsBar } from "../renderers/ActionsBar";
import { DebugPanel } from "../renderers/DebugPanel";
import { StandardMode } from "../renderers/modes/StandardMode";
import { WizardMode } from "../renderers/modes/WizardMode";
import { AccordionMode } from "../renderers/modes/AccordionMode";
import { MasterDetailMode } from "../renderers/modes/MasterDetailMode";
import { ReviewMode } from "../renderers/modes/ReviewMode";
import { normalizeFieldOrder } from "./fieldOrder";

const DEFAULT_COLUMNS = 2;
const CANONICAL_FORM_ERROR_KEY = "__all__";
const LEGACY_DYNAMIC_FORM_PROP_KEYS = [
  "defaultValues",
  "disableAutoReset",
  "readOnly",
  "disabled",
  "isLoading",
  "isSubmitting",
  "onReady",
  "persistKey",
  "onSubmit",
  "onChange",
  "validate",
  "conditions",
  "computed",
  "dependencies",
  "autosave",
  "columns",
  "variant",
  "showSectionHeaders",
  "mode",
  "submitLabel",
  "resetLabel",
  "onReset",
] as const;

function assertNoLegacyDynamicFormProps(props: Record<string, unknown>): void {
  if (import.meta.env.PROD) return;

  const invalid = LEGACY_DYNAMIC_FORM_PROP_KEYS.filter((key) =>
    Object.prototype.hasOwnProperty.call(props, key),
  );
  if (!invalid.length) return;

  throw new Error(
    `[DynamicForm] Legacy props are not supported: ${invalid.join(
      ", ",
    )}. Use state/behavior/layout/actions/devtools.`,
  );
}

function collectSubmitMessages(meta: unknown): string[] {
  if (!meta || typeof meta !== "object") {
    return [];
  }

  const payload = meta as {
    errors?: unknown;
    errorMap?: Record<string, unknown>;
  };
  const collected: string[] = [];

  if (Array.isArray(payload.errors)) {
    payload.errors.forEach((entry) => {
      const normalized = String(entry ?? "").trim();
      if (normalized) {
        collected.push(normalized);
      }
    });
  }

  const submitError = payload.errorMap?.onSubmit;
  if (submitError !== undefined && submitError !== null) {
    const normalized = String(submitError).trim();
    if (normalized) {
      collected.push(normalized);
    }
  }

  return collected;
}

function collectRenderableFieldPaths(
  sections: FormSectionConfig[],
  hiddenFields: Set<string>,
) {
  const paths = new Set<string>();

  const walkField = (field: FormFieldConfig, path: string) => {
    if (!path || field.hidden || hiddenFields.has(path)) {
      return;
    }

    paths.add(path);

    if (field.type !== "group" && field.type !== "object") {
      return;
    }

    field.fields.forEach((child) => {
      const childName = String((child as FormFieldConfig).name ?? "").trim();
      if (!childName) return;
      walkField(child as FormFieldConfig, `${path}.${childName}`);
    });
  };

  sections.forEach((section) => {
    section.fields.forEach((field) => {
      const name = String((field as FormFieldConfig).name ?? "").trim();
      if (!name) return;
      walkField(field as FormFieldConfig, name);
    });
  });

  return paths;
}

function isRenderableFieldPath(
  path: string,
  renderableFieldPaths: Set<string>,
) {
  if (renderableFieldPaths.has(path)) {
    return true;
  }

  const segments = path.split(".").filter(Boolean);
  for (let index = segments.length - 1; index > 0; index -= 1) {
    const parent = segments.slice(0, index).join(".");
    if (renderableFieldPaths.has(parent)) {
      return true;
    }
  }

  return false;
}

function collectGlobalSubmitErrors(
  fieldMeta: Record<string, unknown>,
  renderableFieldPaths: Set<string>,
) {
  const errors: string[] = [];

  Object.entries(fieldMeta).forEach(([path, meta]) => {
    const isFormLevel =
      path === CANONICAL_FORM_ERROR_KEY ||
      !isRenderableFieldPath(path, renderableFieldPaths);

    if (!isFormLevel) return;

    errors.push(...collectSubmitMessages(meta));
  });

  return Array.from(new Set(errors));
}

function countFieldNodes(fields: FormFieldConfig[]): number {
  return fields.reduce((count, field) => {
    const current = field as FormFieldConfig;
    const hasNestedFields =
      (current.type === "group" || current.type === "object") &&
      Array.isArray(current.fields) &&
      current.fields.length > 0;

    const nestedCount = hasNestedFields
      ? countFieldNodes(current.fields as FormFieldConfig[])
      : 0;

    return count + 1 + nestedCount;
  }, 0);
}

const DynamicForm = <TValues extends Record<string, any> = Record<string, any>>(
  props: DynamicFormProps<TValues>,
) => {
  assertNoLegacyDynamicFormProps(props as unknown as Record<string, unknown>);

  const {
    schema,
    state: stateConfig,
    behavior: behaviorConfig,
    layout: layoutConfig,
    actions: actionsConfig,
    devtools: devtoolsConfig,
  } = props;

  // ─── Destructure configs with defaults ───────────────────────────────

  const externalForm = stateConfig?.form;
  const defaultValues = stateConfig?.defaultValues;
  const disableAutoReset = stateConfig?.disableAutoReset ?? false;
  const globalReadOnly = stateConfig?.readOnly ?? false;
  const globalDisabled = stateConfig?.disabled ?? false;
  const isLoading = stateConfig?.isLoading ?? false;
  const externalSubmitting = stateConfig?.isSubmitting ?? false;
  const onReady = stateConfig?.onReady;
  const persistKey = stateConfig?.persistKey;

  const onSubmit = behaviorConfig?.onSubmit;
  const onChange = behaviorConfig?.onChange;
  const validate = behaviorConfig?.validate;
  const conditions = behaviorConfig?.conditions;
  const computed = behaviorConfig?.computed;
  const dependencies = behaviorConfig?.dependencies;
  const autosave = behaviorConfig?.autosave;

  const layoutColumns = layoutConfig?.columns ?? DEFAULT_COLUMNS;
  const layoutVariant = layoutConfig?.variant ?? "default";
  const showSectionHeaders = layoutConfig?.showSectionHeaders ?? true;
  const layoutMode = layoutConfig?.mode ?? { type: "standard" };
  const layoutClassName = layoutConfig?.className;

  const debug = devtoolsConfig?.enabled ?? false;
  const logChanges = devtoolsConfig?.logChanges ?? false;

  // ─── Compute defaults ────────────────────────────────────────────────

  const computedDefaults = useFormDefaults(schema, defaultValues);

  // ─── Form instance ───────────────────────────────────────────────────

  const { runValidation } = useFormValidation({
    form: externalForm as any,
    validate,
    schemaValidators: schema.validators,
  });

  const internalForm = useForm<TValues>({
    defaultValues: computedDefaults,
    onSubmit: async ({ value }) => {
      // Run form-level validation
      const isValid = runValidation(value, form as any);
      if (!isValid) return;
      await onSubmit?.(value, { form, isInternal: !externalForm });
    },
  });

  const form = externalForm ?? internalForm;

  // External form initialization
  const hasInitializedRef = React.useRef(false);
  if (externalForm && !hasInitializedRef.current) {
    hasInitializedRef.current = true;
    const currentValues = externalForm.state.values as Record<string, any>;
    const needsReset = Object.keys(schema.initialValues ?? {}).some((key) => {
      const initial = (schema.initialValues as Record<string, any>)?.[key];
      const current = currentValues?.[key];
      if (initial !== undefined && initial !== null) {
        if (current === undefined || current === null) return true;
        if (
          Array.isArray(initial) &&
          Array.isArray(current) &&
          initial.length > 0 &&
          current.length === 0
        )
          return true;
        if (
          typeof initial === "object" &&
          typeof current === "object" &&
          !Array.isArray(initial)
        ) {
          const initialKeys = Object.keys(initial);
          const currentKeys = Object.keys(current);
          if (initialKeys.length > 0 && currentKeys.length === 0) return true;
        }
      }
      return false;
    });
    if (needsReset) {
      externalForm.reset(computedDefaults);
    }
  }

  // ─── Ready callback ──────────────────────────────────────────────────

  React.useEffect(() => {
    onReady?.(form);
  }, [form, onReady]);

  // ─── Store subscriptions ─────────────────────────────────────────────

  const formValues = useStore(
    form.store,
    (state: any) => state.values,
  ) as TValues;
  const fieldMeta = useStore(
    form.store,
    (state) =>
      (state as { fieldMeta?: Record<string, unknown> }).fieldMeta ?? {},
  );

  // ─── Persistence ─────────────────────────────────────────────────────

  useFormPersistence(form, persistKey, !!persistKey);

  // ─── History (Undo/Redo) ─────────────────────────────────────────────

  const estimatedFieldCount = React.useMemo(() => {
    const rootFields = schema.sections?.length
      ? schema.sections.flatMap(
          (section) => section.fields as FormFieldConfig[],
        )
      : ((schema.fields as FormFieldConfig[] | undefined) ?? []);
    return countFieldNodes(rootFields);
  }, [schema.fields, schema.sections]);

  const adaptiveHistoryMax =
    estimatedFieldCount >= 80 ? 10 : estimatedFieldCount >= 40 ? 20 : 30;
  const adaptiveHistoryDebounceMs = estimatedFieldCount >= 80 ? 600 : 300;

  const history = useFormHistory(
    form,
    actionsConfig?.undoRedo?.enabled ?? false,
    actionsConfig?.undoRedo?.maxHistory ?? adaptiveHistoryMax,
    actionsConfig?.undoRedo?.debounceMs ?? adaptiveHistoryDebounceMs,
  );

  // ─── Auto-reset on defaults change ───────────────────────────────────

  useFormAutoReset(form, computedDefaults, disableAutoReset);

  // ─── Change tracking ─────────────────────────────────────────────────

  const autosaveTimer = React.useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  const handleChange = React.useCallback(
    (
      values: TValues,
      changes: import("../types/schema").ChangeRecord[],
      f: UseFormReturn<TValues>,
    ) => {
      onChange?.(values, changes, f);

      if (autosave?.enabled && autosave.onSave) {
        if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
        autosaveTimer.current = setTimeout(() => {
          autosave.onSave(values, changes);
        }, autosave.debounceMs ?? 500);
      }
    },
    [onChange, autosave],
  );

  const { changeLog } = useFormChangeTracking({
    formValues,
    form,
    computedDefaults,
    onChange: handleChange,
    debug,
    logChanges,
  });

  // ─── Sections resolution ─────────────────────────────────────────────

  const sections = React.useMemo<FormSectionConfig[]>(() => {
    const resolvedSections = schema.sections?.length
      ? schema.sections
      : schema.fields?.length
        ? [{ id: "default", fields: schema.fields }]
        : [];
    return resolvedSections.map((section) => ({
      ...section,
      fields: normalizeFieldOrder(section.fields, {
        ordering: layoutConfig?.ordering,
        sectionId: section.id,
      }),
    }));
  }, [layoutConfig?.ordering, schema.fields, schema.sections]);

  // ─── Conditional visibility ──────────────────────────────────────────

  const { hiddenFields, hiddenSections } = useFormConditions(
    formValues,
    form,
    sections,
    conditions,
  );

  const renderableFieldPaths = React.useMemo(
    () => collectRenderableFieldPaths(sections, hiddenFields),
    [sections, hiddenFields],
  );

  const globalSubmitErrors = React.useMemo(
    () =>
      collectGlobalSubmitErrors(
        fieldMeta as Record<string, unknown>,
        renderableFieldPaths,
      ),
    [fieldMeta, renderableFieldPaths],
  );

  // ─── Computed fields ─────────────────────────────────────────────────

  useFormComputed(formValues, form, computed);

  // ─── Field dependencies ──────────────────────────────────────────────

  useFormDependencies(formValues, form, dependencies);

  // ─── Form validation reference (for internal form) ───────────────────

  const validationRef = React.useRef(runValidation);
  validationRef.current = runValidation;

  // Update internal form submit handler if validation changes
  React.useEffect(() => {
    if (externalForm) return;
    // Already set in useForm config above
  }, [externalForm]);

  // ─── Submit handler ──────────────────────────────────────────────────

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    form.handleSubmit();
  };

  // ─── Layout classes ──────────────────────────────────────────────────

  const isPopup = layoutVariant === "popup" || layoutVariant === "compact";

  const formWrapperClass = cn(
    "relative flex flex-col w-full transition-all duration-300",
    isPopup
      ? "gap-3 border-0 bg-transparent p-0 shadow-none backdrop-blur-0 rounded-none"
      : "h-full bg-card/10 p-6 border border-border/40 shadow-sm rounded-xl",
    layoutClassName,
  );

  const formBodyClass = cn(
    "flex-1 overflow-y-auto overflow-x-hidden px-1 scroll-smooth",
    "scrollbar-thin scroll-track-transparent scrollbar-thumb-muted-foreground/20 hover:scrollbar-thumb-muted-foreground/30",
    isPopup ? "space-y-4" : "space-y-8 pr-2",
  );

  // ─── Mode rendering ─────────────────────────────────────────────────

  const modeProps = {
    sections,
    form,
    columns: layoutColumns,
    variant: layoutVariant,
    hiddenFields,
    hiddenSections,
    globalReadOnly,
    globalDisabled,
  };

  const isWizardMode = layoutMode.type === "wizard";

  const resolvedActionsConfig = React.useMemo(() => {
    if (!actionsConfig && !externalSubmitting) {
      return actionsConfig;
    }
    return {
      ...(actionsConfig ?? {}),
      isSubmitting: Boolean(actionsConfig?.isSubmitting || externalSubmitting),
    };
  }, [actionsConfig, externalSubmitting]);

  const renderMode = () => {
    switch (layoutMode.type) {
      case "wizard":
        return (
          <WizardMode
            {...modeProps}
            config={layoutMode}
            onFinalSubmit={() => form.handleSubmit()}
          />
        );
      case "accordion":
        return <AccordionMode {...modeProps} config={layoutMode} />;
      case "master-detail":
        return <MasterDetailMode {...modeProps} config={layoutMode} />;
      case "review":
        return <ReviewMode {...modeProps} config={layoutMode} />;
      default:
        return <StandardMode {...modeProps} showHeaders={showSectionHeaders} />;
    }
  };

  // ─── Render ──────────────────────────────────────────────────────────

  return (
    <div className="relative h-full w-full">
      <form className={formWrapperClass} onSubmit={handleSubmit} noValidate>
        <div className={formBodyClass}>
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out">
            {renderMode()}
          </div>
        </div>

        {globalSubmitErrors.length > 0 ? (
          <div
            data-testid="dynamic-form-global-errors"
            role="alert"
            className="mx-1 border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive rounded-md"
          >
            {globalSubmitErrors.map((message, index) => (
              <p key={`global-submit-error-${index}`}>{message}</p>
            ))}
          </div>
        ) : null}

        {!isWizardMode ? (
          <ActionsBar
            form={form}
            config={resolvedActionsConfig}
            isLoading={isLoading}
            variant={layoutVariant}
            history={history}
          />
        ) : null}

        {isLoading && (
          <div className="absolute inset-0 z-[100] flex items-center justify-center bg-background/60 backdrop-blur-[2px] animate-in fade-in duration-300">
            <div className="flex flex-col items-center gap-3 border bg-background p-6 shadow-2xl rounded-2xl">
              <Loader2 className="size-8 animate-spin text-primary" />
              <p className="text-sm font-bold tracking-tight text-muted-foreground">
                Chargement...
              </p>
            </div>
          </div>
        )}
      </form>

      <DebugPanel
        form={form}
        formValues={formValues}
        changeLog={changeLog}
        config={devtoolsConfig}
        isLoading={isLoading}
      />
    </div>
  );
};

export default DynamicForm;
