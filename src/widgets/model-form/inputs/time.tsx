import React from "react";
import { useStore } from "@tanstack/react-form";
import { Input } from "@/shared/ui/kit/input";
import { ClockIcon } from "lucide-react";
import { cn } from "@/shared/utils";
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
 <div className="relative group/time">
 <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 transition-colors group-focus-within/time:text-primary/70">
 <ClockIcon className="size-4" />
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
 className="h-10 border-border/60 bg-background/50 pl-9 pr-4 transition-all focus:border-primary/50 focus:bg-background focus:ring-4 focus:ring-primary/5 focus-visible:ring-0"
 />
 </div>
 </FieldWrapper>
 );
};

export default TimeInput;

