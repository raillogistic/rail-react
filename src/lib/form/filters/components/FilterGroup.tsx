/**
 * FilterGroup - AND/OR Group with Conditions
 * 
 * Features:
 * - AND/OR logic toggle
 * - NOT negation toggle
 * - Nested groups support
 * - Add condition/group buttons
 * - Visual hierarchy with indentation
 * - Collapsible groups
 * - Drag-and-drop reordering (future)
 */

import React, { useState, useCallback } from "react";
import {
  Plus,
  Trash2,
  CirclePlus,
  ChevronDown,
  ChevronRight,
  Ban,
} from "lucide-react";

import { Button } from "@/lib/components/ui/button";
import { Badge } from "@/lib/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/lib/components/ui/select";
import { Switch } from "@/lib/components/ui/switch";
import { Label } from "@/lib/components/ui/label";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/lib/components/ui/collapsible";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/lib/components/ui/tooltip";
import { cn } from "@/lib/utils";

import { FilterConditionComponent } from "./FilterCondition";
import { FieldSelector } from "./FieldSelector";
import type {
  FilterGroup as FilterGroupType,
  FilterCondition,
  UnifiedFilterSchema,
  NestedFilterConfig,
} from "../types";
import { generateId } from "../state";

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
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  const canAddMore = group.conditions.length < config.maxFiltersPerGroup;
  const canNestDeeper = depth < config.maxDepth;
  const conditionCount = countConditions(group);

  // Handlers
  const handleLogicChange = useCallback(
    (logic: "AND" | "OR") => {
      onChange({ logic });
    },
    [onChange]
  );

  const handleNegatedChange = useCallback(
    (negated: boolean) => {
      onChange({ negated });
    },
    [onChange]
  );

  const handleAddCondition = useCallback(
    (fieldPath: string[], fieldName: string, operator: string) => {
      onAddCondition(group.id, fieldPath, fieldName, operator);
    },
    [group.id, onAddCondition]
  );

  const handleAddGroup = useCallback(() => {
    // Alternate logic for nested groups
    const newLogic = group.logic === "AND" ? "OR" : "AND";
    onAddGroup(group.id, newLogic);
  }, [group.id, group.logic, onAddGroup]);

  // Group header content
  const headerContent = (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Logic selector */}
      {config.enableLogicalOperators && group.conditions.length > 1 && (
        <Select
          value={group.logic}
          onValueChange={(v) => handleLogicChange(v as "AND" | "OR")}
        >
          <SelectTrigger className="w-20 h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="AND">
              <div className="flex flex-col">
                <span className="font-medium">ET</span>
                <span className="text-xs text-muted-foreground">Tous correspondent</span>
              </div>
            </SelectItem>
            <SelectItem value="OR">
              <div className="flex flex-col">
                <span className="font-medium">OU</span>
                <span className="text-xs text-muted-foreground">Au moins un correspond</span>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      )}

      {/* Logic label for single condition */}
      {(!config.enableLogicalOperators || group.conditions.length <= 1) && (
        <Badge variant="outline" className="h-8 px-3">
          {group.logic}
        </Badge>
      )}

      {/* NOT toggle */}
      {config.enableNot && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-2">
                <Switch
                  id={`not-${group.id}`}
                  checked={group.negated}
                  onCheckedChange={handleNegatedChange}
                  className="data-[state=checked]:bg-destructive"
                />
                <Label
                  htmlFor={`not-${group.id}`}
                  className={cn(
                    "text-xs cursor-pointer",
                    group.negated && "text-destructive font-medium"
                  )}
                >
                  {group.negated ? "NON" : "non"}
                </Label>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              {group.negated
                ? "Les résultats ne doivent PAS correspondre à ces conditions"
                : "Cliquez pour inverser ce groupe"}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}

      {/* Condition count */}
      <span className="text-xs text-muted-foreground ml-auto">
        {conditionCount} {conditionCount === 1 ? "condition" : "conditions"}
      </span>

      {/* Collapse toggle (for non-root groups) */}
      {!isRoot && group.conditions.length > 0 && (
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </Button>
      )}

      {/* Remove group button (for non-root groups) */}
      {!isRoot && onRemove && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-destructive hover:text-destructive"
                onClick={onRemove}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Supprimer ce groupe</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );

  return (
    <div
      className={cn(
        "rounded-lg border-2 transition-colors",
        isRoot ? "border-border bg-background" : "border-dashed border-muted-foreground/30 bg-muted/20",
        group.negated && "border-destructive/50 bg-destructive/5",
        depth > 0 && "ml-4"
      )}
    >
      {/* Group Header */}
      <div
        className={cn(
          "px-3 py-2 flex items-center",
          !isRoot && "border-b border-dashed border-muted-foreground/20"
        )}
      >
        {headerContent}
      </div>

      {/* Negation indicator */}
      {group.negated && (
        <div className="px-3 py-1.5 bg-destructive/10 border-b border-destructive/20 flex items-center gap-2">
          <Ban className="h-3 w-3 text-destructive" />
          <span className="text-xs text-destructive font-medium">
            Exclure les résultats correspondant à :
          </span>
        </div>
      )}

      {/* Conditions */}
      <Collapsible open={!isCollapsed}>
        <CollapsibleContent>
          <div className="p-3 space-y-2">
            {group.conditions.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <p className="text-sm mb-2">Aucun filtre ajouté</p>
                <p className="text-xs">Cliquez sur "Ajouter un filtre" pour commencer</p>
              </div>
            ) : (
              group.conditions.map((item, index) => (
                <React.Fragment key={item.id}>
                  {/* Logic separator between conditions */}
                  {index > 0 && (
                    <div className="flex items-center gap-2 py-1">
                      <div className="flex-1 h-px bg-border" />
                      <Badge
                        variant={group.negated ? "destructive" : "secondary"}
                        className="text-xs px-2"
                      >
                        {group.logic}
                      </Badge>
                      <div className="flex-1 h-px bg-border" />
                    </div>
                  )}

                  {/* Render condition or nested group */}
                  {item.type === "condition" ? (
                    <FilterConditionComponent
                      condition={item}
                      schema={schema}
                      config={config}
                      onChange={(updates) => onUpdateCondition(item.id, updates)}
                      onRemove={() => onRemoveItem(item.id)}
                      depth={depth}
                    />
                  ) : (
                    <FilterGroupComponent
                      group={item}
                      schema={schema}
                      config={config}
                      onChange={(updates) => {
                        // Update nested group
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
                  )}
                </React.Fragment>
              ))
            )}

            {/* Add buttons */}
            {canAddMore && (
              <div className="flex items-center gap-2 pt-2">
                <FieldSelector
                  schema={schema}
                  config={config}
                  currentPath={currentPath}
                  onSelect={handleAddCondition}
                >
                  <Button variant="outline" size="sm" className="gap-1.5">
                    <Plus className="h-4 w-4" />
                    Ajouter un filtre
                  </Button>
                </FieldSelector>

                {config.enableLogicalOperators && canNestDeeper && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1.5"
                          onClick={handleAddGroup}
                        >
                          <CirclePlus className="h-4 w-4" />
                          Ajouter un groupe
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        Ajouter un groupe imbriqué {group.logic === "AND" ? "OU" : "ET"}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
            )}

            {/* Max filters warning */}
            {!canAddMore && (
              <div className="text-xs text-muted-foreground text-center py-2">
                Maximum de {config.maxFiltersPerGroup} filtres atteint
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Collapsed summary */}
      {isCollapsed && !isRoot && (
        <div className="px-3 py-2 text-sm text-muted-foreground">
          {conditionCount} {conditionCount === 1 ? "condition" : "conditions"} (réduit)
        </div>
      )}
    </div>
  );
};

// Helper: Count conditions recursively
function countConditions(group: FilterGroupType): number {
  return group.conditions.reduce((acc, item) => {
    if (item.type === "condition") {
      // Only count if has a value
      const hasValue =
        item.value !== undefined &&
        item.value !== "" &&
        item.value !== null &&
        !(Array.isArray(item.value) && item.value.length === 0);
      return acc + (hasValue ? 1 : 0);
    }
    return acc + countConditions(item);
  }, 0);
}

export default FilterGroupComponent;
