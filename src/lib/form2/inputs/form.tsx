import React from "react";
import { useForm, type UseFormReturn, useStore } from "@tanstack/react-form";
import { Button } from "@/lib/components/ui/button";
import { Card } from "@/lib/components/ui/card";
import { cn } from "@/lib/utils";
import {
  FormBuilderProps,
  FormFieldConfig,
  FormSchema,
  ListFieldConfig,
  ObjectFieldConfig,
  FormSectionConfig,
  ChangeRecord,
  FieldComponentProps,
  ChoiceFieldConfig,
  FormInputType,
} from "./types";
import { resolveInputComponent } from "./factory";
import { resolveFieldErrors, resolveRequiredError } from "./common";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/lib/components/ui/collapsible";
import { ChevronDownIcon } from "lucide-react";
type PrimitiveField = Exclude<
  FormFieldConfig,
  ObjectFieldConfig | ListFieldConfig
>;
const DEFAULT_COLUMNS = 2;
const DynamicForm = <TValues extends Record<string, any> = Record<string, any>>(
  props: FormBuilderProps<TValues>,
) => {
  const {
    schema,
    form: externalForm,
    onFormReady,
    defaultValues,
    onSubmit,
    onChange,
    submitLabel = "Enregistrer",
    resetLabel = "Réinitialiser",
    debug = false,
    debugValueTransformer,
    className,
    inPopup = false,
    layout,
    actionSlot,
    isLoading,
    showSectionHeaders = true,
    disableAutoReset = false,
  } = props;
  const computedDefaults = React.useMemo(
    () =>
      deepMergeDefaults(
        buildDefaultsFromSchema(schema),
        schema.initialValues ?? {},
        defaultValues ?? {}
      ) as TValues,
    [schema, defaultValues],
  );
  const internalForm = useForm<TValues>({
    defaultValues: computedDefaults,
    onSubmit: async ({ value }) => {
      await onSubmit?.(value, { form, isInternal: !externalForm });
    },
  });
  const form = externalForm ?? internalForm;

  // When using an external form, ensure it has the correct initial values
  // This must run synchronously on mount to prevent empty field flash
  const hasInitializedRef = React.useRef(false);
  if (externalForm && !hasInitializedRef.current) {
    hasInitializedRef.current = true;
    // Check if form values differ from computed defaults for nested fields
    const currentValues = externalForm.state.values as Record<string, any>;
    const needsReset = Object.keys(schema.initialValues ?? {}).some((key) => {
      const initial = (schema.initialValues as Record<string, any>)?.[key];
      const current = currentValues?.[key];
      // Check if nested value is missing or empty when it shouldn't be
      if (initial !== undefined && initial !== null) {
        if (current === undefined || current === null) return true;
        if (Array.isArray(initial) && Array.isArray(current) && initial.length > 0 && current.length === 0) return true;
        if (typeof initial === 'object' && typeof current === 'object' && !Array.isArray(initial)) {
          // Check if object is empty when it shouldn't be
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

  React.useEffect(() => {
    onFormReady?.(form);
  }, [form, onFormReady]);
  const formValues = useStore(form.store, (state) => state.values) as TValues;
  const isSubmitting = useStore(form.store, (state) => state.isSubmitting);
  const canSubmit = useStore(form.store, (state) => state.canSubmit);
  const fieldMeta = useStore(
    form.store,
    (state) => (state as any).fieldMeta ?? {},
  );

  const submitDiagnostics = React.useMemo(() => {
    const entries = Object.entries(fieldMeta as Record<string, any>);
    const hasServerErrors = entries.some(([, meta]) =>
      Boolean((meta as any)?.errorMap?.onSubmit),
    );
    const hasUserInteraction = entries.some(([, meta]) =>
      Boolean(meta?.isBlurred || meta?.isDirty),
    );
    const shouldSurfaceState = hasServerErrors || hasUserInteraction;
    if (!shouldSurfaceState) {
      return { reasons: [], untouched: [], invalid: [] };
    }
    const invalid = entries
      .filter(
        ([, meta]) =>
          meta &&
          meta.isValid === false &&
          (meta.isBlurred || meta.isDirty || (meta as any)?.errorMap?.onSubmit),
      )
      .map(([name, meta]) => ({
        name,
        errors: (meta as any)?.errors ?? [],
      }));
    const untouched = hasUserInteraction
      ? entries
          .filter(([, meta]) => meta && meta.isBlurred === false)
          .map(([name]) => name)
      : [];
    const reasons: string[] = [];
    if (shouldSurfaceState && !canSubmit)
      reasons.push("form invalid or untouched");
    if (isSubmitting) reasons.push("form is submitting");
    if (isLoading) reasons.push("external loading flag");
    return { reasons, untouched, invalid };
  }, [canSubmit, fieldMeta, isLoading, isSubmitting]);
  const lastDefaultsRef = React.useRef(computedDefaults);
  React.useEffect(() => {
    if (disableAutoReset) {
      lastDefaultsRef.current = computedDefaults;
      return;
    }
    if (deepEqual(lastDefaultsRef.current, computedDefaults)) {
      return;
    }
    lastDefaultsRef.current = computedDefaults;
    form.reset(computedDefaults);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [computedDefaults, form, disableAutoReset]);
  const [changeLog, setChangeLog] = React.useState<ChangeRecord[]>([]);
  const lastValuesRef = React.useRef<TValues>(computedDefaults);
  React.useEffect(() => {
    // Skip expensive diffing when consumers are not listening.
    if (!onChange && !debug) {
      lastValuesRef.current = formValues as TValues;
      return;
    }
    const diffs = diffValues(lastValuesRef.current, formValues as TValues);
    if (diffs.length > 0) {
      lastValuesRef.current = formValues as TValues;
      if (debug) {
        setChangeLog((prev) => [...prev, ...diffs].slice(-100));
      }
      onChange?.(formValues as TValues, diffs, form);
    }
  }, [formValues, form, onChange, debug]);
  const sections = React.useMemo<FormSectionConfig[]>(() => {
    const resolvedSections = schema.sections?.length
      ? schema.sections
      : schema.fields?.length
        ? [{ id: "default", fields: schema.fields }]
        : [];
    return resolvedSections.map((section) => normalizeSection(section));
  }, [schema.fields, schema.sections]);
  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    form.handleSubmit();
  };
  const gridColumns = layout?.columns ?? DEFAULT_COLUMNS;
  const formBodyClass = inPopup
    ? "flex-1 overflow-y-auto space-y-3"
    : "flex-1 overflow-y-auto space-y-4 pr-1";
  const formWrapperClass = cn(
    inPopup
      ? "flex w-full flex-col gap-3"
      : "flex h-full w-full flex-col rounded-xl p-4",
    className,
  );
  const actionsClass = inPopup
    ? "mt-3 flex flex-wrap items-center justify-end gap-2"
    : "mt-4 flex flex-wrap items-center justify-end gap-2 border-t pt-4";
  return (
    <form className={formWrapperClass} onSubmit={handleSubmit}>
      <div className={formBodyClass}>
        {sections.map((section, index) => (
          <SectionRenderer
            key={
              section.id ??
              section.title ??
              section.fields[0]?.name ??
              `section-${index}`
            }
            section={section}
            form={form}
            columns={section.columns ?? gridColumns}
            showHeaders={showSectionHeaders}
            inPopup={inPopup}
          />
        ))}
        {debug ? (
          <Card className="p-4 space-y-2">
            <pre className="text-xs">
              {JSON.stringify(
                debugValueTransformer
                  ? debugValueTransformer(formValues as TValues)
                  : formValues,
                null,
                2,
              )}
            </pre>
            <pre className="text-[11px] text-muted-foreground">
              {JSON.stringify(changeLog.slice(-5), null, 2)}
            </pre>
            {submitDiagnostics.reasons.length ? (
              <div className="text-xs text-destructive space-y-1">
                <p>Bouton désactivé: {submitDiagnostics.reasons.join(", ")}</p>
                {submitDiagnostics.untouched.length ? (
                  <p>
                    Champs non modifiés:{" "}
                    {submitDiagnostics.untouched.join(", ")}
                  </p>
                ) : null}
                {submitDiagnostics.invalid.length ? (
                  <div>
                    <p>Champs invalides:</p>
                    <ul className="list-disc pl-4 space-y-0.5">
                      {submitDiagnostics.invalid.map(({ name, errors }) => (
                        <li key={name}>
                          {name}
                          {errors?.length ? ` (${errors.join(", ")})` : ""}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            ) : null}
          </Card>
        ) : null}
      </div>
      <div className={actionsClass}>
        <div className="flex items-center gap-2">
          <Button type="submit" disabled={isSubmitting || isLoading}>
            {isSubmitting ? "Enregistrement..." : submitLabel}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => form.reset()}
            disabled={isSubmitting}
          >
            {resetLabel}
          </Button>
        </div>
        {actionSlot}
      </div>
    </form>
  );
};
type SectionRendererProps<TValues> = {
  section: FormSectionConfig;
  form: UseFormReturn<TValues>;
  columns: number;
  showHeaders: boolean;
  inPopup: boolean;
};
const SectionRenderer = <TValues extends Record<string, any>>({
  section,
  form,
  columns,
  showHeaders,
  inPopup,
}: SectionRendererProps<TValues>) => {
  const responsiveClasses = React.useMemo(
    () => buildResponsiveGridClass(columns),
    [columns],
  );
  const ui = section.ui ?? {};
  const cardEnabled = ui.card ?? false;
  const Wrapper = cardEnabled ? Card : "div";
  const wrapperClass = cardEnabled ? "space-y-3 p-4" : "space-y-3";
  const accordionEnabled = Boolean(ui.accordion);
  const defaultAccordionOpen = ui.accordionDefaultOpen ?? true;
  const [accordionOpen, setAccordionOpen] =
    React.useState(defaultAccordionOpen);
  const previousDefaultRef = React.useRef(defaultAccordionOpen);
  React.useEffect(() => {
    if (previousDefaultRef.current !== defaultAccordionOpen) {
      previousDefaultRef.current = defaultAccordionOpen;
      setAccordionOpen(defaultAccordionOpen);
    }
  }, [defaultAccordionOpen]);
  const headerVisible = Boolean(
    (section.title || section.description) && showHeaders,
  );

  const fieldsGrid = (
    <div
      className={cn(
        "grid gap-y-1",
        responsiveClasses,
        section.ui?.bodyClassName,
        inPopup ? "px-0" : null,
      )}
    >
      {section.fields.map((field) => {
        const span = field.type === "list" ? columns : field.colSpan;
        return (
          <FieldRenderer
            key={field.name}
            config={field}
            path={field.name}
            form={form}
            colSpan={span}
          />
        );
      })}
    </div>
  );

  const headerContent = headerVisible ? (
    <div>
      {section.title ? (
        <h3 className="text-base font-semibold">{section.title}</h3>
      ) : null}
      {section.description ? (
        <p className="text-sm text-muted-foreground">{section.description}</p>
      ) : null}
    </div>
  ) : null;

  if (!accordionEnabled) {
    return (
      <Wrapper
        className={cn(
          wrapperClass,
          !cardEnabled && "border-0 shadow-none bg-transparent p-0",
          section.ui?.className,
          inPopup ? "p-0" : null,
        )}
      >
        {headerContent}
        {fieldsGrid}
      </Wrapper>
    );
  }

  const accordionTitle = section.title ?? section.id ?? "Section";

  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-transparent",
        section.ui?.className,
      )}
    >
      <Collapsible
        open={accordionOpen}
        onOpenChange={(open) => setAccordionOpen(open)}
      >
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="flex w-full items-center justify-between px-4 py-3 text-left outline-none focus-visible:ring-ring focus-visible:ring-2"
          >
            <div>
              <p className="text-sm font-semibold">{accordionTitle}</p>
              {section.description ? (
                <p className="text-xs text-muted-foreground">
                  {section.description}
                </p>
              ) : null}
            </div>
            <ChevronDownIcon
              className={cn(
                "size-5 transition-transform duration-200",
                accordionOpen ? "rotate-180" : "rotate-0",
              )}
            />
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent
          forceMount
          className={cn(
            "border-t border-border data-[state=closed]:hidden",
            "space-y-3 p-4",
            {
              "bg-card": cardEnabled,
            },
          )}
        >
          {fieldsGrid}
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};
type FieldRendererProps<TValues> = {
  config: FormFieldConfig;
  path: string;
  form: UseFormReturn<TValues>;
  colSpan?: number;
};
const FieldRenderer = <TValues extends Record<string, any>>({
  config,
  path,
  form,
  colSpan,
}: FieldRendererProps<TValues>) => {
  if (config.type === "object") {
    const nestedGridClass = cn(
      "grid gap-3",
      buildResponsiveGridClass(config.columns ?? 1),
    );
    return (
      <div
        className="rounded-lg border p-3 space-y-3"
        style={
          colSpan
            ? { gridColumn: `span ${colSpan} / span ${colSpan}` }
            : undefined
        }
      >
        {config.label ? (
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold">{config.label}</span>
          </div>
        ) : null}
        <div className={nestedGridClass}>
          {config.fields.map((child) => (
            <FieldRenderer
              key={`${path}.${child.name}`}
              config={child}
              path={`${path}.${child.name}`}
              form={form}
            />
          ))}
        </div>
      </div>
    );
  }
  if (config.type === "list") {
    return (
      <ListFieldRenderer
        key={path}
        config={config}
        form={form}
        path={path}
        colSpan={colSpan}
      />
    );
  }
  if (config.type === "custom" && config.render) {
    return (
      <form.Field
        name={path as any}
        defaultValue={config.defaultValue ?? getPrimitiveDefaultValue("text")}
      >
        {(fieldApi) => (
          <div
            style={
              colSpan
                ? { gridColumn: `span ${colSpan} / span ${colSpan}` }
                : undefined
            }
          >
            {config.render({
              config,
              field: fieldApi,
              form,
            } as FieldComponentProps)}
          </div>
        )}
      </form.Field>
    );
  }
  const normalizedConfig = normalizeChoiceConfig(config);
  const Component =
    resolveInputComponent(normalizedConfig.type as FormInputType) ??
    resolveInputComponent("text");
  const validators = React.useMemo(
    () => createValidators(normalizedConfig, form, path),
    [normalizedConfig, form, path],
  );
  return (
    <form.Field
      name={path as any}
      defaultValue={
        normalizedConfig.defaultValue ??
        (normalizedConfig.type === "date" ||
        normalizedConfig.type === "datetime-local" ||
        normalizedConfig.type === "time"
          ? undefined
          : getPrimitiveDefaultValue(
              normalizedConfig.type as PrimitiveField["type"],
            ))
      }
      validators={validators}
    >
      {(fieldApi) => (
        <div
          style={
            colSpan
              ? { gridColumn: `span ${colSpan} / span ${colSpan}` }
              : undefined
          }
        >
          {Component ? (
            <Component
              config={normalizedConfig as PrimitiveField}
              field={fieldApi}
              form={form as any}
            />
          ) : null}
        </div>
      )}
    </form.Field>
  );
};
const ListFieldRenderer = <TValues extends Record<string, any>>({
  config,
  form,
  path,
  colSpan,
}: {
  config: ListFieldConfig;
  form: UseFormReturn<TValues>;
  path: string;
  colSpan?: number;
}) => {
  const defaultValue = Array.isArray(config.defaultValue)
    ? config.defaultValue
    : [];
  const validators = React.useMemo(
    () => createValidators(config, form, path),
    [config, form, path],
  );
  const itemColumns = Math.max(config.columns ?? config.fields.length ?? 1, 1);
  const itemGridGapStyle = React.useMemo<
    React.CSSProperties | undefined
  >(() => {
    if (config.itemGap === undefined) return undefined;
    return {
      gap:
        typeof config.itemGap === "number"
          ? `${config.itemGap}px`
          : config.itemGap,
    };
  }, [config.itemGap]);
  const itemGridClassName = React.useMemo(
    () =>
      cn("grid", buildResponsiveGridClass(itemColumns), config.itemClassName),
    [config.itemClassName, itemColumns],
  );
  return (
    <form.Field
      name={path as any}
      defaultValue={defaultValue}
      validators={validators}
    >
      {(fieldApi: any) => (
        <ListFieldItems
          config={config}
          form={form}
          fieldApi={fieldApi}
          path={path}
          colSpan={colSpan}
          itemGridClassName={itemGridClassName}
          itemGridGapStyle={itemGridGapStyle}
        />
      )}
    </form.Field>
  );
};

type ListFieldItemsProps<TValues extends Record<string, any>> = {
  config: ListFieldConfig;
  form: UseFormReturn<TValues>;
  fieldApi: any;
  path: string;
  colSpan?: number;
  itemGridClassName: string;
  itemGridGapStyle?: React.CSSProperties;
};

const ListFieldItems = <TValues extends Record<string, any>>({
  config,
  fieldApi,
  path,
  colSpan,
  itemGridClassName,
  itemGridGapStyle,
  form,
}: ListFieldItemsProps<TValues>) => {
  const meta = fieldApi.state?.meta;
  const submitCount = useStore(
    form.store,
    (state) =>
      (state as any).submissionAttempts ?? (state as any).submitCount ?? 0,
  );
  const showListError =
    Boolean(meta?.isDirty) ||
    Boolean(meta?.isBlurred) ||
    submitCount > 0 ||
    Boolean(meta?.errorMap?.onSubmit);
  const items = fieldApi.state.value ?? [];
  const fieldErrors = resolveFieldErrors(meta, showListError);
  const requiredError = resolveRequiredError(config, items, showListError);
  const listError = fieldErrors ?? requiredError;
  const canAdd =
    !config.maxItems ||
    (Array.isArray(items) && items.length < config.maxItems);

  const enforceOrdering = React.useCallback(
    (entries: any[]) => {
      if (!config.ordering?.activate) {
        return entries;
      }
      const targetField = config.ordering.toField;
      if (!targetField) return entries;
      return entries.map((entry, index) => ({
        ...(entry ?? {}),
        [targetField]: index,
      }));
    },
    [config.ordering],
  );

  const handleAdd = React.useCallback(() => {
    const payload = buildDefaultsFromFields(config.fields);
    const nextPayload = config.ordering?.activate
      ? { ...payload, [config.ordering.toField]: items.length }
      : payload;
    fieldApi.setValue(enforceOrdering([...(items ?? []), nextPayload]));
  }, [config.fields, config.ordering, enforceOrdering, fieldApi, items]);

  const handleRemove = React.useCallback(
    (index: number) => {
      const next = (items ?? []).filter((_, idx) => idx !== index);
      fieldApi.setValue(enforceOrdering(next));
    },
    [enforceOrdering, fieldApi, items],
  );

  const handleMove = React.useCallback(
    (index: number, offset: number) => {
      if (!config.ordering?.activate) return;
      const next = [...(items ?? [])];
      const targetIndex = index + offset;
      if (targetIndex < 0 || targetIndex >= next.length) {
        return;
      }
      const [moved] = next.splice(index, 1);
      next.splice(targetIndex, 0, moved);
      fieldApi.setValue(enforceOrdering(next));
    },
    [config.ordering?.activate, enforceOrdering, fieldApi, items],
  );

  React.useEffect(() => {
    if (!config.ordering?.activate) {
      return;
    }
    const targetField = config.ordering.toField;
    if (!targetField) return;
    const needsOrdering = (items ?? []).some(
      (entry: Record<string, any>, index: number) =>
        entry?.[targetField] !== index,
    );
    if (!needsOrdering) {
      return;
    }
    fieldApi.setValue(enforceOrdering(items ?? []));
  }, [config.ordering, enforceOrdering, fieldApi, items]);

  return (
    <div
      className="space-y-3 rounded-lg border p-3"
      style={
        colSpan
          ? { gridColumn: `span ${colSpan} / span ${colSpan}` }
          : undefined
      }
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold">{config.label}</p>
          {config.description ? (
            <p className="text-xs text-muted-foreground">
              {config.description}
            </p>
          ) : null}
        </div>
        <Button type="button" size="sm" onClick={handleAdd} disabled={!canAdd}>
          {config.addLabel ?? "Ajouter"}
        </Button>
      </div>
      {listError ? (
        <div className="text-xs text-destructive">
          {Array.isArray(listError) ? (
            <ul className="space-y-1">
              {listError.map((item, index) => (
                <li key={`${path}-error-${index}`}>{item}</li>
              ))}
            </ul>
          ) : (
            <p>{listError}</p>
          )}
        </div>
      ) : null}
      {items.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          Aucun élément ajouté pour le moment.
        </p>
      ) : (
        items.map((_: unknown, index: number) => (
          <Card
            key={`${path}.${index}`}
            className="space-y-3 p-3 shadow-none border-0"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium">
                {config.itemLabel ?? "Élément"} #{index + 1}
              </span>
              <div className="flex items-center gap-1">
                {config.ordering?.activate ? (
                  <>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={() => handleMove(index, -1)}
                      disabled={index === 0}
                      title="Monter"
                    >
                      ↑
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={() => handleMove(index, 1)}
                      disabled={index === items.length - 1}
                      title="Descendre"
                    >
                      ↓
                    </Button>
                  </>
                ) : null}
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  onClick={() => handleRemove(index)}
                  disabled={
                    config.minItems ? items.length <= config.minItems : false
                  }
                >
                  ✕
                </Button>
              </div>
            </div>
            <div className={itemGridClassName} style={itemGridGapStyle}>
              {config.fields.map((child) => (
                <FieldRenderer
                  key={`${path}.${index}.${child.name}`}
                  config={child}
                  path={`${path}.${index}.${child.name}`}
                  form={form}
                  colSpan={child.colSpan ?? 1}
                />
              ))}
            </div>
          </Card>
        ))
      )}
    </div>
  );
};
function normalizeSection(section: FormSectionConfig): FormSectionConfig {
  const fields = normalizeFieldOrder(section.fields);
  if (fields === section.fields) {
    return section;
  }
  return {
    ...section,
    fields,
  };
}
function normalizeFieldOrder(fields: FormFieldConfig[]): FormFieldConfig[] {
  if (!fields.length) {
    return fields;
  }
  let childMutated = false;
  const withChildren = fields.map((field) => {
    let nextField = field;
    if (fieldHasChildFields(field) && field.fields?.length) {
      const nestedFields = normalizeFieldOrder(field.fields);
      if (nestedFields !== field.fields) {
        childMutated = true;
        nextField = {
          ...nextField,
          fields: nestedFields,
        } as FormFieldConfig;
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
  return fields
    .map((field, index) => ({ field, index }))
    .sort((a, b) => compareFieldOrder(a.field, b.field, a.index, b.index))
    .map((entry) => entry.field);
}
function compareFieldOrder(
  a: FormFieldConfig,
  b: FormFieldConfig,
  indexA: number,
  indexB: number,
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
function fieldHasChildFields(
  field: FormFieldConfig,
): field is ObjectFieldConfig | ListFieldConfig {
  return field.type === "object" || field.type === "list";
}
function buildResponsiveGridClass(columns: number) {
  const normalized = Math.max(1, Math.min(columns, 6));
  const classes = ["grid-cols-1"];
  if (normalized >= 2) classes.push("sm:grid-cols-2");
  if (normalized >= 3) classes.push("md:grid-cols-3");
  if (normalized >= 4) classes.push("lg:grid-cols-4");
  if (normalized >= 5) classes.push("xl:grid-cols-5");
  if (normalized >= 6) classes.push("2xl:grid-cols-6");
  return classes.join(" ");
}
function buildDefaultsFromSchema(schema: FormSchema): Record<string, any> {
  const target: Record<string, any> = {};
  const sections = schema.sections?.length
    ? schema.sections
    : schema.fields
      ? [{ fields: schema.fields }]
      : [];
  sections.forEach((section) => {
    section.fields.forEach((field) => {
      assignDefaultValue(target, field);
    });
  });
  return target;
}
function buildDefaultsFromFields(
  fields: FormFieldConfig[],
): Record<string, any> {
  const result: Record<string, any> = {};
  fields.forEach((field) => assignDefaultValue(result, field));
  return result;
}
function assignDefaultValue(
  target: Record<string, any>,
  field: FormFieldConfig,
  basePath?: string,
) {
  const path = basePath ? `${basePath}.${field.name}` : field.name;
  if (field.type === "object") {
    const value = buildDefaultsFromFields(field.fields);
    setValue(target, path, value);
    return;
  }
  if (field.type === "list") {
    setValue(target, path, field.defaultValue ?? []);
    return;
  }
  if (field.type === "custom") {
    setValue(target, path, field.defaultValue ?? "");
    return;
  }
  setValue(
    target,
    path,
    field.defaultValue ??
      getPrimitiveDefaultValue(field.type as PrimitiveField["type"]),
  );
}
function getPrimitiveDefaultValue(type: PrimitiveField["type"]) {
  switch (type) {
    case "number":
    case "decimal":
    case "slider":
    case "range":
      return 0;
    case "select":
    case "radio":
      return "";
    case "checkbox":
    case "switch":
      return false;
    case "select-query":
      return [];
    case "file":
      return null;
    default:
      return "";
  }
}
function normalizeChoiceConfig(config: FormFieldConfig): FormFieldConfig {
  if (!isChoiceFieldConfig(config)) {
    return config;
  }
  const resolvedType = config.type === "radio" ? "radio" : "select";
  if (config.type === resolvedType) {
    return config;
  }
  return {
    ...config,
    type: resolvedType,
  };
}
function isChoiceFieldConfig(
  config: FormFieldConfig,
): config is ChoiceFieldConfig {
  return Array.isArray((config as ChoiceFieldConfig).options);
}
function setValue(target: Record<string, any>, path: string, value: any) {
  const segments = path.split(".");
  let current = target;
  segments.forEach((segment, index) => {
    if (index === segments.length - 1) {
      current[segment] = value;
      return;
    }
    current[segment] = current[segment] ?? {};
    current = current[segment];
  });
}
function createValidators<TValues>(
  config: FormFieldConfig,
  form: UseFormReturn<TValues>,
  path: string,
) {
  const validators = Array.isArray(config.validators)
    ? [...config.validators]
    : config.validators
      ? [config.validators]
      : [];
  if (config.required) {
    const requiresTrue = config.type === "checkbox" || config.type === "switch";
    validators.unshift((value) => {
      const emptyValue =
        value === undefined ||
        value === null ||
        value === "" ||
        (Array.isArray(value) && value.length === 0);
      const invalidBoolean = requiresTrue && value === false;
      return emptyValue || invalidBoolean
        ? "Ce champ est obligatoire"
        : undefined;
    });
  }
  if (validators.length === 0) return undefined;
  const runSyncValidators = (payload: unknown) => {
    const value = getValidatorValue(payload);
    const ctx = {
      values: form.state.values,
      name: path,
    };
    for (const validator of validators) {
      const result = validator(value, ctx);
      if (isPromise(result)) {
        continue;
      }
      if (result) {
        return result;
      }
    }
    return undefined;
  };
  const runAsyncValidators = async (payload: unknown) => {
    const value = getValidatorValue(payload);
    const ctx = {
      values: form.state.values,
      name: path,
    };
    for (const validator of validators) {
      const result = validator(value, ctx);
      if (isPromise(result)) {
        const message = await result;
        if (message) {
          return message;
        }
        continue;
      }
      if (result) {
        return result;
      }
    }
    return undefined;
  };
  return {
    onChange: (payload: unknown) => runSyncValidators(payload),
    onBlur: (payload: unknown) => runSyncValidators(payload),
    onMount: (payload: unknown) => runSyncValidators(payload),
    onSubmit: (payload: unknown) => runSyncValidators(payload),
    onChangeAsync: (payload: unknown) => runAsyncValidators(payload),
    onBlurAsync: (payload: unknown) => runAsyncValidators(payload),
    onSubmitAsync: (payload: unknown) => runAsyncValidators(payload),
    onMountAsync: (payload: unknown) => runAsyncValidators(payload),
  };
}
function getValidatorValue(payload: unknown) {
  if (payload && typeof payload === "object" && "value" in (payload as any)) {
    return (payload as { value?: unknown }).value;
  }
  return payload;
}
function isPromise<T = unknown>(value: unknown): value is Promise<T> {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as Promise<T>).then === "function"
  );
}
function isPlainObject(value: unknown): value is Record<string, any> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function diffValues(previous: any, next: any, path = ""): ChangeRecord[] {
  const changes: ChangeRecord[] = [];
  if (isPlainObject(previous) && isPlainObject(next)) {
    const keys = new Set([...Object.keys(previous), ...Object.keys(next)]);
    keys.forEach((key) => {
      changes.push(
        ...diffValues(previous[key], next[key], path ? `${path}.${key}` : key),
      );
    });
    return changes;
  }
  if (Array.isArray(previous) && Array.isArray(next)) {
    if (JSON.stringify(previous) !== JSON.stringify(next)) {
      changes.push({
        name: path,
        previousValue: previous,
        nextValue: next,
        timestamp: Date.now(),
      });
    }
    return changes;
  }
  if (previous !== next) {
    changes.push({
      name: path,
      previousValue: previous,
      nextValue: next,
      timestamp: Date.now(),
    });
  }
  return changes;
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
  if (isPlainObject(a) && isPlainObject(b)) {
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
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

function deepMergeDefaults(
  ...sources: Record<string, any>[]
): Record<string, any> {
  const result: Record<string, any> = {};
  for (const source of sources) {
    if (!source || typeof source !== "object") continue;
    for (const key of Object.keys(source)) {
      const sourceValue = source[key];
      const resultValue = result[key];
      // Arrays replace entirely (don't merge array items)
      if (Array.isArray(sourceValue)) {
        result[key] = sourceValue;
      }
      // Nested objects are recursively merged
      else if (
        sourceValue &&
        typeof sourceValue === "object" &&
        !Array.isArray(sourceValue) &&
        resultValue &&
        typeof resultValue === "object" &&
        !Array.isArray(resultValue)
      ) {
        result[key] = deepMergeDefaults(resultValue, sourceValue);
      }
      // Primitives and null replace
      else {
        result[key] = sourceValue;
      }
    }
  }
  return result;
}
export default DynamicForm;
