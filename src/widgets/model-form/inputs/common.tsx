import React from "react";
import { Label } from "@/shared/ui/kit/label";
import { cn } from "@/shared/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/ui/kit/tooltip";
import { Info, AlertCircle } from "lucide-react";
import type { BaseFieldConfig } from "./types";

type FieldWrapperProps = {
  config: BaseFieldConfig;
  fieldId?: string;
  error?: string | string[];
  dirty?: boolean;
  children: React.ReactNode;
};

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
      <div className="flex items-center justify-between gap-2 px-0.5">
        {config.label ? (
          <div className="flex items-center gap-1.5">
            <Label
              htmlFor={fieldId}
              className={cn(
                "text-[13px] font-semibold uppercase tracking-wide transition-all duration-300",
                hasError ? "text-destructive" : "text-muted-foreground",
                "group-focus-within:text-primary",
              )}
            >
              {config.label}
              {config.required ? (
                <span
                  className="text-destructive ml-1 text-base leading-none"
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
                      className="text-muted-foreground/60 hover:text-muted-foreground transition-colors outline-none"
                    >
                      <Info className="size-3.5" />
                      <span className="sr-only">Description</span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="max-w-64 text-xs">
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
          <span className=" bg-emerald-500/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 animate-in fade-in slide-in-from-right-1">
            Modifié
          </span>
        )}
      </div>

      <div
        className={cn(
          "relative transition-all duration-300",
          "data-[dirty=true]:[&_[data-slot=input]]:border-emerald-500/50 data-[dirty=true]:[&_[data-slot=input]]:ring-emerald-500/10",
          "data-[dirty=true]:[&_[data-slot=textarea]]:border-emerald-500/50 data-[dirty=true]:[&_[data-slot=textarea]]:ring-emerald-500/10",
          "data-[dirty=true]:[&_[data-slot=select-trigger]]:border-emerald-500/50 data-[dirty=true]:[&_[data-slot=select-trigger]]:ring-emerald-500/10",
          "data-[dirty=true]:[&_[data-slot=checkbox]]:border-emerald-500 data-[dirty=true]:[&_[data-slot=checkbox]]:ring-emerald-500/20",
          "data-[dirty=true]:[&_[data-slot=button]]:border-emerald-500/50 data-[dirty=true]:[&_[data-slot=button]]:ring-emerald-500/10",

          "data-[error=true]:[&_[data-slot=input]]:border-destructive data-[error=true]:[&_[data-slot=input]]:bg-destructive/5 data-[error=true]:[&_[data-slot=input]]:ring-destructive/20",
          "data-[error=true]:[&_[data-slot=textarea]]:border-destructive data-[error=true]:[&_[data-slot=textarea]]:bg-destructive/5 data-[error=true]:[&_[data-slot=textarea]]:ring-destructive/20",
          "data-[error=true]:[&_[data-slot=select-trigger]]:border-destructive data-[error=true]:[&_[data-slot=select-trigger]]:bg-destructive/5 data-[error=true]:[&_[data-slot=select-trigger]]:ring-destructive/20",
          "data-[error=true]:[&_[data-slot=checkbox]]:border-destructive data-[error=true]:[&_[data-slot=checkbox]]:ring-destructive/30",
          "data-[error=true]:[&_[data-slot=button]]:border-destructive data-[error=true]:[&_[data-slot=button]]:bg-destructive/5 data-[error=true]:[&_[data-slot=button]]:ring-destructive/20",

          // Enhanced Neo-Brutalist Base, Focus and Active Interactions (no shadow, strict background)
          "[&_[data-slot=input]]:!shadow-none [&_[data-slot=input]]:!bg-muted/30 hover:[&_[data-slot=input]]:!bg-muted/50 [&_[data-slot=input]]:transition-colors [&_[data-slot=input]]:duration-150",
          "[&_[data-slot=input]:focus]:-translate-y-1 [&_[data-slot=input]:focus]:-translate-x-1 [&_[data-slot=input]:focus]:!border-primary [&_[data-slot=input]:focus]:!border-2 [&_[data-slot=input]:focus]:!bg-background",

          "[&_[data-slot=textarea]]:!shadow-none [&_[data-slot=textarea]]:!bg-muted/30 hover:[&_[data-slot=textarea]]:!bg-muted/50 [&_[data-slot=textarea]]:transition-colors [&_[data-slot=textarea]]:duration-150",
          "[&_[data-slot=textarea]:focus]:-translate-y-1 [&_[data-slot=textarea]:focus]:-translate-x-1 [&_[data-slot=textarea]:focus]:!border-primary [&_[data-slot=textarea]:focus]:!border-2 [&_[data-slot=textarea]:focus]:!bg-background",

          "[&_[data-slot=select-trigger]]:!shadow-none [&_[data-slot=select-trigger]]:!bg-muted/30 hover:[&_[data-slot=select-trigger]]:!bg-muted/50 [&_[data-slot=select-trigger]]:transition-colors [&_[data-slot=select-trigger]]:duration-150",
          "[&_[data-slot=select-trigger]:focus]:-translate-y-1 [&_[data-slot=select-trigger]:focus]:-translate-x-1 [&_[data-slot=select-trigger]:focus]:!border-primary [&_[data-slot=select-trigger]:focus]:!border-2 [&_[data-slot=select-trigger]:focus]:!bg-background",
          "[&_[data-slot=select-trigger][data-state=open]]:-translate-y-1 [&_[data-slot=select-trigger][data-state=open]]:-translate-x-1 [&_[data-slot=select-trigger][data-state=open]]:!border-primary [&_[data-slot=select-trigger][data-state=open]]:!border-2 [&_[data-slot=select-trigger][data-state=open]]:!bg-background",

          "[&_[data-slot=button]]:!shadow-none",
          "[&_[data-slot=button]:focus-visible]:-translate-y-1 [&_[data-slot=button]:focus-visible]:-translate-x-1 [&_[data-slot=button]:focus-visible]:!border-primary [&_[data-slot=button]:focus-visible]:!border-2",
          "[&_[data-slot=button]:active]:translate-y-1 [&_[data-slot=button]:active]:translate-x-1",
          "[&_[data-slot=button][data-state=open]]:-translate-y-1 [&_[data-slot=button][data-state=open]]:-translate-x-1 [&_[data-slot=button][data-state=open]]:!border-primary [&_[data-slot=button][data-state=open]]:!border-2",

          "[&_[data-slot=checkbox]]:!shadow-none",
          "[&_[data-slot=checkbox]:focus-visible]:-translate-y-1 [&_[data-slot=checkbox]:focus-visible]:-translate-x-1 [&_[data-slot=checkbox]:focus-visible]:!border-primary [&_[data-slot=checkbox]:focus-visible]:!border-2",
          "[&_[data-slot=checkbox]:active]:translate-y-1 [&_[data-slot=checkbox]:active]:translate-x-1",
        )}
        data-dirty={dirty ? "true" : undefined}
        data-error={hasError ? "true" : undefined}
      >
        {children}
      </div>

      {config.helpText && !hasError && (
        <p className="px-0.5 text-[11px] leading-tight text-muted-foreground/70 italic">
          {config.helpText}
        </p>
      )}

      {hasError && (
        <div className="mt-1 flex flex-col gap-1.5 animate-in fade-in slide-in-from-top-1">
          {errorList.map((item, index) => (
            <div
              key={`${config.name}-error-${index}`}
              className="flex items-start gap-2  bg-destructive/10 px-3 py-2 text-[12px] font-medium text-destructive"
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
