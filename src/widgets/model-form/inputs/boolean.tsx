/**
 * Boolean form inputs: checkbox and switch toggles.
 *
 * Renders a clickable card with either a Checkbox or Switch component
 * and a label that reflects the current boolean state.
 *
 * @module form/inputs/boolean
 */
import React from "react";
import { useStore } from "@tanstack/react-form";
import { Checkbox } from "@/shared/ui/kit/checkbox";
import { Switch } from "@/shared/ui/kit/switch";
import { cn } from "@/shared/utils";
import {
  FieldWrapper,
  resolveFieldErrors,
  resolveRequiredError,
} from "./common";
import type { BooleanFieldConfig, FieldComponentProps } from "./types";

type Props = FieldComponentProps<BooleanFieldConfig, boolean>;

/** Renders a boolean field as either a switch or checkbox card. */
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

  // ── Switch variant ───────────────────────────────────────────────────
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
            "flex items-center gap-3 rounded-lg border border-border/50 bg-background p-3 transition-all duration-200",
            "hover:border-border hover:bg-accent/30",
            value
              ? "border-primary/30 bg-primary/5 ring-1 ring-primary/10"
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
          <div className="flex flex-1 flex-col">
            <span
              className={cn(
                "text-sm font-medium transition-colors",
                value ? "text-foreground" : "text-foreground/60",
              )}
            >
              {label}
            </span>
          </div>
        </div>
      </FieldWrapper>
    );
  }

  // ── Checkbox variant (default) ───────────────────────────────────────
  return (
    <FieldWrapper config={config} fieldId={fieldId} error={error} dirty={dirty}>
      <div
        className={cn(
          "flex cursor-pointer items-center gap-3 rounded-lg border border-border/50 bg-background px-4 py-2.5 transition-all duration-200",
          "hover:border-border hover:bg-accent/30",
          value
            ? "border-primary/30 bg-primary/5 ring-1 ring-primary/10"
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
          className="size-4.5 rounded"
          onClick={(e) => e.stopPropagation()}
        />
        <div className="flex flex-col cursor-pointer select-none">
          <span
            className={cn(
              "text-sm font-medium transition-colors",
              value ? "text-foreground" : "text-foreground/60",
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
