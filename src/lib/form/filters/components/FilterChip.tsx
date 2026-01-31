/**
 * FilterChip - Compact display of active filter.
 */

import React, { useMemo } from "react";
import { X } from "lucide-react";
import { Button } from "@/lib/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/lib/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { FilterCondition, UnifiedFilterSchema } from "../types";

export interface FilterChipProps {
  condition: FilterCondition;
  schema: UnifiedFilterSchema;
  onRemove: () => void;
  onClick: () => void;
}

export const FilterChip: React.FC<FilterChipProps> = ({
  condition,
  schema,
  onRemove,
  onClick,
}) => {
  const label = useMemo(() => {
    const field = schema.fields.find((f) => f.name === condition.fieldName || f.fieldName === condition.fieldName);
    const fieldLabel = field?.fieldLabel ?? condition.fieldName;
    const operator = OPERATOR_LABELS[condition.operator]?.symbol ?? condition.operator;
    const value = formatValue(condition.value);
    return `${fieldLabel} ${operator} ${value}`;
  }, [condition, schema.fields]);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={onClick}
            className={cn(
              "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs bg-muted/30 hover:bg-muted transition animate-in fade-in-0"
            )}
          >
            <span className="truncate max-w-[140px]">{label}</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-4 w-4"
              onClick={(event) => {
                event.stopPropagation();
                onRemove();
              }}
            >
              <X className="h-3 w-3" />
            </Button>
          </button>
        </TooltipTrigger>
        <TooltipContent>{label}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

function formatValue(value: any): string {
  if (Array.isArray(value)) {
    return value.join(", ");
  }
  if (value === null || value === undefined || value === "") {
    return "—";
  }
  return String(value);
}

const OPERATOR_LABELS: Record<string, { symbol: string; label: string }> = {
  eq: { symbol: "=", label: "Equals" },
  neq: { symbol: "!=", label: "Not equals" },
  gt: { symbol: ">", label: "Greater than" },
  gte: { symbol: ">=", label: "Greater or equal" },
  lt: { symbol: "<", label: "Less than" },
  lte: { symbol: "<=", label: "Less or equal" },
  contains: { symbol: "contains", label: "Contains" },
  icontains: { symbol: "contains", label: "Contains" },
  startsWith: { symbol: "starts", label: "Starts with" },
  endsWith: { symbol: "ends", label: "Ends with" },
  in: { symbol: "in", label: "Is one of" },
  notIn: { symbol: "not in", label: "Is not one of" },
  between: { symbol: "between", label: "Between" },
  isNull: { symbol: "is null", label: "Is empty" },
  regex: { symbol: ".*", label: "Matches pattern" },
};

export default FilterChip;
