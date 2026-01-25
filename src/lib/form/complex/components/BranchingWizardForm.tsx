import React from "react";
import { useForm, useStore } from "@tanstack/react-form";
import { Card } from "@/lib/components/ui/card";
import { Button } from "@/lib/components/ui/button";
import { Badge } from "@/lib/components/ui/badge";
import DynamicForm from "../../inputs/form";
import type { FormSectionConfig } from "../../inputs/types";

export type BranchingWizardFormProps<TValues extends Record<string, any>> = {
  /** Returns the ordered sections to render based on current values. */
  resolveSections: (values: TValues) => FormSectionConfig<TValues>[];
  defaultValues?: Partial<TValues>;
  onSubmit?: (values: TValues) => void | Promise<void>;
  title?: string;
  finalSubmitLabel?: string;
};

/**
 * Wizard whose path depends on current form values. The section list is
 * recomputed on every render using `resolveSections`.
 */
const BranchingWizardForm = <TValues extends Record<string, any>>({
  resolveSections,
  defaultValues,
  onSubmit,
  title = "Wizard conditionnel",
  finalSubmitLabel = "Soumettre",
}: BranchingWizardFormProps<TValues>) => {
  const [stepIndex, setStepIndex] = React.useState(0);
  const stepRef = React.useRef(stepIndex);
  React.useEffect(() => {
    stepRef.current = stepIndex;
  }, [stepIndex]);

  const form = useForm<TValues>({
    defaultValues: (defaultValues ?? {}) as TValues,
    onSubmit: async ({ value }) => {
      const path = resolveSections(value);
      const lastIndex = Math.max(0, path.length - 1);
      if (stepRef.current < lastIndex) {
        setStepIndex((prev) => Math.min(lastIndex, prev + 1));
        return;
      }
      await onSubmit?.(value);
    },
  });

  const values = useStore(form.store, (state) => state.values as TValues);
  const path = React.useMemo(
    () => resolveSections(values),
    [resolveSections, values]
  );
  React.useEffect(() => {
    if (stepIndex > path.length - 1) {
      setStepIndex(Math.max(0, path.length - 1));
    }
  }, [path.length, stepIndex]);

  const currentSection = path[stepIndex];
  const lastIndex = Math.max(0, path.length - 1);

  if (!path.length) {
    return (
      <Card className="p-4 text-sm text-muted-foreground">
        Aucun parcours défini.
      </Card>
    );
  }

  return (
    <Card className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold">{title}</p>
          <p className="text-xs text-muted-foreground">
            Le chemin dépend des valeurs courantes.
          </p>
        </div>
        <Badge variant="outline">
          Étape {Math.min(stepIndex + 1, path.length)} / {path.length}
        </Badge>
      </div>
      <DynamicForm
        schema={{
          id: "branching",
          sections: currentSection ? [currentSection] : [],
        }}
        form={form}
        submitLabel={stepIndex === lastIndex ? finalSubmitLabel : "Continuer"}
        disableAutoReset
        actionSlot={
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              disabled={stepIndex === 0}
              onClick={() => setStepIndex((prev) => Math.max(0, prev - 1))}
            >
              Retour
            </Button>
          </div>
        }
      />
    </Card>
  );
};

export default BranchingWizardForm;
