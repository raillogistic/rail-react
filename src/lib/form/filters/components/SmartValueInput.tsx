/**
 * SmartValueInput - Wrapper around ScalarFilterInput with date presets.
 */

import React, { useMemo } from "react";
import { ScalarFilterInput } from "./ScalarFilterInput";
import { DatePresetPicker } from "./DatePresetPicker";
import type { FilterableField, FilterOperator } from "../types";
import { cn } from "@/lib/utils";

export interface SmartValueInputProps {
  field: FilterableField;
  operator: FilterOperator;
  value: any;
  onChange: (value: any) => void;
  disabled?: boolean;
  autoFocus?: boolean;
  className?: string;
}

export const SmartValueInput: React.FC<SmartValueInputProps> = ({
  field,
  operator,
  value,
  onChange,
  disabled,
  autoFocus,
  className,
}) => {
  const presets = useMemo(() => field.uiHints.datePresets ?? [], [field.uiHints.datePresets]);
  const showPresets = presets.length > 0 && (field.baseType === "Date" || field.baseType === "DateTime");

  return (
    <div className={cn("flex items-start gap-2", className)}>
      <div className="flex-1 min-w-0">
        <ScalarFilterInput
          field={field}
          operator={operator}
          value={value}
          onChange={onChange}
          disabled={disabled}
          autoFocus={autoFocus}
          ariaLabel="Valeur"
        />
      </div>
      {showPresets && (
        <DatePresetPicker
          presets={presets}
          onSelect={(range) => {
            if (operator.name === "between") {
              onChange(range);
            } else {
              onChange(range[0]);
            }
          }}
          disabled={disabled}
        />
      )}
    </div>
  );
};

export default SmartValueInput;
