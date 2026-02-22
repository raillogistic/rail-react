import React from "react";
import { Button } from "@/lib/components/ui/button";
import { cn } from "@/lib/utils";
import type { ModelTableTopActionsSlotProps } from "./types";

/**
 * Props for the default top-actions slot.
 */
type ModelTableTopActionsProps = ModelTableTopActionsSlotProps;

/**
 * Renders the default top-actions cluster for model tables.
 */
export function ModelTableTopActions({ controller }: ModelTableTopActionsProps) {
  return (
    <div className="flex items-center justify-end gap-2.5">
      {controller.resolvedTopActions.map((action) => (
        <Button
          key={action.key}
          variant={action.variant ?? "outline"}
          size={action.size === "icon" ? "icon" : "sm"}
          className={cn(
            "h-11 rounded-2xl transition-all duration-300 font-black uppercase tracking-widest text-[10px]",
            action.key === "add" &&
              "bg-primary text-primary-foreground shadow-xl shadow-primary/20 hover:scale-[1.05] active:scale-95 border-none",
            action.key === "import" &&
              "hover:bg-indigo-500 hover:text-white dark:hover:bg-indigo-600 border-indigo-200/50 text-indigo-600 dark:text-indigo-400",
            action.size === "icon" ? "w-11" : "px-6",
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
