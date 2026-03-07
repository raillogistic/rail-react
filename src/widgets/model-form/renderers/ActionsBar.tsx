/**
 * Actions bar for the DynamicForm.
 *
 * Renders submit/reset buttons, extra action slots, dirty indicator,
 * and optional submit confirmation dialog.
 *
 * @module form/renderers/ActionsBar
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
import {
  Save,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Undo,
  Redo,
  Check,
  Circle,
} from "lucide-react";
import type { FormActionsConfig } from "../types/actions";

/** Props for the ActionsBar component. */
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

/**
 * Renders the form action bar with submit, reset, undo/redo,
 * dirty indicator, and optional confirm dialog.
 */
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

  const formSubmitting = useStore(
    form.store,
    (state: any) => state.isSubmitting,
  );
  const isSubmitting = Boolean(formSubmitting || externalSubmitting);
  const canSubmit = useStore(form.store, (state: any) => state.canSubmit);
  const isDirty = useStore(form.store, (state: any) => state.isDirty);

  const [confirmOpen, setConfirmOpen] = React.useState(false);

  if (hidden) return null;

  const isPopup = variant === "popup" || variant === "compact";

  const actionsClass = cn(
    "z-50 flex flex-wrap items-center justify-between px-4 py-3",
    "transition-all duration-200 ease-in-out",
    isPopup
      ? "mt-3 rounded-lg border border-border/30 bg-muted/20"
      : "sticky bottom-0 mt-4 -mx-2 rounded-lg border border-border/30 bg-background/90 backdrop-blur-md shadow-sm",
  );

  /** Handles submit click, optionally opening the confirmation dialog. */
  const handleSubmitClick = () => {
    if (confirmSubmit?.enabled) {
      setConfirmOpen(true);
      return;
    }
    void form.handleSubmit();
  };

  const renderedExtra =
    typeof extra === "function"
      ? extra({
          form,
          isSubmitting,
          canSubmit,
          submitOutcome: submitOutcome ?? undefined,
        })
      : extra;

  const showUndoRedo =
    undoRedo?.enabled && undoRedo?.showInActionBar !== false && history;

  return (
    <>
      <div className={actionsClass}>
        <div className="flex items-center gap-2">
          {showDirtyIndicator && isDirty ? (
            <Badge
              variant="secondary"
              className="rounded-full border-none bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400 animate-in fade-in slide-in-from-left-2 px-2.5 py-0.5 text-[11px] font-medium"
            >
              <Circle className="mr-1.5 size-2 fill-current" />
              Modifications non enregistrées
            </Badge>
          ) : (
            <div className="w-1" />
          )}
        </div>

        <div className="flex items-center gap-2">
          {renderedExtra}

          {showUndoRedo && history ? (
            <div className="flex items-center gap-0.5 border-r border-border/40 pr-2.5 mr-0.5">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-8 rounded-md text-muted-foreground hover:text-foreground"
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
                className="size-8 rounded-md text-muted-foreground hover:text-foreground"
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
            className="rounded-md text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="mr-1.5 size-3.5" />
            {resetLabel}
          </Button>

          <Button
            type={confirmSubmit?.enabled ? "button" : "submit"}
            size="sm"
            disabled={isSubmitting || isLoading || (!isDirty && !canSubmit)}
            className="min-w-[120px] rounded-md"
            onClick={confirmSubmit?.enabled ? handleSubmitClick : undefined}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                Enregistrement...
              </>
            ) : (
              <>
                <Save className="mr-1.5 size-3.5" />
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
          <DialogContent className="sm:max-w-[425px] rounded-xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="size-5 text-amber-500" />
                {confirmSubmit.title ?? "Confirmer la soumission"}
              </DialogTitle>
              <DialogDescription className="pt-2">
                {confirmSubmit.message ??
                  "Êtes-vous sûr de vouloir soumettre ce formulaire ?"}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="mt-4 gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setConfirmOpen(false)}
                className="rounded-md"
              >
                Annuler
              </Button>
              <Button
                type="button"
                className="rounded-md"
                onClick={() => {
                  setConfirmOpen(false);
                  void form.handleSubmit();
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
