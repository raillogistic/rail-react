import React from "react";
import { Badge } from "@/shared/ui/kit/badge";
import { cn } from "@/shared/utils";
import { RefreshCw } from "lucide-react";
import type { ModelTableHeaderSlotProps } from "./types";

/**
 * Props for the default model-table header slot.
 */
type ModelTableHeaderProps = ModelTableHeaderSlotProps;

/**
 * Renders the default table header with breadcrumb, title, counts, and actions.
 * Redesigned for optimal space management and modern ERP aesthetics.
 */
export function ModelTableHeader({
  controller,
  TopActionsComponent,
}: ModelTableHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 w-full bg-transparent">
      <div className="flex flex-col justify-center gap-1">
        {/* Title & Badges */}
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-foreground tracking-tight leading-none">
            {controller.resolvedTitle}
          </h1>
          <div className="flex items-center gap-1.5">
            <Badge
              variant="secondary"
              className="px-1.5 py-0.5 h-auto leading-none text-xs font-medium bg-muted text-muted-foreground border-transparent rounded"
              title="Nombre total d'éléments"
            >
              {controller.totalCount} éléments
            </Badge>
            {controller.hasSelection && (
              <Badge className="px-1.5 py-0.5 h-auto leading-none text-xs font-medium bg-primary/10 text-primary border-primary/20 rounded">
                {controller.selectedCount} sélectionné(s)
              </Badge>
            )}
          </div>
        </div>

        {/* Status Line */}
        <div className="flex items-center text-xs font-medium text-muted-foreground mt-1">
          <span className="uppercase tracking-wider">{controller.app}</span>
          <span className="mx-2 text-border">&bull;</span>
          <span>{controller.model}</span>
          <span className="mx-2 text-border">&bull;</span>
          <span className="flex items-center gap-1.5">
            <RefreshCw className="size-3" />
            <span>Mis à jour {controller.timeAgo}</span>
          </span>
        </div>
      </div>
      
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          onClick={controller.triggerRefresh}
          disabled={controller.loading}
          className={cn(
            "flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted transition-colors",
            controller.loading && "opacity-50 cursor-not-allowed"
          )}
          title="Rafraîchir les données"
        >
          <RefreshCw
            className={cn(
              "size-4",
              controller.loading && "animate-spin text-primary"
            )}
          />
          <span className="sr-only">Rafraîchir</span>
        </button>
        <div className="h-4 w-px bg-border/40 mx-1 hidden sm:block" />
        <TopActionsComponent controller={controller} />
      </div>
    </div>
  );
}
