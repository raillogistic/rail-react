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
import { FieldWrapper } from "./common";
import type {
  ChoiceFieldConfig,
  FieldComponentProps,
  ChoiceOption,
} from "./types";

type Props = FieldComponentProps<ChoiceFieldConfig>;

const ChoiceInput: React.FC<Props> = ({ config, field, form }) => {
  const meta = field.state.meta;
  const dirty = meta.isDirty;
  const rawError = meta.touchedErrors?.[0] ?? meta.errors?.[0];
  const submitCount = useStore(form.store, (state) => state.submitCount);
  const isSubmitted = submitCount > 0;
  const showError = dirty || meta.isBlurred || isSubmitted || Boolean(meta.errorMap?.onSubmit);
  const error = showError ? rawError : undefined;

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

    return (
      <FieldWrapper config={config} error={error} dirty={dirty}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="w-full justify-between">
              <span className="truncate text-left">
                {selectedValues.length > 0
                  ? `${selectedValues.length} sélectionné${
                      selectedValues.length > 1 ? "s" : ""
                    }`
                  : config.placeholder ?? "Choisir des valeurs"}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-64 p-2">
            {config.options.map((option) => (
              <DropdownMenuCheckboxItem
                key={option.value}
                className="rounded-md px-2 py-2"
                checked={selectedValues.includes(option.value)}
                onCheckedChange={() => toggleValue(option.value)}
                disabled={option.disabled}
              >
                <div className="flex flex-col text-left">
                  <span className="text-sm font-medium">{option.label}</span>
                  {option.description ? (
                    <span className="text-xs text-muted-foreground">
                      {option.description}
                    </span>
                  ) : null}
                </div>
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </FieldWrapper>
    );
  }

  if (config.type === "radio") {
    const value = field.state.value ?? "";
    return (
      <FieldWrapper config={config} error={error} dirty={dirty}>
        <div className="space-y-2">
          {config.options.map((option) => (
            <label
              key={option.value}
              className="flex cursor-pointer items-center gap-2 text-sm"
            >
              <input
                type="radio"
                className="accent-primary"
                checked={value === option.value}
                onChange={() => field.handleChange(option.value)}
                disabled={option.disabled}
              />
              <span>{option.label}</span>
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
    <FieldWrapper config={config} error={error} dirty={dirty}>
      <Select
        value={selectedValue as string}
        onValueChange={(next) => field.handleChange(next)}
        disabled={config.disabled}
      >
        <SelectTrigger className="w-full">
          <SelectValue
            placeholder={config.placeholder ?? "Choisir une option"}
          />
        </SelectTrigger>
        <SelectContent>
          {config.options.map((option) => (
            <SelectItem
              key={option.value}
              value={String(option.value)}
              disabled={option.disabled}
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </FieldWrapper>
  );
};

export default ChoiceInput;
