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
import { Info, AlertCircle, CircleDot, Sparkles } from "lucide-react";
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
        "group/field flex flex-col gap-2 py-2.5",
        "transition-all duration-500 ease-in-out",
        config.className,
      )}
    >
      {/* ── Label row ────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3 px-1">
        {config.label ? (
          <div className="flex items-center gap-2">
            <Label
              htmlFor={fieldId}
              className={cn(
                "text-[13.5px] font-bold tracking-tight text-foreground/60 transition-all duration-300",
                hasError && "text-destructive",
                "group-focus-within/field:text-primary group-focus-within/field:translate-x-0.5",
              )}
            >
              {config.label}
              {config.required ? (
                <span
                  className="text-destructive/80 ml-1 text-sm leading-none"
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
                      className="text-muted-foreground/30 hover:text-primary/60 transition-all outline-none hover:scale-110 active:scale-95"
                    >
                      <Info className="size-3.5" />
                      <span className="sr-only">Description</span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent
                    side="top"
                    align="start"
                    className="max-w-72 rounded-xl border border-border/50 bg-popover/95 backdrop-blur-md px-4 py-3 text-[12px] font-medium shadow-2xl"
                  >
                    <div className="flex gap-2.5">
                      <Sparkles className="size-4 shrink-0 text-primary/60" />
                      <span className="leading-relaxed">{config.description}</span>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        ) : (
          <div />
        )}

        {dirty && !hasError && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400 animate-in fade-in zoom-in-95 duration-500">
            <CircleDot className="size-2.5" />
            Modifié
          </span>
        )}
      </div>

      {/* ── Slot container — propagates data-dirty / data-error to children ─ */}
      <div
        className={cn(
          "relative transition-all duration-500 ease-out",

          // ── Dirty state — subtle emerald accent ──
          "data-[dirty=true]:[&_[data-slot=input]]:border-emerald-500/30 data-[dirty=true]:[&_[data-slot=input]]:bg-emerald-500/[0.02]",
          "data-[dirty=true]:[&_[data-slot=textarea]]:border-emerald-500/30 data-[dirty=true]:[&_[data-slot=textarea]]:bg-emerald-500/[0.02]",
          "data-[dirty=true]:[&_[data-slot=select-trigger]]:border-emerald-500/30 data-[dirty=true]:[&_[data-slot=select-trigger]]:bg-emerald-500/[0.02]",
          "data-[dirty=true]:[&_[data-slot=checkbox]]:border-emerald-500 data-[dirty=true]:[&_[data-slot=checkbox]]:bg-emerald-500/10",
          "data-[dirty=true]:[&_[data-slot=button]]:border-emerald-500/30 data-[dirty=true]:[&_[data-slot=button]]:bg-emerald-500/[0.02]",

          // ── Error state — destructive accent ──
          "data-[error=true]:[&_[data-slot=input]]:border-destructive/60 data-[error=true]:[&_[data-slot=input]]:bg-destructive/[0.03] data-[error=true]:[&_[data-slot=input]]:ring-4 data-[error=true]:[&_[data-slot=input]]:ring-destructive/5",
          "data-[error=true]:[&_[data-slot=textarea]]:border-destructive/60 data-[error=true]:[&_[data-slot=textarea]]:bg-destructive/[0.03] data-[error=true]:[&_[data-slot=textarea]]:ring-4 data-[error=true]:[&_[data-slot=textarea]]:ring-destructive/5",
          "data-[error=true]:[&_[data-slot=select-trigger]]:border-destructive/60 data-[error=true]:[&_[data-slot=select-trigger]]:bg-destructive/[0.03] data-[error=true]:[&_[data-slot=select-trigger]]:ring-4 data-[error=true]:[&_[data-slot=select-trigger]]:ring-destructive/5",
          "data-[error=true]:[&_[data-slot=checkbox]]:border-destructive data-[error=true]:[&_[data-slot=checkbox]]:ring-4 data-[error=true]:[&_[data-slot=checkbox]]:ring-destructive/10",
          "data-[error=true]:[&_[data-slot=button]]:border-destructive/60 data-[error=true]:[&_[data-slot=button]]:bg-destructive/[0.03] data-[error=true]:[&_[data-slot=button]]:ring-4 data-[error=true]:[&_[data-slot=button]]:ring-destructive/5",

          // ── Base input styling — Clean & Premium look ──
          "[&_[data-slot=input]]:shadow-none [&_[data-slot=input]]:border-border/60 [&_[data-slot=input]]:rounded-xl [&_[data-slot=input]]:transition-all [&_[data-slot=input]]:duration-300",
          "[&_[data-slot=input]:focus]:ring-4 [&_[data-slot=input]:focus]:ring-primary/10 [&_[data-slot=input]:focus]:border-primary/60 [&_[data-slot=input]:focus]:bg-background",

          "[&_[data-slot=textarea]]:shadow-none [&_[data-slot=textarea]]:border-border/60 [&_[data-slot=textarea]]:rounded-xl [&_[data-slot=textarea]]:transition-all [&_[data-slot=textarea]]:duration-300",
          "[&_[data-slot=textarea]:focus]:ring-4 [&_[data-slot=textarea]:focus]:ring-primary/10 [&_[data-slot=textarea]:focus]:border-primary/60 [&_[data-slot=textarea]:focus]:bg-background",

          "[&_[data-slot=select-trigger]]:shadow-none [&_[data-slot=select-trigger]]:border-border/60 [&_[data-slot=select-trigger]]:rounded-xl [&_[data-slot=select-trigger]]:transition-all [&_[data-slot=select-trigger]]:duration-300",
          "[&_[data-slot=select-trigger]:focus]:ring-4 [&_[data-slot=select-trigger]:focus]:ring-primary/10 [&_[data-slot=select-trigger]:focus]:border-primary/60 [&_[data-slot=select-trigger]:focus]:bg-background",
          "[&_[data-slot=select-trigger][data-state=open]]:ring-4 [&_[data-slot=select-trigger][data-state=open]]:ring-primary/10 [&_[data-slot=select-trigger][data-state=open]]:border-primary/60",

          "[&_[data-slot=button]]:shadow-none [&_[data-slot=button]]:rounded-xl",
          "[&_[data-slot=button]:focus-visible]:ring-4 [&_[data-slot=button]:focus-visible]:ring-primary/10 [&_[data-slot=button]:focus-visible]:border-primary/60",

          "[&_[data-slot=checkbox]]:shadow-none [&_[data-slot=checkbox]]:rounded-lg",
          "[&_[data-slot=checkbox]:focus-visible]:ring-4 [&_[data-slot=checkbox]:focus-visible]:ring-primary/10",
        )}
        data-dirty={dirty ? "true" : undefined}
        data-error={hasError ? "true" : undefined}
      >
        {children}
        
        {/* Subtle glow effect on focus within */}
        <div className="absolute inset-0 -z-10 bg-primary/[0.02] opacity-0 blur-xl transition-opacity duration-700 group-focus-within/field:opacity-100 pointer-events-none" />
      </div>

      {/* ── Help text ────────────────────────────────────────────── */}
      {config.helpText && !hasError && (
        <p className="px-1.5 text-[11px] font-medium leading-tight text-muted-foreground/50 italic">
          {config.helpText}
        </p>
      )}

      {/* ── Error messages ───────────────────────────────────────── */}
      {hasError && (
        <div className="mt-1 flex flex-col gap-1.5 animate-in fade-in slide-in-from-top-2 duration-500 ease-out">
          {errorList.map((item, index) => (
            <div
              key={`${config.name}-error-${index}`}
              className="flex items-start gap-2 rounded-xl border border-destructive/10 bg-destructive/[0.03] px-3 py-2 text-[12.5px] font-semibold text-destructive shadow-sm"
            >
              <AlertCircle className="mt-0.5 size-3.5 shrink-0 transition-transform group-hover/field:scale-110" />
              <span className="leading-tight">{item}</span>
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
