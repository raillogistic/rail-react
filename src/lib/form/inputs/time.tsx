import React from "react";
import { useStore } from "@tanstack/react-form";
import { Input } from "@/lib/components/ui/input";
import { FieldWrapper, resolveFieldErrors, resolveRequiredError } from "./common";
import type { DateFieldConfig, FieldComponentProps } from "./types";

type Props = FieldComponentProps<DateFieldConfig, string>;

const TimeInput: React.FC<Props> = ({ config, field, form }) => {
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
  const value = (field.state.value as string) ?? "";

  return (
    <FieldWrapper config={config} error={error} dirty={dirty}>
      <Input
        type="time"
        value={value}
        min={config.min}
        max={config.max}
        onChange={(event) => field.handleChange(event.target.value)}
        onBlur={field.handleBlur}
        disabled={config.disabled}
      />
    </FieldWrapper>
  );
};

export default TimeInput;
