/**
 * Shared field wrapper and validation utilities for DynamicForm inputs.
 *
 * Provides a consistent container around every field with label, description
 * tooltip, dirty indicator, error messages, and data-attribute-driven styling
 * for all nested input slots.
 *
 * @module form/inputs/common
 */
import React from "react";
import { Label } from "@/shared/ui/kit/label";
import { cn } from "@/shared/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/ui/kit/tooltip";
import { Info, AlertCircle, CircleDot } from "lucide-react";
import type { BaseFieldConfig } from "./types";

/** Props accepted by the FieldWrapper component. */
type FieldWrapperProps = {
  config: BaseFieldConfig;
  fieldId?: string;
  error?: string | string[];
  dirty?: boolean;
  children: React.ReactNode;
};

/**
 * Wraps every form field with a consistent layout:
 * - Label row (label + required asterisk + info tooltip + dirty pill)
 * - Slot container with data-attribute-driven focus/error/dirty styling
 * - Help text or error messages
 */
export const FieldWrapper: React.FC<FieldWrapperProps> = ({
  config,
  fieldId,
  error,
  dirty,
  children,
}) => {
  const errorList = Array.isArray(error)
    ? error.filter(Boolean)
    : error
      ? [error]
      : [];

  const hasError = errorList.length > 0;

  if (config.hidden) {
    return <div className="hidden">{children}</div>;
  }

  return (
    <div
      data-dirty={dirty ? "true" : undefined}
      data-error={hasError ? "true" : undefined}
      className={cn(
        "group flex flex-col gap-1.5 py-1",
        "transition-all duration-200 ease-in-out",
        config.className,
      )}
    >
      {/* ── Label row ────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-2 px-0.5">
        {config.label ? (
          <div className="flex items-center gap-1.5">
            <Label
              htmlFor={fieldId}
              className={cn(
                "text-[13px] font-medium text-foreground/70 transition-colors duration-200",
                hasError && "text-destructive",
                "group-focus-within:text-primary",
              )}
            >
              {config.label}
              {config.required ? (
                <span
                  className="text-destructive ml-0.5 text-sm leading-none"
                  aria-hidden="true"
                >
                  *
                </span>
              ) : null}
            </Label>

            {config.description && (
              <TooltipProvider>
                <Tooltip delayDuration={300}>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      className="text-muted-foreground/40 hover:text-muted-foreground/70 transition-colors outline-none"
                    >
                      <Info className="size-3.5" />
                      <span className="sr-only">Description</span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent
                    side="right"
                    className="max-w-64 rounded-lg border border-border/50 bg-popover px-3 py-2 text-xs shadow-lg"
                  >
                    {config.description}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        ) : (
          <div />
        )}

        {dirty && !hasError && (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400 animate-in fade-in slide-in-from-right-1">
            <CircleDot className="size-2.5" />
            Modifié
          </span>
        )}
      </div>

      {/* ── Slot container — propagates data-dirty / data-error to children ─ */}
      <div
        className={cn(
          "relative transition-all duration-200",

          // ── Dirty state — subtle emerald accent ──
          "data-[dirty=true]:[&_[data-slot=input]]:border-emerald-500/40 data-[dirty=true]:[&_[data-slot=input]]:ring-1 data-[dirty=true]:[&_[data-slot=input]]:ring-emerald-500/10",
          "data-[dirty=true]:[&_[data-slot=textarea]]:border-emerald-500/40 data-[dirty=true]:[&_[data-slot=textarea]]:ring-1 data-[dirty=true]:[&_[data-slot=textarea]]:ring-emerald-500/10",
          "data-[dirty=true]:[&_[data-slot=select-trigger]]:border-emerald-500/40 data-[dirty=true]:[&_[data-slot=select-trigger]]:ring-1 data-[dirty=true]:[&_[data-slot=select-trigger]]:ring-emerald-500/10",
          "data-[dirty=true]:[&_[data-slot=checkbox]]:border-emerald-500 data-[dirty=true]:[&_[data-slot=checkbox]]:ring-1 data-[dirty=true]:[&_[data-slot=checkbox]]:ring-emerald-500/20",
          "data-[dirty=true]:[&_[data-slot=button]]:border-emerald-500/40 data-[dirty=true]:[&_[data-slot=button]]:ring-1 data-[dirty=true]:[&_[data-slot=button]]:ring-emerald-500/10",

          // ── Error state — destructive accent ──
          "data-[error=true]:[&_[data-slot=input]]:border-destructive data-[error=true]:[&_[data-slot=input]]:bg-destructive/5 data-[error=true]:[&_[data-slot=input]]:ring-1 data-[error=true]:[&_[data-slot=input]]:ring-destructive/20",
          "data-[error=true]:[&_[data-slot=textarea]]:border-destructive data-[error=true]:[&_[data-slot=textarea]]:bg-destructive/5 data-[error=true]:[&_[data-slot=textarea]]:ring-1 data-[error=true]:[&_[data-slot=textarea]]:ring-destructive/20",
          "data-[error=true]:[&_[data-slot=select-trigger]]:border-destructive data-[error=true]:[&_[data-slot=select-trigger]]:bg-destructive/5 data-[error=true]:[&_[data-slot=select-trigger]]:ring-1 data-[error=true]:[&_[data-slot=select-trigger]]:ring-destructive/20",
          "data-[error=true]:[&_[data-slot=checkbox]]:border-destructive data-[error=true]:[&_[data-slot=checkbox]]:ring-1 data-[error=true]:[&_[data-slot=checkbox]]:ring-destructive/30",
          "data-[error=true]:[&_[data-slot=button]]:border-destructive data-[error=true]:[&_[data-slot=button]]:bg-destructive/5 data-[error=true]:[&_[data-slot=button]]:ring-1 data-[error=true]:[&_[data-slot=button]]:ring-destructive/20",

          // ── Base input styling — clean ERP look ──
          "[&_[data-slot=input]]:shadow-none [&_[data-slot=input]]:transition-all [&_[data-slot=input]]:duration-200",
          "[&_[data-slot=input]:focus]:ring-2 [&_[data-slot=input]:focus]:ring-primary/20 [&_[data-slot=input]:focus]:border-primary",

          "[&_[data-slot=textarea]]:shadow-none [&_[data-slot=textarea]]:transition-all [&_[data-slot=textarea]]:duration-200",
          "[&_[data-slot=textarea]:focus]:ring-2 [&_[data-slot=textarea]:focus]:ring-primary/20 [&_[data-slot=textarea]:focus]:border-primary",

          "[&_[data-slot=select-trigger]]:shadow-none [&_[data-slot=select-trigger]]:transition-all [&_[data-slot=select-trigger]]:duration-200",
          "[&_[data-slot=select-trigger]:focus]:ring-2 [&_[data-slot=select-trigger]:focus]:ring-primary/20 [&_[data-slot=select-trigger]:focus]:border-primary",
          "[&_[data-slot=select-trigger][data-state=open]]:ring-2 [&_[data-slot=select-trigger][data-state=open]]:ring-primary/20 [&_[data-slot=select-trigger][data-state=open]]:border-primary",

          "[&_[data-slot=button]]:shadow-none",
          "[&_[data-slot=button]:focus-visible]:ring-2 [&_[data-slot=button]:focus-visible]:ring-primary/20 [&_[data-slot=button]:focus-visible]:border-primary",
          "[&_[data-slot=button][data-state=open]]:ring-2 [&_[data-slot=button][data-state=open]]:ring-primary/20 [&_[data-slot=button][data-state=open]]:border-primary",

          "[&_[data-slot=checkbox]]:shadow-none",
          "[&_[data-slot=checkbox]:focus-visible]:ring-2 [&_[data-slot=checkbox]:focus-visible]:ring-primary/20 [&_[data-slot=checkbox]:focus-visible]:border-primary",
        )}
        data-dirty={dirty ? "true" : undefined}
        data-error={hasError ? "true" : undefined}
      >
        {children}
      </div>

      {/* ── Help text ────────────────────────────────────────────── */}
      {config.helpText && !hasError && (
        <p className="px-0.5 text-[11px] leading-tight text-muted-foreground/60">
          {config.helpText}
        </p>
      )}

      {/* ── Error messages ───────────────────────────────────────── */}
      {hasError && (
        <div className="mt-0.5 flex flex-col gap-1 animate-in fade-in slide-in-from-top-1">
          {errorList.map((item, index) => (
            <div
              key={`${config.name}-error-${index}`}
              className="flex items-start gap-1.5 rounded-md bg-destructive/8 px-2.5 py-1.5 text-[12px] font-medium text-destructive"
            >
              <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
              <span>{item}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/**
 * Resolves field-level error messages from meta state.
 * Returns the unique, non-empty list if any errors are found, otherwise undefined.
 */
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

/**
 * Returns a required-field error string if the value is empty AND
 * showError is true AND the config says required.
 */
export function resolveRequiredError(
  config: BaseFieldConfig,
  value: any,
  showError: boolean,
) {
  if (!showError || !config.required) return undefined;
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
