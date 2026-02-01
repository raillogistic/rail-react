/**
 * FilterRow - Inline filter row with field, operator, and value.
 */

import React, { useMemo } from "react";
import { X, AlertCircle } from "lucide-react";
import { Button } from "@/lib/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/lib/components/ui/select";
import { cn } from "@/lib/utils";
import type {
  FilterCondition,
  FilterableField,
  RelationFilter,
  NestedFilterConfig,
  UnifiedFilterSchema,
  FieldSelectorOptions,
} from "../types";
import { InlineFieldSelector } from "./InlineFieldSelector";
import { CompactOperatorSelect } from "./CompactOperatorSelect";
import { SmartValueInput } from "./SmartValueInput";

export interface FilterRowProps {
  condition: FilterCondition;
  schema: UnifiedFilterSchema;
  config: NestedFilterConfig;
  onChange: (updates: Partial<FilterCondition>) => void;
  onRemove: () => void;
  onFieldChange: (fieldPath: string[], fieldName: string, operator: string) => void;
  autoFocus?: boolean;
  isNew?: boolean;
  disabled?: boolean;
  validationError?: string;
  recentFields?: string[][];
  favoriteFields?: string[][];
  fieldSelector?: FieldSelectorOptions;
  onLoadRelationSchema?: (
    relation: RelationFilter
  ) => Promise<UnifiedFilterSchema | null>;
  getRelationSchema?: (relation: RelationFilter) => UnifiedFilterSchema | null;
}

export const FilterRow: React.FC<FilterRowProps> = ({
  condition,
  schema,
  config,
  onChange,
  onRemove,
  onFieldChange,
  autoFocus,
  isNew,
  disabled,
  validationError,
  recentFields,
  favoriteFields,
  fieldSelector,
  onLoadRelationSchema,
  getRelationSchema,
}) => {
  const { field, relationChain } = useMemo(() => {
    let currentSchema: UnifiedFilterSchema | undefined = schema;
    const relations: RelationFilter[] = [];
    let targetField: FilterableField | undefined;

    for (let i = 0; i < condition.fieldPath.length; i++) {
      const segment = condition.fieldPath[i];
      const isLast = i === condition.fieldPath.length - 1;

      const scalarField = currentSchema?.fields.find((f) => f.name === segment);
      if (scalarField && (!scalarField.isRelation || isLast)) {
        if (isLast) {
          targetField = scalarField;
        }
        break;
      }

      const relation = currentSchema?.relationFilters.find(
        (r) => r.name === segment || r.fieldName === segment,
      );
      if (relation) {
        relations.push(relation);
        const nestedSchema =
          relation.nestedSchema ?? getRelationSchema?.(relation);
        if (nestedSchema) {
          currentSchema = nestedSchema;
        }
      }
    }

    return { field: targetField, relationChain: relations };
  }, [schema, condition.fieldPath, getRelationSchema]);

  const needsRelationOperator = useMemo(() => {
    return relationChain.some(
      (r) => r.relationType === "MANY_TO_MANY" || r.relationType === "REVERSE_FK"
    );
  }, [relationChain]);

  const selectedOperator = useMemo(() => {
    if (!field) return null;
    return field.operators.find((op) => op.name === condition.operator) ?? field.operators[0];
  }, [field, condition.operator]);

  if (!field || !selectedOperator) {
    return (
      <div className="flex items-center gap-2 p-3 rounded-lg border border-destructive/50 bg-destructive/5">
        <AlertCircle className="h-4 w-4 text-destructive" />
        <span className="text-sm text-destructive">
          Unknown field: {condition.fieldPath.join(" -> ")}
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 ml-auto"
          onClick={onRemove}
          disabled={disabled}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "group flex flex-wrap items-center gap-2 rounded-lg border bg-card px-3 py-2 transition-colors",
        validationError && "border-destructive/50 bg-destructive/5",
        isNew && "animate-in fade-in-0 slide-in-from-top-1 duration-200"
      )}
    >
      <InlineFieldSelector
        schema={schema}
        config={config}
        currentPath={condition.fieldPath}
        onSelect={(fieldPath, fieldName, operator) => {
          onFieldChange(fieldPath, fieldName, operator);
        }}
        onLoadRelationSchema={onLoadRelationSchema}
        getRelationSchema={getRelationSchema}
        fieldSelector={fieldSelector}
        trigger={
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs gap-1.5"
            disabled={disabled}
          >
            {condition.fieldPath.length === 0 ? "Select field..." : field.fieldLabel}
          </Button>
        }
        recentFields={recentFields}
        favoriteFields={favoriteFields}
      />

      {needsRelationOperator && (
        <Select
          value={condition.relationOperator ?? config.defaultM2MOperator}
          onValueChange={(value) => onChange({ relationOperator: value })}
          disabled={disabled}
        >
          <SelectTrigger className="h-8 w-24 text-xs" aria-label="Relation operator">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_some">some</SelectItem>
            <SelectItem value="_every">every</SelectItem>
            <SelectItem value="_none">none</SelectItem>
          </SelectContent>
        </Select>
      )}

      <CompactOperatorSelect
        field={field}
        value={condition.operator}
        onChange={(newOperator) => onChange({ operator: newOperator, value: undefined })}
        disabled={disabled}
      />

      <SmartValueInput
        field={field}
        operator={selectedOperator}
        value={condition.value}
        onChange={(newValue) => onChange({ value: newValue })}
        disabled={disabled}
        autoFocus={autoFocus || isNew}
        className="flex-1 min-w-[180px] items-center"
      />

      <Button
        variant="ghost"
        size="icon"
        className="ml-auto h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={onRemove}
        disabled={disabled}
        aria-label="Remove filter"
      >
        <X className="h-4 w-4" />
      </Button>

      {validationError && (
        <div className="flex w-full items-center gap-1 text-xs text-destructive">
          <AlertCircle className="h-3 w-3" />
          {validationError}
        </div>
      )}
    </div>
  );
};

export default FilterRow;
