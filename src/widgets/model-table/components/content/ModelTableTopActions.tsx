import React from "react";
import { Button } from "@/shared/ui/kit/button";
import { cn } from "@/shared/utils";
import type { ModelTableTopActionsSlotProps } from "./types";

/**
 * Props for the default top-actions slot.
 */
type ModelTableTopActionsProps = ModelTableTopActionsSlotProps;

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
        <Button
          key={action.key}
          variant={action.variant ?? "outline"}
          size={action.size === "icon" ? "icon" : "sm"}
          className={cn(
            "h-9 rounded-xl transition-all duration-200 font-bold uppercase tracking-wider text-[10px]",
            action.key === "add" &&
              "bg-primary text-primary-foreground shadow-md shadow-primary/15 hover:shadow-lg hover:shadow-primary/25 hover:scale-[1.03] active:scale-95 border-none",
            action.key === "import" &&
              "hover:bg-indigo-500 hover:text-white dark:hover:bg-indigo-600 border-indigo-200/50 dark:border-indigo-800/30 text-indigo-600 dark:text-indigo-400",
            action.size === "icon" ? "w-9" : "px-4",
          )}
          disabled={action.disabled || controller.loading}
          onClick={() => controller.handleTopActionClick(action)}
        >
          {action.icon}
          {action.size !== "icon" && <span>{action.label}</span>}
        </Button>
      ))}
    </div>
  );
}
