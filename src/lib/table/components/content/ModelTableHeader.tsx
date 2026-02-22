import React from "react";
import { Badge } from "@/lib/components/ui/badge";
import { Separator } from "@/lib/components/ui/separator";
import { cn } from "@/lib/utils";
import { Box, ChevronRight, Database, RefreshCw } from "lucide-react";
import type { ModelTableHeaderSlotProps } from "./types";

/**
 * Props for the default model-table header slot.
 */
type ModelTableHeaderProps = ModelTableHeaderSlotProps;

/**
 * Renders the default table header with breadcrumb, title, counts, and actions.
 */
export function ModelTableHeader({
  controller,
  TopActionsComponent,
}: ModelTableHeaderProps) {
  return (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 px-1 py-4">
      <div className="flex items-start gap-4">
        <div className="hidden sm:flex h-14 w-14 shrink-0 items-center justify-center rounded-[1.25rem] bg-gradient-to-br from-primary/20 to-primary/5 text-primary shadow-inner">
          <Box className="h-7 w-7" />
        </div>

        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground/40">
            <Database className="h-3.5 w-3.5" />
            <span>{controller.app}</span>
            <ChevronRight className="h-3 w-3" />
            <span className="text-primary/70">{controller.model}</span>
          </div>

          <div className="flex items-center gap-4">
            <h1 className="text-4xl font-black tracking-tighter text-foreground/90 uppercase">
              {controller.resolvedTitle}
            </h1>
            <div className="flex items-center gap-2">
              <Badge
                variant="secondary"
                className="h-8 rounded-full px-4 bg-primary text-primary-foreground border-none font-black text-sm shadow-lg shadow-primary/20"
              >
                {controller.totalCount}
              </Badge>
              {controller.hasSelection && (
                <Badge className="h-8 rounded-full px-4 bg-secondary text-white border-none font-black text-sm shadow-lg animate-in zoom-in">
                  {controller.selectedCount} SELECTIONNES
                </Badge>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 text-[10px] font-bold text-muted-foreground/60">
            <div className="flex items-center gap-1.5">
              <RefreshCw
                className={cn(
                  "h-3 w-3",
                  controller.loading && "animate-spin text-primary",
                )}
              />
              <span>Mis a jour {controller.timeAgo}</span>
            </div>
            <Separator orientation="vertical" className="h-3" />
            <button
              onClick={controller.triggerRefresh}
              className="hover:text-primary transition-colors uppercase tracking-widest"
            >
              Rafraichir maintenant
            </button>
          </div>
        </div>
      </div>

      <TopActionsComponent controller={controller} />
    </div>
  );
}
