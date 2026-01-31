import React, { useState, useCallback } from "react";
import {
  Plus,
  X,
  ChevronDown,
} from "lucide-react";

import { Button } from "@/lib/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/lib/components/ui/select";
import { cn } from "@/lib/utils";

import { FilterConditionComponent } from "./FilterCondition";
import { FieldSelector } from "./FieldSelector";
import type {
  FilterGroup as FilterGroupType,
  FilterCondition,
  UnifiedFilterSchema,
  NestedFilterConfig,
} from "../types";

export interface FilterGroupProps {
  group: FilterGroupType;
  schema: UnifiedFilterSchema;
  config: NestedFilterConfig;
  onChange: (updates: Partial<FilterGroupType>) => void;
  onRemove?: () => void;
  onAddCondition: (groupId: string, fieldPath: string[], fieldName: string, operator: string) => void;
  onAddGroup: (parentId: string, logic: "AND" | "OR") => void;
  onUpdateCondition: (id: string, updates: Partial<FilterCondition>) => void;
  onRemoveItem: (id: string) => void;
  isRoot?: boolean;
  depth?: number;
  currentPath?: string[];
}

export const FilterGroupComponent: React.FC<FilterGroupProps> = ({
  group,
  schema,
  config,
  onChange,
  onRemove,
  onAddCondition,
  onAddGroup,
  onUpdateCondition,
  onRemoveItem,
  isRoot = false,
  depth = 0,
  currentPath = [],
}) => {
  const canAddMore = group.conditions.length < config.maxFiltersPerGroup;

  const handleLogicChange = useCallback(
    (logic: "AND" | "OR") => {
      onChange({ logic });
    },
    [onChange]
  );

  const handleAddCondition = useCallback(
    (fieldPath: string[], fieldName: string, operator: string) => {
      onAddCondition(group.id, fieldPath, fieldName, operator);
    },
    [group.id, onAddCondition]
  );

  const activeConditions = group.conditions.filter(
    (item) => item.type === "condition" && item.value !== undefined && item.value !== "" && item.value !== null &&
      !(Array.isArray(item.value) && item.value.length === 0)
  );

  const hasConditions = group.conditions.length > 0;

  return (
    <div className="space-y-3">
      {!isRoot && (
        <div className="flex items-center justify-between px-2">
          <Select
            value={group.logic}
            onValueChange={(v) => handleLogicChange(v as "AND" | "OR")}
          >
            <SelectTrigger className="w-20 h-7 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="AND">AND</SelectItem>
              <SelectItem value="OR">OR</SelectItem>
            </SelectContent>
          </Select>
          {onRemove && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-destructive"
              onClick={onRemove}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      )}

      {!hasConditions ? (
        <FieldSelector
          schema={schema}
          config={config}
          currentPath={currentPath}
          onSelect={handleAddCondition}
        >
          <Button variant="outline" className="w-full h-10 border-dashed text-muted-foreground hover:text-foreground">
            <Plus className="h-4 w-4 mr-2" />
            Add filter
          </Button>
        </FieldSelector>
      ) : (
        <div className="space-y-2">
          {group.conditions.map((item, index) => (
            <React.Fragment key={item.id}>
              {item.type === "condition" ? (
                <div className="relative group">
                  <FilterConditionComponent
                    condition={item}
                    schema={schema}
                    config={config}
                    onChange={(updates) => onUpdateCondition(item.id, updates)}
                    onRemove={() => onRemoveItem(item.id)}
                    depth={depth}
                  />
                </div>
              ) : (
                <div className="border rounded-lg bg-muted/50 p-3">
                  <FilterGroupComponent
                    group={item}
                    schema={schema}
                    config={config}
                    onChange={(updates) => {
                      const updatedConditions = group.conditions.map((c) =>
                        c.id === item.id ? { ...c, ...updates } : c
                      );
                      onChange({ conditions: updatedConditions });
                    }}
                    onRemove={() => onRemoveItem(item.id)}
                    onAddCondition={onAddCondition}
                    onAddGroup={onAddGroup}
                    onUpdateCondition={onUpdateCondition}
                    onRemoveItem={onRemoveItem}
                    depth={depth + 1}
                    currentPath={currentPath}
                  />
                </div>
              )}
            </React.Fragment>
          ))}

          {canAddMore && (
            <FieldSelector
              schema={schema}
              config={config}
              currentPath={currentPath}
              onSelect={handleAddCondition}
            >
              <Button
                variant="ghost"
                size="sm"
                className="w-full h-8 text-muted-foreground hover:text-foreground hover:bg-muted"
              >
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                Add another filter
              </Button>
            </FieldSelector>
          )}
        </div>
      )}
    </div>
  );
};

export default FilterGroupComponent;
