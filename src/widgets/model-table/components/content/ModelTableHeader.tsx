import React from "react";
import { Badge } from "@/shared/ui/kit/badge";
import { Separator } from "@/shared/ui/kit/separator";
import { cn } from "@/shared/utils";
import { ChevronRight, Database, RefreshCw } from "lucide-react";
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
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6 py-5 bg-transparent">
      <div className="flex items-center gap-4">
        {/* Modern Icon Block */}
        <div className="hidden sm:flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20 shadow-inner">
          <Database className="size-5" />
        </div>

        <div className="flex flex-col justify-center gap-1.5">
          {/* Title & Badges */}
          <div className="flex items-center gap-3">
            <h1 className="text-xl md:text-2xl font-bold text-foreground tracking-tight leading-none">
              {controller.resolvedTitle}
            </h1>
            <div className="flex items-center gap-2">
              <Badge
                variant="secondary"
                className="h-6 px-2.5 bg-secondary text-secondary-foreground hover:bg-secondary/80 text-[11px] font-semibold tabular-nums transition-colors"
                title="Nombre total d'éléments"
              >
                {controller.totalCount} au total
              </Badge>
              {controller.hasSelection && (
                <Badge
                  className="h-6 px-2.5 bg-primary text-primary-foreground text-[11px] font-semibold shadow-sm animate-in zoom-in duration-200 tabular-nums"
                  title={`${controller.selectedCount} éléments sélectionnés`}
                >
                  {controller.selectedCount} sél.
                </Badge>
              )}
            </div>
          </div>

          {/* Breadcrumb & Status */}
          <div className="flex items-center text-[11px] font-medium text-muted-foreground/80 tracking-wide">
            <span className="uppercase">{controller.app}</span>
            <ChevronRight className="size-3.5 mx-1.5 opacity-40 shrink-0" />
            <span className="text-foreground/70">{controller.model}</span>
            <Separator
              orientation="vertical"
              className="h-3.5 mx-3 opacity-30"
            />
            <span className="flex items-center gap-1.5 opacity-90">
              <RefreshCw className="size-3" />
              <span>
                Mis à jour :{" "}
                <span className="text-foreground">{controller.timeAgo}</span>
              </span>
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={controller.triggerRefresh}
          disabled={controller.loading}
          className={cn(
            "flex size-9 items-center justify-center rounded-lg border border-border/50 bg-background/50 shadow-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            controller.loading
              ? "opacity-50 cursor-not-allowed text-muted-foreground"
              : "hover:bg-accent hover:text-accent-foreground active:scale-95 text-foreground",
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
          className="h-7 hidden sm:block mx-1 opacity-40"
        />
        <TopActionsComponent controller={controller} />
      </div>
    </div>
  );
}
