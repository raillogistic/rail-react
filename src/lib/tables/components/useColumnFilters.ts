import * as React from "react";
import type { ComplexFilterInput, FilterFieldType, FilterOptionType } from "../types";
import type { ColumnFilterValue, FilterValue } from "./filtering";

/**
 * Determines whether a filter value is empty.
 * Accepts strings, arrays, ranges, or booleans and normalizes whitespace.
 */
export const isFilterValueEmpty = (value: FilterValue | undefined): boolean => {
  if (value === undefined || value === null) return true;
  if (typeof value === "string") return value.trim().length === 0;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === "object") {
    const range = value as { start?: string; end?: string };
    const hasStart = !!range.start && range.start.trim().length > 0;
    const hasEnd = !!range.end && range.end.trim().length > 0;
    return !hasStart && !hasEnd;
  }
  return false;
};

const normalizeFilterValueForOption = (
  option: FilterOptionType,
  value: FilterValue | undefined
): string | number | boolean | Array<string | number> | undefined => {
  if (value === undefined || value === null) return undefined;

  if (
    option.lookup_expr === "range" &&
    typeof value === "object" &&
    !Array.isArray(value)
  ) {
    const { start, end } = value as { start?: string; end?: string };
    const normalizedStart =
      start && start.trim().length > 0 ? start : undefined;
    const normalizedEnd = end && end.trim().length > 0 ? end : undefined;
    if (!normalizedStart && !normalizedEnd) return undefined;
    return [normalizedStart ?? "", normalizedEnd ?? ""];
  }

  if (Array.isArray(value)) {
    return value.length > 0 ? value : undefined;
  }

  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value;

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed.length) return undefined;
    if (option.filter_type === "NumberFilter") {
      const num = Number(trimmed);
      return Number.isNaN(num) ? trimmed : num;
    }
    return trimmed;
  }

  return value as
    | string
    | number
    | boolean
    | Array<string | number>
    | undefined;
};

const buildColumnFiltersPayloadFromState = (
  state: Record<string, ColumnFilterValue>,
  metaMap: Map<string, FilterFieldType>
): ComplexFilterInput<string> | null => {
  const parts: ComplexFilterInput<string>[] = [];
  Object.entries(state).forEach(([columnId, filterValue]) => {
    if (!filterValue || isFilterValueEmpty(filterValue.value)) return;
    const fieldMeta = metaMap.get(columnId);
    if (!fieldMeta) return;
    const option =
      fieldMeta.options?.find((opt) => opt.name === filterValue.optionName) ??
      fieldMeta.options?.[0];
    if (!option) return;
    const normalized = normalizeFilterValueForOption(option, filterValue.value);
    if (normalized === undefined) return;
    parts.push({ [option.name]: normalized } as ComplexFilterInput<string>);
  });
  if (parts.length === 0) return null;
  if (parts.length === 1) return parts[0];
  return { AND: parts } as ComplexFilterInput<string>;
};

/**
 * Configuration fed into {@link useColumnFilters}.
 * @property metaMap - Map of filterable columns keyed by column id.
 * @property mode - Filter UI mode ("devextreme" | "ag-grid").
 * @property debounceMs - Debounce delay for filter updates.
 */
export type UseColumnFiltersConfig = {
  metaMap: Map<string, FilterFieldType>;
  mode: "devextreme" | "ag-grid";
  debounceMs: number;
};

/**
 * Return type produced by {@link useColumnFilters}.
 * @property columnFiltersState - Immediate filter values keyed by column id.
 * @property debouncedColumnFiltersState - Debounced filter values used for payloads.
 * @property setColumnFilterValue - Setter that handles debounce and cleanup.
 * @property columnFiltersPayload - GraphQL-friendly payload built from the current filter state.
 * @property columnFiltersEnabled - Whether filters are enabled for at least one column.
 */
export type UseColumnFiltersResult = {
  columnFiltersState: Record<string, ColumnFilterValue>;
  debouncedColumnFiltersState: Record<string, ColumnFilterValue>;
  setColumnFilterValue: (
    columnId: string,
    nextValue: ColumnFilterValue | undefined,
    immediate?: boolean
  ) => void;
  columnFiltersPayload: ComplexFilterInput<string> | null;
  columnFiltersEnabled: boolean;
};

/**
 * Manages column-level filter state with optional debounce and builds the GraphQL payload
 * consumed by the backend.
 */
export function useColumnFilters({
  metaMap,
  mode,
  debounceMs,
}: UseColumnFiltersConfig): UseColumnFiltersResult {
  const columnFiltersEnabled =
    metaMap.size > 0 && (mode === "devextreme" || mode === "ag-grid");

  const [columnFiltersState, setColumnFiltersState] = React.useState<
    Record<string, ColumnFilterValue>
  >({});
  const [debouncedColumnFiltersState, setDebouncedColumnFiltersState] =
    React.useState<Record<string, ColumnFilterValue>>({});

  React.useEffect(() => {
    if (!columnFiltersEnabled) {
      if (Object.keys(columnFiltersState).length > 0) {
        setColumnFiltersState({});
        setDebouncedColumnFiltersState({});
      }
      return;
    }
    const handle = setTimeout(
      () => setDebouncedColumnFiltersState(columnFiltersState),
      debounceMs
    );
    return () => clearTimeout(handle);
  }, [columnFiltersEnabled, columnFiltersState, debounceMs]);

  const setColumnFilterValue = React.useCallback(
    (
      columnId: string,
      nextValue: ColumnFilterValue | undefined,
      immediate = false
    ) => {
      setColumnFiltersState((prev) => {
        const next = { ...prev };
        if (!nextValue) {
          delete next[columnId];
        } else {
          next[columnId] = nextValue;
        }
        if (immediate) {
          setDebouncedColumnFiltersState(next);
        }
        return next;
      });
    },
    []
  );

  const columnFiltersPayload = React.useMemo(
    () =>
      columnFiltersEnabled
        ? buildColumnFiltersPayloadFromState(
            debouncedColumnFiltersState,
            metaMap
          )
        : null,
    [columnFiltersEnabled, debouncedColumnFiltersState, metaMap]
  );

  return {
    columnFiltersState,
    debouncedColumnFiltersState,
    setColumnFilterValue,
    columnFiltersPayload,
    columnFiltersEnabled,
  };
}
