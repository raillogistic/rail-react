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
import { CheckCircle2, XCircle, ToggleLeft, ToggleRight, CheckSquare, Square } from "lucide-react";

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
            "group/bool relative flex items-center gap-4 rounded-xl border border-border/70 bg-muted/5 p-4 transition-all duration-500 ease-out",
            "hover:border-primary/30 hover:bg-muted/8 hover:shadow-md hover:shadow-primary/1 cursor-pointer",
            value
              ? "border-primary/40 bg-primary/3 ring-1 ring-primary/10 shadow-sm"
              : "hover:bg-muted/10",
          )}
          onClick={() => !config.disabled && field.handleChange(!value)}
        >
          <div className="flex size-10 items-center justify-center rounded-xl bg-background/50 shadow-inner group-hover/bool:bg-background transition-colors">
            {value ? (
              <ToggleRight className="size-5.5 text-primary" />
            ) : (
              <ToggleLeft className="size-5.5 text-muted-foreground/40" />
            )}
          </div>
          <Switch
            id={fieldId}
            data-slot="checkbox"
            checked={value}
            onCheckedChange={(checked) => field.handleChange(Boolean(checked))}
            disabled={config.disabled}
            className="scale-110 data-[state=checked]:bg-primary transition-all duration-500"
            onClick={(e) => e.stopPropagation()}
          />
          <div className="flex flex-1 flex-col gap-0.5">
            <span
              className={cn(
                "text-[13.5px] font-bold transition-all duration-300",
                value ? "text-primary translate-x-0.5" : "text-foreground/50",
              )}
            >
              {label}
            </span>
          </div>
          <div className="flex items-center justify-center opacity-0 group-hover/bool:opacity-100 transition-opacity duration-500 pr-1">
             {value ? <CheckCircle2 className="size-4 text-primary/40" /> : <XCircle className="size-4 text-muted-foreground/20" />}
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
          "group/bool relative flex cursor-pointer items-center gap-4 rounded-xl border border-border/70 bg-muted/5 px-5 py-4 transition-all duration-500 ease-out",
          "hover:border-primary/30 hover:bg-muted/8 hover:shadow-md hover:shadow-primary/1",
          value
            ? "border-primary/40 bg-primary/3 ring-1 ring-primary/10 shadow-sm"
            : "hover:bg-muted/10",
        )}
        onClick={() => !config.disabled && field.handleChange(!value)}
      >
        <div className="flex size-10 items-center justify-center rounded-xl bg-background/50 shadow-inner group-hover/bool:bg-background transition-colors">
          {value ? (
            <CheckSquare className="size-5.5 text-primary" />
          ) : (
            <Square className="size-5.5 text-muted-foreground/40" />
          )}
        </div>
        <div className="relative flex size-5.5 items-center justify-center">
            <Checkbox
              id={fieldId}
              data-slot="checkbox"
              checked={value}
              onCheckedChange={(checked) => field.handleChange(Boolean(checked))}
              onBlur={field.handleBlur}
              disabled={config.disabled}
              className={cn(
                "size-5.5 rounded-lg border-2 transition-all duration-500",
                value ? "border-primary bg-primary scale-110 shadow-lg shadow-primary/20" : "border-muted-foreground/30",
              )}
              onClick={(e) => e.stopPropagation()}
            />
        </div>
        <div className="flex flex-1 flex-col select-none gap-0.5">
          <span
            className={cn(
              "text-[13.5px] font-bold transition-all duration-300",
              value ? "text-primary translate-x-0.5" : "text-foreground/50",
            )}
          >
            {label}
          </span>
        </div>
        <div className="flex items-center justify-center opacity-0 group-hover/bool:opacity-100 transition-opacity duration-500 pr-1">
             {value ? <CheckCircle2 className="size-4 text-primary/40" /> : <XCircle className="size-4 text-muted-foreground/20" />}
        </div>
      </div>
    </FieldWrapper>
  );
};

export default BooleanInput;
