import React from "react";
import { useStore } from "@tanstack/react-form";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { CalendarDays, Clock } from "lucide-react";
import { cn } from "@/shared/utils";
import { Button } from "@/shared/ui/kit/button";
import { Calendar as CalendarComponent } from "@/shared/ui/kit/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/shared/ui/kit/popover";
import { Input } from "@/shared/ui/kit/input";
import { FieldWrapper, resolveFieldErrors, resolveRequiredError } from "./common";
import type { DateFieldConfig, FieldComponentProps } from "./types";

type Props = FieldComponentProps<DateFieldConfig, string>;

const DateTimeInput: React.FC<Props> = ({ config, field, form }) => {
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

  // Parse the current value
  const dateValue = value ? new Date(value) : undefined;
  const isValidDate = dateValue && !isNaN(dateValue.getTime());

  const handleDateSelect = (selectedDate: Date | undefined) => {
    if (!selectedDate) {
      field.handleChange("");
      return;
    }

    // Preserve existing time or default to 00:00
    const currentTime = isValidDate
      ? { hours: dateValue.getHours(), minutes: dateValue.getMinutes() }
      : { hours: 0, minutes: 0 };

    const newDate = new Date(selectedDate);
    newDate.setHours(currentTime.hours);
    newDate.setMinutes(currentTime.minutes);
    newDate.setSeconds(0);
    newDate.setMilliseconds(0);

    // Format to YYYY-MM-DDThh:mm (local time)
    const isoString = format(newDate, "yyyy-MM-dd'T'HH:mm");
    field.handleChange(isoString);
  };

  const handleTimeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const timeStr = event.target.value;
    if (!timeStr) return;

    const [hours, minutes] = timeStr.split(":").map(Number);
    
    // Use existing date or today if not set
    const newDate = isValidDate ? new Date(dateValue) : new Date();
    newDate.setHours(hours);
    newDate.setMinutes(minutes);
    newDate.setSeconds(0);
    newDate.setMilliseconds(0);

    const isoString = format(newDate, "yyyy-MM-dd'T'HH:mm");
    field.handleChange(isoString);
  };

  return (
    <FieldWrapper config={config} error={error} dirty={dirty}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            data-slot="input"
            className={cn(
              "h-10 w-full justify-start rounded-lg border-border/60 bg-background/50 px-4 text-left font-normal transition-all",
              "hover:border-primary/50 hover:bg-background focus:border-primary/50 focus:bg-background focus:ring-4 focus:ring-primary/5",
              !value && "text-muted-foreground",
              isValidDate && "border-primary/30 font-medium text-foreground",
              config.disabled && "cursor-not-allowed opacity-60"
            )}
            disabled={config.disabled}
          >
            <CalendarDays className={cn(
              "mr-2.5 size-4 transition-colors",
              isValidDate ? "text-primary" : "text-muted-foreground/60"
            )} />
            <span className="truncate">
              {isValidDate ? (
                format(dateValue, "dd/MM/yyyy HH:mm", { locale: fr })
              ) : (
                <span>Choisir date et heure</span>
              )}
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 border-border/40 shadow-xl bg-background/95 backdrop-blur-sm" align="start">
          <CalendarComponent
            mode="single"
            selected={dateValue}
            onSelect={handleDateSelect}
            initialFocus
            locale={fr}
            className="p-3"
          />
          <div className="flex items-center gap-3 border-t border-border/40 bg-muted/20 p-4">
            <Clock className="size-4 text-primary" />
            <div className="flex-1">
              <Input
                type="time"
                className="h-9 rounded-md border-border/60 bg-background transition-all focus:border-primary/50 focus:ring-4 focus:ring-primary/5"
                value={isValidDate ? format(dateValue, "HH:mm") : ""}
                onChange={handleTimeChange}
              />
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </FieldWrapper>
  );
};

export default DateTimeInput;
