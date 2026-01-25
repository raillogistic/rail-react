import * as React from "react";
import type { ApolloError } from "@apollo/client";
import { useModelTableMetadata } from "../../hooks";
import type {
  ComplexFilterInput,
  FilterFieldType,
  ModelTableFiltersOptions,
  ModelTableType,
} from "../../types";
import type {
  AdvancedFilteringController,
  AdvancedFilteringDisplayMode,
} from "./types";
import { useAdvancedFiltering } from "./useAdvancedFiltering";

/**
 * Parameters for {@link useModelAdvancedFiltering}.
 */
export type UseModelAdvancedFilteringParams = {
  /** Backend Django app label hosting the model. */
  appName: string;
  /** Backend model name (PascalCase, as exposed by metadata). */
  modelName: string;
  /** Optional scoping options for metadata queries. */
  filtersOptions?: ModelTableFiltersOptions;
  /** Optional metadata used for chip rendering (defaults to `metadata.filters`). */
  chipFiltersMeta?: FilterFieldType[];
  /** Optional title displayed in the dialog/drawer header. */
  title?: string;
  /** Advanced filter builder presentation mode. */
  displayMode?: AdvancedFilteringDisplayMode;
  /**
   * Called whenever the active advanced filters change (apply, clear, remove chip).
   * Receives `null` when filters are cleared / empty.
   */
  onApply?: (filters: ComplexFilterInput<string> | null) => void;
  /** When true, skips metadata fetching (panel will render nothing). */
  skip?: boolean;
};

/**
 * Return type for {@link useModelAdvancedFiltering}.
 */
export type UseModelAdvancedFilteringResult = {
  /** Controller driving the advanced filter UI. */
  controller: AdvancedFilteringController;
  /** Latest model metadata snapshot (includes `filters`). */
  metadata: ModelTableType | null;
  /** Whether metadata is currently loading. */
  loading: boolean;
  /** Metadata fetching error, if any. */
  error: ApolloError | undefined;
  /** Forces a network refetch of model metadata. */
  refetch: () => Promise<ModelTableType | null>;
};

/**
 * Checks whether a value is meaningful for a filter payload.
 */
function hasMeaningfulValue(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === "string") return value.trim().length > 0;
  if (Array.isArray(value)) return value.some(hasMeaningfulValue);
  if (typeof value === "object") {
    return Object.values(value as Record<string, unknown>).some(hasMeaningfulValue);
  }
  return true;
}

/**
 * Checks whether a {@link ComplexFilterInput} contains at least one effective predicate.
 */
function isMeaningfulFilterPayload(
  filters: ComplexFilterInput<string> | null | undefined,
): filters is ComplexFilterInput<string> {
  if (!filters) return false;

  const andParts = filters.AND ?? [];
  if (andParts.some(isMeaningfulFilterPayload)) return true;
  const orParts = filters.OR ?? [];
  if (orParts.some(isMeaningfulFilterPayload)) return true;
  if (filters.NOT && isMeaningfulFilterPayload(filters.NOT)) return true;

  return Object.entries(filters).some(([key, value]) => {
    if (key === "AND" || key === "OR" || key === "NOT") return false;
    return hasMeaningfulValue(value);
  });
}

/**
 * Model-aware advanced filtering controller.
 *
 * This hook automatically fetches the filter metadata for `appName/modelName`
 * and wires it into {@link useAdvancedFiltering}. Consumers get a ready-to-use
 * controller without needing to plumb `filtersMeta` manually.
 */
export function useModelAdvancedFiltering({
  appName,
  modelName,
  filtersOptions,
  chipFiltersMeta,
  title,
  displayMode,
  onApply,
  skip = false,
}: UseModelAdvancedFilteringParams): UseModelAdvancedFilteringResult {
  const { metadata, loading, error, refetch } = useModelTableMetadata(
    appName,
    modelName,
    filtersOptions,
    { skip },
  );

  const filtersMeta = React.useMemo<FilterFieldType[]>(
    () => metadata?.filters ?? [],
    [metadata?.filters],
  );

  const handleApply = React.useCallback(
    (filters: ComplexFilterInput<string>) => {
      onApply?.(isMeaningfulFilterPayload(filters) ? filters : null);
    },
    [onApply],
  );

  const controller = useAdvancedFiltering({
    filtersMeta,
    chipFiltersMeta,
    onApply: handleApply,
    title,
    displayMode,
  });

  return { controller, metadata, loading, error, refetch };
}

