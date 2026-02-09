import * as React from "react";
import type { ApolloError } from "@apollo/client";
import { Filter } from "lucide-react";
import { Button } from "@/lib/components/ui/button";
import { cn } from "@/lib/utils";
import type {
  ComplexFilterInput,
  ModelTableFiltersOptions,
} from "../../compat/types";
import type { AdvancedFilteringDisplayMode, FilterSeedSpec } from "./types";
import { AdvancedFilterChips } from "./AdvancedFilterChips";
import {
  AdvancedFiltersDialog,
  type AdvancedFiltersDialogProps,
} from "./AdvancedFiltersDialog";
import { useModelAdvancedFiltering } from "./useModelAdvancedFiltering";

/**
 * Popup sizing convenience props used by {@link ModelAdvancedFiltersControl}.
 *
 * For full control (including responsive sizes), prefer `dialogContentProps` /
 * `drawerContentProps` with Tailwind `className` and/or inline `style`.
 */
export type AdvancedFiltersPopupSizing = {
  /** CSS width (e.g. `"60vw"`, `640`). */
  width?: React.CSSProperties["width"];
  /** CSS max-width (e.g. `"900px"`). */
  maxWidth?: React.CSSProperties["maxWidth"];
  /** CSS height (e.g. `"70vh"`). */
  height?: React.CSSProperties["height"];
  /** CSS max-height (e.g. `"80vh"`). */
  maxHeight?: React.CSSProperties["maxHeight"];
  /** CSS min-width. */
  minWidth?: React.CSSProperties["minWidth"];
  /** CSS min-height. */
  minHeight?: React.CSSProperties["minHeight"];
};

/**
 * Props for {@link ModelAdvancedFiltersControl}.
 */
export type ModelAdvancedFiltersControlProps = {
  /** Backend Django app label hosting the model. */
  appName: string;
  /** Backend model name (PascalCase, as exposed by metadata). */
  modelName: string;
  /** Optional scoping options for metadata queries. */
  filtersOptions?: ModelTableFiltersOptions;
  /** Dialog vs drawer builder presentation. */
  displayMode?: AdvancedFilteringDisplayMode;
  /** Title displayed in the popup header. */
  popupTitle?: string;
  /** Called whenever the active advanced filters change (apply, clear, remove chip). */
  onApply?: (filters: ComplexFilterInput<string> | null) => void;
  /**
   * Optional seed specs used to prefill the builder before opening.
   *
   * This is useful when the surrounding UI stores filters in a serialized spec format
   * (e.g. the BI `default_filters` list) and wants a round-trip editing experience.
   */
  seedSpecs?: FilterSeedSpec[];

  /** Wrapper class name. */
  className?: string;

  /** Button label text. */
  buttonLabel?: string;
  /** Button icon (defaults to a filter icon). */
  buttonIcon?: React.ReactNode;
  /** Button variant (shadcn/ui). */
  buttonVariant?: "default" | "secondary" | "outline" | "ghost" | "destructive" | "link";
  /** Button size (shadcn/ui). */
  buttonSize?: "default" | "sm" | "lg" | "icon";
  /** Additional button class name. */
  buttonClassName?: string;
  /** Render a fully custom button instead of the default one. */
  renderButton?: (args: {
    /** Advanced filtering controller. */
    controller: ReturnType<typeof useModelAdvancedFiltering>["controller"];
    /** Whether at least one filter chip is active. */
    isActive: boolean;
    /** Active chip count. */
    activeCount: number;
    /** Opens the popup. */
    open: () => void;
  }) => React.ReactNode;
  /** When true, shows a small badge with active filter count. */
  showActiveCountBadge?: boolean;

  /** When true, renders chips under the button. */
  showChips?: boolean;
  /** Label for the "clear filters" chip action. */
  clearLabel?: string;

  /** Convenience sizing for dialog mode. */
  dialogSizing?: AdvancedFiltersPopupSizing;
  /** Convenience sizing for drawer mode. */
  drawerSizing?: AdvancedFiltersPopupSizing;

  /** Advanced dialog configuration forwarded to {@link AdvancedFiltersDialog}. */
  dialogProps?: Omit<AdvancedFiltersDialogProps, "controller">;

  /** Rendered while the filter metadata is loading and no UI can be shown yet. */
  loadingFallback?: React.ReactNode;
  /** Rendered when metadata fails to load. */
  errorFallback?: React.ReactNode | ((error: ApolloError) => React.ReactNode);
  /** When true, skips metadata fetching (renders nothing). */
  skip?: boolean;
};

