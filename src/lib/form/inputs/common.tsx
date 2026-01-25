import React from "react";
import { Label } from "@/lib/components/ui/label";
import { cn } from "@/lib/utils";
import type { BaseFieldConfig } from "./types";

type FieldWrapperProps = {
  config: BaseFieldConfig;
  error?: string;
  dirty?: boolean;
  children: React.ReactNode;
};

export const FieldWrapper: React.FC<FieldWrapperProps> = ({
  config,
  error,
  dirty,
  children,
}) => {
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
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
};
