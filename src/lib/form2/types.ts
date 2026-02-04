import type React from "react";
import type {
  FormBuilderProps,
  FormFieldConfig,
  FormSchema,
  FormSectionConfig,
  ChangeRecord,
} from "./inputs/types";
import type { UseFormReturn } from "@tanstack/react-form";
import type {
  QueryHookOptions,
  MutationHookOptions,
  MutationResult,
  ApolloError,
} from "@apollo/client";
import type {
  ModelSchema,
  FieldSchema,
  RelationshipSchema,
} from "../tablev2/types";
import type {
  CreateMutationResponse,
  CreateMutationVariables,
  UpdateMutationResponse,
  UpdateMutationVariables,
  MutationError,
} from "./mutations";

export type { ModelSchema, FieldSchema, RelationshipSchema, MutationError };

export type FormMetadata = ModelSchema;

export interface FieldGroup {
  key: string;
  label: string;
  description?: string | null;
  fields: string[];
  collapsed?: boolean | null;
}

export type CustomFieldOrderValue =
  | string[]
  | ((context: { metadata: FormMetadata }) => string[]);

export type ModelFormOrderingOptions = {
  customFieldOrder?: CustomFieldOrderValue;
  fieldOrder?: string[];
  pinnedFields?: string[];
  trailingFields?: string[];
  sortRemainingFields?: "metadata" | "alphabetical";
};

export type ModelFormSectionChangeHandler<TValues extends Record<string, any>> = (
  values: TValues,
  changes: ChangeRecord[],
  form: FormBuilderProps<TValues>["form"],
  section: FormSectionConfig
) => void;

export type ModelFormSectionFieldDescriptor =
  | string
  | FormFieldConfig
  | "required"
  | "all";

export type ModelFormSectionDefinition<TValues extends Record<string, any>> = {
  id?: string;
  title?: string;
  description?: string;
  columns?: number;
  ordering?: ModelFormOrderingOptions;
  fields: ModelFormSectionFieldDescriptor[] | "required" | "all";
  onChange?: ModelFormSectionChangeHandler<TValues>;
  overrideFieldsMeta?: Record<string, Partial<FormFieldConfig>>;
};

export type ModelFormSectionsControl<TValues extends Record<string, any>> = {
  ordering?: ModelFormOrderingOptions;
  sections?: Array<ModelFormSectionDefinition<TValues>>;
  fallbackSection?: Omit<ModelFormSectionDefinition<TValues>, "fields"> & {
    fields?: ModelFormSectionFieldDescriptor[] | "all";
  };
  sectionOverrides?: Record<
    number,
    Partial<FormSectionConfig> & {
      overrideFieldsMeta?: Record<string, Partial<FormFieldConfig>>;
    }
  >;
};

export type ModelFormLayoutVariant<TValues extends Record<string, any>> =
  | {
      variant?: "default";
    }
  | {
      variant: "accordion";
      title?: React.ReactNode;
      formProps?: Partial<AllowedFormProps<TValues>>;
    }
  | {
      variant: "master-detail";
      title?: React.ReactNode;
      renderPreview: (values: TValues) => React.ReactNode;
      className?: string;
      detailsCardClassName?: string;
      previewCardClassName?: string;
      renderToolbar?: (context: { form: UseFormReturn<TValues> }) => React.ReactNode;
      formProps?: Partial<AllowedFormProps<TValues>>;
    };

export type InlineCreateOverrides = {
  defaultEnabled?: boolean;
  fields?: Record<
    string,
    import("./inputs/types").QueryChoiceInlineCreateConfig | boolean
  >;
};

export interface UseFormMetadataOptions {
  appName: string;
  modelName: string;
  objectId?: string | null;
  nestedFields?: string[];
  exclude?: string[];
  only?: string[];
  excludeRelationships?: string[];
  onlyRelationships?: string[];
  skip?: boolean;
  queryOptions?: Omit<QueryHookOptions<any, any>, "variables">;
}

