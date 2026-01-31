import React, { useMemo, useCallback } from "react";
import {
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
  showDragHandle = false,
  validationError,
}) => {
  const { field, relationChain } = useMemo(() => {
    let currentSchema: UnifiedFilterSchema | undefined = schema;
    const relations: RelationFilter[] = [];
    let targetField: FilterableField | undefined;

    for (let i = 0; i < condition.fieldPath.length; i++) {
      const segment = condition.fieldPath[i];
      const isLast = i === condition.fieldPath.length - 1;

      const scalarField = currentSchema?.fields.find((f) => f.name === segment);
      if (scalarField) {
        if (isLast) {
          targetField = scalarField;
        }
        break;
      }

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

  const needsRelationOperator = useMemo(() => {
    return relationChain.some(
      (r) => r.relationType === "MANY_TO_MANY" || r.relationType === "REVERSE_FK"
    );
  }, [relationChain]);

  const selectedOperator = useMemo(() => {
    if (!field) return null;
    return field.operators.find((op) => op.name === condition.operator) ?? field.operators[0];
  }, [field, condition.operator]);

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

    return Object.fromEntries(
      Object.entries(groups).filter(([_, ops]) => ops.length > 0)
    );
  }, [field]);

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
          Unknown field: {condition.fieldPath.join(" → ")}
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
        depth > 0 && "ml-3 border-l-2 border-l-primary/20"
      )}
    >
      <div className="flex items-start gap-2 flex-wrap">
        <div className="flex items-center gap-1 flex-wrap flex-1 min-w-0">
          {condition.fieldPath.map((segment, index) => {
            const isLast = index === condition.fieldPath.length - 1;
            const relation = relationChain.find((r) => r.fieldName === segment);
             
            return (
              <React.Fragment key={index}>
                {index > 0 && (
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-1" />
                )}
                <Badge
                  variant={isLast ? "secondary" : "outline"}
                  className={cn(
                    "font-medium text-xs",
                    relation && "text-blue-600 bg-blue-50 border-blue-200"
                  )}
                >
                  {isLast ? field.fieldLabel : relation?.fieldLabel ?? segment}
                </Badge>
              </React.Fragment>
            );
          })}
        </div>

        <Select
          value={condition.operator}
          onValueChange={handleOperatorChange}
          disabled={disabled}
        >
          <SelectTrigger className="w-36 h-8 text-xs" aria-label="Operator">
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

        {needsRelationOperator && (
          <Select
            value={condition.relationOperator ?? config.defaultM2MOperator}
            onValueChange={handleRelationOperatorChange}
            disabled={disabled}
          >
            <SelectTrigger className="w-24 h-8 text-xs" aria-label="Relation Operator">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_some">some</SelectItem>
              <SelectItem value="_every">every</SelectItem>
              <SelectItem value="_none">none</SelectItem>
            </SelectContent>
          </Select>
        )}

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
          onClick={onRemove}
          disabled={disabled}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

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

      {validationError && (
        <div className="flex items-center gap-1 text-xs text-destructive">
          <AlertCircle className="h-3 w-3" />
          {validationError}
        </div>
      )}
    </div>
  );
};

export default FilterConditionComponent;