/**
 * Merges sizing convenience props into an existing style object.
 */
function mergeSizingStyle(
  base: React.CSSProperties | undefined,
  sizing: AdvancedFiltersPopupSizing | undefined,
): React.CSSProperties | undefined {
  if (!sizing) return base;
  return {
    ...base,
    width: sizing.width ?? base?.width,
    maxWidth: sizing.maxWidth ?? base?.maxWidth,
    height: sizing.height ?? base?.height,
    maxHeight: sizing.maxHeight ?? base?.maxHeight,
    minWidth: sizing.minWidth ?? base?.minWidth,
    minHeight: sizing.minHeight ?? base?.minHeight,
  };
}

/**
 * Standalone model advanced filters opener with a customizable button and popup sizing.
 *
 * This is the "easy mode" when you want:
 * - only `appName` + `modelName`,
 * - a single button that opens a dialog/drawer,
 * - optional chips summary under the button.
 */
export const ModelAdvancedFiltersControl: React.FC<
  ModelAdvancedFiltersControlProps
> = ({
  appName,
  modelName,
  filtersOptions,
  displayMode = "dialog",
  popupTitle,
  onApply,
  seedSpecs,
  className,
  buttonLabel = "Filtres avancÃ©s",
  buttonIcon,
  buttonVariant = "outline",
  buttonSize = "sm",
  buttonClassName,
  renderButton,
  showActiveCountBadge = true,
  showChips = true,
  clearLabel = "Effacer les filtres",
  dialogSizing,
  drawerSizing,
  dialogProps,
  loadingFallback = null,
  errorFallback = null,
  skip = false,
}) => {
  const { controller, loading, error } = useModelAdvancedFiltering({
    appName,
    modelName,
    filtersOptions,
    title: popupTitle ?? buttonLabel,
    displayMode,
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

  const isActive = controller.hasActiveFilters;
  const activeCount = controller.chips.length;
  const open = () => {
    if (seedSpecs && seedSpecs.length > 0) {
      controller.seedFromSpecs(seedSpecs);
    }
    controller.openDialog();
  };

  const dialogContentProps: AdvancedFiltersDialogProps["dialogContentProps"] = {
    ...dialogProps?.dialogContentProps,
    style: mergeSizingStyle(dialogProps?.dialogContentProps?.style, dialogSizing),
  };

  const drawerContentProps: AdvancedFiltersDialogProps["drawerContentProps"] = {
    ...dialogProps?.drawerContentProps,
    style: mergeSizingStyle(dialogProps?.drawerContentProps?.style, drawerSizing),
  };

  const mergedDialogProps: Omit<AdvancedFiltersDialogProps, "controller"> = {
    ...dialogProps,
    dialogContentProps,
    drawerContentProps,
  };

  return (
    <div className={className}>
      {renderButton ? (
        renderButton({ controller, isActive, activeCount, open })
      ) : (
        <Button
          variant={buttonVariant}
          size={buttonSize}
          onClick={open}
          aria-pressed={isActive}
          className={cn(buttonClassName, isActive && "border-primary text-primary")}
        >
          {buttonIcon ?? <Filter className="mr-2 h-4 w-4" />}
          <span>{buttonLabel}</span>
          {showActiveCountBadge && isActive ? (
            <span className="ml-2 rounded-full bg-primary/10 px-2 text-xs font-semibold text-primary">
              {activeCount}
            </span>
          ) : null}
        </Button>
      )}

      {showChips ? (
        <div className="mt-2">
          <AdvancedFilterChips controller={controller} clearLabel={clearLabel} />
        </div>
      ) : null}

      <AdvancedFiltersDialog controller={controller} {...mergedDialogProps} />
    </div>
  );
};

