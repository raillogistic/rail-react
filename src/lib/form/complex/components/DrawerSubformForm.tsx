import React from "react";
import { useForm } from "@tanstack/react-form";
import { Card } from "@/lib/components/ui/card";
import { Button } from "@/lib/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/lib/components/ui/drawer";
import DynamicForm from "../../inputs/form";
import type { FormSchema, FormSectionConfig } from "../../inputs/types";

export type DrawerSubformFormProps<TValues extends Record<string, any>> = {
  schema?: FormSchema<TValues>;
  sections?: FormSectionConfig<TValues>[];
  drawerSchema: FormSchema<TValues>;
  defaultValues?: Partial<TValues>;
  onSubmit?: (values: TValues) => void | Promise<void>;
  onDrawerSubmit?: (values: TValues) => void | Promise<void>;
  triggerLabel?: string;
  title?: string;
  drawerTitle?: string;
  drawerDescription?: string;
};

/**
 * Drawer-based nested editor bound to the same form store.
 */
const DrawerSubformForm = <TValues extends Record<string, any>>({
  schema,
  sections,
  drawerSchema,
  defaultValues,
  onSubmit,
  onDrawerSubmit,
  triggerLabel = "Ouvrir le tiroir",
  title = "Sous-formulaire en drawer",
  drawerTitle = "Edition en tiroir",
  drawerDescription = "Modifier sans quitter le contexte principal.",
}: DrawerSubformFormProps<TValues>) => {
  const form = useForm<TValues>({
    defaultValues: (defaultValues ?? {}) as TValues,
    onSubmit: ({ value }) => onSubmit?.(value),
  });
  const [open, setOpen] = React.useState(false);

  const resolvedSchema: FormSchema<TValues> = React.useMemo(() => {
    if (schema) return schema;
    if (sections) return { id: "drawer-parent", sections };
    return { id: "drawer-parent", sections: [] };
  }, [schema, sections]);

  return (
    <Card className="space-y-3 p-4">
      <p className="text-sm font-semibold">{title}</p>
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerTrigger asChild>
          <Button type="button" variant="outline">
            {triggerLabel}
          </Button>
        </DrawerTrigger>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>{drawerTitle}</DrawerTitle>
            <DrawerDescription>{drawerDescription}</DrawerDescription>
          </DrawerHeader>
          <div className="p-4">
            <DynamicForm
              schema={drawerSchema}
              form={form}
              submitLabel="Enregistrer"
              onSubmit={async (values) => {
                await onDrawerSubmit?.(values);
                setOpen(false);
              }}
              disableAutoReset
            />
          </div>
          <DrawerFooter>
            <DrawerClose asChild>
              <Button variant="secondary">Fermer</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
      <DynamicForm
        schema={resolvedSchema}
        form={form}
        submitLabel="Enregistrer"
        disableAutoReset
      />
    </Card>
  );
};

export default DrawerSubformForm;
