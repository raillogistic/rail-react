import React from "react";
import { useStore } from "@tanstack/react-form";
import { Hash } from "lucide-react";
import { Input } from "@/shared/ui/kit/input";
import { cn } from "@/shared/utils";
import {
  FieldWrapper,
  resolveFieldErrors,
  resolveRequiredError,
} from "./common";
import type { FieldComponentProps, NumberFieldConfig } from "./types";

type Props = FieldComponentProps<NumberFieldConfig, string | number>;

function normalizeDecimalDraft(value: string): string {
  return value.replace(",", ".");
}

function isValidDecimalDraft(value: string): boolean {
  return /^-?\d*(\.\d*)?$/.test(value);
}

function formatDecimalOnBlur(value: string): string {
  if (!value) return "";
  if (/^-?\d+\.$/.test(value)) {
    return value.slice(0, -1);
  }
  return value;
}

const DecimalInput: React.FC<Props> = ({ config, field, form }) => {
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
  const value =
    field.state.value === undefined || field.state.value === null
      ? ""
      : String(field.state.value);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const raw = normalizeDecimalDraft(event.target.value);
    if (raw === "" || isValidDecimalDraft(raw)) {
      field.handleChange(raw);
    }
  };

  const handleBlur = () => {
    field.handleChange(formatDecimalOnBlur(value));
    field.handleBlur();
  };

  const numericValue = value === "" ? undefined : Number(value);
  const canFormat = numericValue !== undefined && Number.isFinite(numericValue);

  return (
    <FieldWrapper config={config} fieldId={fieldId} error={error} dirty={dirty}>
      <div className="relative group/decimal">
        <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/30 transition-all duration-300 group-focus-within/decimal:text-primary/50 group-focus-within/decimal:scale-110">
          <Hash className="size-4.5 stroke-[2.5]" />
        </div>
        <Input
          id={fieldId}
          data-slot="input"
          type="text"
          inputMode="decimal"
          value={value}
          min={config.min}
          max={config.max}
          step={config.step}
          onChange={handleChange}
          onBlur={handleBlur}
          disabled={config.disabled}
          className={cn(
            "h-12 rounded-xl border border-input/70 bg-muted/5 pl-11 pr-4 text-[13.5px] font-bold transition-all duration-300 ease-out",
            "hover:border-primary/40 hover:bg-muted/8 hover:shadow-inner",
            "focus:border-primary focus:ring-4 focus:ring-primary/10 focus-visible:ring-0",
            config.disabled && "cursor-not-allowed opacity-60 grayscale-[0.5]",
          )}
        />

        {config.format && canFormat ? (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 animate-in fade-in slide-in-from-right-2 duration-500">
            <span className="rounded-lg bg-primary/10 px-2.5 py-1 text-[10.5px] font-black uppercase tracking-wider text-primary shadow-inner shadow-primary/10">
              {config.format(numericValue)}
            </span>
          </div>
        ) : null}
      </div>
    </FieldWrapper>
  );
};

export default DecimalInput;
