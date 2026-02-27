import React from "react";
import {
  FileSpreadsheet,
  FileText,
  ArrowRight,
  ClipboardList,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/shared/ui/kit/alert-dialog";
import { Button } from "@/shared/ui/kit/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/ui/kit/dropdown-menu";
import { Separator } from "@/shared/ui/kit/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/shared/ui/kit/tooltip";
import { cn } from "@/shared/utils";
import type { ModelTableBulkActionsBarSlotProps } from "./types";

/**
 * Props for the default floating bulk-actions bar slot.
 */
type ModelTableBulkActionsBarProps = ModelTableBulkActionsBarSlotProps;

/**
 * Renders template actions and destructive controls for selected rows.
 * Floating bottom bar with premium glassmorphism, smooth spring animation,
 * categorized action clusters, and centered content layout.
 */
export function ModelTableBulkActionsBar({
  controller,
}: ModelTableBulkActionsBarProps) {
  const showTemplatePlaceholders =
    controller.templateCapabilitiesPending &&
    controller.pdfTemplates.length === 0 &&
    controller.excelTemplates.length === 0;

  return (
    <div
      className={cn(
        "fixed bottom-8 left-1/2 z-[60] -translate-x-1/2 transition-all duration-500 ease-out",
        controller.hasSelection
          ? "translate-y-0 opacity-100 scale-100"
          : "translate-y-24 opacity-0 scale-95 pointer-events-none",
      )}
    >
      <div className="flex items-center gap-3 rounded-2xl border border-border/30 bg-background/90 p-2 shadow-xl backdrop-blur-2xl ring-4 ring-primary/5">
        {/* Selection indicator */}
        <div className="flex items-center gap-3 pl-4 pr-2">
          <div className="relative flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md shadow-primary/20">
            <ClipboardList className="size-4" />
            <div className="absolute -right-2 -top-2 flex size-5 items-center justify-center rounded-full bg-foreground text-[9px] font-bold text-background shadow ring-2 ring-background tabular-nums">
              {controller.selectedCount}
            </div>
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-[11px] font-bold text-foreground">
              Sélection active
            </span>
            <span className="text-[9px] font-semibold uppercase text-primary/60 tracking-wider">
              {controller.model}
            </span>
          </div>
        </div>

        <Separator orientation="vertical" className="h-8 bg-border/20" />

        {/* Actions cluster */}
        <div className="flex items-center gap-1.5 rounded-xl bg-muted/30 p-1">
          <div className="flex items-center gap-0.5">
            {controller.pdfTemplates.length > 0 ? (
              <DropdownMenu>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        data-testid="templates-pdf-dropdown-trigger"
                        className="size-8 rounded-lg text-blue-500 hover:bg-blue-500 hover:text-white transition-all"
                      >
                        <FileText className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                  </TooltipTrigger>
                  <TooltipContent
                    side="top"
                    className="rounded-lg bg-blue-600 font-bold uppercase text-[9px] tracking-widest text-white"
                  >
                    Extractions PDF
                  </TooltipContent>
                </Tooltip>
                <DropdownMenuContent
                  align="center"
                  className="w-64 rounded-2xl border-border/30 p-1.5 shadow-xl backdrop-blur-xl bg-background/95"
                >
                  <DropdownMenuLabel className="flex items-center gap-2 px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">
                    <Sparkles className="size-3 text-blue-500" />
                    Templates PDF
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-border/30" />
                  <div className="p-0.5">
                    {controller.pdfTemplates.map((template) => (
                      <DropdownMenuItem
                        key={template.key}
                        disabled={template.allowed === false}
                        title={template.denialReason ?? undefined}
                        onClick={() =>
                          controller.runTemplateForRows(
                            template,
                            controller.selectedRows,
                          )
                        }
                        className="rounded-lg py-2.5 text-xs font-medium gap-3 transition-colors"
                      >
                        <div className="flex size-7 items-center justify-center rounded-md bg-blue-500/10 text-blue-500">
                          <FileText className="size-3.5" />
                        </div>
                        <span className="flex-1 truncate">
                          {template.title || template.key}
                        </span>
                        <ArrowRight className="ml-auto size-3 opacity-20" />
                      </DropdownMenuItem>
                    ))}
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : showTemplatePlaceholders ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    disabled
                    className="size-8 rounded-lg text-blue-500/60"
                    title="Chargement des templates PDF..."
                  >
                    <FileText className="size-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent
                  side="top"
                  className="rounded-lg bg-blue-600 font-bold uppercase text-[9px] tracking-widest text-white"
                >
                  Chargement des templates PDF...
                </TooltipContent>
              </Tooltip>
            ) : null}

            {controller.excelTemplates.length > 0 ? (
              <DropdownMenu>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        data-testid="templates-excel-dropdown-trigger"
                        className="size-8 rounded-lg text-emerald-500 hover:bg-emerald-500 hover:text-white transition-all"
                      >
                        <FileSpreadsheet className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                  </TooltipTrigger>
                  <TooltipContent
                    side="top"
                    className="rounded-lg bg-emerald-600 font-bold uppercase text-[9px] tracking-widest text-white"
                  >
                    Extractions Excel
                  </TooltipContent>
                </Tooltip>
                <DropdownMenuContent
                  align="center"
                  className="w-64 rounded-2xl border-border/30 p-1.5 shadow-xl backdrop-blur-xl bg-background/95"
                >
                  <DropdownMenuLabel className="flex items-center gap-2 px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">
                    <Sparkles className="size-3 text-emerald-500" />
                    Templates Excel
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-border/30" />
                  <div className="p-0.5">
                    {controller.excelTemplates.map((template) => (
                      <DropdownMenuItem
                        key={template.key}
                        disabled={template.allowed === false}
                        title={template.denialReason ?? undefined}
                        onClick={() =>
                          controller.runTemplateForRows(
                            template,
                            controller.selectedRows,
                          )
                        }
                        className="rounded-lg py-2.5 text-xs font-medium gap-3 transition-colors"
                      >
                        <div className="flex size-7 items-center justify-center rounded-md bg-emerald-500/10 text-emerald-500">
                          <FileSpreadsheet className="size-3.5" />
                        </div>
                        <span className="flex-1 truncate">
                          {template.title || template.key}
                        </span>
                        <ArrowRight className="ml-auto size-3 opacity-20" />
                      </DropdownMenuItem>
                    ))}
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : showTemplatePlaceholders ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    disabled
                    className="size-8 rounded-lg text-emerald-500/60"
                    title="Chargement des templates Excel..."
                  >
                    <FileSpreadsheet className="size-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent
                  side="top"
                  className="rounded-lg bg-emerald-600 font-bold uppercase text-[9px] tracking-widest text-white"
                >
                  Chargement des templates Excel...
                </TooltipContent>
              </Tooltip>
            ) : null}
          </div>

          <Separator
            orientation="vertical"
            className="h-5 bg-border/30 mx-0.5"
          />

          <div className="flex items-center gap-0.5">
            <AlertDialog
              open={controller.bulkDeleteDialogOpen}
              onOpenChange={controller.setBulkDeleteDialogOpen}
            >
              <Tooltip>
                <TooltipTrigger asChild>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 rounded-lg text-rose-500 hover:bg-rose-500 hover:text-white transition-all"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </AlertDialogTrigger>
                </TooltipTrigger>
                <TooltipContent
                  side="top"
                  className="rounded-lg bg-rose-600 font-bold uppercase text-[9px] tracking-widest text-white"
                >
                  Suppression en masse
                </TooltipContent>
              </Tooltip>
              <AlertDialogContent className="max-w-[420px] rounded-3xl border-border/30 shadow-2xl overflow-hidden p-0 bg-background/95 backdrop-blur-2xl">
                {/* Accent strip */}
                <div className="h-1.5 w-full bg-gradient-to-r from-rose-400 via-rose-500 to-rose-600" />
                <div className="flex flex-col items-center gap-4 p-8 text-center">
                  <div className="flex size-14 items-center justify-center rounded-2xl bg-rose-500/10">
                    <Trash2 className="size-7 text-rose-500" />
                  </div>
                  <AlertDialogHeader className="space-y-2">
                    <AlertDialogTitle className="text-xl font-bold">
                      Action critique
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-sm font-medium leading-relaxed text-muted-foreground">
                      Vous êtes sur le point de supprimer définitivement{" "}
                      <span className="font-bold text-rose-500 tabular-nums">
                        {controller.selectedCount}
                      </span>{" "}
                      enregistrements de{" "}
                      <span className="font-bold text-foreground">
                        {controller.model}
                      </span>
                      . Cette opération est irréversible.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter className="mt-4 flex flex-col sm:flex-row gap-3 justify-center w-full">
                    <AlertDialogCancel className="h-10 flex-1 rounded-xl border-border/30 bg-muted/30 font-bold text-xs uppercase tracking-wider transition-all hover:bg-muted/50 active:scale-95">
                      Annuler
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={controller.confirmBulkDelete}
                      className="h-10 flex-1 rounded-xl bg-rose-500 font-bold text-xs uppercase tracking-wider text-white shadow-lg shadow-rose-500/20 transition-all hover:bg-rose-600 hover:scale-[1.02] active:scale-95"
                    >
                      Confirmer la suppression
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </div>
              </AlertDialogContent>
            </AlertDialog>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 rounded-lg text-muted-foreground hover:bg-muted transition-all"
                  onClick={controller.clearSelection}
                >
                  <X className="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent
                side="top"
                className="rounded-lg bg-foreground font-bold uppercase text-[9px] tracking-widest text-background"
              >
                Désélectionner tout
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </div>
    </div>
  );
}
