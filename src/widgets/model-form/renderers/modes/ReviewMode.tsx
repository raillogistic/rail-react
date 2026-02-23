/**
 * Review mode: toggleable read-only state with optional summary view.
 *
 * Replaces the old ReviewLockForm component.
 */
import React from "react";
import type { UseFormReturn } from "@tanstack/react-form";
import { useStore } from "@tanstack/react-form";
import { Button } from "@/shared/ui/kit/button";
import { Card } from "@/shared/ui/kit/card";
import { cn } from "@/shared/utils";
import { Lock, Unlock, ClipboardCheck, Info } from "lucide-react";
import type { FormSectionConfig } from "../../types/schema";
import type { FormLayoutMode } from "../../types/layout";
import { StandardMode } from "./StandardMode";

type ReviewConfig<TValues> = Extract<
  FormLayoutMode<TValues>,
  { type: "review" }
>;

export type ReviewModeProps<TValues> = {
  sections: FormSectionConfig[];
  form: UseFormReturn<TValues>;
  columns: number;
  variant: "default" | "compact" | "popup";
  config: ReviewConfig<TValues>;
  hiddenFields?: Set<string>;
  hiddenSections?: Set<string>;
  globalReadOnly?: boolean;
  globalDisabled?: boolean;
};

export const ReviewMode = <TValues extends Record<string, any>>({
  sections,
  form,
  columns,
  variant,
  config,
  hiddenFields,
  hiddenSections,
  globalReadOnly,
  globalDisabled,
}: ReviewModeProps<TValues>) => {
  const [locked, setLocked] = React.useState(false);
  const values = useStore(form.store, (state) => state.values as TValues);

  const effectiveReadOnly = globalReadOnly || locked;

  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-500">
      <div className={cn(
        "flex flex-wrap items-center justify-between gap-4 rounded-xl border p-4 shadow-sm transition-all duration-300",
        locked 
          ? "border-amber-200 bg-amber-50/50 dark:border-amber-900/30 dark:bg-amber-950/20" 
          : "border-primary/20 bg-primary/5"
      )}>
        <div className="flex items-center gap-3">
          <div className={cn(
            "flex size-10 items-center justify-center rounded-full shadow-sm",
            locked ? "bg-amber-100 text-amber-600 dark:bg-amber-900/50" : "bg-primary/10 text-primary"
          )}>
            {locked ? <Lock className="size-5" /> : <Unlock className="size-5" />}
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold tracking-tight">
              {locked ? "Mode révision" : "Mode édition"}
            </span>
            <span className="text-xs text-muted-foreground/80">
              {locked
                ? "Le formulaire est verrouillé pour révision."
                : "Vous pouvez modifier les champs du formulaire."}
            </span>
          </div>
        </div>
        
        <Button
          type="button"
          variant={locked ? "default" : "outline"}
          size="sm"
          className={cn(
            "min-w-[140px] shadow-sm transition-all active:scale-[0.98]",
            !locked && "border-primary/30 text-primary hover:bg-primary/5 hover:text-primary"
          )}
          onClick={() => setLocked((c) => !c)}
        >
          {locked ? (
            <><Unlock className="mr-2 size-4" /> Déverrouiller</>
          ) : (
            <><Lock className="mr-2 size-4" /> Verrouiller pour révision</>
          )}
        </Button>
      </div>

      {config.renderSummary && locked && (
        <div className="flex flex-col gap-4 animate-in slide-in-from-top-4 duration-500">
          <div className="flex items-center gap-2 px-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
             <ClipboardCheck className="size-4 text-primary" />
             Résumé de la soumission
          </div>
          <Card className="overflow-hidden border-border/40 bg-muted/5 shadow-inner">
            <div className="p-6">
              {config.renderSummary(values)}
            </div>
          </Card>
        </div>
      )}

      <div className="relative">
        {locked && (
          <div className="pointer-events-none absolute inset-0 z-10 flex items-start justify-center pt-20">
             <div className="flex items-center gap-2 rounded-full bg-background/80 px-4 py-2 text-xs font-bold text-muted-foreground shadow-lg backdrop-blur-md border border-border/40">
                <Info className="size-3.5 text-amber-500" />
                Lecture seule
             </div>
          </div>
        )}
        <div className={cn(
          "transition-all duration-500",
          locked ? "opacity-60 grayscale-[0.2]" : "opacity-100"
        )}>
          <StandardMode
            sections={sections}
            form={form}
            columns={columns}
            showHeaders
            variant={variant}
            hiddenFields={hiddenFields}
            hiddenSections={hiddenSections}
            globalReadOnly={effectiveReadOnly}
            globalDisabled={globalDisabled}
          />
        </div>
      </div>
    </div>
  );
};
