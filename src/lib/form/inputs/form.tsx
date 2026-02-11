/**
 * DynamicForm — the main form component.
 *
 * Thin orchestrator that wires up hooks and delegates rendering
 * to the appropriate mode component based on layout configuration.
 */
import React from "react";
import { useForm, type UseFormReturn, useStore } from "@tanstack/react-form";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import type { DynamicFormProps } from "../types/props";
import type { FormSectionConfig } from "../types/schema";
import { useFormDefaults } from "../hooks/useFormDefaults";
import { useFormAutoReset } from "../hooks/useFormAutoReset";
import { useFormChangeTracking } from "../hooks/useFormChangeTracking";
import { useFormConditions } from "../hooks/useFormConditions";
import { useFormComputed } from "../hooks/useFormComputed";
import { useFormDependencies } from "../hooks/useFormDependencies";
import { useFormValidation } from "../hooks/useFormValidation";
import { ActionsBar } from "../renderers/ActionsBar";
import { DebugPanel } from "../renderers/DebugPanel";
import { StandardMode } from "../renderers/modes/StandardMode";
import { WizardMode } from "../renderers/modes/WizardMode";
import { AccordionMode } from "../renderers/modes/AccordionMode";
import { MasterDetailMode } from "../renderers/modes/MasterDetailMode";
import { ReviewMode } from "../renderers/modes/ReviewMode";
import { normalizeFieldOrder } from "./fieldOrder";

const DEFAULT_COLUMNS = 2;

const DynamicForm = <TValues extends Record<string, any> = Record<string, any>>(
  props: DynamicFormProps<TValues>,
) => {
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
  const onReady = stateConfig?.onReady;

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
      const isValid = runValidation(value);
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

  const formValues = useStore(form.store, (state) => state.values) as TValues;

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
      fields: normalizeFieldOrder(section.fields),
    }));
  }, [schema.fields, schema.sections]);

  // ─── Conditional visibility ──────────────────────────────────────────

  const { hiddenFields, hiddenSections } = useFormConditions(
    formValues,
    form,
    sections,
    conditions,
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
      ? "gap-4 bg-transparent"
      : "h-full rounded-2xl bg-card/10 p-6 border border-border/40 shadow-sm",
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

        {!isWizardMode ? (
          <ActionsBar
            form={form}
            config={actionsConfig}
            isLoading={isLoading}
            variant={layoutVariant}
          />
        ) : null}

        {isLoading && (
          <div className="absolute inset-0 z-[100] flex items-center justify-center rounded-2xl bg-background/60 backdrop-blur-[2px] animate-in fade-in duration-300">
            <div className="flex flex-col items-center gap-3 rounded-xl border bg-background p-6 shadow-2xl">
              <Loader2 className="size-8 animate-spin text-primary" />
              <p className="text-sm font-bold tracking-tight text-muted-foreground">
                Chargement en cours...
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
