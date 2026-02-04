import React from "react";
import { useStore } from "@tanstack/react-form";
import { format, parseISO } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/lib/components/ui/button";
import { Calendar } from "@/lib/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/lib/components/ui/popover";
import { Input } from "@/lib/components/ui/input";
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
            variant={"outline"}
            data-slot="input"
            className={cn(
              "w-full justify-start text-left font-normal",
              !value && "text-muted-foreground"
            )}
            disabled={config.disabled}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {isValidDate ? (
              format(dateValue, "yyyy-MM-dd HH:mm")
            ) : (
              <span>Pick a date and time</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={dateValue}
            onSelect={handleDateSelect}
            initialFocus
            className="p-2"
          />
          <div className="p-2 border-t border-border">
            <Input
              type="time"
              className="w-full"
              value={isValidDate ? format(dateValue, "HH:mm") : ""}
              onChange={handleTimeChange}
            />
          </div>
        </PopoverContent>
      </Popover>
    </FieldWrapper>
  );
};

export default DateTimeInput;
