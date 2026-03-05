import React, { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/shared/ui/kit/button";
import { cn } from "@/shared/utils";
import type { ModelTableTopActionsSlotProps } from "./types";

const ACTION_LOADING_SPINNER_DELAY_MS = 180;

/**
 * Props for the default top-actions slot.
 */
type ModelTableTopActionsProps = ModelTableTopActionsSlotProps;

type TopActionButtonProps = {
 action: ModelTableTopActionsSlotProps["controller"]["resolvedTopActions"][number];
 controller: ModelTableTopActionsSlotProps["controller"];
};

function TopActionButton({ action, controller }: TopActionButtonProps) {
 const isActionLoading = Boolean(action.loading);
 const [showLoadingSpinner, setShowLoadingSpinner] = useState(false);

 useEffect(() => {
 if (!isActionLoading) {
 setShowLoadingSpinner(false);
 return;
 }

 const timeoutId = window.setTimeout(() => {
 setShowLoadingSpinner(true);
 }, ACTION_LOADING_SPINNER_DELAY_MS);

 return () => {
 window.clearTimeout(timeoutId);
 };
 }, [isActionLoading]);

 return (
 <Button
 key={action.key}
 variant={action.variant ?? "outline"}
 size={action.size === "icon" ? "icon" : "sm"}
 title={action.disabled ? action.disabledReason : undefined}
 className={cn(
 "h-9 transition-all duration-200 font-bold uppercase tracking-wider text-[10px]",
 action.key === "add" &&
 "bg-primary text-primary-foreground shadow-md shadow-primary/15 hover:shadow-lg hover:shadow-primary/25 hover:scale-[1.03] active:scale-95 border-none",
 action.key === "import" &&
 "hover:bg-indigo-500 hover:text-white dark:hover:bg-indigo-600 border-indigo-200/50 dark:border-indigo-800/30 text-indigo-600 dark:text-indigo-400",
 action.size === "icon" ? "w-9" : "px-4",
 )}
 disabled={action.disabled || controller.loading || isActionLoading}
 aria-busy={isActionLoading ? true : undefined}
 onClick={() => controller.handleTopActionClick(action)}
 >
 <span
 aria-hidden
 className={cn(
 "inline-flex h-4 w-4 shrink-0 items-center justify-center",
 action.size === "icon" ? "" : "mr-2",
 )}
 >
 {showLoadingSpinner ? (
 <Loader2 className="h-4 w-4 animate-spin" />
 ) : (
 action.icon ?? null
 )}
 </span>
 {action.size !== "icon" && <span>{action.label}</span>}
 </Button>
 );
}

/**
 * Renders the default top-actions cluster for model tables.
 * Premium styled buttons with consistent sizing, smooth transitions,
 * and contextual color treatments per action type.
 */
export function ModelTableTopActions({
 controller,
}: ModelTableTopActionsProps) {
 return (
 <div className="flex items-center justify-end gap-2">
 {controller.resolvedTopActions.map((action) => (
 <TopActionButton key={action.key} action={action} controller={controller} />
 ))}
 </div>
 );
}
