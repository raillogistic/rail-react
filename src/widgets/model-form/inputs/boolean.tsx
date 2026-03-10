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
import { ToggleLeft, ToggleRight, CheckSquare, Square } from "lucide-react";

type Props = FieldComponentProps<BooleanFieldConfig, boolean>;

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

  const isSwitch = config.type === "switch";

  const Icon = isSwitch 
    ? (value ? ToggleRight : ToggleLeft)
    : (value ? CheckSquare : Square);

  return (
    <FieldWrapper config={config} fieldId={fieldId} error={error} dirty={dirty}>
      <div className="relative group/bool">
        <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/30 transition-all duration-300 group-focus-within/bool:text-primary/50 group-focus-within/bool:scale-110">
          <Icon className={cn("size-4.5", isSwitch ? "stroke-2" : "stroke-[2.5]", value && "text-primary")} />
        </div>
        
        <label
          htmlFor={fieldId}
          data-slot="input"
          className={cn(
            "flex h-11 w-full cursor-pointer items-center justify-between rounded-xl border border-input/70 bg-muted/5 pl-11 pr-4 text-[13.5px] font-bold transition-all duration-300 ease-out",
            "hover:border-primary/40 hover:bg-muted/8 hover:shadow-inner",
            "focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/10",
            value && "border-primary/20 bg-primary/2 text-foreground",
            !value && "text-foreground/70",
            config.disabled && "cursor-not-allowed opacity-60 grayscale-[0.5]",
          )}
        >
          <span
            className={cn(
              "truncate flex-1 transition-colors duration-300",
              value ? "text-primary hover:text-primary/80" : "group-hover/bool:text-foreground/90",
            )}
          >
            {label}
          </span>

          <div className="flex shrink-0 items-center ml-4">
            {isSwitch ? (
              <Switch
                id={fieldId}
                checked={value}
                onCheckedChange={(checked) => {
                  field.handleChange(Boolean(checked));
                  field.handleBlur();
                }}
                disabled={config.disabled}
                className={cn(
                  "transition-all duration-500 scale-110",
                  value ? "data-[state=checked]:bg-primary" : "data-[state=unchecked]:bg-muted-foreground/30 dark:data-[state=unchecked]:bg-muted-foreground/50",
                )}
              />
            ) : (
              <Checkbox
                id={fieldId}
                checked={value}
                onCheckedChange={(checked) => {
                  field.handleChange(Boolean(checked));
                  field.handleBlur();
                }}
                disabled={config.disabled}
                className={cn(
                  "size-5 rounded-[0.4rem] transition-all duration-300",
                  value ? "border-primary bg-primary scale-110 shadow-sm shadow-primary/20" : "border-muted-foreground/40 bg-muted-foreground/5",
                )}
              />
            )}
          </div>
        </label>
      </div>
    </FieldWrapper>
  );
};

export default BooleanInput;
