import React from "react";
import { useForm } from "@tanstack/react-form";
import { Card } from "@/lib/components/ui/card";
import { Button } from "@/lib/components/ui/button";
import DynamicForm from "../../inputs/form";
import type { FormSchema, FormSectionConfig } from "../../inputs/types";

export type ReviewLockFormProps<TValues extends Record<string, any>> = {
  schema?: FormSchema<TValues>;
  sections?: FormSectionConfig<TValues>[];
  defaultValues?: Partial<TValues>;
  onSubmit?: (values: TValues) => void | Promise<void>;
  title?: string;
};

/**
 * Review step rendering the same form in read-only mode.
 */
const ReviewLockForm = <TValues extends Record<string, any>>({
  schema,
  sections,
  defaultValues,
  onSubmit,
  title = "Écran de revue",
}: ReviewLockFormProps<TValues>) => {
  const form = useForm<TValues>({
    defaultValues: (defaultValues ?? {}) as TValues,
    onSubmit: ({ value }) => onSubmit?.(value),
  });

  const [locked, setLocked] = React.useState(false);
  const resolvedSchema = React.useMemo<FormSchema<TValues>>(() => {
    const base: FormSchema<TValues> =
      schema ??
      (sections
        ? {
            id: "review",
            sections,
          }
        : { id: "review", sections: [] });
    return {
      ...base,
      sections: (base.sections ?? []).map((section) => ({
        ...section,
        fields: section.fields.map((field) => ({
          ...field,
          readOnly: locked || field.readOnly,
          disabled: locked || field.disabled,
        })),
      })),
    };
  }, [schema, sections, locked]);

  return (
    <Card className="space-y-3 p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold">{title}</p>
          <p className="text-xs text-muted-foreground">
            Basculer en lecture seule pour verrouiller la saisie.
          </p>
        </div>
        <Button
          variant={locked ? "secondary" : "outline"}
          onClick={() => setLocked((current) => !current)}
        >
          {locked ? "Déverrouiller" : "Verrouiller"}
        </Button>
      </div>
      <DynamicForm
        schema={resolvedSchema}
        form={form}
        submitLabel={locked ? "Valider" : "Enregistrer"}
        resetLabel="Réinitialiser"
        disableAutoReset
      />
    </Card>
  );
};

export default ReviewLockForm;
