/**
 * Time-only input with a clock icon indicator.
 *
 * Renders an HTML `<input type="time">` inside the shared FieldWrapper.
 *
 * @module form/inputs/time
 */
import React from "react";
import { useStore } from "@tanstack/react-form";
import { Input } from "@/shared/ui/kit/input";
import { ClockIcon } from "lucide-react";
import { cn } from "@/shared/utils";
import { FieldWrapper, resolveFieldErrors, resolveRequiredError } from "./common";
import type { DateFieldConfig, FieldComponentProps } from "./types";

type Props = FieldComponentProps<DateFieldConfig, string>;

/** Renders a time input with a left-aligned clock icon. */
const TimeInput: React.FC<Props> = ({ config, field, form }) => {
  const meta = field.state.meta;
  const dirty = meta.isDirty;
  const submitCount = useStore(
    form.store,
    (state) => (state as any).submissionAttempts ?? (state as any).submitCount ?? 0,
  );
  const isSubmitted = submitCount > 0;
  const showError = dirty || meta.isBlurred || isSubmitted || Boolean(meta.errorMap?.onSubmit);
  const fieldErrors = resolveFieldErrors(meta, showError);
  const error = fieldErrors ?? resolveRequiredError(config, field.state.value, showError);
  const value = (field.state.value as string) ?? "";

  return (
    <FieldWrapper config={config} error={error} dirty={dirty}>
      <div className="relative group/time">
        <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/30 transition-all duration-300 group-focus-within/time:text-primary/50 group-focus-within/time:scale-110">
          <ClockIcon className="size-4.5 stroke-[2.5]" />
        </div>
        <Input
          data-slot="input"
          type="time"
          value={value}
          min={config.min}
          max={config.max}
          onChange={(event) => field.handleChange(event.target.value)}
          onBlur={field.handleBlur}
          disabled={config.disabled}
          className={cn(
            "h-12 rounded-xl border border-input/60 bg-background pl-11 pr-4 text-[13.5px] font-bold transition-all duration-300 ease-out",
            "hover:border-primary/30 hover:bg-muted/[0.03] hover:shadow-md hover:shadow-primary/[0.01]",
            "focus:border-primary focus:ring-4 focus:ring-primary/10 focus-visible:ring-0",
             config.disabled && "cursor-not-allowed opacity-60 grayscale-[0.5]",
          )}
        />
      </div>
    </FieldWrapper>
  );
};

export default TimeInput;
