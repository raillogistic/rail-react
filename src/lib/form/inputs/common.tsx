import React from "react";
import { Label } from "@/lib/components/ui/label";
import { cn } from "@/lib/utils";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/lib/components/ui/tooltip";
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
        config.className
      )}
    >
      <div className="flex items-center justify-between gap-2 px-0.5">
        {config.label ? (
          <div className="flex items-center gap-1.5">
            <Label
              htmlFor={fieldId}
              className={cn(
                "text-sm font-medium transition-colors",
                hasError ? "text-destructive" : "text-foreground/90",
                "group-focus-within:text-primary"
              )}
            >
              {config.label}
              {config.required ? (
                <span className="text-destructive ml-0.5" aria-hidden="true">*</span>
              ) : null}
            </Label>
            
            {config.description && (
              <TooltipProvider>
                <Tooltip delayDuration={300}>
                  <TooltipTrigger asChild>
                    <button type="button" className="text-muted-foreground/60 hover:text-muted-foreground transition-colors outline-none">
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
        ) : <div />}

        {dirty && !hasError && (
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-500 animate-in fade-in slide-in-from-right-1">
            Modifié
          </span>
        )}
      </div>

      <div 
        className={cn(
          "relative transition-all duration-200",
          "data-[dirty=true]:[&_[data-slot=input]]:border-emerald-500/50 data-[dirty=true]:[&_[data-slot=input]]:ring-emerald-500/10",
          "data-[dirty=true]:[&_[data-slot=textarea]]:border-emerald-500/50 data-[dirty=true]:[&_[data-slot=textarea]]:ring-emerald-500/10",
          "data-[dirty=true]:[&_[data-slot=select-trigger]]:border-emerald-500/50 data-[dirty=true]:[&_[data-slot=select-trigger]]:ring-emerald-500/10",
          "data-[dirty=true]:[&_[data-slot=checkbox]]:border-emerald-500 data-[dirty=true]:[&_[data-slot=checkbox]]:ring-emerald-500/20",
          "data-[dirty=true]:[&_[data-slot=button]]:border-emerald-500/50 data-[dirty=true]:[&_[data-slot=button]]:ring-emerald-500/10",
          
          "data-[error=true]:[&_[data-slot=input]]:border-destructive/50 data-[error=true]:[&_[data-slot=input]]:ring-destructive/10",
          "data-[error=true]:[&_[data-slot=textarea]]:border-destructive/50 data-[error=true]:[&_[data-slot=textarea]]:ring-destructive/10",
          "data-[error=true]:[&_[data-slot=select-trigger]]:border-destructive/50 data-[error=true]:[&_[data-slot=select-trigger]]:ring-destructive/10",
          "data-[error=true]:[&_[data-slot=checkbox]]:border-destructive data-[error=true]:[&_[data-slot=checkbox]]:ring-destructive/20",
          "data-[error=true]:[&_[data-slot=button]]:border-destructive/50 data-[error=true]:[&_[data-slot=button]]:ring-destructive/10"
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
        <div className="flex flex-col gap-1 px-0.5 animate-in fade-in slide-in-from-top-1">
          {errorList.map((item, index) => (
            <div 
              key={`${config.name}-error-${index}`}
              className="flex items-center gap-1.5 text-[11px] font-medium text-destructive leading-tight"
            >
              <AlertCircle className="size-3 shrink-0" />
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
  showError: boolean
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
