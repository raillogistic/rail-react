import React from "react";
import { useForm } from "@tanstack/react-form";
import { Card } from "@/lib/components/ui/card";
import { Button } from "@/lib/components/ui/button";
import { Badge } from "@/lib/components/ui/badge";
import DynamicForm from "../../inputs/form";
import type { FormSchema, FormSectionConfig } from "../../inputs/types";

export type MultiStepWizardFormProps<TValues extends Record<string, any>> = {
  /** Ordered sections composing the wizard. */
  sections: FormSectionConfig<TValues>[];
  /** Optional defaults merged into the form. */
  defaultValues?: Partial<TValues>;
  /** Called when the final step is submitted. */
  onSubmit?: (values: TValues) => void | Promise<void>;
  title?: string;
  finalSubmitLabel?: string;
  resetLabel?: string;
};

/**
 * Multi-step wizard that slices a schema by section while sharing a single
 * TanStack form store. Schema content is provided by the caller (no shared fields).
 */
const MultiStepWizardForm = <TValues extends Record<string, any>>({
  sections,
  defaultValues,
  onSubmit,
  title = "Assistant multi-étapes",
  finalSubmitLabel = "Valider",
  resetLabel = "Réinitialiser",
}: MultiStepWizardFormProps<TValues>) => {
  const [stepIndex, setStepIndex] = React.useState(0);
  const stepRef = React.useRef(stepIndex);
  React.useEffect(() => {
    stepRef.current = stepIndex;
  }, [stepIndex]);

  const form = useForm<TValues>({
    defaultValues: (defaultValues ?? {}) as TValues,
    onSubmit: async ({ value }) => {
      if (stepRef.current < Math.max(0, sections.length - 1)) {
        setStepIndex((current) => Math.min(sections.length - 1, current + 1));
        return;
      }
      await onSubmit?.(value);
    },
  });

  const stepSchema = React.useMemo<FormSchema<TValues>>(
    () => ({
      id: "wizard",
      sections: sections[stepIndex]
        ? [
            {
              ...sections[stepIndex],
              title:
                sections[stepIndex]?.title ??
                `Étape ${stepIndex + 1} / ${sections.length}`,
            },
          ]
        : [],
    }),
    [sections, stepIndex]
  );

  const isLast = stepIndex >= sections.length - 1;

  if (!sections.length) {
    return (
      <Card className="p-4 text-sm text-muted-foreground">
        Aucun schéma fourni.
      </Card>
    );
  }

  return (
    <Card className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold">{title}</p>
          <p className="text-xs text-muted-foreground">
            Schéma piloté par vos sections.
          </p>
        </div>
        <Badge variant="outline">
          Étape {Math.min(stepIndex + 1, sections.length)} / {sections.length}
        </Badge>
      </div>
      <DynamicForm
        schema={stepSchema}
        form={form}
        submitLabel={isLast ? finalSubmitLabel : "Continuer"}
        resetLabel={resetLabel}
        disableAutoReset
        actionSlot={
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              disabled={stepIndex === 0}
              onClick={() => setStepIndex((current) => Math.max(0, current - 1))}
            >
              Précédent
            </Button>
            {!isLast ? (
              <Button
                type="button"
                onClick={() => form.handleSubmit()}
                variant="outline"
              >
                Sauvegarder et continuer
              </Button>
            ) : null}
          </div>
        }
      />
    </Card>
  );
};

export default MultiStepWizardForm;
