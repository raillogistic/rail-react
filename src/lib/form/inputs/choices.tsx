import React from "react";
import { useStore } from "@tanstack/react-form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/lib/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/lib/components/ui/dropdown-menu";
import { Button } from "@/lib/components/ui/button";
import { Checkbox } from "@/lib/components/ui/checkbox";
import { Badge } from "@/lib/components/ui/badge";
import { ChevronDown, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { FieldWrapper, resolveFieldErrors, resolveRequiredError } from "./common";
import type {
  ChoiceFieldConfig,
  FieldComponentProps,
  ChoiceOption,
} from "./types";

type Props = FieldComponentProps<ChoiceFieldConfig>;

const ChoiceInput: React.FC<Props> = ({ config, field, form }) => {
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

  if (config.multiple) {
    const selectedValues = Array.isArray(field.state.value)
      ? (field.state.value as Array<string | number>)
      : [];

    const toggleValue = (value: ChoiceOption["value"]) => {
      const exists = selectedValues.includes(value);
      const next = exists
        ? selectedValues.filter((item) => item !== value)
        : [...selectedValues, value];
      field.handleChange(next);
    };

    const selectedOptions = config.options.filter(opt => selectedValues.includes(opt.value));

    return (
      <FieldWrapper config={config} fieldId={field.name} error={error} dirty={dirty}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              id={field.name}
              variant="outline"
              data-slot="select-trigger"
              className={cn(
                "h-auto min-h-10 w-full justify-between rounded-lg border-border/60 bg-background/50 px-3 py-2 text-left font-normal transition-all hover:border-primary/50 hover:bg-background",
                selectedValues.length > 0 ? "border-primary/30" : ""
              )}
            >
              <div className="flex flex-wrap gap-1.5 pr-4">
                {selectedOptions.length > 0 ? (
                  selectedOptions.map(opt => (
                    <Badge 
                      key={opt.value} 
                      variant="secondary" 
                      className="bg-primary/10 text-primary border-none rounded-md px-1.5 py-0 text-[10px] font-bold uppercase tracking-wider"
                    >
                      {opt.label}
                      <X 
                        className="ml-1 size-3 cursor-pointer opacity-60 hover:opacity-100" 
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleValue(opt.value);
                        }}
                      />
                    </Badge>
                  ))
                ) : (
                  <span className="text-muted-foreground">
                    {config.placeholder ?? "Choisir des valeurs"}
                  </span>
                )}
              </div>
              <ChevronDown className="size-4 shrink-0 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-72 p-2 shadow-xl border-border/40 bg-background/95 backdrop-blur-sm">
            <div className="max-h-64 overflow-y-auto space-y-1">
              {config.options.map((option) => (
                <DropdownMenuCheckboxItem
                  key={option.value}
                  className={cn(
                    "rounded-md px-3 py-2.5 transition-colors focus:bg-primary/5 focus:text-primary",
                    selectedValues.includes(option.value) ? "bg-primary/5 text-primary" : ""
                  )}
                  checked={selectedValues.includes(option.value)}
                  onCheckedChange={() => toggleValue(option.value)}
                  disabled={option.disabled}
                >
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-semibold leading-none">{option.label}</span>
                    {option.description ? (
                      <span className="text-[10px] text-muted-foreground/70 leading-tight">
                        {option.description}
                      </span>
                    ) : null}
                  </div>
                </DropdownMenuCheckboxItem>
              ))}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </FieldWrapper>
    );
  }

  if (config.type === "radio") {
    const value = field.state.value ?? "";
    return (
      <FieldWrapper config={config} error={error} dirty={dirty}>
        <div className="flex flex-col gap-2 pt-1">
          {config.options.map((option) => (
            <label
              key={option.value}
              className={cn(
                "group relative flex w-full cursor-pointer items-center gap-3 rounded-lg border border-border/40 bg-background/50 px-4 py-3 transition-all duration-200",
                "hover:border-primary/30 hover:bg-background hover:shadow-sm",
                value === option.value ? "border-primary/50 bg-primary/5 ring-1 ring-primary/20" : ""
              )}
            >
              <div className={cn(
                "flex size-5 shrink-0 items-center justify-center rounded-full border border-border/60 transition-all",
                value === option.value ? "border-primary bg-primary scale-110 shadow-sm shadow-primary/20" : "group-hover:border-primary/50"
              )}>
                {value === option.value && <div className="size-2 rounded-full bg-primary-foreground" />}
              </div>
              <div className="flex flex-col gap-0.5">
                <span className={cn(
                  "text-sm font-semibold transition-colors",
                  value === option.value ? "text-primary" : "text-foreground/80"
                )}>
                  {option.label}
                </span>
                {option.description && (
                  <span className="text-[11px] text-muted-foreground/70 leading-tight">
                    {option.description}
                  </span>
                )}
              </div>
              <input
                type="radio"
                className="sr-only"
                checked={value === option.value}
                onChange={() => field.handleChange(option.value)}
                disabled={option.disabled || config.disabled}
              />
            </label>
          ))}
        </div>
      </FieldWrapper>
    );
  }

  const selectedValue =
    field.state.value ??
    (config.required ? config.options[0]?.value ?? "" : "");

  return (
    <FieldWrapper config={config} fieldId={field.name} error={error} dirty={dirty}>
      <div className="w-full">
        <Select
          value={String(selectedValue)}
          onValueChange={(next) => field.handleChange(next)}
          disabled={config.disabled}
        >
          <SelectTrigger
            id={field.name}
            data-slot="select-trigger"
            className="h-10 w-full rounded-lg border-border/60 bg-background/50 px-4 transition-all focus:border-primary/50 focus:bg-background focus:ring-4 focus:ring-primary/5 focus-visible:ring-0"
          >
            <SelectValue placeholder={config.placeholder ?? "Choisir une option"} />
          </SelectTrigger>
          <SelectContent className="border-border/40 shadow-xl bg-background/95 backdrop-blur-sm">
            {config.options.map((option) => (
              <SelectItem
                key={option.value}
                value={String(option.value)}
                disabled={option.disabled}
                className="rounded-md py-2.5 transition-colors focus:bg-primary/5 focus:text-primary"
              >
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-semibold">{option.label}</span>
                  {option.description && (
                    <span className="text-[10px] text-muted-foreground/70">{option.description}</span>
                  )}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </FieldWrapper>
  );
};

export default ChoiceInput;
