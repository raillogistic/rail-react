import React from "react";
import { useForm, useStore, type UseFormReturn } from "@tanstack/react-form";
import { Card } from "@/lib/components/ui/card";
import { Badge } from "@/lib/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/lib/components/ui/collapsible";
import DynamicForm from "../../inputs/form";
import type { FormSectionConfig } from "../../inputs/types";
import type { FormBuilderProps } from "../../inputs/types";

type AllowedFormProps<TValues extends Record<string, any>> = Omit<
  FormBuilderProps<TValues>,
  "schema" | "form"
>;

export type AccordionSectionsFormProps<TValues extends Record<string, any>> = {
  sections: FormSectionConfig<TValues>[];
  defaultValues?: Partial<TValues>;
  onSubmit?: (values: TValues) => void | Promise<void>;
  title?: string;
  form?: UseFormReturn<TValues>;
  formProps?: Partial<AllowedFormProps<TValues>>;
};

/**
 * Accordion layout: one section visible at a time, stacked headers.
 */
const AccordionSectionsForm = <TValues extends Record<string, any>>({
  sections,
  defaultValues,
  onSubmit,
  title = "Sections empilées",
  form,
  formProps,
}: AccordionSectionsFormProps<TValues>) => {
  const internalForm = useForm<TValues>({
    defaultValues: (defaultValues ?? {}) as TValues,
    onSubmit: ({ value }) => onSubmit?.(value),
  });
  const resolvedForm = form ?? internalForm;
  const values = useStore(
    resolvedForm.store,
    (state) => state.values as TValues
  );
  const keyedSections = React.useMemo(
    () =>
      sections.map((section, index) => ({
        key: [
          section.id ?? section.title ?? section.fields[0]?.name ?? "section",
          index,
        ]
          .filter(Boolean)
          .join("-"),
        section,
      })),
    [sections]
  );
  const [openId, setOpenId] = React.useState<string | null>(
    keyedSections[0]?.key ?? null
  );
  React.useEffect(() => {
    if (!keyedSections.length) {
      setOpenId(null);
      return;
    }
    setOpenId((current) => {
      if (current && keyedSections.some(({ key }) => key === current)) {
        return current;
      }
      return keyedSections[0]?.key ?? null;
    });
  }, [keyedSections]);

  const mergedFormProps = React.useMemo(
    () => ({
      disableAutoReset: true,
      showSectionHeaders: false,
      ...formProps,
    }),
    [formProps]
  );

  if (!sections.length) {
    return (
      <Card className="p-4 text-sm text-muted-foreground">
        Aucun schéma fourni.
      </Card>
    );
  }

  return (
    <Card className="space-y-3 bg-slate-100/70 p-4 shadow-sm dark:bg-slate-900/40">
      <p className="text-sm font-semibold">{title}</p>
      <div className="space-y-2">
        {keyedSections.map(({ key, section }) => (
          <Collapsible
            key={key}
            open={openId === key}
            onOpenChange={(open) => setOpenId(open ? key : null)}
            className="rounded-lg border border-border/70 bg-transparent"
          >
            <CollapsibleTrigger className="w-full">
              <div className="flex w-full items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm font-semibold">
                    {section.title ?? section.id ?? "Section"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Cliquez pour développer
                  </p>
                </div>
                <Badge variant="secondary">
                  {openId === key ? "Ouvert" : "Fermé"}
                </Badge>
              </div>
            </CollapsibleTrigger>
            {openId === key ? (
              <CollapsibleContent className="border-t p-3">
                <DynamicForm
                  form={resolvedForm}
                  schema={{ id: section.id ?? key, sections: [section] }}
                  submitLabel="Enregistrer la section"
                  resetLabel="Réinitialiser"
                  {...mergedFormProps}
                  onSubmit={() => onSubmit?.(values)}
                />
              </CollapsibleContent>
            ) : null}
          </Collapsible>
        ))}
      </div>
    </Card>
  );
};

export default AccordionSectionsForm;
