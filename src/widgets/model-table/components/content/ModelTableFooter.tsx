import React from "react";
import { Info } from "lucide-react";
import type { ModelTableFooterSlotProps } from "./types";

/**
 * Props for the default footer slot.
 */
type ModelTableFooterProps = ModelTableFooterSlotProps;

/**
 * Renders a compact footer summary for the current table state.
 * Premium styled with container, muted icon, and subtle typography.
 */
export function ModelTableFooter({ controller }: ModelTableFooterProps) {
 return (
 <div className="flex items-center justify-between border border-border/20 bg-muted/20 px-4 py-2.5 text-[11px] font-medium text-muted-foreground/70 backdrop-blur-sm">
 <div className="inline-flex items-center gap-2">
 <Info className="size-3.5 text-muted-foreground/40" />
 <span className="tabular-nums">
 {controller.totalCount} lignes au total
 </span>
 </div>
 <span className="tabular-nums">
 {controller.selectedCount} sélectionnées
 </span>
 </div>
 );
}
