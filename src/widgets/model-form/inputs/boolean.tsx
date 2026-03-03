import React from "react";
import { useStore } from "@tanstack/react-form";
import { Checkbox } from "@/shared/ui/kit/checkbox";
import { Switch } from "@/shared/ui/kit/switch";
import { Button } from "@/shared/ui/kit/button";
import { cn } from "@/shared/utils";
import {
  FieldWrapper,
  resolveFieldErrors,
  resolveRequiredError,
} from "./common";
import type { BooleanFieldConfig, FieldComponentProps } from "./types";

type Props = FieldComponentProps<BooleanFieldConfig, boolean>;

const BooleanInput: React.FC<Props> = ({ config, field, form }) => {
  const meta = field.state.meta;
  const dirty = meta.isDirty;
  const submitCount = useStore(
    form.store,
    (state) =>
      (state as any).submissionAttempts ?? (state as any).submitCount ?? 0,
  );
  const isSubmitted = submitCount > 0;
  const showError =
    dirty || meta.isBlurred || isSubmitted || Boolean(meta.errorMap?.onSubmit);
  const fieldErrors = resolveFieldErrors(meta, showError);
  const error =
    fieldErrors ?? resolveRequiredError(config, field.state.value, showError);
  const fieldId = field.name;
  const value = Boolean(field.state.value);

  const label = value
    ? (config.trueLabel ?? "Oui")
    : (config.falseLabel ?? "Non");

  if (config.type === "switch") {
    return (
      <FieldWrapper
        config={config}
        fieldId={fieldId}
        error={error}
        dirty={dirty}
      >
        <div
          className={cn(
            "flex items-center gap-3 border border-border/30 bg-muted/10 p-3 transition-all duration-300  ",
            "hover:border-border/60 hover:bg-muted/20 hover: hover:-translate-y-0.5",
            value
              ? "border-primary/50 bg-primary/5 ring-2 ring-primary/20 "
              : "",
          )}
        >
          <Switch
            id={fieldId}
            data-slot="checkbox"
            checked={value}
            onCheckedChange={(checked) => field.handleChange(Boolean(checked))}
            disabled={config.disabled}
          />
          <div className="flex flex-col">
            <span
              className={cn(
                "text-sm font-medium transition-colors",
                value ? "text-primary" : "text-foreground/70",
              )}
            >
              {label}
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto h-8 px-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground transition-all hover:bg-primary/20 hover:text-primary  border border-transparent hover:border-primary/30"
            onClick={() => field.handleChange(!value)}
            type="button"
            disabled={config.disabled}
          >
            {value ? "Désactiver" : "Activer"}
          </Button>
        </div>
      </FieldWrapper>
    );
  }

  return (
    <FieldWrapper config={config} fieldId={fieldId} error={error} dirty={dirty}>
      <div
        className={cn(
          "flex cursor-pointer items-center gap-3 border border-border/30 bg-muted/10 px-5 py-2 transition-all duration-300  ",
          "hover:border-primary/30 hover:bg-muted/20 hover: hover:-translate-y-0.5",
          value
            ? "border-primary/50 bg-primary/5 ring-2 ring-primary/20 "
            : "",
        )}
        onClick={() => !config.disabled && field.handleChange(!value)}
      >
        <Checkbox
          id={fieldId}
          data-slot="checkbox"
          checked={value}
          onCheckedChange={(checked) => field.handleChange(Boolean(checked))}
          onBlur={field.handleBlur}
          disabled={config.disabled}
          className="size-5 "
          onClick={(e) => e.stopPropagation()}
        />
        <div className="flex flex-col cursor-pointer select-none">
          <span
            className={cn(
              "text-sm font-semibold transition-colors",
              value ? "text-primary" : "text-foreground/80",
            )}
          >
            {label}
          </span>
        </div>
      </div>
    </FieldWrapper>
  );
};

export default BooleanInput;
