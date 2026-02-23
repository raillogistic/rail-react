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
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/shared/ui/kit/alert-dialog";
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
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/ui/kit/tooltip";
import { cn } from "@/shared/utils";
import type { ModelTableBulkActionsBarSlotProps } from "./types";

/**
 * Props for the default floating bulk-actions bar slot.
 */
type ModelTableBulkActionsBarProps = ModelTableBulkActionsBarSlotProps;

/**
 * Renders template actions and destructive controls for selected rows.
 */
export function ModelTableBulkActionsBar({
  controller,
}: ModelTableBulkActionsBarProps) {
  return (
    <div
      className={cn(
        "fixed bottom-10 left-1/2 z-[60] -translate-x-1/2 transition-all duration-700 cubic-bezier(0.34, 1.56, 0.64, 1)",
        controller.hasSelection
          ? "translate-y-0 opacity-100 scale-100"
          : "translate-y-32 opacity-0 scale-90 pointer-events-none",
      )}
    >
      <div className="flex items-center gap-4 rounded-[2.5rem] border border-primary/30 bg-background/90 p-2.5 shadow-[0_20px_50px_rgba(0,0,0,0.15)] backdrop-blur-3xl ring-8 ring-primary/5">
        <div className="flex items-center gap-4 pl-5 pr-3">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-2xl shadow-primary/40">
            <ClipboardList className="h-5 w-5" />
            <div className="absolute -right-2.5 -top-2.5 flex h-6 w-6 items-center justify-center rounded-full bg-foreground text-[10px] font-black text-background shadow-lg ring-2 ring-background">
              {controller.selectedCount}
            </div>
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-[11px] font-black uppercase tracking-tighter text-foreground">
              Selection active
            </span>
            <span className="text-[9px] font-bold uppercase text-primary/70 tracking-widest">
              {controller.model}
            </span>
          </div>
        </div>

        <Separator orientation="vertical" className="h-10 bg-border/20" />

        <div className="flex items-center gap-2 rounded-[1.75rem] bg-muted/40 p-1.5">
          <div className="flex items-center gap-1">
            {controller.pdfTemplates.length > 0 && (
              <DropdownMenu>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        data-testid="templates-pdf-dropdown-trigger"
                        className="h-10 w-10 rounded-xl text-blue-500 hover:bg-blue-500 hover:text-white transition-all shadow-sm"
                      >
                        <FileText className="h-5 w-5" />
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
                  className="w-72 rounded-3xl border-none p-2 shadow-3xl backdrop-blur-2xl bg-background/95"
                >
                    <DropdownMenuLabel className="flex items-center gap-2 px-4 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">
                      <Sparkles className="h-3.5 w-3.5 text-blue-500" />
                      PDF Templates
                    </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-border/40" />
                  <div className="p-1">
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
                        className="rounded-xl py-3 text-xs font-bold gap-4 transition-colors"
                      >
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500">
                          <FileText className="h-4 w-4" />
                        </div>
                        {template.title || template.key}
                        <ArrowRight className="ml-auto h-3 w-3 opacity-20" />
                      </DropdownMenuItem>
                    ))}
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {controller.excelTemplates.length > 0 && (
              <DropdownMenu>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        data-testid="templates-excel-dropdown-trigger"
                        className="h-10 w-10 rounded-xl text-emerald-500 hover:bg-emerald-500 hover:text-white transition-all shadow-sm"
                      >
                        <FileSpreadsheet className="h-5 w-5" />
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
                  className="w-72 rounded-3xl border-none p-2 shadow-3xl backdrop-blur-2xl bg-background/95"
                >
                    <DropdownMenuLabel className="flex items-center gap-2 px-4 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">
                      <Sparkles className="h-3.5 w-3.5 text-emerald-500" />
                      Excel Templates
                    </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-border/40" />
                  <div className="p-1">
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
                        className="rounded-xl py-3 text-xs font-bold gap-4 transition-colors"
                      >
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
                          <FileSpreadsheet className="h-4 w-4" />
                        </div>
                        {template.title || template.key}
                        <ArrowRight className="ml-auto h-3 w-3 opacity-20" />
                      </DropdownMenuItem>
                    ))}
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          <Separator orientation="vertical" className="h-6 bg-border/40 mx-1" />

          <div className="flex items-center gap-1">
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
                      className="h-10 w-10 rounded-xl text-rose-500 hover:bg-rose-500 hover:text-white transition-all shadow-sm"
                    >
                      <Trash2 className="h-5 w-5" />
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
              <AlertDialogContent className="max-w-[450px] rounded-[3rem] border-none shadow-3xl overflow-hidden p-0 bg-background/95 backdrop-blur-2xl">
                <div className="relative h-32 w-full bg-rose-500 flex items-center justify-center">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white/20 to-transparent opacity-50" />
                  <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl bg-white dark:bg-slate-900 shadow-2xl">
                    <Trash2 className="h-10 w-10 text-rose-500" />
                  </div>
                </div>
                <div className="p-10 text-center">
                  <AlertDialogHeader className="space-y-4">
                    <AlertDialogTitle className="text-3xl font-black uppercase tracking-tighter">
                      Action critique
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-sm font-medium leading-relaxed text-muted-foreground">
                      Vous etes sur le point de supprimer definitivement{" "}
                      <span className="font-black text-rose-500">
                        {controller.selectedCount}
                      </span>{" "}
                      enregistrements de{" "}
                      <span className="font-black text-foreground">
                        {controller.model}
                      </span>
                      . Cette operation est irreversible.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
                    <AlertDialogCancel className="h-14 flex-1 rounded-2xl border-none bg-muted/50 font-black uppercase text-[10px] tracking-widest transition-all hover:bg-muted active:scale-95">
                      Annuler
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={controller.confirmBulkDelete}
                      className="h-14 flex-1 rounded-2xl bg-rose-500 font-black uppercase text-[10px] tracking-widest text-white shadow-2xl shadow-rose-200 dark:shadow-rose-900/40 transition-all hover:bg-rose-600 hover:scale-[1.02] active:scale-95"
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
                  className="h-10 w-10 rounded-xl text-muted-foreground hover:bg-muted transition-all"
                  onClick={controller.clearSelection}
                >
                  <X className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent
                side="top"
                className="rounded-lg bg-foreground font-bold uppercase text-[9px] tracking-widest text-background"
              >
                Deselectionner tout
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </div>
    </div>
  );
}
