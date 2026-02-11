import React from "react";
import { useStore } from "@tanstack/react-form";
import { Input } from "@/lib/components/ui/input";
import { FieldWrapper, resolveFieldErrors, resolveRequiredError } from "./common";
import type { FieldComponentProps, NumberFieldConfig } from "./types";

type Props = FieldComponentProps<NumberFieldConfig, number | string>;

const NumberInput: React.FC<Props> = ({ config, field, form }) => {
  const meta = field.state.meta;
  const dirty = meta.isDirty;
  const submitCount = useStore(
    form.store,
    (state) => (state as any).submissionAttempts ?? (state as any).submitCount ?? 0
  );
  const isSubmitted = submitCount > 0;
  const showError = dirty || meta.isBlurred || isSubmitted || Boolean(meta.errorMap?.onSubmit);
  const fieldErrors = resolveFieldErrors(meta, showError);
  const error = fieldErrors ?? resolveRequiredError(config, field.state.value, showError);
  const value = field.state.value ?? "";

  const typeAttr =
    config.type === "slider" || config.type === "range" ? "range" : "number";

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const raw = event.target.value;
    if (raw === "") {
      field.handleChange("");
      return;
    }
    const parsed =
      config.type === "decimal" ? parseFloat(raw) : parseInt(raw, 10);
    field.handleChange(Number.isNaN(parsed) ? "" : parsed);
  };

  return (
    <FieldWrapper config={config} error={error} dirty={dirty}>
      <div className="space-y-1">
        <Input
          type={typeAttr}
          value={value as any}
          min={config.min}
          max={config.max}
          step={config.step ?? (config.type === "decimal" ? 0.01 : 1)}
          onChange={handleChange}
          onBlur={field.handleBlur}
          disabled={config.disabled}
        />
        {config.format && typeof value === "number" ? (
          <span className="text-xs text-muted-foreground">
            {config.format(value)}
          </span>
        ) : null}
      </div>
    </FieldWrapper>
  );
};

export default NumberInput;
