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
} from "@/shared/ui/kit/select";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/shared/ui/kit/dropdown-menu";
import { Button } from "@/shared/ui/kit/button";
import { Badge } from "@/shared/ui/kit/badge";
import { ChevronDown, X, Layers, CircleDot, ListChecks, CheckCircle2 } from "lucide-react";
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

const choiceTriggerClassName = [
  "w-full rounded-xl border border-input/70 bg-muted/5 px-4 text-left text-[13.5px] font-medium transition-all duration-300 ease-out",
  "hover:border-primary/40 hover:bg-muted/8 hover:shadow-inner",
  "focus:border-primary focus:ring-4 focus:ring-primary/10",
  "data-[state=open]:border-primary data-[state=open]:ring-4 data-[state=open]:ring-primary/10",
].join(" ");

const multiChoiceTriggerClassName = `${choiceTriggerClassName} h-auto min-h-12 justify-between py-2.5`;
const singleChoiceTriggerClassName = `${choiceTriggerClassName} h-auto min-h-11`;

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
    const canClearSelection = !config.required && selectedValues.length > 0;

    const toggleValue = (value: ChoiceOption["value"]) => {
      const exists = selectedValues.includes(value);
      const next = exists
        ? selectedValues.filter((item) => item !== value)
        : [...selectedValues, value];
      field.handleChange(next);
    };

    const clearSelection = (event?: React.MouseEvent<HTMLElement>) => {
      event?.preventDefault();
      event?.stopPropagation();
      field.handleChange([]);
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
          <div className="relative">
            <DropdownMenuTrigger asChild>
              <Button
                id={field.name}
                variant="outline"
                data-slot="select-trigger"
                className={cn(
                  multiChoiceTriggerClassName,
                  canClearSelection ? "pr-12" : "",
                  selectedValues.length > 0 ? "border-primary/20 bg-primary/2" : "",
                )}
              >
                <div className="flex flex-wrap items-center gap-2 pr-4">
                  {selectedOptions.length === 0 && (
                     <ListChecks className="mr-1 size-4 text-primary/40 shrink-0" />
                  )}
                  {selectedOptions.length > 0 ? (
                    selectedOptions.map((opt) => (
                      <Badge
                        key={opt.value}
                        variant="secondary"
                        className="group/badge h-7 rounded-lg bg-primary/5 text-primary hover:bg-primary/10 transition-all border-none px-2.5 text-[11.5px] font-bold"
                      >
                        {opt.label}
                        <X
                          className="ml-2 size-3 cursor-pointer opacity-40 group-hover/badge:opacity-100 transition-opacity"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleValue(opt.value);
                          }}
                        />
                      </Badge>
                    ))
                  ) : (
                    <span className="text-muted-foreground/60 font-medium">
                      {config.placeholder ?? "Choisir des valeurs"}
                    </span>
                  )}
                </div>
                <ChevronDown className="size-4 shrink-0 text-muted-foreground/30 transition-transform duration-300 group-data-[state=open]:rotate-180" />
              </Button>
            </DropdownMenuTrigger>
            {canClearSelection ? (
              <button
                type="button"
                aria-label="Effacer la sélection"
                className="absolute right-8 top-1/2 z-10 inline-flex size-7 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground/50 transition-colors hover:bg-muted/60 hover:text-foreground"
                onMouseDown={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                }}
                onClick={clearSelection}
              >
                <X className="size-3.5" />
              </button>
            ) : null}
          </div>
          <DropdownMenuContent 
            className="w-80 rounded-2xl border border-border/50 bg-popover/95 backdrop-blur-xl p-2 shadow-2xl animate-in fade-in zoom-in-95 duration-200"
            align="start"
          >
            <div className="max-h-72 overflow-y-auto space-y-1 pr-1 scrollbar-thin">
              {config.options.map((option) => (
                <DropdownMenuCheckboxItem
                  key={option.value}
                  className={cn(
                    "rounded-xl px-3 py-3 transition-all duration-200 cursor-pointer",
                    "focus:bg-primary/5 focus:text-primary",
                    selectedValues.includes(option.value)
                      ? "bg-primary/5 text-primary font-bold"
                      : "text-foreground/70 hover:bg-muted/50",
                  )}
                  checked={selectedValues.includes(option.value)}
                  onCheckedChange={() => toggleValue(option.value)}
                  disabled={option.disabled}
                >
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[13px] leading-none">
                      {option.label}
                    </span>
                    {option.description ? (
                      <span className="text-[10px] text-muted-foreground/50 font-medium leading-tight mt-1">
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {config.options.map((option) => (
            <label
              key={option.value}
              className={cn(
                "group relative flex w-full cursor-pointer items-center gap-4 rounded-xl border border-border/70 bg-muted/5 px-5 py-4 transition-all duration-300 ease-out",
                "hover:border-primary/30 hover:bg-muted/8 hover:shadow-md hover:shadow-primary/1",
                value === option.value
                  ? "border-primary/40 bg-primary/3 ring-1 ring-primary/20 shadow-sm"
                  : "",
              )}
              onClick={(event) => {
                if (!config.required && value === option.value) {
                  event.preventDefault();
                  field.handleChange("");
                }
              }}
            >
              <div
                className={cn(
                  "flex size-5 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-300",
                  value === option.value
                    ? "border-primary bg-primary scale-110 shadow-lg shadow-primary/20"
                    : "border-muted-foreground/20 group-hover:border-primary/30",
                )}
              >
                {value === option.value && (
                  <div className="size-1.5 rounded-full bg-primary-foreground animate-in zoom-in-0 duration-300" />
                )}
              </div>
              <div className="flex flex-col gap-1">
                <span className={cn(
                  "text-[13.5px] font-bold transition-colors",
                  value === option.value
                    ? "text-primary"
                    : "text-foreground/70 group-hover:text-foreground/90",
                )}>
                  {option.label}
                </span>
                {option.description && (
                  <span className="text-[11px] font-medium text-muted-foreground/50 leading-tight">
                    {option.description}
                  </span>
                )}
              </div>
              <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                 {value === option.value ? (
                   <CheckCircle2 className="size-4 text-primary animate-in zoom-in-50 duration-300" />
                 ) : (
                   <CircleDot className="size-4 text-muted-foreground/10" />
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
  const canClearSelection = !config.required && Boolean(selectedValue);
  const selectedValueKey = String(selectedValue);
  const selectedOption = config.options.find(
    (option) => String(option.value) === selectedValueKey,
  );

  return (
    <FieldWrapper
      config={config}
      fieldId={field.name}
      error={error}
      dirty={dirty}
    >
      <div className="w-full relative">
        <Select
          value={selectedValue ? String(selectedValue) : undefined}
          onValueChange={(next) => field.handleChange(next)}
          disabled={config.disabled}
        >
          <SelectTrigger
            id={field.name}
            data-slot="select-trigger"
            className={cn(
              singleChoiceTriggerClassName,
              canClearSelection ? "pr-12" : "",
              "focus-visible:ring-0",
            )}
          >
            <div className="flex items-center gap-3">
               <Layers className={cn(
                 "size-4 transition-all duration-300",
                 selectedValue ? "text-primary scale-110" : "text-muted-foreground/30"
               )} />
               <span
                 className={cn(
                   "block truncate",
                   selectedOption
                     ? "text-foreground"
                     : "text-muted-foreground",
                 )}
               >
                 {selectedOption?.label ??
                   config.placeholder ??
                   "Choisir une option"}
               </span>
            </div>
          </SelectTrigger>
          <SelectContent 
            className="rounded-2xl border border-border/50 bg-popover/95 backdrop-blur-xl shadow-2xl p-2 animate-in fade-in slide-in-from-top-2 duration-300"
            align="start"
          >
            <div className="max-h-75 overflow-y-auto space-y-1 pr-1 scrollbar-thin">
              {config.options.map((option) => (
                <SelectItem
                  key={option.value}
                  value={String(option.value)}
                  disabled={option.disabled}
                  className="rounded-xl py-3 px-4 transition-all duration-200 cursor-pointer hover:bg-primary/3 focus:bg-primary/5 focus:text-primary data-[state=checked]:bg-primary/4 data-[state=checked]:font-bold"
                  onPointerUpCapture={(event) => {
                    if (
                      !config.required &&
                      selectedValueKey &&
                      selectedValueKey === String(option.value)
                    ) {
                      event.preventDefault();
                      event.stopPropagation();
                      field.handleChange("");
                    }
                  }}
                >
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[13.5px]">{option.label}</span>
                    {option.description && (
                      <span className="text-[10px] font-medium text-muted-foreground/50 mt-0.5">
                        {option.description}
                      </span>
                    )}
                  </div>
                </SelectItem>
              ))}
            </div>
          </SelectContent>
        </Select>
        {canClearSelection ? (
          <button
            type="button"
            aria-label="Effacer la sélection"
            className="absolute right-8 top-1/2 z-10 inline-flex size-7 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground/50 transition-colors hover:bg-muted/60 hover:text-foreground"
            onMouseDown={(event) => {
              event.preventDefault();
              event.stopPropagation();
            }}
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              field.handleChange("");
            }}
          >
            <X className="size-3.5" />
          </button>
        ) : null}
      </div>
    </FieldWrapper>
  );
};

export default ChoiceInput;
