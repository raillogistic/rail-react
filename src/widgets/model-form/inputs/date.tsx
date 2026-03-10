/**
 * Date picker input using a pop-over calendar.
 *
 * Stores the selected date as an ISO `yyyy-MM-dd` string and renders a
 * localized French display label via date-fns.
 *
 * @module form/inputs/date
 */
import * as React from "react";
import { useStore } from "@tanstack/react-form";
import { Calendar, CalendarDays, Sparkle } from "lucide-react";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";

import { Button } from "@/shared/ui/kit/button";
import { Calendar as CalendarComponent } from "@/shared/ui/kit/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/shared/ui/kit/popover";
import { cn } from "@/shared/utils";
import {
  FieldWrapper,
  resolveFieldErrors,
  resolveRequiredError,
} from "./common";
import type { DateFieldConfig, FieldComponentProps } from "./types";

type Props = FieldComponentProps<DateFieldConfig, string>;

/** Human-readable display format. */
const DISPLAY_FORMAT = "PPP";
/** ISO date format for storage. */
const STORAGE_FORMAT = "yyyy-MM-dd";

/** Returns today's date in the storage format used by the input. */
export function today(): string {
  return format(new Date(), STORAGE_FORMAT);
}

/** Renders a date picker with pop-over calendar. */
const DateInput: React.FC<Props> = ({ config, field, form }) => {
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
    [field],
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
      : (config.placeholder ?? "Sélectionner une date");

  return (
    <FieldWrapper config={config} error={error} dirty={dirty}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            data-slot="input"
            className={cn(
              "h-11 w-full justify-start rounded-xl border border-input/60 bg-background px-4 text-left text-[13.5px] font-medium transition-all duration-300 ease-out",
              "hover:border-primary/30 hover:bg-muted/[0.03] hover:shadow-md hover:shadow-primary/[0.01]",
              "focus:border-primary focus:ring-4 focus:ring-primary/10",
              !parsedValue && "text-muted-foreground/60",
              parsedValue && "text-foreground font-bold border-primary/20 bg-primary/[0.01]",
              config.disabled && "cursor-not-allowed opacity-50 grayscale",
            )}
            disabled={config.disabled}
          >
            <CalendarDays
              className={cn(
                "mr-3 size-4.5 transition-all duration-300",
                parsedValue ? "text-primary scale-110" : "text-muted-foreground/30",
              )}
            />
            <span className="truncate flex-1">{buttonLabel}</span>
            {parsedValue && <Sparkle className="size-3 text-primary/30 ml-2 animate-in fade-in zoom-in" />}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-auto rounded-2xl border border-border/50 bg-popover/95 backdrop-blur-xl p-2 shadow-2xl animate-in fade-in zoom-in-95 duration-300"
          align="start"
        >
          <CalendarComponent
            mode="single"
            selected={parsedValue}
            onSelect={handleSelect}
            disabled={
              disabledRanges.length ? (disabledRanges as any) : undefined
            }
            initialFocus
            locale={fr}
            className="p-3"
          />
        </PopoverContent>
      </Popover>
    </FieldWrapper>
  );
};

/** Safely parses a date string or Date instance. */
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

/** Type-guard: checks whether a Date is valid. */
function isValidDate(value?: Date): value is Date {
  return Boolean(value && !Number.isNaN(value.getTime()));
}

export default DateInput;
