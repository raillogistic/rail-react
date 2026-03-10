/**
 * Numeric form inputs: number, slider, and range.
 *
 * Renders a numeric input with a left-aligned hash icon indicator
 * and an optional formatted display badge on the right.
 *
 * @module form/inputs/numbers
 */
import React from "react";
import { useStore } from "@tanstack/react-form";
import { Input } from "@/shared/ui/kit/input";
import { cn } from "@/shared/utils";
import { Binary } from "lucide-react";
import {
  FieldWrapper,
  resolveFieldErrors,
  resolveRequiredError,
} from "./common";
import type { FieldComponentProps, NumberFieldConfig } from "./types";

type Props = FieldComponentProps<NumberFieldConfig, number | string>;

/** Renders a numeric input with optional formatting badge. */
const NumberInput: React.FC<Props> = ({ config, field, form }) => {
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
  const value = field.state.value ?? "";

  const typeAttr =
    config.type === "slider" || config.type === "range" ? "range" : "number";

  /** Parses and normalizes the input value. */
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const raw = event.target.value;
    if (raw === "") {
      field.handleChange("");
      return;
    }
    const parsed = parseInt(raw, 10);
    field.handleChange(Number.isNaN(parsed) ? "" : parsed);
  };

  return (
    <FieldWrapper config={config} fieldId={fieldId} error={error} dirty={dirty}>
      <div className="relative group/number">
        <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/30 transition-all duration-300 group-focus-within/number:text-primary/60 group-focus-within/number:scale-110">
          <Binary className="size-4.5" />
        </div>
        <Input
          id={fieldId}
          data-slot="input"
          type={typeAttr}
          value={value as any}
          min={config.min}
          max={config.max}
          step={config.step ?? 1}
          onChange={handleChange}
          onBlur={field.handleBlur}
          disabled={config.disabled}
          className={cn(
            "h-11 rounded-xl border border-input/60 bg-background pl-11 pr-4 text-[13.5px] font-bold transition-all duration-300 ease-out",
            "hover:border-primary/30 hover:bg-muted/3",
            "focus:border-primary focus:ring-4 focus:ring-primary/10 focus-visible:ring-0",
            (config.type === "slider" || config.type === "range") &&
              "h-8 px-0 border-none bg-transparent focus:ring-0",
          )}
        />

        {config.format && typeof value === "number" && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 animate-in fade-in slide-in-from-right-2 duration-500 ease-out">
            <span className="rounded-lg bg-primary/10 px-2.5 py-1 text-[11px] font-bold text-primary shadow-sm shadow-primary/5">
              {config.format(value)}
            </span>
          </div>
        )}
      </div>
    </FieldWrapper>
  );
};

export default NumberInput;
