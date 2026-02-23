import React from "react";
import { Info } from "lucide-react";
import type { ModelTableFooterSlotProps } from "./types";

/**
 * Props for the default footer slot.
 */
type ModelTableFooterProps = ModelTableFooterSlotProps;

/**
 * Renders a compact footer summary for the current table state.
 */
export function ModelTableFooter({ controller }: ModelTableFooterProps) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-border/40 bg-card/40 px-4 py-2 text-[11px] font-semibold text-muted-foreground/80">
      <div className="inline-flex items-center gap-2">
        <Info className="h-3.5 w-3.5" />
        <span>
          {controller.totalCount} lignes au total
        </span>
      </div>
      <span>
        {controller.selectedCount} selectionnees
      </span>
    </div>
  );
}
