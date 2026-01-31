/**
 * FilterCondition - Single filter condition display
 * 
 * Features:
 * - Field path breadcrumb display
 * - Operator selector with descriptions
 * - Type-specific value input
 * - Relation operator for M2M fields
 * - Drag handle for reordering
 * - Remove button
 * - Validation state display
 */

import React, { useMemo, useCallback } from "react";
import {
  GripVertical,
  X,
  ChevronRight,
  AlertCircle,
} from "lucide-react";

import { Button } from "@/lib/components/ui/button";
import { Badge } from "@/lib/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/lib/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/lib/components/ui/tooltip";
import { cn } from "@/lib/utils";

import { ScalarFilterInput } from "./ScalarFilterInput";
import type {
  FilterCondition as FilterConditionType,
  UnifiedFilterSchema,
  FilterableField,
  RelationFilter,
  NestedFilterConfig,
} from "../types";

export interface FilterConditionProps {
  condition: FilterConditionType;
  schema: UnifiedFilterSchema;
  config: NestedFilterConfig;
  onChange: (updates: Partial<FilterConditionType>) => void;
  onRemove: () => void;
  disabled?: boolean;
  depth?: number;
  showDragHandle?: boolean;
  validationError?: string;
}

export const FilterConditionComponent: React.FC<FilterConditionProps> = ({
  condition,
  schema,
  config,
  onChange,
  onRemove,
  disabled,
  depth = 0,
  showDragHandle = true,
  validationError,
}) => {
  // Resolve field from path
  const { field, relationChain } = useMemo(() => {
    let currentSchema: UnifiedFilterSchema | undefined = schema;
    const relations: RelationFilter[] = [];
    let targetField: FilterableField | undefined;

    for (let i = 0; i < condition.fieldPath.length; i++) {
      const segment = condition.fieldPath[i];
      const isLast = i === condition.fieldPath.length - 1;

      // Check scalar field
      const scalarField = currentSchema?.fields.find((f) => f.name === segment);
      if (scalarField) {
        if (isLast) {
          targetField = scalarField;
        }
        break;
      }

      // Check relation field
      const relation = currentSchema?.relationFilters.find((r) => r.name === segment);
      if (relation) {
        relations.push(relation);
        if (relation.nestedSchema) {
          currentSchema = relation.nestedSchema;
        }
      }
    }

    return { field: targetField, relationChain: relations };
  }, [schema, condition.fieldPath]);

  // Check if we need relation operator selector
  const needsRelationOperator = useMemo(() => {
    return relationChain.some(
      (r) => r.relationType === "MANY_TO_MANY" || r.relationType === "REVERSE_FK"
    );
  }, [relationChain]);

  // Get selected operator
  const selectedOperator = useMemo(() => {
    if (!field) return null;
    return field.operators.find((op) => op.name === condition.operator) ?? field.operators[0];
  }, [field, condition.operator]);

  // Group operators by category
  const groupedOperators = useMemo(() => {
    if (!field) return {};
    
    const groups: Record<string, typeof field.operators> = {
      "Equality": [],
      "Comparison": [],
      "Text Search": [],
      "List": [],
      "Date": [],
      "Other": [],
    };

    field.operators.forEach((op) => {
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

    // Remove empty groups
    return Object.fromEntries(
      Object.entries(groups).filter(([_, ops]) => ops.length > 0)
    );
  }, [field]);

  // Handlers
  const handleOperatorChange = useCallback(
    (newOperator: string) => {
      onChange({ operator: newOperator, value: undefined });
    },
    [onChange]
  );

  const handleValueChange = useCallback(
    (newValue: any) => {
      onChange({ value: newValue });
    },
    [onChange]
  );

  const handleRelationOperatorChange = useCallback(
    (relOp: string) => {
      onChange({ relationOperator: relOp });
    },
    [onChange]
  );

  if (!field || !selectedOperator) {
    return (
      <div className="flex items-center gap-2 p-3 rounded-lg border border-destructive/50 bg-destructive/5">
        <AlertCircle className="h-4 w-4 text-destructive" />
        <span className="text-sm text-destructive">
          Champ inconnu : {condition.fieldPath.join(" → ")}
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 ml-auto"
          onClick={onRemove}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex flex-col gap-2 p-3 rounded-lg border bg-card transition-colors",
        validationError && "border-destructive/50 bg-destructive/5",
        depth > 0 && "ml-4 border-l-2 border-l-primary/30"
      )}
    >
      {/* Header: Field path and actions */}
      <div className="flex items-center gap-2">
        {showDragHandle && (
          <GripVertical
            className="h-4 w-4 text-muted-foreground cursor-grab shrink-0"
            aria-label="Drag handle"
            role="button"
            tabIndex={0}
          />
        )}

        {/* Field path breadcrumb */}
        <div className="flex items-center gap-1 flex-wrap flex-1 min-w-0">
          {condition.fieldPath.map((segment, index) => {
            const isLast = index === condition.fieldPath.length - 1;
            const relation = relationChain.find((r) => r.fieldName === segment);
            
            return (
              <React.Fragment key={index}>
                {index > 0 && (
                  <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" />
                )}
                <Badge
                  variant={isLast ? "default" : "outline"}
                  className={cn(
                    "font-normal",
                    relation && "bg-blue-50 text-blue-700 border-blue-200"
                  )}
                >
                  {isLast ? field.fieldLabel : relation?.fieldLabel ?? segment}
                </Badge>
              </React.Fragment>
            );
          })}
        </div>

        {/* Relation operator (for M2M) */}
        {needsRelationOperator && (
          <Select
            value={condition.relationOperator ?? config.defaultM2MOperator}
            onValueChange={handleRelationOperatorChange}
            disabled={disabled}
          >
            <SelectTrigger className="w-28 h-7 text-xs" aria-label="Relation Operator">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_some">en a certains</SelectItem>
              <SelectItem value="_every">a tout</SelectItem>
              <SelectItem value="_none">n'a aucun</SelectItem>
            </SelectContent>
          </Select>
        )}

        {/* Remove button */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0"
                onClick={onRemove}
                disabled={disabled}
              >
                <X className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Supprimer le filtre</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Operator and Value Row */}
      <div className="flex items-start gap-2">
        {/* Operator selector */}
        <Select
          value={condition.operator}
          onValueChange={handleOperatorChange}
          disabled={disabled}
        >
          <SelectTrigger className="w-48 shrink-0" aria-label="Operator">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(groupedOperators).map(([group, operators]) => (
              <SelectGroup key={group}>
                <SelectLabel className="text-xs">{group}</SelectLabel>
                {operators.map((op) => (
                  <SelectItem key={op.name} value={op.name}>
                    <div className="flex flex-col">
                      <span>{op.label}</span>
                      {op.helpText && (
                        <span className="text-xs text-muted-foreground">
                          {op.helpText}
                        </span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectGroup>
            ))}
          </SelectContent>
        </Select>

        {/* Value input */}
        <div className="flex-1 min-w-0">
          <ScalarFilterInput
            field={field}
            operator={selectedOperator}
            value={condition.value}
            onChange={handleValueChange}
            disabled={disabled}
            ariaLabel="Value"
          />
        </div>
      </div>

      {/* Validation error */}
      {validationError && (
        <div className="flex items-center gap-1 text-xs text-destructive">
          <AlertCircle className="h-3 w-3" />
          {validationError}
        </div>
      )}

      {/* Help text */}
      {selectedOperator.helpText && !validationError && (
        <div className="text-xs text-muted-foreground pl-1">
          💡 {selectedOperator.helpText}
        </div>
      )}
    </div>
  );
};

export default FilterConditionComponent;
