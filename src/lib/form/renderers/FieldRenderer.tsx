/**
 * Renders a single field by dispatching to the correct input component.
 *
 * Handles primitive fields, nested objects, repeatable lists, and custom renderers.
 */
import React from "react";
import type { UseFormReturn } from "@tanstack/react-form";
import { cn } from "@/lib/utils";
import type {
  FormFieldConfig,
  ObjectFieldConfig,
  ListFieldConfig,
  ChoiceFieldConfig,
  FormInputType,
  FieldComponentProps,
  GroupFieldConfig,
} from "../types/schema";
import { resolveInputComponent } from "../inputs/factory";
import { ListFieldRenderer } from "./ListFieldRenderer";
import { GroupFieldRenderer } from "./GroupFieldRenderer";
import { buildResponsiveGridClass } from "./utils";

type PrimitiveField = Exclude<
  FormFieldConfig,
  ObjectFieldConfig | ListFieldConfig | GroupFieldConfig
>;

export type FieldRendererProps<TValues> = {
  config: FormFieldConfig;
  path: string;
  form: UseFormReturn<TValues>;
  colSpan?: number;
  globalReadOnly?: boolean;
  globalDisabled?: boolean;
  hiddenFields?: Set<string>;
};

export const FieldRenderer = <TValues extends Record<string, any>>({
  config,
  path,
  form,
  colSpan,
  globalReadOnly,
  globalDisabled,
  hiddenFields,
}: FieldRendererProps<TValues>) => {
  // Check hidden status
  if (config.hidden || hiddenFields?.has(path)) {
    return null;
  }

  if (config.type === "group") {
    return (
      <GroupFieldRenderer
        config={config}
        path={path}
        form={form}
        colSpan={colSpan}
        globalReadOnly={globalReadOnly}
        globalDisabled={globalDisabled}
        hiddenFields={hiddenFields}
      />
    );
  }

  if (config.type === "object") {
    const nestedGridClass = cn(
      "grid gap-x-4 gap-y-2",
      buildResponsiveGridClass(config.columns ?? 1),
    );
    return (
      <div
        className="group/object rounded-xl border border-border/40 bg-muted/5 p-4 transition-all duration-300 hover:border-border/80 hover:bg-muted/10 space-y-4"
        style={
          colSpan
            ? { gridColumn: `span ${colSpan} / span ${colSpan}` }
            : undefined
        }
      >
        {config.label ? (
          <div className="flex items-center justify-between border-b border-border/30 pb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80 group-hover/object:text-foreground transition-colors">
              {config.label}
            </span>
          </div>
        ) : null}
        <div className={nestedGridClass}>
          {config.fields.map((child) => (
            <FieldRenderer
              key={`${path}.${child.name}`}
              config={child}
              path={`${path}.${child.name}`}
              form={form}
              globalReadOnly={globalReadOnly}
              globalDisabled={globalDisabled}
              hiddenFields={hiddenFields}
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
        globalReadOnly={globalReadOnly}
        globalDisabled={globalDisabled}
        hiddenFields={hiddenFields}
      />
    );
  }

  if (config.type === "custom" && config.render) {
    return (
      <form.Field name={path as any}>
        {(fieldApi) => (
          <div
            className="animate-in fade-in slide-in-from-bottom-2 duration-300"
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

  // Apply global read-only/disabled
  const effectiveConfig = React.useMemo(() => {
    if (!globalReadOnly && !globalDisabled) return normalizedConfig;
    return {
      ...normalizedConfig,
      readOnly: globalReadOnly || normalizedConfig.readOnly,
      disabled: globalDisabled || normalizedConfig.disabled,
    };
  }, [normalizedConfig, globalReadOnly, globalDisabled]);

  return (
    <form.Field
      name={path as any}
      validators={validators}
    >
      {(fieldApi) => (
        <div
          className="animate-in fade-in slide-in-from-bottom-1 duration-200"
          style={
            colSpan
              ? { gridColumn: `span ${colSpan} / span ${colSpan}` }
              : undefined
          }
        >
          {Component ? (
            <Component
              config={effectiveConfig as PrimitiveField}
              field={fieldApi}
              form={form as any}
            />
          ) : null}
        </div>
      )}
    </form.Field>
  );
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function normalizeChoiceConfig(config: FormFieldConfig): FormFieldConfig {
  if (!isChoiceFieldConfig(config)) return config;
  const resolvedType = config.type === "radio" ? "radio" : "select";
  if (config.type === resolvedType) return config;
  return { ...config, type: resolvedType };
}

function isChoiceFieldConfig(
  config: FormFieldConfig,
): config is ChoiceFieldConfig {
  return Array.isArray((config as ChoiceFieldConfig).options);
}

export function createValidators<TValues>(
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
    validators.unshift((value) => {
      const emptyValue =
        value === undefined ||
        value === null ||
        value === "" ||
        (Array.isArray(value) && value.length === 0);
      return emptyValue ? "This field is required" : undefined;
    });
  }

  if (validators.length === 0) return undefined;

  const runSyncValidators = (payload: unknown) => {
    const value = getValidatorValue(payload);
    const ctx = { values: form.state.values, name: path };
    for (const validator of validators) {
      const result = validator(value, ctx);
      if (isPromise(result)) continue;
      if (result) return result;
    }
    return undefined;
  };

  const runAsyncValidators = async (payload: unknown) => {
    const value = getValidatorValue(payload);
    const ctx = { values: form.state.values, name: path };
    for (const validator of validators) {
      const result = validator(value, ctx);
      if (isPromise(result)) {
        const message = await result;
        if (message) return message;
        continue;
      }
      if (result) return result;
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
  if (
    payload &&
    typeof payload === "object" &&
    "value" in (payload as any)
  ) {
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
