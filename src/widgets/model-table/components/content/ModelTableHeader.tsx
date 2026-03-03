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
 * Redesigned for optimal space management and modern ERP aesthetics.
 */
export function ModelTableHeader({
  controller,
  TopActionsComponent,
}: ModelTableHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-4 py-3 border-b border-border/40 bg-background/50 backdrop-blur-sm">
      <div className="flex items-center gap-3">
        {/* Subtle Icon */}
        <div className="hidden sm:flex size-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 text-primary border border-primary/20 shadow-sm">
          <Box className="size-5" />
        </div>

        <div className="flex flex-col justify-center gap-1.5">
          {/* Title & Badges */}
          <div className="flex items-center gap-2.5">
            <h1 className="text-lg md:text-xl font-bold text-foreground/90 tracking-tight leading-none">
              {controller.resolvedTitle}
            </h1>
            <div className="flex items-center gap-1.5">
              <Badge
                variant="secondary"
                className="h-6 px-2.5 rounded-md bg-secondary/80 text-secondary-foreground hover:bg-secondary/60 border-none text-[11px] font-bold tabular-nums transition-colors"
                title="Nombre total d'éléments"
              >
                {controller.totalCount}
              </Badge>
              {controller.hasSelection && (
                <Badge
                  className="h-6 px-2.5 rounded-md bg-primary text-primary-foreground border-none text-[11px] font-bold shadow-sm animate-in zoom-in-95 duration-200 tabular-nums"
                  title={`${controller.selectedCount} éléments sélectionnés`}
                >
                  {controller.selectedCount} sél.
                </Badge>
              )}
            </div>
          </div>

          {/* Breadcrumb & Status */}
          <div className="flex items-center text-[10px] font-semibold text-muted-foreground uppercase tracking-wider leading-none">
            <Database className="size-3 mr-1.5 opacity-70" />
            <span>{controller.app}</span>
            <ChevronRight className="size-3 mx-1 opacity-40" />
            <span className="text-primary/80">{controller.model}</span>
            <Separator
              orientation="vertical"
              className="h-3 mx-2.5 opacity-50"
            />
            <span className="normal-case tracking-normal opacity-70">
              Mis à jour :{" "}
              <span className="font-semibold text-foreground/80">
                {controller.timeAgo}
              </span>
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <button
          onClick={controller.triggerRefresh}
          disabled={controller.loading}
          className={cn(
            "flex size-9 items-center justify-center rounded-md border shadow-sm transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
            controller.loading
              ? "opacity-50 cursor-not-allowed bg-muted text-muted-foreground"
              : "bg-background hover:bg-accent hover:text-accent-foreground active:scale-95 text-foreground",
          )}
          title="Rafraîchir les données"
        >
          <RefreshCw
            className={cn(
              "size-4",
              controller.loading && "animate-spin text-primary",
            )}
          />
          <span className="sr-only">Rafraîchir</span>
        </button>
        <Separator
          orientation="vertical"
          className="h-6 hidden sm:block opacity-50 mx-1"
        />
        <TopActionsComponent controller={controller} />
      </div>
    </div>
  );
}
