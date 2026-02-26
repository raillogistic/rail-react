import React from "react";
import { Badge } from "@/shared/ui/kit/badge";
import { Separator } from "@/shared/ui/kit/separator";
import { cn } from "@/shared/utils";
import { Box, ChevronRight, Database, RefreshCw } from "lucide-react";
import type { ModelTableHeaderSlotProps } from "./types";

/**
 * Props for the default model-table header slot.
 */
type ModelTableHeaderProps = ModelTableHeaderSlotProps;

/**
 * Renders the default table header with breadcrumb, title, counts, and actions.
 * Premium design with gradient icon, animated badges, and subtle status indicators.
 */
export function ModelTableHeader({
  controller,
  TopActionsComponent,
}: ModelTableHeaderProps) {
  return (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 px-1 py-4">
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className="hidden sm:flex size-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/15 to-primary/5 text-primary shadow-sm ring-1 ring-primary/10">
          <Box className="size-6" />
        </div>

        <div className="flex flex-col gap-1.5">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/50">
            <Database className="size-3" />
            <span>{controller.app}</span>
            <ChevronRight className="size-2.5" />
            <span className="text-primary/60">{controller.model}</span>
          </div>

          {/* Title + Badges */}
          <div className="flex items-center gap-3.5">
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground/90">
              {controller.resolvedTitle}
            </h1>
            <div className="flex items-center gap-2">
              <Badge
                variant="secondary"
                className="h-7 rounded-full px-3.5 bg-primary text-primary-foreground border-none font-bold text-xs shadow-md shadow-primary/15 tabular-nums"
              >
                {controller.totalCount}
              </Badge>
              {controller.hasSelection && (
                <Badge className="h-7 rounded-full px-3.5 bg-secondary text-secondary-foreground border-none font-bold text-xs shadow-md animate-in zoom-in-95 duration-200 tabular-nums">
                  {controller.selectedCount} sélectionnés
                </Badge>
              )}
            </div>
          </div>

          {/* Status bar */}
          <div className="flex items-center gap-3 text-[10px] font-medium text-muted-foreground/50">
            <div className="flex items-center gap-1.5">
              <RefreshCw
                className={cn(
                  "size-3",
                  controller.loading && "animate-spin text-primary",
                )}
              />
              <span>Mis à jour {controller.timeAgo}</span>
            </div>
            <Separator orientation="vertical" className="h-3" />
            <button
              onClick={controller.triggerRefresh}
              className="hover:text-primary transition-colors uppercase tracking-widest"
            >
              Rafraîchir
            </button>
          </div>
        </div>
      </div>

      <TopActionsComponent controller={controller} />
    </div>
  );
}
