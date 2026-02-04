import * as React from "react";
import { useStore } from "@tanstack/react-form";
import { CalendarIcon } from "lucide-react";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";

import { Button } from "@/lib/components/ui/button";
import { Calendar } from "@/lib/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/lib/components/ui/popover";
import { cn } from "@/lib/utils";
import { FieldWrapper } from "./common";
import type { DateFieldConfig, FieldComponentProps } from "./types";

type Props = FieldComponentProps<DateFieldConfig, string>;

const DISPLAY_FORMAT = "PPP";
const STORAGE_FORMAT = "yyyy-MM-dd";

const DateInput: React.FC<Props> = ({ config, field, form }) => {
  const meta = field.state.meta;
  const dirty = meta.isDirty;
  const rawError = meta.touchedErrors?.[0] ?? meta.errors?.[0];
  const submitCount = useStore(form.store, (state) => state.submitCount);
  const isSubmitted = submitCount > 0;
  const showError = dirty || meta.isBlurred || isSubmitted || Boolean(meta.errorMap?.onSubmit);
  const error = showError ? rawError : undefined;
  const rawValue = (field.state.value as string) ?? "";
  const parsedValue = React.useMemo(() => parseDateValue(rawValue), [rawValue]);
  const [open, setOpen] = React.useState(false);

  const handleSelect = React.useCallback(
    (nextValue?: Date) => {
      if (!nextValue) {
        field.handleChange("");
        return;
      }
      const formatted = format(nextValue, STORAGE_FORMAT);
      field.handleChange(formatted);
      field.handleBlur();
      setOpen(false);
    },
    [field]
  );

  const disabledRanges = React.useMemo(() => {
    const rules: Array<{ before?: Date; after?: Date }> = [];
    const minDate = parseDateValue(config.min);
    const maxDate = parseDateValue(config.max);
    if (minDate) {
      rules.push({ before: minDate });
    }
    if (maxDate) {
      rules.push({ after: maxDate });
    }
    return rules;
  }, [config.min, config.max]);

  const buttonLabel =
    parsedValue && isValidDate(parsedValue)
      ? format(parsedValue, DISPLAY_FORMAT, { locale: fr })
      : config.placeholder ?? "Sélectionner une date";

  return (
    <FieldWrapper config={config} error={error} dirty={dirty}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            data-slot="input"
            className={cn(
              "w-full justify-start text-left font-normal",
              !parsedValue && "text-muted-foreground",
              config.disabled && "cursor-not-allowed opacity-60"
            )}
            disabled={config.disabled}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {buttonLabel}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={parsedValue}
            onSelect={handleSelect}
            disabled={disabledRanges.length ? disabledRanges : undefined}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </FieldWrapper>
  );
};

function parseDateValue(value?: string | Date | null): Date | undefined {
  if (!value) return undefined;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? undefined : value;
  }
  try {
    const parsed = parseISO(value);
    return Number.isNaN(parsed.getTime()) ? undefined : parsed;
  } catch {
    return undefined;
  }
}

function isValidDate(value?: Date): value is Date {
  return Boolean(value && !Number.isNaN(value.getTime()));
}

export default DateInput;
