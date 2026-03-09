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
 <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/40 transition-colors group-focus-within/decimal:text-primary/60">
 <Hash className="size-4" />
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
 "h-10 rounded-md border border-input bg-background pl-10 pr-4 text-sm transition-all duration-200",
 "hover:border-border",
 "focus:border-primary focus:ring-2 focus:ring-primary/20 focus-visible:ring-0",
 )}
 />

 {config.format && canFormat ? (
 <div className="absolute right-3 top-1/2 -translate-y-1/2 animate-in fade-in slide-in-from-right-1">
 <span className="rounded-md bg-primary/8 px-2 py-0.5 text-[11px] font-medium text-primary">
 {config.format(numericValue)}
 </span>
 </div>
 ) : null}
 </div>
 </FieldWrapper>
 );
};

export default DecimalInput;
