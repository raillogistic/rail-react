/**
 * Model-form level types (ModelFormProps and related).
 *
 * These types are used by the higher-level ModelForm component
 * that wraps DynamicForm with backend metadata integration.
 */
import type React from "react";
import type { DynamicFormProps } from "./types/props";

export type { MutationError } from "./mutations";

export interface ModelFormProps<
  TFormValues extends Record<string, any> = Record<string, any>,
> extends Partial<DynamicFormProps<TFormValues>> {
  appName?: string;
  modelName?: string;
  mutationMode?: "create" | "update" | null;
  mutationId?: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  showHeading?: boolean;
  containerClassName?: string;
  only?: string[];
  exclude?: string[];
  onlyRelationships?: string[];
  excludeRelationships?: string[];
  nestedFields?: string[];
}
