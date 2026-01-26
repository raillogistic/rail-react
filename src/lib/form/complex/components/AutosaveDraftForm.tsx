import React from "react";
import { useForm } from "@tanstack/react-form";
import { Card } from "@/lib/components/ui/card";
import { Badge } from "@/lib/components/ui/badge";
import DynamicForm from "../../inputs/form";
import type { ChangeRecord, FormSchema } from "../../inputs/types";

export type AutosaveDraftFormProps<TValues extends Record<string, any>> = {
  schema: FormSchema<TValues>;
  defaultValues?: Partial<TValues>;
  onSubmit?: (values: TValues) => void | Promise<void>;
  onDraftSave: (values: TValues, changes: ChangeRecord[]) => void | Promise<void>;
  title?: string;
};

/**
 * Autosave pattern with debounced draft persistence.
 */
const AutosaveDraftForm = <TValues extends Record<string, any>>({
  schema,
  defaultValues,
  onSubmit,
  onDraftSave,
  title = "Autosave / brouillon",
}: AutosaveDraftFormProps<TValues>) => {
  const form = useForm<TValues>({
    defaultValues: (defaultValues ?? {}) as TValues,
    onSubmit: ({ value }) => onSubmit?.(value),
  });
  const [status, setStatus] = React.useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  const saveTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleChange = React.useCallback(
    (values: TValues, changes: ChangeRecord[]) => {
      if (saveTimer.current) {
        clearTimeout(saveTimer.current);
      }
      setStatus("saving");
      saveTimer.current = setTimeout(async () => {
        try {
          await onDraftSave(values, changes);
          setStatus("saved");
        } catch (error) {
          console.error(error);
          setStatus("error");
        }
      }, 400);
    },
    [onDraftSave]
  );

  return (
    <Card className="space-y-3 p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">{title}</p>
        <Badge
          variant={
            status === "saved"
              ? "secondary"
              : status === "saving"
              ? "outline"
              : status === "error"
              ? "destructive"
              : "outline"
          }
        >
          {status === "idle"
            ? "En attente"
            : status === "saving"
            ? "Sauvegarde…"
            : status === "saved"
            ? "Brouillon enregistré"
            : "Erreur"}
        </Badge>
      </div>
      <DynamicForm
        schema={schema}
        form={form}
        onChange={handleChange}
        submitLabel="Sauvegarder"
        disableAutoReset
      />
    </Card>
  );
};

export default AutosaveDraftForm;
