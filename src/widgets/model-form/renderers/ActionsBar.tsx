/**
 * Actions bar for the DynamicForm.
 *
 * Renders submit/reset buttons, extra action slots, dirty indicator,
 * and optional submit confirmation dialog.
 */
import React from "react";
import type { UseFormReturn } from "@tanstack/react-form";
import { useStore } from "@tanstack/react-form";
import { Button } from "@/shared/ui/kit/button";
import { Badge } from "@/shared/ui/kit/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/kit/dialog";
import { cn } from "@/shared/utils";
import { Save, RotateCcw, CheckCircle2, AlertTriangle, Loader2, Undo, Redo } from "lucide-react";

export type ActionsBarProps<TValues> = {
  form: UseFormReturn<TValues>;
  config?: FormActionsConfig<TValues>;
  isLoading?: boolean;
  variant: "default" | "compact" | "popup";
  history?: {
    undo: () => void;
    redo: () => void;
    canUndo: boolean;
    canRedo: boolean;
  };
};

export const ActionsBar = <TValues extends Record<string, any>>({
  form,
  config,
  isLoading,
  variant,
  history,
}: ActionsBarProps<TValues>) => {
  const {
    submitLabel = "Enregistrer",
    resetLabel = "Réinitialiser",
    hidden = false,
    extra,
    confirmSubmit,
    showDirtyIndicator = true,
    undoRedo,
    isSubmitting: externalSubmitting,
    submitOutcome,
  } = config ?? {};

  const formSubmitting = useStore(form.store, (state) => state.isSubmitting);
  const isSubmitting = Boolean(formSubmitting || externalSubmitting);
  const canSubmit = useStore(form.store, (state) => state.canSubmit);
  const isDirty = useStore(form.store, (state) => state.isDirty);

  const [confirmOpen, setConfirmOpen] = React.useState(false);

  if (hidden) return null;

  const isPopup = variant === "popup" || variant === "compact";

  const actionsClass = cn(
    "z-50 flex flex-wrap items-center justify-between gap-4 p-4",
    "transition-all duration-300 ease-in-out",
    isPopup
      ? "mt-4 border-t bg-muted/30"
      : "sticky bottom-0 mt-6 -mx-4 border-t bg-background/80 backdrop-blur-md shadow-[0_-4px_12px_rgba(0,0,0,0.03)]"
  );

  const handleSubmitClick = () => {
    if (confirmSubmit?.enabled) {
      setConfirmOpen(true);
      return;
    }
    form.handleSubmit();
  };

  const renderedExtra =
    typeof extra === "function"
      ? extra({ form, isSubmitting, canSubmit })
      : extra;

  const showUndoRedo = undoRedo?.enabled && undoRedo?.showInActionBar !== false && history;

  return (
    <>
      <div className={actionsClass}>
        <div className="flex items-center gap-3">
          {showDirtyIndicator && isDirty ? (
            <Badge
              variant="outline"
              className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800 animate-in fade-in slide-in-from-left-2"
            >
              <CheckCircle2 className="mr-1.5 size-3.5" />
              Modifications non enregistrées
            </Badge>
          ) : (
             <div className="w-1" />
          )}
        </div>

        <div className="flex items-center gap-3">
          {renderedExtra}

          {showUndoRedo && history ? (
            <div className="flex items-center gap-1 border-r border-border/40 pr-3 mr-1">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-8 text-muted-foreground"
                onClick={history.undo}
                disabled={!history.canUndo || isSubmitting}
                title="Annuler"
              >
                <Undo className="size-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-8 text-muted-foreground"
                onClick={history.redo}
                disabled={!history.canRedo || isSubmitting}
                title="Rétablir"
              >
                <Redo className="size-4" />
              </Button>
            </div>
          ) : null}

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => form.reset()}
            disabled={isSubmitting || !isDirty}
            className="text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="mr-2 size-4" />
            {resetLabel}
          </Button>

          <Button
            type="submit"
            size="sm"
            disabled={isSubmitting || isLoading || (!isDirty && !canSubmit)}
            className="shadow-sm shadow-primary/20 min-w-[120px]"
            onClick={(e) => {
              if (confirmSubmit?.enabled) {
                e.preventDefault();
                handleSubmitClick();
              }
            }}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Enregistrement...
              </>
            ) : (
              <>
                <Save className="mr-2 size-4" />
                {submitLabel}
              </>
            )}
          </Button>

          {submitOutcome ? (
            <span
              className={cn(
                "text-xs font-medium",
                submitOutcome.ok
                  ? "text-emerald-600"
                  : submitOutcome.conflict
                    ? "text-amber-600"
                    : "text-destructive",
              )}
            >
              {submitOutcome.ok
                ? "Enregistré"
                : submitOutcome.conflict
                  ? "Actualisation requise"
                  : `${submitOutcome.errorCount} erreur(s)`}
            </span>
          ) : null}
        </div>
      </div>

      {confirmSubmit?.enabled ? (
        <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="size-5 text-warning text-amber-500" />
                {confirmSubmit.title ?? "Confirmer la soumission"}
              </DialogTitle>
              <DialogDescription className="pt-2">
                {confirmSubmit.message ??
                  "Êtes-vous sûr de vouloir soumettre ce formulaire ?"}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="mt-4 gap-2">
              <Button
                variant="outline"
                onClick={() => setConfirmOpen(false)}
              >
                Annuler
              </Button>
              <Button
                onClick={() => {
                  setConfirmOpen(false);
                  form.handleSubmit();
                }}
              >
                Confirmer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      ) : null}
    </>
  );
};
