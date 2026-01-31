/**
 * CompactOperatorSelect - Operator dropdown with grouped categories.
 */

import React, { useMemo } from "react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/lib/components/ui/select";
import type { FilterableField } from "../types";

export interface CompactOperatorSelectProps {
  field: FilterableField;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export const CompactOperatorSelect: React.FC<CompactOperatorSelectProps> = ({
  field,
  value,
  onChange,
  disabled,
}) => {
  const groupedOperators = useMemo(() => {
    const groups: Record<string, typeof field.operators> = {
      "Equality": [],
      "Comparison": [],
      "Text Search": [],
      "List": [],
      "Date": [],
      "Other": [],
    };

    const operators = applyPreferredOperatorOrdering(field);

    operators.forEach((op) => {
      if (["eq", "neq"].includes(op.name)) {
        groups["Equality"].push(op);
      } else if (["gt", "gte", "lt", "lte", "between"].includes(op.name)) {
        groups["Comparison"].push(op);
      } else if (["contains", "icontains", "startsWith", "endsWith", "regex", "iregex"].includes(op.name)) {
        groups["Text Search"].push(op);
      } else if (["in", "notIn"].includes(op.name)) {
        groups["List"].push(op);
      } else if (["year", "month", "day", "weekDay", "hour"].includes(op.name)) {
        groups["Date"].push(op);
      } else {
        groups["Other"].push(op);
      }
    });

    return Object.fromEntries(
      Object.entries(groups).filter(([_, ops]) => ops.length > 0)
    );
  }, [field]);

  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger className="h-8 w-32 text-xs" aria-label="Operator">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {Object.entries(groupedOperators).map(([group, operators]) => (
          <SelectGroup key={group}>
            <SelectLabel className="text-xs">{group}</SelectLabel>
            {operators.map((op) => (
              <SelectItem key={op.name} value={op.name} className="text-xs">
                {op.label}
              </SelectItem>
            ))}
          </SelectGroup>
        ))}
      </SelectContent>
    </Select>
  );
};

function applyPreferredOperatorOrdering(field: FilterableField) {
  if (!field.preferredOperators || field.preferredOperators.length === 0) {
    return field.operators;
  }
  const order = field.preferredOperators;
  const byName = new Map(field.operators.map((op) => [op.name, op]));
  const ordered = order.map((name) => byName.get(name)).filter(Boolean) as typeof field.operators;
  const remaining = field.operators.filter((op) => !order.includes(op.name));
  return [...ordered, ...remaining];
}

export default CompactOperatorSelect;
