import * as React from "react";
import type { UseFormReturn } from "@tanstack/react-form";
import type { FormSchema, FormBuilderProps } from "../inputs/types";
import type {
  FormMetadata,
  ModelFormLayoutVariant,
  MutationError,
} from "../types";

export interface ModelFormContextValue<
  TValues extends Record<string, any> = Record<string, any>
> {
  metadata: FormMetadata | null;
  schema: FormSchema<TValues> | null;
  form: UseFormReturn<TValues>;
  loading: boolean;
  error?: Error;
  refetchMetadata: () => Promise<any>;
  formProps: FormBuilderProps<TValues>;
  layoutVariant?: ModelFormLayoutVariant<TValues>;
  headingTitle?: React.ReactNode;
  description?: string;
  showHeading: boolean;
  showSectionHeaders: boolean;
  containerClassName?: string;
  loadingMessage?: React.ReactNode;
  errorMessage?: React.ReactNode;
  mutationErrors: MutationError[];
  globalMutationErrors: MutationError[];
  resolveFieldLabel: (fieldName: string) => string | undefined;
}

const ModelFormContext = React.createContext<
  ModelFormContextValue | undefined
>(undefined);

export function ModelFormProvider<
  TValues extends Record<string, any> = Record<string, any>
>({
  value,
  children,
}: {
  value: ModelFormContextValue<TValues>;
  children: React.ReactNode;
}) {
  return (
    <ModelFormContext.Provider value={value as ModelFormContextValue}>
      {children}
    </ModelFormContext.Provider>
  );
}

export function useModelFormContext<
  TValues extends Record<string, any> = Record<string, any>
>() {
  const context = React.useContext(ModelFormContext);
  if (!context) {
    throw new Error("useModelFormContext must be used within ModelFormProvider");
  }
  return context as ModelFormContextValue<TValues>;
}
