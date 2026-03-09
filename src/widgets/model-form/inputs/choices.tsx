/**
 * Choice-based form inputs: select dropdown, multi-select, and radio group.
 *
 * Uses shadcn/ui Select for single choice, DropdownMenu for multi-select,
 * and custom radio cards for radio groups.
 *
 * @module form/inputs/choices
 */
import React from "react";
import { useStore } from "@tanstack/react-form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/kit/select";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/shared/ui/kit/dropdown-menu";
import { Button } from "@/shared/ui/kit/button";
import { Checkbox } from "@/shared/ui/kit/checkbox";
import { Badge } from "@/shared/ui/kit/badge";
import { ChevronDown, Check, X } from "lucide-react";
import { cn } from "@/shared/utils";
import {
  FieldWrapper,
  resolveFieldErrors,
  resolveRequiredError,
} from "./common";
import type {
  ChoiceFieldConfig,
  FieldComponentProps,
  ChoiceOption,
} from "./types";

type Props = FieldComponentProps<ChoiceFieldConfig>;

const choiceTriggerClassName =
  "w-full rounded-md border border-input bg-background px-3 text-left text-sm font-normal transition-all duration-200 hover:border-border hover:bg-accent/30 focus:border-primary focus:ring-2 focus:ring-primary/20";

const multiChoiceTriggerClassName = `${choiceTriggerClassName} h-auto min-h-10 justify-between py-2`;

const singleChoiceTriggerClassName = `${choiceTriggerClassName} h-auto min-h-10`;

/** Renders a choice input based on configuration (select | multi | radio). */
const ChoiceInput: React.FC<Props> = ({ config, field, form }) => {
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

  // ── Multi-select (dropdown with checkboxes) ──────────────────────────
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

    const selectedOptions = config.options.filter((opt) =>
      selectedValues.includes(opt.value),
    );

    return (
      <FieldWrapper
        config={config}
        fieldId={field.name}
        error={error}
        dirty={dirty}
      >
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              id={field.name}
              variant="outline"
              data-slot="select-trigger"
              className={cn(
                multiChoiceTriggerClassName,
                selectedValues.length > 0
                  ? "border-primary/30"
                  : "",
              )}
            >
              <div className="flex flex-wrap gap-1.5 pr-4">
                {selectedOptions.length > 0 ? (
                  selectedOptions.map((opt) => (
                    <Badge
                      key={opt.value}
                      variant="secondary"
                      className="rounded-full bg-primary/10 text-primary hover:bg-primary/15 transition-colors border-none px-2.5 py-0.5 text-[11px] font-medium"
                    >
                      {opt.label}
                      <X
                        className="ml-1.5 size-3 cursor-pointer opacity-50 hover:opacity-100"
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
              <ChevronDown className="size-4 shrink-0 text-muted-foreground/50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-80 rounded-lg border border-border/50 bg-popover p-1.5 shadow-lg">
            <div className="max-h-64 overflow-y-auto space-y-0.5">
              {config.options.map((option) => (
                <DropdownMenuCheckboxItem
                  key={option.value}
                  className={cn(
                    "rounded-md px-3 py-2 transition-colors duration-150 cursor-pointer",
                    "focus:bg-accent focus:text-accent-foreground",
                    selectedValues.includes(option.value)
                      ? "bg-primary/5 text-primary"
                      : "text-foreground/80 hover:bg-accent/50",
                  )}
                  checked={selectedValues.includes(option.value)}
                  onCheckedChange={() => toggleValue(option.value)}
                  disabled={option.disabled}
                >
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-medium leading-none">
                      {option.label}
                    </span>
                    {option.description ? (
                      <span className="text-[10px] text-muted-foreground/60 leading-tight">
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

  // ── Radio group ──────────────────────────────────────────────────────
  if (config.type === "radio") {
    const value = field.state.value ?? "";
    return (
      <FieldWrapper config={config} error={error} dirty={dirty}>
        <div className="flex flex-col gap-2 pt-0.5">
          {config.options.map((option) => (
            <label
              key={option.value}
              className={cn(
                "group relative flex w-full cursor-pointer items-center gap-3 rounded-lg border border-border/50 bg-background px-4 py-2.5 transition-all duration-200",
                "hover:border-border hover:bg-accent/30",
                value === option.value
                  ? "border-primary/40 bg-primary/5 ring-1 ring-primary/10"
                  : "",
              )}
            >
              <div
                className={cn(
                  "flex size-4.5 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-200",
                  value === option.value
                    ? "border-primary bg-primary"
                    : "border-muted-foreground/30 group-hover:border-muted-foreground/50",
                )}
              >
                {value === option.value && (
                  <div className="size-1.5 rounded-full bg-primary-foreground" />
                )}
              </div>
              <div className="flex flex-col gap-0.5">
                <span
                  className={cn(
                    "text-sm font-medium transition-colors",
                    value === option.value
                      ? "text-foreground"
                      : "text-foreground/70",
                  )}
                >
                  {option.label}
                </span>
                {option.description && (
                  <span className="text-[11px] text-muted-foreground/60 leading-tight">
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

  // ── Single select ────────────────────────────────────────────────────
  const selectedValue =
    field.state.value ??
    (config.required ? (config.options[0]?.value ?? "") : "");

  return (
    <FieldWrapper
      config={config}
      fieldId={field.name}
      error={error}
      dirty={dirty}
    >
      <div className="w-full">
        <Select
          value={String(selectedValue)}
          onValueChange={(next) => field.handleChange(next)}
          disabled={config.disabled}
        >
          <SelectTrigger
            id={field.name}
            data-slot="select-trigger"
            className={cn(
              singleChoiceTriggerClassName,
              "focus-visible:ring-0",
            )}
          >
            <SelectValue
              placeholder={config.placeholder ?? "Choisir une option"}
            />
          </SelectTrigger>
          <SelectContent className="rounded-lg border border-border/50 bg-popover shadow-lg p-1">
            {config.options.map((option) => (
              <SelectItem
                key={option.value}
                value={String(option.value)}
                disabled={option.disabled}
                className="rounded-md py-2 px-3 transition-colors duration-150 cursor-pointer focus:bg-accent focus:text-accent-foreground hover:bg-accent/50"
              >
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium">{option.label}</span>
                  {option.description && (
                    <span className="text-[10px] text-muted-foreground/60">
                      {option.description}
                    </span>
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
