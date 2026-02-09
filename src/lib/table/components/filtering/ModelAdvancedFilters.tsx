import * as React from "react";
import type { ApolloError } from "@apollo/client";
import { Plus } from "lucide-react";
import { Button } from "@/lib/components/ui/button";
import { cn } from "@/lib/utils";
import type { ComplexFilterInput, ModelTableFiltersOptions } from "../../compat/types";
import { FilterGroupEditor } from "./FilterGroupEditor";
import { useModelAdvancedFiltering } from "./useModelAdvancedFiltering";

/**
 * Props for {@link ModelAdvancedFilters}.
 */
export type ModelAdvancedFiltersProps = {
  /** Backend Django app label hosting the model. */
  appName: string;
  /** Backend model name (PascalCase, as exposed by metadata). */
  modelName: string;
  /** Optional scoping options for metadata queries. */
  filtersOptions?: ModelTableFiltersOptions;
  /** Title displayed above the inline builder. */
  title?: string;
  /** Called whenever the active advanced filters change (apply, reset). */
  onApply?: (filters: ComplexFilterInput<string> | null) => void;

  /** When true, skips metadata fetching (renders nothing). */
  skip?: boolean;
  /** Rendered while the filter metadata is loading and no UI can be shown yet. */
  loadingFallback?: React.ReactNode;
  /** Rendered when metadata fails to load. */
  errorFallback?: React.ReactNode | ((error: ApolloError) => React.ReactNode);

  /** Optional wrapper class name. */
  className?: string;
  /** Optional header class name. */
  headerClassName?: string;
  /** Optional body class name. */
  bodyClassName?: string;
  /** Optional footer class name. */
  footerClassName?: string;

  /** When false, hides the header row (title + add buttons). */
  showHeader?: boolean;
  /** When false, hides the footer row (reset/apply buttons). */
  showFooter?: boolean;

  /** Label for the "add condition" button. */
  addConditionLabel?: string;
  /** Label for the "add group" button. */
  addGroupLabel?: string;
  /** Label for the reset button. */
  resetLabel?: string;
  /** Label for the apply button. */
  applyLabel?: string;
};

/**
 * Inline advanced filter builder for any model.
 *
 * This component renders the filter builder UI directly (no trigger, no dialog, no drawer).
 * Use {@link ModelAdvancedFiltersControl} when you want a button that opens a popup instead.
 */
export const ModelAdvancedFilters: React.FC<ModelAdvancedFiltersProps> = ({
  appName,
  modelName,
  filtersOptions,
  title = "Filtres avancÃ©s",
  onApply,
  skip = false,
  loadingFallback = null,
  errorFallback = null,
  className,
  headerClassName,
  bodyClassName,
  footerClassName,
  showHeader = true,
  showFooter = true,
  addConditionLabel = "Condition",
  addGroupLabel = "Groupe",
  resetLabel = "RÃ©initialiser",
  applyLabel = "Appliquer",
}) => {
  const { controller, loading, error } = useModelAdvancedFiltering({
    appName,
    modelName,
    filtersOptions,
    title,
    displayMode: "dialog",
    onApply,
    skip,
  });

  if (skip) return null;
  if (error) {
    if (typeof errorFallback === "function") return errorFallback(error);
    return errorFallback;
  }
  if (loading && controller.filtersMeta.length === 0) return loadingFallback;
  if (!controller.filtersMeta.length) return null;

  const builderIsEmpty =
    controller.rootGroup.conditions.length === 0 &&
    controller.rootGroup.groups.length === 0;

  return (
    <div className={cn("rounded-lg border bg-card p-4", className)}>
      {showHeader ? (
        <div
          className={cn(
            "mb-4 flex items-center justify-between gap-3",
            headerClassName,
          )}
        >
          <div className="text-lg font-semibold">{controller.title}</div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => controller.addCondition("root")}
            >
              <Plus className="mr-1 h-4 w-4" />
              {addConditionLabel}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => controller.addGroup("root")}
            >
              <Plus className="mr-1 h-4 w-4" />
              {addGroupLabel}
            </Button>
          </div>
        </div>
      ) : null}

      <div className={cn("space-y-4", bodyClassName)}>
        <FilterGroupEditor controller={controller} group={controller.rootGroup} />
      </div>

      {showFooter ? (
        <div className={cn("mt-4 flex items-center justify-end gap-2", footerClassName)}>
          <Button variant="outline" onClick={controller.resetBuilder}>
            {resetLabel}
          </Button>
          <Button onClick={controller.applyFilters} disabled={builderIsEmpty}>
            {applyLabel}
          </Button>
        </div>
      ) : null}
    </div>
  );
};


