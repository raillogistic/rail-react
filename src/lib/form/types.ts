import type React from "react";
import type { FormBuilderProps } from "./inputs/types";

export * from "./inputs/types";
export type { MutationError } from "./mutations";

export interface ModelFormProps<
  TFormValues extends Record<string, any> = Record<string, any>
> extends Partial<FormBuilderProps<TFormValues>> {
  appName?: string;
  modelName?: string;
  mutationMode?: "create" | "update" | null;
  mutationId?: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  showHeading?: boolean;
  showSectionHeaders?: boolean;
  containerClassName?: string;
  only?: string[];
  exclude?: string[];
  onlyRelationships?: string[];
  excludeRelationships?: string[];
  nestedFields?: string[];
}
