/** Accessible report filters backed by native inputs and query-based FK selectors. */

import { useEffect, useState } from "react";
import { useForm } from "@tanstack/react-form";
import { Filter, X } from "lucide-react";
import { Button } from "@/shared/ui/kit/button";
import { Input } from "@/shared/ui/kit/input";
import QueryChoiceInput from "@/widgets/model-form/inputs/query";
import type { QueryChoiceFieldConfig } from "@/widgets/model-form/inputs/types";
import type {
  ReportingFilterDefinition,
  ReportingFilterValue,
  ReportingFilterValues,
} from "./types";

export type ReportingFilterBarProps = {
  filters: ReportingFilterValues;
  onFiltersChange: (filters: ReportingFilterValues) => void;
  availableFilters?: ReportingFilterDefinition[];
};

export const ReportingFilterBar = ({
  filters,
  onFiltersChange,
  availableFilters = [],
}: ReportingFilterBarProps) => {
  const dummyForm = useForm({ defaultValues: {} });
  const [localFilters, setLocalFilters] =
    useState<ReportingFilterValues>(filters);

  useEffect(() => setLocalFilters(filters), [filters]);

  const handleClear = () => {
    setLocalFilters({});
    onFiltersChange({});
  };
  const handleChange = (name: string, value: ReportingFilterValue | "") =>
    setLocalFilters((current) => ({ ...current, [name]: value }));

  if (!availableFilters.length) return null;

  return (
    <div className="flex flex-wrap items-end gap-4 rounded-lg border bg-muted/30 p-4">
      <div className="mb-2 mr-2 flex items-center text-sm font-medium text-muted-foreground">
        <Filter className="mr-2 h-4 w-4" />
        Filtres
      </div>

      {availableFilters.map((filter) => {
        const inputId = `report-filter-${filter.name}`;
        return (
          <div key={filter.name} className="min-w-[180px] flex-1">
            <label
              htmlFor={inputId}
              className="mb-1.5 block text-xs text-muted-foreground"
            >
              {filter.label}
            </label>
            {filter.type === "query" && filter.relatedModel ? (
              <QueryChoiceInput
                config={{
                  name: filter.name,
                  type: "select-query",
                  relatedModel: filter.relatedModel,
                  multiple: false,
                  className:
                    "py-0 [&>div:first-child]:hidden [&_[data-slot=button]]:min-h-9 [&_[data-slot=button]]:h-9 [&_[data-slot=button]]:bg-background",
                  placeholder: filter.label,
                  graphql: {
                    listFieldName: filter.graphql?.listFieldName,
                    labelField: filter.graphql?.labelField,
                    extraFields: filter.graphql?.extraFields,
                  },
                } satisfies QueryChoiceFieldConfig}
                field={{
                  state: {
                    value: localFilters[filter.name] ?? null,
                    meta: {
                      isDirty: false,
                      touchedErrors: [],
                      errors: [],
                      errorMap: {},
                      isBlurred: false,
                    },
                  },
                  handleChange: (value: ReportingFilterValue | null) =>
                    handleChange(filter.name, value ?? ""),
                  getValue: () => localFilters[filter.name] ?? null,
                  setValue: (value: ReportingFilterValue | null) =>
                    handleChange(filter.name, value ?? ""),
                } as never}
                form={dummyForm as never}
              />
            ) : filter.type === "select" ? (
              <select
                id={inputId}
                value={String(localFilters[filter.name] ?? "")}
                onChange={(event) =>
                  handleChange(filter.name, event.target.value)
                }
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
              >
                <option value="">Tous</option>
                {(filter.options ?? []).map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            ) : (
              <Input
                id={inputId}
                type={filter.type}
                value={String(localFilters[filter.name] ?? "")}
                onChange={(event) =>
                  handleChange(filter.name, event.target.value)
                }
                className="bg-background"
                placeholder={filter.label}
              />
            )}
          </div>
        );
      })}

      <div className="flex gap-2">
        <Button onClick={() => onFiltersChange(localFilters)} size="sm">
          Appliquer
        </Button>
        {Object.values(localFilters).some(Boolean) ? (
          <Button
            onClick={handleClear}
            variant="ghost"
            size="sm"
            aria-label="Effacer les filtres"
          >
            <X className="h-4 w-4" />
          </Button>
        ) : null}
      </div>
    </div>
  );
};
