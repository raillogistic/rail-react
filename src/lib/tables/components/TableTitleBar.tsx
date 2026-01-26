import React from "react";
import { cn } from "@/lib/utils";

/**
 * Props for {@link TableTitleBar}.
 * @property title - Optional table title; defaults to a generic label.
 * @property rowSummary - Human-readable summary of the row count.
 * @property visibleColumnCount - Number of currently visible columns.
 * @property topActions - Pre-rendered action buttons aligned to the right.
 * @property actions - Secondary actions rendered after top actions.
 */
export type TableTitleBarProps = {
  title?: string;
  rowSummary: string;
  visibleColumnCount: number;
  topActions?: React.ReactNode;
  actions?: React.ReactNode;
};

/**
 * Displays the table heading with row/column summary and aligned action buttons.
 */
export function TableTitleBar({
  title,
  rowSummary,
  visibleColumnCount,
  topActions,
  actions,
}: TableTitleBarProps) {
  return (
    <div className="mb-4 rounded-lg shadow-sm  bg-card/60 p-4 ">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          {title ? (
            <div className="text-lg font-semibold tracking-wide text-foreground">
              {title}
            </div>
          ) : (
            <div className="text-sm font-medium text-muted-foreground">
              Tableau
            </div>
          )}
          <p className="text-xs text-muted-foreground">
            {rowSummary} · {visibleColumnCount} colonne
            {visibleColumnCount > 1 ? "s" : ""} visibles
          </p>
        </div>
        <div className={cn("flex flex-wrap items-center gap-2")}>
          {topActions}
          {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
        </div>
      </div>
    </div>
  );
}
