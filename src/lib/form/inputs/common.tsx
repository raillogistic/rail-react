import React from "react";
import { Label } from "@/lib/components/ui/label";
import { cn } from "@/lib/utils";
import type { BaseFieldConfig } from "./types";

type FieldWrapperProps = {
  config: BaseFieldConfig;
  error?: string | string[];
  dirty?: boolean;
  children: React.ReactNode;
};

export const FieldWrapper: React.FC<FieldWrapperProps> = ({
  config,
  error,
  dirty,
  children,
}) => {
  const errorList = Array.isArray(error)
    ? error.filter(Boolean)
    : error
    ? [error]
    : [];
  if (config.hidden) {
    return <div className="hidden">{children}</div>;
  }
  return (
    <div
      data-dirty={dirty ? "true" : undefined}
      className={cn(
        "rounded-md border border-transparent p-1",
        "data-[dirty=true]:[&_[data-slot=input]]:border-emerald-500 data-[dirty=true]:[&_[data-slot=input]]:focus-visible:border-emerald-500 data-[dirty=true]:[&_[data-slot=input]]:focus-visible:ring-emerald-500/50",
        "data-[dirty=true]:[&_[data-slot=textarea]]:border-emerald-500 data-[dirty=true]:[&_[data-slot=textarea]]:focus-visible:border-emerald-500 data-[dirty=true]:[&_[data-slot=textarea]]:focus-visible:ring-emerald-500/50",
        "data-[dirty=true]:[&_[data-slot=select-trigger]]:border-emerald-500 data-[dirty=true]:[&_[data-slot=select-trigger]]:focus-visible:border-emerald-500 data-[dirty=true]:[&_[data-slot=select-trigger]]:focus-visible:ring-emerald-500/50",
        "data-[dirty=true]:[&_[data-slot=checkbox]]:border-emerald-500 data-[dirty=true]:[&_[data-slot=checkbox]]:ring-emerald-500/40",
        "data-[dirty=true]:[&_[data-slot=button]]:border-emerald-500 data-[dirty=true]:[&_[data-slot=button]]:focus-visible:border-emerald-500 data-[dirty=true]:[&_[data-slot=button]]:focus-visible:ring-emerald-500/40",
        config.className
      )}
    >
      {config.label ? (
        <div className="flex items-center justify-between gap-2">
          <Label className="text-sm font-medium text-foreground">
            {config.label}
            {config.required ? (
              <span className="text-destructive ml-1">*</span>
            ) : null}
          </Label>
        </div>
      ) : null}
      {config.description ? (
        <p className="text-xs text-muted-foreground">{config.description}</p>
      ) : null}
      {children}
      {config.helpText ? (
        <p className="text-xs text-muted-foreground">{config.helpText}</p>
      ) : null}
      {errorList.length > 0 ? (
        errorList.length === 1 ? (
          <p className="text-xs text-destructive">{errorList[0]}</p>
        ) : (
          <ul className="space-y-1 text-xs text-destructive">
            {errorList.map((item, index) => (
              <li key={`${config.name}-error-${index}`}>{item}</li>
            ))}
          </ul>
        )
      ) : null}
    </div>
  );
};

export function resolveFieldErrors(meta: any, showError: boolean) {
  if (!showError) return undefined;
  const collected: string[] = [];
  if (Array.isArray(meta?.touchedErrors)) {
    collected.push(...meta.touchedErrors);
  }
  if (Array.isArray(meta?.errors)) {
    collected.push(...meta.errors);
  }
  const submitError = meta?.errorMap?.onSubmit;
  if (submitError) {
    collected.push(submitError);
  }
  const unique = Array.from(new Set(collected.filter(Boolean)));
  return unique.length ? unique : undefined;
}

export function resolveRequiredError(
  config: BaseFieldConfig,
  value: any,
  showError: boolean
) {
  if (!showError || !config.required) return undefined;
  const requiresTrue = config.type === "checkbox" || config.type === "switch";
  if (requiresTrue) {
    return value === true ? undefined : "Ce champ est obligatoire";
  }
  if (Array.isArray(value)) {
    return value.length > 0 ? undefined : "Ce champ est obligatoire";
  }
  if (typeof value === "string") {
    return value.trim().length > 0 ? undefined : "Ce champ est obligatoire";
  }
  if (value === undefined || value === null) {
    return "Ce champ est obligatoire";
  }
  return undefined;
}
