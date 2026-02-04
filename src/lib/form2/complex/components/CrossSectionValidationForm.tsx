import React from "react";
import { useForm } from "@tanstack/react-form";
import { Card } from "@/lib/components/ui/card";
import DynamicForm from "../../inputs/form";
import type { FormSchema } from "../../inputs/types";

export type CrossSectionValidationFormProps<
  TValues extends Record<string, any>
> = {
  schema: FormSchema<TValues>;
  defaultValues?: Partial<TValues>;
  onSubmit?: (values: TValues) => void | Promise<void>;
  title?: string;
  debug?: boolean;
};

/**
 * Renders a schema with potential cross-field validators.
 */
const CrossSectionValidationForm = <TValues extends Record<string, any>>({
  schema,
  defaultValues,
  onSubmit,
  title = "Validation transverse",
  debug = false,
}: CrossSectionValidationFormProps<TValues>) => {
  const form = useForm<TValues>({
    defaultValues: (defaultValues ?? {}) as TValues,
    onSubmit: ({ value }) => onSubmit?.(value),
  });

  return (
    <Card className="space-y-3 p-4">
      <p className="text-sm font-semibold">{title}</p>
      <DynamicForm
        schema={schema}
        form={form}
        submitLabel="Enregistrer"
        debug={debug}
        disableAutoReset
      />
    </Card>
  );
};

export default CrossSectionValidationForm;
