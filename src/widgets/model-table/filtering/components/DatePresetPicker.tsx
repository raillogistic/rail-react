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
} from "@/shared/ui/kit/dropdown-menu";
import { Button } from "@/shared/ui/kit/button";
import { cn } from "@/shared/utils";
import type { DatePreset } from "../types";
import { calculateDatePreset } from "../datePresets";

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
export default DatePresetPicker;
