import React from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/shared/ui/kit/button";
import { cn } from "@/shared/utils";
import type { ModelTableTopActionsSlotProps } from "./types";

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
 return (
 <Button
 key={action.key}
 variant={action.variant ?? "outline"}
 size={action.size === "icon" ? "icon" : "sm"}
 title={action.disabled ? action.disabledReason : undefined}
 className={cn(
    "h-9 font-bold uppercase tracking-wider text-[10px]",
        action.key === "add" && "bg-primary text-primary-foreground hover:bg-primary/90 border-transparent",
        action.key === "import" && "bg-secondary text-secondary-foreground hover:bg-secondary/80 border-transparent",
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
 {isActionLoading ? <Loader2 className="h-4 w-4" /> : action.icon ?? null}
 </span>
 {action.size !== "icon" && <span>{action.label}</span>}
 </Button>
 );
}

/**
 * Renders the default top-actions cluster for model tables.
 * Premium styled buttons with consistent sizing,
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
