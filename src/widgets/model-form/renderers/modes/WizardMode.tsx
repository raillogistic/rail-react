/**
 * Wizard mode: renders one section at a time with step navigation.
 *
 * Replaces the old MultiStepWizardForm and BranchingWizardForm components.
 */
import React from "react";
import type { UseFormReturn } from "@tanstack/react-form";
import { useStore } from "@tanstack/react-form";
import { Button } from "@/shared/ui/kit/button";
import { Badge } from "@/shared/ui/kit/badge";
import { cn } from "@/shared/utils";
import { ChevronRight, ChevronLeft, Check, Send } from "lucide-react";
import type { FormSectionConfig } from "../../types/schema";
import type { FormLayoutMode } from "../../types/layout";
import { SectionRenderer } from "../SectionRenderer";

type WizardConfig<TValues> = Extract<
  FormLayoutMode<TValues>,
  { type: "wizard" }
>;

export type WizardModeProps<TValues> = {
  sections: FormSectionConfig[];
  form: UseFormReturn<TValues>;
  columns: number;
  variant: "default" | "compact" | "popup";
  config: WizardConfig<TValues>;
  hiddenFields?: Set<string>;
  hiddenSections?: Set<string>;
  globalReadOnly?: boolean;
  globalDisabled?: boolean;
  onFinalSubmit?: () => void;
};

export const WizardMode = <TValues extends Record<string, any>>({
  sections,
  form,
  columns,
  variant,
  config,
  hiddenFields,
  hiddenSections,
  globalReadOnly,
  globalDisabled,
  onFinalSubmit,
}: WizardModeProps<TValues>) => {
  const values = useStore(form.store, (state: any) => state.values as TValues);

  const visibleSections = React.useMemo(() => {
    let resolved = sections.filter((section, index) => {
      const sectionId = section.id ?? `__section_${index}`;
      if (hiddenSections?.has(sectionId)) return false;
      if (section.visible && !section.visible(values)) return false;
      return true;
    });

    if (config.resolveSteps) {
      const indices = config.resolveSteps(values);
      resolved = indices
        .map((i) => sections[i])
        .filter(Boolean) as FormSectionConfig[];
    }

    return resolved;
  }, [sections, hiddenSections, values, config]);

  const [stepIndex, setStepIndex] = React.useState(0);

  // Clamp step if sections shrink
  React.useEffect(() => {
    if (stepIndex >= visibleSections.length && visibleSections.length > 0) {
      setStepIndex(visibleSections.length - 1);
    }
  }, [visibleSections.length, stepIndex]);

  const currentSection = visibleSections[stepIndex];
  const isLast = stepIndex >= visibleSections.length - 1;
  const totalSteps = visibleSections.length;

  const handleNext = React.useCallback(() => {
    const section = visibleSections[stepIndex];
    if (section?.step?.canAdvance) {
      const result = section.step.canAdvance(values);
      if (result !== true) return;
    }
    setStepIndex((prev) => Math.min(totalSteps - 1, prev + 1));
  }, [stepIndex, visibleSections, values, totalSteps]);

  const handlePrev = React.useCallback(() => {
    setStepIndex((prev) => Math.max(0, prev - 1));
  }, []);

  if (!visibleSections.length) {
    return (
      <div className="flex flex-col items-center justify-center border border-dashed border-border/60 py-20 px-4 text-center">
        <p className="text-sm font-medium text-muted-foreground/60">
          Aucune étape définie.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {config.showProgress !== false ? (
        <div className="relative flex flex-col gap-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold tracking-tight">
                Étape {stepIndex + 1} sur {totalSteps}
              </span>
            </div>
            <Badge
              variant="secondary"
              className="bg-primary/5 text-primary border-primary/20 font-bold px-2 py-0.5 text-[10px] uppercase tracking-wider "
            >
              {Math.round(((stepIndex + 1) / totalSteps) * 100)}% complété
            </Badge>
          </div>

          <div className="flex items-center gap-2 px-1">
            {visibleSections.map((section, index) => {
              const isActive = index === stepIndex;
              const isCompleted = index < stepIndex;
              const isClickable = config.allowSkip || index < stepIndex; // Determine if the step is clickable

              return (
                <React.Fragment key={section.id ?? index}>
                  <button
                    type="button"
                    disabled={!isClickable} // Use isClickable for disabled state
                    onClick={() => {
                      if (isClickable) {
                        setStepIndex(index);
                      }
                    }}
                    className={cn(
                      "group relative flex w-full flex-col gap-2  p-2 transition-all duration-300",
                      isClickable && "cursor-pointer hover:bg-muted/50",
                    )}
                  >
                    <div
                      className={cn(
                        "relative h-1.5 w-full overflow-hidden transition-all duration-300 ", // Added  here
                        isActive
                          ? "bg-primary"
                          : isCompleted
                            ? "bg-primary/40"
                            : "bg-muted hover:bg-muted/80",
                      )}
                      title={
                        section.step?.label ??
                        section.title ??
                        `Étape ${index + 1}`
                      }
                    >
                      {isActive && (
                        <div className="absolute inset-0 bg-white/20 animate-pulse" />
                      )}
                    </div>
                    <span
                      className={cn(
                        "hidden sm:block text-[10px] font-bold uppercase tracking-tight transition-colors truncate px-0.5",
                        isActive ? "text-primary" : "text-muted-foreground/60",
                      )}
                    >
                      {section.step?.label ??
                        section.title ??
                        `Étape ${index + 1}`}
                    </span>
                  </button>
                </React.Fragment>
              );
            })}
          </div>
        </div>
      ) : null}

      <div className="animate-in fade-in slide-in-from-right-4 duration-500 ease-out">
        {currentSection ? (
          <SectionRenderer
            section={{
              ...currentSection,
              title: currentSection.title,
            }}
            form={form}
            columns={currentSection.columns ?? columns}
            showHeaders
            variant={variant}
            hiddenFields={hiddenFields}
            globalReadOnly={globalReadOnly}
            globalDisabled={globalDisabled}
          />
        ) : null}
      </div>

      <div className="mt-4 flex items-center justify-between gap-4 border-t pt-6">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="min-w-[100px] border-border/60 hover:bg-muted/50 "
          disabled={stepIndex === 0}
          onClick={handlePrev}
        >
          <ChevronLeft className="mr-2 size-4" />
          Précédent
        </Button>

        <div className="flex items-center gap-3">
          {isLast ? (
            <Button
              type="submit"
              size="sm"
              className="min-w-[120px]  /20 "
              onClick={(e) => {
                e.preventDefault();
                onFinalSubmit?.();
              }}
            >
              <Send className="mr-2 size-4" />
              Terminer
            </Button>
          ) : (
            <Button
              type="button"
              size="sm"
              className="min-w-[120px]  /10 "
              onClick={handleNext}
            >
              Continuer
              <ChevronRight className="ml-2 size-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
