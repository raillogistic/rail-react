import { useCallback, useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/shared/ui/kit/button";
import { useMetadata } from "../../context/MetadataContext";
import { useTableFilters } from "../../hooks/useTableFilters";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";
import {
  findModelTableFilterCondition,
  resolveModelTableFilterField,
  type ResolvedModelTableFilterField,
} from "../filterFieldResolver";
import { ScalarFilterInput } from "@/widgets/model-table/filtering/components/ScalarFilterInput";

type QuickFiltersProps = {
  fields: string[];
};

function hasMeaningfulFilterValue(value: unknown): boolean {
  if (value === undefined || value === null) {
    return false;
  }
  if (typeof value === "string") {
    return value.trim().length > 0;
  }
  if (Array.isArray(value)) {
    return value.some((entry) => hasMeaningfulFilterValue(entry));
  }
  if (typeof value === "object") {
    return Object.values(value as Record<string, unknown>).some((entry) =>
      hasMeaningfulFilterValue(entry),
    );
  }
  return true;
}

function serializeFilterValue(value: unknown): string {
  if (value === undefined) {
    return "__undefined__";
  }
  return JSON.stringify(value);
}

function shouldDebounceFilter(field: ResolvedModelTableFilterField): boolean {
  return (
    field.filterableField.baseType === "String" &&
    !field.filterableField.choices?.length &&
    !field.filterableField.isRelation
  );
}

function QuickFilterField({ field }: { field: ResolvedModelTableFilterField }) {
  const {
    advancedFilters,
    addFilterCondition,
    removeFilterCondition,
  } = useTableFilters();
  const activeCondition = useMemo(
    () => findModelTableFilterCondition(advancedFilters.root, field.fieldPath),
    [advancedFilters.root, field.fieldPath],
  );
  const currentOperator =
    field.filterableField.operators.find(
      (operator) => operator.name === field.filterableField.defaultOperator,
    ) ?? field.filterableField.operators[0];
  const isDebounced = shouldDebounceFilter(field);
  const [localValue, setLocalValue] = useState<unknown>(activeCondition?.value);
  const debouncedValue = useDebouncedValue(localValue, 300);

  useEffect(() => {
    setLocalValue(activeCondition?.value);
  }, [activeCondition?.id, activeCondition?.operator, activeCondition?.value]);

  const commitValue = useCallback(
    (value: unknown) => {
      if (!hasMeaningfulFilterValue(value)) {
        if (activeCondition) {
          removeFilterCondition(activeCondition.id);
        }
        return;
      }

      addFilterCondition({
        field: field.filterMeta.name || field.fieldPath.join("."),
        fieldPath: field.fieldPath,
        fieldName: field.fieldName,
        operator: field.filterableField.defaultOperator,
        value,
      });
    },
    [
      activeCondition,
      addFilterCondition,
      field.fieldName,
      field.fieldPath,
      field.filterMeta.name,
      field.filterableField.defaultOperator,
      removeFilterCondition,
    ],
  );

  useEffect(() => {
    if (!isDebounced) {
      return;
    }

    if (
      serializeFilterValue(debouncedValue) ===
      serializeFilterValue(activeCondition?.value)
    ) {
      return;
    }

    commitValue(debouncedValue);
  }, [activeCondition?.value, commitValue, debouncedValue, isDebounced]);

  const handleChange = useCallback(
    (value: unknown) => {
      setLocalValue(value);
      if (!isDebounced) {
        commitValue(value);
      }
    },
    [commitValue, isDebounced],
  );

  const handleClear = useCallback(() => {
    setLocalValue(undefined);
    if (activeCondition) {
      removeFilterCondition(activeCondition.id);
    }
  }, [activeCondition, removeFilterCondition]);

  return (
    <div className="min-w-[180px] max-w-[240px] space-y-1 rounded-md bg-muted/20 p-2">
      <div className="flex items-center justify-between gap-2">
        <label className="truncate text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          {field.label}
        </label>
        {hasMeaningfulFilterValue(localValue) ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-5 w-5 text-muted-foreground hover:text-foreground"
            onClick={handleClear}
            aria-label={`Clear ${field.label} quick filter`}
          >
            <X className="h-3 w-3" />
          </Button>
        ) : null}
      </div>
      {currentOperator ? (
        <ScalarFilterInput
          field={field.filterableField}
          operator={currentOperator}
          value={localValue}
          onChange={handleChange}
          ariaLabel={`${field.label} quick filter`}
        />
      ) : null}
    </div>
  );
}

export function QuickFilters({ fields }: QuickFiltersProps) {
  const { metadata } = useMetadata();
  const resolvedFields = useMemo(
    () =>
      fields
        .map((field) => resolveModelTableFilterField(metadata, field))
        .filter(
          (field): field is ResolvedModelTableFilterField => field !== null,
        ),
    [fields, metadata],
  );

  if (resolvedFields.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-start gap-2">
      {resolvedFields.map((field) => (
        <QuickFilterField key={field.fieldPath.join(".")} field={field} />
      ))}
    </div>
  );
}
