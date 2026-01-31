/**
 * ActiveFiltersBar - Horizontal bar showing active filters as chips.
 */

import React, { useMemo } from "react";
import { Button } from "@/lib/components/ui/button";
import { FilterChip } from "./FilterChip";
import type { FilterFormState, UnifiedFilterSchema, FilterCondition } from "../types";

export interface ActiveFiltersBarProps {
  state: FilterFormState;
  schema: UnifiedFilterSchema;
  onRemoveCondition: (id: string) => void;
  onClearAll: () => void;
  onAddFilter: () => void;
  maxVisible?: number;
}

export const ActiveFiltersBar: React.FC<ActiveFiltersBarProps> = ({
  state,
  schema,
  onRemoveCondition,
  onClearAll,
  onAddFilter,
  maxVisible = 4,
}) => {
  const conditions = useMemo(() => flattenConditions(state.root), [state.root]);
  const visible = conditions.slice(0, maxVisible);
  const overflow = conditions.length - visible.length;

  if (conditions.length === 0) {
    return (
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={onAddFilter}>
          Add filter
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center flex-wrap gap-2">
      {visible.map((condition) => (
        <FilterChip
          key={condition.id}
          condition={condition}
          schema={schema}
          onRemove={() => onRemoveCondition(condition.id)}
          onClick={onAddFilter}
        />
      ))}

      {overflow > 0 && (
        <span className="text-xs text-muted-foreground">+{overflow} more</span>
      )}

      <Button variant="outline" size="sm" onClick={onAddFilter}>
        Add filter
      </Button>

      <Button variant="ghost" size="sm" onClick={onClearAll}>
        Clear all
      </Button>
    </div>
  );
};

function flattenConditions(group: FilterFormState["root"]): FilterCondition[] {
  const items: FilterCondition[] = [];
  group.conditions.forEach((item) => {
    if (item.type === "condition") {
      items.push(item);
    } else {
      items.push(...flattenConditions(item));
    }
  });
  return items;
}

export default ActiveFiltersBar;
