import React from "react";
import { useForm } from "@tanstack/react-form";
import { Card } from "@/lib/components/ui/card";
import { Badge } from "@/lib/components/ui/badge";
import DynamicForm from "../../inputs/form";
import type { FormSchema, FormSectionConfig } from "../../inputs/types";

export type DynamicSectionsFormProps<TValues extends Record<string, any>> = {
  baseSchema?: FormSchema<TValues>;
  baseSections?: FormSectionConfig<TValues>[];
  loadExtraSections: () =>
    | Promise<FormSectionConfig<TValues>[]>
    | FormSectionConfig<TValues>[];
  defaultValues?: Partial<TValues>;
  onSubmit?: (values: TValues) => void | Promise<void>;
  title?: string;
};

/**
 * Schema augmented by async data (permissions, feature flags).
 */
const DynamicSectionsForm = <TValues extends Record<string, any>>({
  baseSchema,
  baseSections,
  loadExtraSections,
  defaultValues,
  onSubmit,
  title = "Sections dynamiques",
}: DynamicSectionsFormProps<TValues>) => {
  const form = useForm<TValues>({
    defaultValues: (defaultValues ?? {}) as TValues,
    onSubmit: ({ value }) => onSubmit?.(value),
  });

  const [extraSections, setExtraSections] = React.useState<
    FormSectionConfig<TValues>[]
  >([]);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    let mounted = true;
    const run = async () => {
      setLoading(true);
      const result = await loadExtraSections();
      if (mounted) {
        setExtraSections(result ?? []);
        setLoading(false);
      }
    };
    void run();
    return () => {
      mounted = false;
    };
  }, [loadExtraSections]);

  const resolvedBase: FormSchema<TValues> =
    baseSchema ??
    (baseSections
      ? { id: "dynamic-base", sections: baseSections }
      : { id: "dynamic-base", sections: [] });

  const mergedSchema = React.useMemo<FormSchema<TValues>>(
    () => ({
      ...resolvedBase,
      sections: [...(resolvedBase.sections ?? []), ...(extraSections ?? [])],
    }),
    [resolvedBase, extraSections]
  );

  return (
    <Card className="space-y-3 p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">{title}</p>
        {loading ? <Badge variant="secondary">Chargement…</Badge> : null}
      </div>
      <DynamicForm
        schema={mergedSchema}
        form={form}
        submitLabel="Enregistrer"
        disableAutoReset
      />
    </Card>
  );
};

export default DynamicSectionsForm;