export interface UseFormMetadataResult {
  metadata: FormMetadata | null;
  nestedMetadata: Record<string, FormMetadata>;
  loading: boolean;
  error: ApolloError | undefined;
  refetch: () => Promise<FormMetadata | null>;
}

export interface UseModelFormOptions<TFormValues extends Record<string, any>>
  extends UseFormMetadataOptions {
  initialValues?: Partial<TFormValues>;
  mutationMode?: "create" | "update" | null;
  mutationSelection?: string;
  mutationId?: string;
  transformInput?: (
    values: TFormValues,
    ctx: { metadata: FormMetadata }
  ) => Record<string, any>;
  onCompleted?: (payload: any) => void;
  onError?: (error: unknown) => void;
  onSubmit?: (
    values: TFormValues,
    ctx: UseModelFormSubmitContext<TFormValues>
  ) => Promise<any> | void;
  mutationOptions?: Omit<MutationHookOptions<any, any>, "variables">;
}

export interface UseModelFormSubmitContext<
  TFormValues extends Record<string, any>
> {
  metadata: FormMetadata | null;
  createMutation: (
    variables: CreateMutationVariables<Record<string, any>>
  ) => Promise<any>;
  updateMutation: (
    variables: UpdateMutationVariables<Record<string, any>>
  ) => Promise<any>;
  form: UseFormReturn<TFormValues>;
  setServerErrors: (errors: MutationError[]) => void;
}

export interface UseModelFormResult<TFormValues extends Record<string, any>> {
  metadata: FormMetadata | null;
  nestedMetadata: Record<string, FormMetadata>;
  schema: FormSchema<TFormValues> | null;
  loading: boolean;
  error: unknown;
  form: UseFormReturn<TFormValues>;
  handleSubmit: UseFormReturn<TFormValues>["handleSubmit"];
  refetchMetadata: () => Promise<any>;
  createState: MutationResult<CreateMutationResponse<any>>;
  updateState: MutationResult<UpdateMutationResponse<any>>;
  mutationErrors: MutationError[];
  clearMutationErrors: (fieldName?: string) => void;
}

export type AllowedFormProps<TValues extends Record<string, any>> = Omit<
  FormBuilderProps<TValues>,
  "schema" | "form"
>;

type ModelFormBaseOptions<TFormValues extends Record<string, any>> = Omit<
  UseModelFormOptions<TFormValues>,
  "customFieldOrder"
>;

type ForwardedFormProps<TFormValues extends Record<string, any>> = Pick<
  FormBuilderProps<TFormValues>,
  | "submitLabel"
  | "resetLabel"
  | "layout"
  | "debug"
  | "actionSlot"
  | "className"
  | "onChange"
  | "isLoading"
  | "showSectionHeaders"
  | "debugValueTransformer"
  | "inPopup"
  | "disableAutoReset"
>;

export interface ModelFormProps<
  TFormValues extends Record<string, any> = Record<string, any>
> extends Omit<ModelFormBaseOptions<TFormValues>, "appName" | "modelName">,
    ForwardedFormProps<TFormValues> {
  title?: React.ReactNode;
  showHeading?: boolean;
  showSectionHeaders?: boolean;
  containerClassName?: string;
  loadingMessage?: React.ReactNode;
  errorMessage?: React.ReactNode;
  onlyRequired?: boolean;
  ordering?: ModelFormOrderingOptions;
  sectionsControl?: ModelFormSectionsControl<TFormValues>;
  onSuccessRedirect?: (payload: any) => void;
  successMessage?:
    | string
    | ((ctx: { payload: any; mode: "create" | "update" }) => string);
  appName?: string;
  modelName?: string;
  showSuccessToast?: boolean;
  layoutVariant?: ModelFormLayoutVariant<TFormValues>;
  inlineCreateOverrides?: InlineCreateOverrides;
}
