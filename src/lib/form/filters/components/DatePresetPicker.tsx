/**
 * DatePresetPicker - Quick date range selector.
 */

import React, { useMemo } from "react";
import {
  Calendar,
  ChevronDown,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/lib/components/ui/dropdown-menu";
import { Button } from "@/lib/components/ui/button";
import { cn } from "@/lib/utils";
import type { DatePreset } from "../types";
import {
  endOfMonth,
  endOfQuarter,
  endOfWeek,
  endOfYear,
  format,
  startOfDay,
  startOfMonth,
  startOfQuarter,
  startOfWeek,
  startOfYear,
  subDays,
  subMonths,
  subWeeks,
} from "date-fns";

export interface DatePresetPickerProps {
  presets: DatePreset[];
  onSelect: (value: [string, string?], preset: DatePreset) => void;
  disabled?: boolean;
  className?: string;
}

export const DatePresetPicker: React.FC<DatePresetPickerProps> = ({
  presets,
  onSelect,
  disabled,
  className,
}) => {
  const resolvedPresets = useMemo(() => {
    return presets.map((preset) => ({
      ...preset,
      value: preset.getValue ? preset.getValue() : calculateDatePreset(preset.key),
    }));
  }, [presets]);

  if (!presets.length) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn("h-8 gap-1.5 text-xs", className)}
          disabled={disabled}
        >
          <Calendar className="h-3.5 w-3.5" />
          Raccourcis
          <ChevronDown className="h-3 w-3 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {resolvedPresets.map((preset) => (
          <DropdownMenuItem
            key={preset.key}
            onClick={() => onSelect(preset.value, preset)}
          >
            {preset.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export function calculateDatePreset(key: string): [string, string?] {
  const now = new Date();
  const today = startOfDay(now);

  switch (key) {
    case "today":
      return [format(today, "yyyy-MM-dd")];
    case "yesterday":
      return [format(subDays(today, 1), "yyyy-MM-dd")];
    case "thisWeek":
      return [
        format(startOfWeek(today), "yyyy-MM-dd"),
        format(endOfWeek(today), "yyyy-MM-dd"),
      ];
    case "lastWeek": {
      const lastWeek = subWeeks(today, 1);
      return [
        format(startOfWeek(lastWeek), "yyyy-MM-dd"),
        format(endOfWeek(lastWeek), "yyyy-MM-dd"),
      ];
    }
    case "thisMonth":
      return [
        format(startOfMonth(today), "yyyy-MM-dd"),
        format(endOfMonth(today), "yyyy-MM-dd"),
      ];
    case "lastMonth": {
      const lastMonth = subMonths(today, 1);
      return [
        format(startOfMonth(lastMonth), "yyyy-MM-dd"),
        format(endOfMonth(lastMonth), "yyyy-MM-dd"),
      ];
    }
    case "thisQuarter":
      return [
        format(startOfQuarter(today), "yyyy-MM-dd"),
        format(endOfQuarter(today), "yyyy-MM-dd"),
      ];
    case "thisYear":
      return [
        format(startOfYear(today), "yyyy-MM-dd"),
        format(endOfYear(today), "yyyy-MM-dd"),
      ];
    case "last30Days":
      return [
        format(subDays(today, 30), "yyyy-MM-dd"),
        format(today, "yyyy-MM-dd"),
      ];
    case "last90Days":
      return [
        format(subDays(today, 90), "yyyy-MM-dd"),
        format(today, "yyyy-MM-dd"),
      ];
    default:
      return [format(today, "yyyy-MM-dd")];
  }
}

export default DatePresetPicker;
