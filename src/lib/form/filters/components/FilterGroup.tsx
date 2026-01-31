import React, { useState, useCallback } from "react";
import {
  Plus,
  X,
  ChevronDown,
  Layers,
} from "lucide-react";

import { Button } from "@/lib/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/lib/components/ui/toggle-group";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/lib/components/ui/collapsible";
import { Switch } from "@/lib/components/ui/switch";
import { cn } from "@/lib/utils";

import { InlineFieldSelector } from "./InlineFieldSelector";
import { FilterRow } from "./FilterRow";
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
  recentFields?: string[][];
  favoriteFields?: string[][];
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
  recentFields,
  favoriteFields,
}) => {
  const [collapsed, setCollapsed] = useState(false);
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

  const hasConditions = group.conditions.length > 0;

  const canAddGroup = depth < config.maxDepth;

  return (
    <Collapsible open={!collapsed} onOpenChange={(open) => setCollapsed(!open)}>
      <div
        className={cn("space-y-3", depth > 0 && "border rounded-lg bg-muted/30 p-3")}
        data-testid="filter-group"
      >
        <div className="flex items-center gap-2">
          <span className="text-xs uppercase tracking-wide text-muted-foreground">
            Match {group.logic === "AND" ? "ALL" : "ANY"}
          </span>
          <ToggleGroup
            type="single"
            size="sm"
            value={group.logic}
            onValueChange={(value) => value && handleLogicChange(value as "AND" | "OR")}
            aria-label="Group logic"
          >
            <ToggleGroupItem value="AND" aria-label="Match all">
              ALL
            </ToggleGroupItem>
            <ToggleGroupItem value="OR" aria-label="Match any">
              ANY
            </ToggleGroupItem>
          </ToggleGroup>

        <div className="ml-auto flex items-center gap-1">
          {config.enableNot && (
            <div className="flex items-center gap-2 mr-2">
              <span className="text-xs text-muted-foreground">NOT</span>
              <Switch
                checked={group.negated}
                onCheckedChange={(checked) => onChange({ negated: checked })}
                aria-label="Toggle NOT"
              />
            </div>
          )}
          {!isRoot && (
            <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-destructive"
                onClick={onRemove}
                aria-label="Remove group"
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            )}
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground"
                aria-label="Toggle group"
              >
                <ChevronDown className={cn("h-4 w-4 transition-transform", collapsed && "-rotate-90")} />
              </Button>
            </CollapsibleTrigger>
          </div>
        </div>

        <CollapsibleContent className="space-y-2">
          {!hasConditions ? (
            <InlineFieldSelector
              schema={schema}
              config={config}
              currentPath={currentPath}
              onSelect={handleAddCondition}
              trigger={
                <Button
                  variant="outline"
                  className="w-full h-10 border-dashed text-muted-foreground hover:text-foreground"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add filter
                </Button>
              }
              recentFields={recentFields}
              favoriteFields={favoriteFields}
            />
          ) : (
            <div className="space-y-2">
              {group.conditions.map((item) => (
                <React.Fragment key={item.id}>
                  {item.type === "condition" ? (
                    <FilterRow
                      condition={item}
                      schema={schema}
                      config={config}
                      onChange={(updates) => onUpdateCondition(item.id, updates)}
                      onRemove={() => onRemoveItem(item.id)}
                      onFieldChange={(fieldPath, fieldName, operator) =>
                        onUpdateCondition(item.id, {
                          fieldPath,
                          fieldName,
                          operator,
                          value: undefined,
                        })
                      }
                      recentFields={recentFields}
                      favoriteFields={favoriteFields}
                    />
                  ) : (
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
                      recentFields={recentFields}
                      favoriteFields={favoriteFields}
                    />
                  )}
                </React.Fragment>
              ))}

              <div className="flex items-center gap-2">
                {canAddMore && (
                  <InlineFieldSelector
                    schema={schema}
                    config={config}
                    currentPath={currentPath}
                    onSelect={handleAddCondition}
                    trigger={
                      <Button
                        variant="ghost"
                        size="sm"
                        className="flex-1 h-8 text-muted-foreground hover:text-foreground hover:bg-muted"
                      >
                        <Plus className="h-3.5 w-3.5 mr-1.5" />
                        Add {group.logic === "OR" ? "OR" : ""} filter
                      </Button>
                    }
                    recentFields={recentFields}
                    favoriteFields={favoriteFields}
                  />
                )}

                <Button
                  variant="outline"
                  size="sm"
                  className="h-8"
                  onClick={() => onAddGroup(group.id, "OR")}
                  disabled={!canAddGroup}
                >
                  <Layers className="h-3.5 w-3.5 mr-1.5" />
                  Add group
                </Button>
              </div>
            </div>
          )}
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
};

export default FilterGroupComponent;
