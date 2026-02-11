import React from "react";
import { useStore } from "@tanstack/react-form";
import { Input } from "@/lib/components/ui/input";
import { cn } from "@/lib/utils";
import { Hash } from "lucide-react";
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
      <div className="relative group/number">
        <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 transition-colors group-focus-within/number:text-primary/70">
          <Hash className="size-4" />
        </div>
        <Input
          data-slot="input"
          type={typeAttr}
          value={value as any}
          min={config.min}
          max={config.max}
          step={config.step ?? (config.type === "decimal" ? 0.01 : 1)}
          onChange={handleChange}
          onBlur={field.handleBlur}
          disabled={config.disabled}
          className={cn(
            "h-10 rounded-lg border-border/60 bg-background/50 pl-9 pr-4 transition-all focus:border-primary/50 focus:bg-background focus:ring-4 focus:ring-primary/5 focus-visible:ring-0",
            (config.type === "slider" || config.type === "range") && "h-8 px-0 border-none bg-transparent focus:ring-0"
          )}
        />
        
        {config.format && typeof value === "number" && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 animate-in fade-in slide-in-from-right-1">
            <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold text-primary">
              {config.format(value)}
            </span>
          </div>
        )}
      </div>
    </FieldWrapper>
  );
};

export default NumberInput;
