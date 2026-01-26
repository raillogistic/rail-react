import React from "react";
import { useForm } from "@tanstack/react-form";
import { Card } from "@/lib/components/ui/card";
import { Button } from "@/lib/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/lib/components/ui/dialog";
import DynamicForm from "../../inputs/form";
import type { FormSchema, FormSectionConfig } from "../../inputs/types";

export type ModalSubformFormProps<TValues extends Record<string, any>> = {
  /** Primary schema rendered in the page. */
  schema?: FormSchema<TValues>;
  sections?: FormSectionConfig<TValues>[];
  /** Schema rendered inside the modal (same form instance). */
  modalSchema: FormSchema<TValues>;
  defaultValues?: Partial<TValues>;
  onSubmit?: (values: TValues) => void | Promise<void>;
  onModalSubmit?: (values: TValues) => void | Promise<void>;
  triggerLabel?: string;
  title?: string;
  modalTitle?: string;
  modalDescription?: string;
};

/**
 * Modal subform that hydrates the same store as the parent form.
 */
const ModalSubformForm = <TValues extends Record<string, any>>({
  schema,
  sections,
  modalSchema,
  defaultValues,
  onSubmit,
  onModalSubmit,
  triggerLabel = "Ouvrir la fenêtre",
  title = "Sous-formulaire en modal",
  modalTitle = "Formulaire complémentaire",
  modalDescription = "Les données sont liées au formulaire principal.",
}: ModalSubformFormProps<TValues>) => {
  const form = useForm<TValues>({
    defaultValues: (defaultValues ?? {}) as TValues,
    onSubmit: ({ value }) => onSubmit?.(value),
  });
  const [modalOpen, setModalOpen] = React.useState(false);

  const resolvedSchema: FormSchema<TValues> = React.useMemo(() => {
    if (schema) return schema;
    if (sections) return { id: "modal-parent", sections };
    return { id: "modal-parent", sections: [] };
  }, [schema, sections]);

  return (
    <Card className="space-y-3 p-4">
      <p className="text-sm font-semibold">{title}</p>
      <DynamicForm
        schema={resolvedSchema}
        form={form}
        submitLabel="Enregistrer"
        disableAutoReset
        actionSlot={
          <Dialog open={modalOpen} onOpenChange={setModalOpen}>
            <DialogTrigger asChild>
              <Button type="button" variant="outline">
                {triggerLabel}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{modalTitle}</DialogTitle>
                <DialogDescription>{modalDescription}</DialogDescription>
              </DialogHeader>
              <DynamicForm
                schema={modalSchema}
                form={form}
                submitLabel="Enregistrer"
                resetLabel="Réinitialiser"
                onSubmit={async (values) => {
                  await onModalSubmit?.(values);
                  setModalOpen(false);
                }}
                disableAutoReset
              />
              <DialogFooter className="flex justify-end">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setModalOpen(false)}
                >
                  Fermer
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />
    </Card>
  );
};

export default ModalSubformForm;
