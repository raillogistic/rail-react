import React from "react";
import { useForm, useStore, type UseFormReturn } from "@tanstack/react-form";
import { Card } from "@/lib/components/ui/card";
import { cn } from "@/lib/utils";
import DynamicForm from "../../inputs/form";
import type {
  FormBuilderProps,
  FormSchema,
  FormSectionConfig,
} from "../../inputs/types";

type AllowedFormProps<TValues extends Record<string, any>> = Omit<
  FormBuilderProps<TValues>,
  "schema" | "form"
>;

export type MasterDetailPreviewFormProps<TValues extends Record<string, any>> = {
  schema?: FormSchema<TValues>;
  sections?: FormSectionConfig<TValues>[];
  defaultValues?: Partial<TValues>;
  onSubmit?: (values: TValues) => void | Promise<void>;
  renderPreview: (values: TValues) => React.ReactNode;
  title?: string;
  className?: string;
  detailsCardClassName?: string;
  previewCardClassName?: string;
  formProps?: Partial<AllowedFormProps<TValues>>;
  renderToolbar?: (context: { form: UseFormReturn<TValues> }) => React.ReactNode;
  form?: UseFormReturn<TValues>;
};

/**
 * Split layout with live preview (custom render prop).
 */
const MasterDetailPreviewForm = <TValues extends Record<string, any>>({
  schema,
  sections,
  defaultValues,
  onSubmit,
  renderPreview,
  title,
  className,
  detailsCardClassName,
  previewCardClassName,
  formProps,
  renderToolbar,
  form,
}: MasterDetailPreviewFormProps<TValues>) => {
  const internalForm = useForm<TValues>({
    defaultValues: (defaultValues ?? {}) as TValues,
    onSubmit: ({ value }) => onSubmit?.(value),
  });
  const resolvedForm = form ?? internalForm;
  const values = useStore(resolvedForm.store, (state) => state.values as TValues);

  const resolvedSchema = React.useMemo<FormSchema<TValues>>(() => {
    if (schema) return schema;
    if (sections) return { id: "master", sections };
    return { id: "master", sections: [] };
  }, [schema, sections]);

  const mergedFormProps = React.useMemo(
    () => ({
      disableAutoReset: true,
      ...formProps,
    }),
    [formProps]
  );

  return (
    <div className={cn("grid gap-3 lg:grid-cols-3 items-start", className)}>
      <Card className={cn("lg:col-span-2 space-y-4 p-4", detailsCardClassName)}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-semibold">{title}</p>
          {renderToolbar ? renderToolbar({ form: resolvedForm }) : null}
        </div>
        <DynamicForm
          schema={resolvedSchema}
          form={resolvedForm}
          {...mergedFormProps}
        />
      </Card>
      <Card className={cn("space-y-3 p-4 h-fit", previewCardClassName)}>
        {renderPreview(values)}
      </Card>
    </div>
  );
};

export default MasterDetailPreviewForm;
