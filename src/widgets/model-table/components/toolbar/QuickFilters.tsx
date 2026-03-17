import { useCallback, useEffect, useMemo, useState } from "react";
import { CirclePlus, X } from "lucide-react";
import { cn } from "@/shared/utils";
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
    <div
      className={cn(
        "group flex min-h-9 min-w-[180px] max-w-[320px] items-center overflow-hidden rounded-xl border border-border/60 bg-background/95 shadow-xs backdrop-blur-sm transition-all",
        hasMeaningfulFilterValue(localValue)
          ? "border-foreground/15 shadow-sm"
          : "hover:border-border hover:bg-background",
      )}
    >
      <div className="flex h-full shrink-0 items-center gap-2 border-r border-border/60 px-3 text-sm font-semibold text-foreground">
        <CirclePlus className="h-4 w-4 text-muted-foreground" />
        <span className="whitespace-nowrap">{field.label}</span>
      </div>
      <div className="min-w-0 flex-1 px-2 [&_.space-y-2]:space-y-0 [&_.space-y-2>div:last-child]:hidden [&_[data-slot=input]]:h-8 [&_[data-slot=input]]:border-0 [&_[data-slot=input]]:bg-transparent [&_[data-slot=input]]:px-0 [&_[data-slot=input]]:shadow-none [&_[data-slot=input]]:focus-visible:ring-0 [&_[data-slot=input]]:focus-visible:border-transparent [&_[data-slot=textarea]]:min-h-8 [&_[data-slot=textarea]]:border-0 [&_[data-slot=textarea]]:bg-transparent [&_[data-slot=textarea]]:px-0 [&_[data-slot=textarea]]:py-1 [&_[data-slot=textarea]]:shadow-none [&_[data-slot=textarea]]:focus-visible:ring-0 [&_[data-slot=textarea]]:focus-visible:border-transparent [&_[data-slot=select-trigger]]:h-8 [&_[data-slot=select-trigger]]:w-full [&_[data-slot=select-trigger]]:border-0 [&_[data-slot=select-trigger]]:bg-transparent [&_[data-slot=select-trigger]]:px-0 [&_[data-slot=select-trigger]]:shadow-none [&_[data-slot=select-trigger]]:focus-visible:ring-0 [&_[data-slot=select-trigger]]:focus-visible:border-transparent [&_[data-slot=button]]:h-8 [&_[data-slot=button]]:border-0 [&_[data-slot=button]]:bg-transparent [&_[data-slot=button]]:px-0 [&_[data-slot=button]]:shadow-none [&_[data-slot=button]]:focus-visible:ring-0 [&_[data-slot=button]]:focus-visible:border-transparent [&_[role=combobox]]:justify-start [&_[role=combobox]]:font-normal">
        {currentOperator ? (
          <ScalarFilterInput
            field={field.filterableField}
            operator={currentOperator}
            value={localValue}
            onChange={handleChange}
            ariaLabel={`${field.label} quick filter`}
            appearance="toolbar"
          />
        ) : null}
      </div>
      {hasMeaningfulFilterValue(localValue) ? (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="mr-1 shrink-0 text-muted-foreground hover:bg-muted/60 hover:text-foreground"
          onClick={handleClear}
          aria-label={`Clear ${field.label} quick filter`}
        >
          <X className="h-3.5 w-3.5" />
        </Button>
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
