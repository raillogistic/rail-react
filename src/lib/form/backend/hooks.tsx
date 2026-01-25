import * as React from "react";
import {
  gql,
  useMutation,
  useApolloClient,
  type QueryHookOptions,
  type MutationHookOptions,
  type MutationResult,
  type ApolloError,
} from "@apollo/client";
import { useForm, type UseFormReturn } from "@tanstack/react-form";
import type {
  FormSchema,
  FormFieldConfig,
  FormSectionConfig,
  FormInputType,
  ChoiceFieldConfig,
  NumberFieldConfig,
  QueryChoiceFieldConfig,
  TextFieldConfig,
  ListFieldConfig,
} from "../inputs/types";
import {
  model_form_metadata,
  model_form_metadata_query_result,
  model_form_metadata_variables,
  build_model_form_metadata_variables,
  form_field_metadata,
  form_relationship_metadata,
  relationship_type,
} from "./types/meta";
import {
  build_create_mutation,
  build_update_mutation,
  type CreateMutationResponse,
  type UpdateMutationResponse,
  type CreateMutationVariables,
  type UpdateMutationVariables,
  type MutationError,
  toOperationField,
} from "./types/mutations";
import {
  buildMetadataScopeKey,
  isCacheEntryFresh,
  stableSerialize,
  useMetadataCacheEntry,
  writeMetadataCacheEntry,
  METADATA_CACHE_TTL_MS,
} from "@/lib/metadata/cache";

/* -------------------------------------------------------------------------- */
/*                               GraphQL Query                                */
/* -------------------------------------------------------------------------- */

export const MODEL_FORM_META_QUERY = `
query ModelFormMetadata($app_name: String!, $model_name: String!, $nested_fields: [String!] = [], $exclude: [String!] = [], $only: [String!] = [], $exclude_relationships: [String!] = [], $only_relationships: [String!] = []) {
  model_form_metadata(
    app_name: $app_name
    model_name: $model_name
    nested_fields: $nested_fields
    exclude: $exclude
    only: $only
    exclude_relationships: $exclude_relationships
    only_relationships: $only_relationships
  ) {
    metadataVersion
    app_name
    model_name
    verbose_name
    verbose_name_plural
    form_title
    form_description
    fields {
      name
      field_type
      is_required
      verbose_name
      help_text
      widget_type
      placeholder
      default_value
      choices {
        value
        label
      }
      max_length
      min_length
      decimal_places
      max_digits
      min_value
      max_value
      auto_now
      auto_now_add
      blank
      null
      unique
      editable
      validators
      error_messages
      disabled
      readonly
      css_classes
      data_attributes
      has_permission
      permissions {
        can_read
        can_write
        visibility
        access_level
        mask_value
        reason
      }
    }
    relationships {
      name
      relationship_type
      verbose_name
      help_text
      widget_type
      is_required
      related_model
      related_app
      to_field
      from_field
      many_to_many
      one_to_one
      foreign_key
      is_reverse
      multiple
      queryset_filters
      empty_label
      limit_choices_to
      disabled
      readonly
      css_classes
      data_attributes
      permissions {
        can_read
        can_write
        visibility
        access_level
        mask_value
        reason
      }
    }
    nested {
      name
      field_name
      relationship_type
      to_field
      from_field
      is_required
      app_name
      model_name
      verbose_name
      verbose_name_plural
      form_title
      form_description
      fields {
        name
        field_type
        is_required
        verbose_name
        help_text
        widget_type
        placeholder
        default_value
        choices {
          value
          label
        }
        max_length
        min_length
        decimal_places
        max_digits
        min_value
        max_value
        auto_now
        auto_now_add
        blank
        null
        unique
        editable
        validators
        error_messages
        disabled
        readonly
        css_classes
        data_attributes
        has_permission
      }
      relationships {
        name
        relationship_type
        verbose_name
        help_text
        widget_type
        is_required
        related_model
        related_app
        to_field
        from_field
        many_to_many
        one_to_one
        foreign_key
        is_reverse
        multiple
        queryset_filters
        empty_label
        limit_choices_to
        disabled
        readonly
        css_classes
        data_attributes
      }
      field_order
      exclude_fields
      readonly_fields
      required_permissions
      form_validation_rules
      form_layout
      css_classes
      form_attributes
    }
    field_order
    exclude_fields
    readonly_fields
    required_permissions
    form_validation_rules
    form_layout
    css_classes
    form_attributes
    permissions {
      can_create
      can_update
      can_delete
      can_read
      can_list
      reasons
    }
  }
}
`;

const MODEL_FORM_META_DOCUMENT = gql(MODEL_FORM_META_QUERY);

/* -------------------------------------------------------------------------- */
/*                             Metadata fetch hooks                           */
/* -------------------------------------------------------------------------- */

export interface UseFormMetadataOptions {
  appName: string;
  modelName: string;
  nestedFields?: string[];
  exclude?: string[];
  only?: string[];
  excludeRelationships?: string[];
  onlyRelationships?: string[];
  skip?: boolean;
  queryOptions?: Omit<
    QueryHookOptions<
      model_form_metadata_query_result,
      model_form_metadata_variables
    >,
    "variables"
  >;
}

export function useFormMetadata({
  appName,
  modelName,
  nestedFields = [],
  exclude = [],
  only = [],
  excludeRelationships = [],
  onlyRelationships = [],
  skip = false,
  queryOptions,
}: UseFormMetadataOptions) {
  const client = useApolloClient();
  const signature = React.useMemo(
    () =>
      stableSerialize({
        nestedFields,
        exclude,
        only,
        excludeRelationships,
        onlyRelationships,
      }),
    [nestedFields, exclude, only, excludeRelationships, onlyRelationships]
  );
  const scopeKey = React.useMemo(
    () => buildMetadataScopeKey(appName, modelName, signature),
    [appName, modelName, signature]
  );
  const cachedEntry = useMetadataCacheEntry<model_form_metadata>(
    "form",
    scopeKey
  );
  const variables = React.useMemo(
    () => ({
      ...build_model_form_metadata_variables(appName, modelName, nestedFields),
      exclude,
      only,
      exclude_relationships: excludeRelationships,
      only_relationships: onlyRelationships,
    }),
    [appName, modelName, signature]
  );
  const metadataQueryOptions = React.useMemo(
    () => ({
      fetchPolicy: queryOptions?.fetchPolicy ?? "network-only",
      errorPolicy: queryOptions?.errorPolicy,
      context: queryOptions?.context,
    }),
    [
      queryOptions?.fetchPolicy,
      queryOptions?.errorPolicy,
      queryOptions?.context,
    ]
  );
  const [networkState, setNetworkState] = React.useState<{
    loading: boolean;
    error: ApolloError | undefined;
  }>({
    loading: false,
    error: undefined,
  });
  const shouldFetch =
    !skip && !isCacheEntryFresh(cachedEntry, METADATA_CACHE_TTL_MS);
  const executeMetadataQuery = React.useCallback(async () => {
    const result = await client.query<
      model_form_metadata_query_result,
      model_form_metadata_variables
    >({
      query: MODEL_FORM_META_DOCUMENT,
      variables,
      fetchPolicy: metadataQueryOptions.fetchPolicy,
      errorPolicy: metadataQueryOptions.errorPolicy,
      context: metadataQueryOptions.context,
    });
    const payload = result.data?.model_form_metadata ?? null;
    if (payload) {
      writeMetadataCacheEntry(
        "form",
        scopeKey,
        payload.metadataVersion,
        payload
      );
    }
    return payload;
  }, [client, variables, metadataQueryOptions, scopeKey]);

  React.useEffect(() => {
    if (!shouldFetch) return;
    let ignore = false;
    setNetworkState({ loading: true, error: undefined });
    executeMetadataQuery()
      .then(() => {
        if (!ignore) {
          setNetworkState({ loading: false, error: undefined });
        }
      })
      .catch((error) => {
        if (!ignore) {
          setNetworkState({ loading: false, error: error as ApolloError });
        }
      });
    return () => {
      ignore = true;
    };
  }, [shouldFetch, executeMetadataQuery]);

  const refetchMetadata = React.useCallback(() => {
    if (skip) {
      return Promise.resolve(null);
    }
    setNetworkState({ loading: true, error: undefined });
    return executeMetadataQuery()
      .then((payload) => {
        setNetworkState({ loading: false, error: undefined });
        return payload;
      })
      .catch((error) => {
        setNetworkState({ loading: false, error: error as ApolloError });
        throw error;
      });
  }, [skip, executeMetadataQuery]);

  const metadata = skip ? null : cachedEntry?.data ?? null;
  const loading = !skip && !metadata && (networkState.loading || shouldFetch);
  const error = skip ? undefined : networkState.error;
  return {
    metadata,
    loading,
    error,
    refetch: refetchMetadata,
  };
}

/* -------------------------------------------------------------------------- */
/*                             Dynamic form builder                           */
/* -------------------------------------------------------------------------- */

export interface UseModelFormOptions<
  TFormValues extends Record<string, any> = Record<string, any>
> extends UseFormMetadataOptions {
  initialValues?: Partial<TFormValues>;
  /**
   * When provided, the hook automatically executes the corresponding mutation on submit.
   * If omitted, you can call `form.handleSubmit` and manage persistence yourself.
   */
  mutationMode?: "create" | "update" | null;
  mutationSelection?: string;
  mutationId?: string;
  transformInput?: (
    values: TFormValues,
    ctx: { metadata: model_form_metadata }
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
  metadata: model_form_metadata | null;
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
  metadata: model_form_metadata | null;
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

export function useModelForm<
  TFormValues extends Record<string, any> = Record<string, any>
>(options: UseModelFormOptions<TFormValues>): UseModelFormResult<TFormValues> {
  const {
    appName,
    modelName,
    nestedFields,
    exclude,
    only,
    excludeRelationships,
    onlyRelationships,
    initialValues,
    mutationMode = null,
    mutationSelection = "id",
    mutationId,
    transformInput,
    onCompleted,
    onError,
    onSubmit,
    mutationOptions,
    queryOptions,
    skip,
  } = options;

  const { metadata, loading, error, refetch } = useFormMetadata({
    appName,
    modelName,
    nestedFields,
    exclude,
    only,
    excludeRelationships,
    onlyRelationships,
    skip,
    queryOptions,
  });

  const formMode: "create" | "update" =
    mutationMode === "update" ? "update" : "create";

  const normalizedModelName = React.useMemo(() => modelName, [modelName]);

  const schema = React.useMemo<FormSchema<TFormValues> | null>(() => {
    if (!metadata) return null;
    return buildSchemaFromMetadata<TFormValues>(
      metadata,
      initialValues ?? {},
      formMode
    );
  }, [metadata, initialValues, formMode]);

  const computedDefaults = React.useMemo(() => {
    if (!schema) {
      return ((initialValues ?? {}) as TFormValues) ?? ({} as TFormValues);
    }
    const base = buildDefaultsFromSchema(schema);
    return {
      ...base,
      ...(schema.initialValues ?? {}),
      ...(initialValues ?? {}),
    } as TFormValues;
  }, [schema, initialValues]);

  const mutationOperationField = React.useMemo(
    () => toOperationField(modelName ?? ""),
    [modelName]
  );

  const resolveMutationPayload = React.useCallback(
    (
      data: Record<string, any> | undefined | null,
      mode: "create" | "update"
    ) => {
      if (!data) {
        return null;
      }
      const aliasPayload =
        data.response as
          | CreateMutationResponse<any>
          | UpdateMutationResponse<any>
          | undefined;
      if (aliasPayload) {
        return aliasPayload;
      }
      const fallbackKey = `${mode}_${mutationOperationField}`;
      return (data as any)?.[fallbackKey] ?? null;
    },
    [mutationOperationField]
  );

  const createDocument = React.useMemo(
    () =>
      gql`
        ${build_create_mutation(modelName, mutationSelection)}
      `,
    [modelName, mutationSelection]
  );
  const updateDocument = React.useMemo(
    () =>
      gql`
        ${build_update_mutation(modelName, mutationSelection)}
      `,
    [modelName, mutationSelection]
  );

  const [runCreateMutation, createState] = useMutation<
    CreateMutationResponse<any>,
    CreateMutationVariables<Record<string, any>>
  >(createDocument, mutationOptions ?? {});

  const [runUpdateMutation, updateState] = useMutation<
    UpdateMutationResponse<any>,
    UpdateMutationVariables<Record<string, any>>
  >(updateDocument, mutationOptions ?? {});

  const [mutationErrors, setMutationErrors] = React.useState<MutationError[]>(
    []
  );

  const clearMutationErrors = React.useCallback((fieldName?: string) => {
    const normalizedField = normalizeErrorFieldPath(fieldName);
    setMutationErrors((previous) => {
      if (previous.length === 0) {
        return previous;
      }
      if (!normalizedField) {
        return previous.length ? [] : previous;
      }
      const filtered = previous.filter(
        (error) => error.field !== normalizedField
      );
      return filtered.length === previous.length ? previous : filtered;
    });
  }, []);

  const form = useForm<TFormValues>({
    defaultValues: computedDefaults,
    meta: {
      appName,
      modelName,
    },
    onSubmit: async ({ value }) => {
      try {
        if (onSubmit) {
          await onSubmit(value as TFormValues, {
            metadata,
            createMutation: runCreateMutation,
            updateMutation: runUpdateMutation,
            form,
            setServerErrors: (errors) =>
              applyServerErrors(errors, form, setMutationErrors),
          });
          return;
        }
        if (!mutationMode) return;
        if (!metadata) {
          throw new Error(
            "Impossible d'exécuter la mutation sans métadonnées du formulaire."
          );
        }
        const baseInput = transformInput
          ? transformInput(value as TFormValues, { metadata })
          : (value as Record<string, any>);
        
        let processedInput: Record<string, any> = baseInput;

        if (formMode === "update") {
           processedInput = stripUntouchedFieldValues(
              baseInput as Record<string, any>,
              form
           );
        }
        
        const prefixedInput = applyNestedPrefix(processedInput, metadata);
        const relationshipNormalizedInput = normalizeRelationshipInputValues(
          prefixedInput,
          metadata
        );
        const normalizedInput = sanitizeEmptyScalarValues(
          relationshipNormalizedInput,
          metadata
        );
        // We no longer normalize to Enum names because the backend now expects
        // raw string values for choice fields to ensure consistency.
        const numericNormalizedInput = coerceNumericFieldValues(
          normalizedInput,
          metadata
        );
        applyServerErrors([], form, setMutationErrors);
        if (mutationMode === "update") {
          const targetId = mutationId ?? (value as any)?.id;
          if (!targetId) {
            throw new Error(
              "Un identifiant est requis pour mettre à jour cet objet."
            );
          }
          const updateInput = {
            ...numericNormalizedInput,
            id: String(targetId),
          };
          const result = await runUpdateMutation({
            variables: { input: updateInput },
          });

          const payload = resolveMutationPayload(
            result.data as Record<string, any> | undefined,
            "update"
          );
          if (!payload) {
            throw new Error(
              "La mutation de mise à jour n'a retourné aucune donnée."
            );
          }
          if (payload.errors?.length) {
            applyServerErrors(payload.errors, form, setMutationErrors);
            throw new Error(
              payload.errors[0]?.message ?? "Erreur lors de la mise à jour."
            );
          }
          applyServerErrors([], form, setMutationErrors);
          onCompleted?.(payload);
        } else {
          const result = await runCreateMutation({
            variables: { input: numericNormalizedInput },
          });
          const payload = resolveMutationPayload(
            result.data as Record<string, any> | undefined,
            "create"
          );

          if (!payload) {
            throw new Error(
              "La mutation de création n'a retourné aucune donnée."
            );
          }
          if (payload.errors?.length) {
            applyServerErrors(payload.errors, form, setMutationErrors);
            throw new Error(
              payload.errors[0]?.message ?? "Erreur lors de la création."
            );
          }
          applyServerErrors([], form, setMutationErrors);
          onCompleted?.(payload);
        }
      } catch (submitError) {
        onError?.(submitError);
        throw submitError;
      }
    },
  });

  React.useEffect(() => {
    if (schema) {
      form.reset(computedDefaults);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schema, computedDefaults]);

  return {
    metadata,
    schema,
    loading,
    error,
    form,
    handleSubmit: form.handleSubmit,
    refetchMetadata: refetch,
    createState,
    updateState,
    mutationErrors,
    clearMutationErrors,
  };
}

/* -------------------------------------------------------------------------- */
/*                                 Utilities                                  */
/* -------------------------------------------------------------------------- */

function buildSchemaFromMetadata<TFormValues extends Record<string, any>>(
  metadata: model_form_metadata,
  initialValues: Partial<TFormValues>,
  mode: "create" | "update"
): FormSchema<TFormValues> {
  const combinedFields = collectFieldConfigs(metadata, mode);

  const sections: FormSectionConfig[] = combinedFields.length
    ? [
        {
          id: "primary",
          title: metadata.form_title || metadata.verbose_name,
          description: metadata.form_description ?? undefined,
          fields: combinedFields,
        },
      ]
    : [];

  if (sections.length === 0) {
    return {
      id: `${metadata.app_name}.${metadata.model_name}`,
      fields: [],
      initialValues,
      meta: {
        appName: metadata.app_name,
        modelName: metadata.model_name,
      },
    };
  }

  return {
    id: `${metadata.app_name}.${metadata.model_name}`,
    sections,
    initialValues,
    meta: {
      appName: metadata.app_name,
      modelName: metadata.model_name,
    },
  };
}

function collectFieldConfigs(
  metadata: model_form_metadata,
  mode: "create" | "update"
): FormFieldConfig[] {
  const readonly = new Set(metadata.readonly_fields ?? []);
  const excluded = new Set(metadata.exclude_fields ?? []);

  const primitiveFields = metadata.fields
    .filter((field) => {
      if (excluded.has(field.name) || field.has_permission === false) {
        return false;
      }
      if (mode === "create" && field.editable === false) {
        return false;
      }
      return true;
    })
    .map((field) => mapFieldMetadata(field, readonly))
    .filter((field): field is FormFieldConfig => Boolean(field));

  const relationshipFields = metadata.relationships
    .map((relationship) => mapRelationshipMetadata(relationship))
    .filter((field): field is FormFieldConfig => Boolean(field));

  const nestedFields =
    metadata.nested
      ?.map((nestedMeta) => mapNestedMetadata(nestedMeta, mode))
      .filter((field): field is FormFieldConfig => Boolean(field)) ?? [];

  const ordering = metadata.field_order ?? [];
  return sortFieldsByOrder(
    [...primitiveFields, ...relationshipFields, ...nestedFields],
    ordering
  );
}

function mapFieldMetadata(
  field: form_field_metadata,
  readonlyFields: Set<string>
): FormFieldConfig | null {
  const type = inferInputType(field);
  const base = {
    name: field.name,
    label: field.verbose_name || field.name,
    description: field.help_text || undefined,
    placeholder: field.placeholder || undefined,
    required: field.is_required,
    defaultValue: field.default_value,
    disabled: field.disabled || !field.editable,
    readOnly:
      field.readonly || readonlyFields.has(field.name) || !field.editable,
    className: field.css_classes || undefined,
  };

  if (field.choices?.length) {
    const config: ChoiceFieldConfig = {
      ...base,
      type: type === "radio" ? "radio" : "select",
      options: field.choices.map((choice) => ({
        value: choice.value,
        label: choice.label,
      })),
      multiple: field.widget_type === "multiselect",
    };
    if (config.multiple && config.defaultValue === undefined) {
      config.defaultValue = [];
    }
    return config;
  }

  if (
    type === "number" ||
    type === "decimal" ||
    type === "slider" ||
    type === "range"
  ) {
    const config: NumberFieldConfig = {
      ...base,
      type,
      min: field.min_value ?? undefined,
      max: field.max_value ?? undefined,
      step: inferDecimalStep(field.decimal_places, type),
    };
    return config;
  }

  if (
    type === "text" ||
    type === "textarea" ||
    type === "email" ||
    type === "password" ||
    type === "json"
  ) {
    const config: TextFieldConfig = {
      ...base,
      type,
      minLength: field.min_length ?? undefined,
      maxLength: field.max_length ?? undefined,
    };
    return config;
  }

  if (type === "checkbox" || type === "switch") {
    return {
      ...base,
      type,
      defaultValue:
        typeof base.defaultValue === "boolean" ? base.defaultValue : false,
    };
  }

  if (type === "file") {
    return {
      ...base,
      type,
    };
  }

  return {
    ...base,
    type,
  };
}

function mapRelationshipMetadata(
  relationship: form_relationship_metadata
): FormFieldConfig | null {
  if (!relationship.related_model) {
    return null;
  }
  const multiple = shouldUseMultiSelect(relationship);
  const relatedModel =
    relationship.related_model?.toLowerCase() ?? relationship.related_model;
  const config: QueryChoiceFieldConfig = {
    name: relationship.name,
    label: relationship.verbose_name || relationship.name,
    description: relationship.help_text || undefined,
    type: "select-query",
    multiple,
    required: relationship.is_required,
    defaultValue: multiple ? [] : null,
    placeholder: relationship.empty_label || undefined,
    relatedModel,
    disabled: relationship.disabled,
    readOnly: relationship.readonly,
    className: relationship.css_classes || undefined,
  };
  return config;
}

function mapNestedMetadata(
  nestedMeta: model_form_metadata,
  mode: "create" | "update"
): FormFieldConfig | null {
  const fieldName =
    nestedMeta.name ?? nestedMeta.field_name ?? nestedMeta.model_name;
  if (!fieldName) {
    return null;
  }
  const nestedFields = collectFieldConfigs(nestedMeta, mode);
  if (nestedFields.length === 0) {
    return null;
  }
  const label = nestedMeta.form_title || nestedMeta.verbose_name || fieldName;
  const description = nestedMeta.form_description ?? undefined;
  const multiple = isMultipleRelationship(nestedMeta.relationship_type);
  if (multiple) {
    const config: ListFieldConfig = {
      name: fieldName,
      label,
      description,
      type: "list",
      fields: nestedFields,
      defaultValue: [],
      required: nestedMeta.is_required,
      addLabel: nestedMeta.verbose_name
        ? `Ajouter ${nestedMeta.verbose_name}`
        : undefined,
      itemLabel: nestedMeta.verbose_name ?? undefined,
    };
    return config;
  }
  return {
    name: fieldName,
    label,
    description,
    type: "object",
    fields: nestedFields,
    required: nestedMeta.is_required,
  };
}

function inferInputType(field: form_field_metadata): FormInputType {
  if (field.choices?.length) {
    if (field.widget_type === "radio") return "radio";
    return "select";
  }
  switch (field.widget_type) {
    case "textarea":
      return "textarea";
    case "checkbox":
      return "checkbox";
    case "number":
      return field.field_type === "DecimalField" ? "decimal" : "number";
    case "date":
      return "date";
    case "datetime-local":
      return "datetime-local";
    case "multiselect":
      return "select";
    case "select":
      return "select";
    case "email":
      return "email";
    case "url":
      return "text";
    default:
      break;
  }
  switch (field.field_type) {
    case "DecimalField":
    case "FloatField":
    case "IntegerField":
    case "SmallIntegerField":
    case "PositiveSmallIntegerField":
    case "PositiveIntegerField":
    case "BigIntegerField":
    case "BigAutoField":
    case "AutoField":
      return "number";
    case "DateField":
      return "date";
    case "TimeField":
      return "time";
    case "DateTimeField":
      return "datetime-local";
    case "BooleanField":
    case "NullBooleanField":
      return "switch";
    case "JSONField":
      return "json";
    case "TextField":
      return "textarea";
    case "EmailField":
      return "email";
    case "URLField":
      return "text";
    case "FileField":
    case "ImageField":
      return "file";
    default:
      return "text";
  }
}

function inferDecimalStep(decimalPlaces?: number | null, type?: FormInputType) {
  if (
    type === "decimal" &&
    typeof decimalPlaces === "number" &&
    decimalPlaces > 0
  ) {
    return Number((1 / 10 ** decimalPlaces).toFixed(decimalPlaces));
  }
  if (type === "range" || type === "slider") {
    return 1;
  }
  return undefined;
}

function sortFieldsByOrder(
  fields: FormFieldConfig[],
  order: string[]
): FormFieldConfig[] {
  if (!order.length) return fields;
  const rank = new Map(order.map((name, index) => [name, index]));
  return [...fields].sort((a, b) => {
    const rankA = rank.get(a.name) ?? Number.MAX_SAFE_INTEGER;
    const rankB = rank.get(b.name) ?? Number.MAX_SAFE_INTEGER;
    if (rankA === rankB) return a.name.localeCompare(b.name);
    return rankA - rankB;
  });
}

function isMultipleRelationship(value?: relationship_type | string | null) {
  if (!value) return false;
  const normalized = value.toString();
  return (
    normalized === "ManyToManyField" ||
    normalized === "ReverseManyToMany" ||
    normalized === "ReverseForeignKey" ||
    normalized === "ManyToOneRel"
  );
}

function shouldUseMultiSelect(
  relationship: form_relationship_metadata
): boolean {
  if (
    relationship.one_to_one ||
    relationship.foreign_key ||
    relationship.relationship_type === "ForeignKey" ||
    relationship.relationship_type === "OneToOneField"
  ) {
    return false;
  }
  if (
    relationship.multiple ||
    relationship.many_to_many ||
    relationship.relationship_type === "ManyToManyField" ||
    relationship.relationship_type === "ReverseManyToMany"
  ) {
    return true;
  }
  if (relationship.relationship_type === "ManyToOneRel") {
    return Boolean(relationship.many_to_many);
  }
  return false;
}
function buildDefaultsFromSchema(schema: FormSchema): Record<string, any> {
  const target: Record<string, any> = {};
  const sections = schema.sections?.length
    ? schema.sections
    : schema.fields
    ? [{ fields: schema.fields }]
    : [];
  sections.forEach((section) => {
    section.fields.forEach((field) => {
      assignDefaultValue(target, field);
    });
  });
  return target;
}

function assignDefaultValue(
  target: Record<string, any>,
  field: FormFieldConfig,
  basePath?: string
) {
  const path = basePath ? `${basePath}.${field.name}` : field.name;
  if (field.type === "object") {
    const value = buildDefaultsFromFields(field.fields);
    setValue(target, path, value);
    return;
  }
  if (field.type === "list") {
    setValue(target, path, field.defaultValue ?? []);
    return;
  }
  if (field.type === "custom") {
    setValue(target, path, field.defaultValue ?? "");
    return;
  }
  setValue(
    target,
    path,
    field.defaultValue ?? getPrimitiveDefaultValue(field.type as FormInputType)
  );
}

function buildDefaultsFromFields(
  fields: FormFieldConfig[]
): Record<string, any> {
  const result: Record<string, any> = {};
  fields.forEach((field) => assignDefaultValue(result, field));
  return result;
}

function setValue(target: Record<string, any>, path: string, value: any) {
  const segments = path.split(".");
  let current = target;
  segments.forEach((segment, index) => {
    if (index === segments.length - 1) {
      current[segment] = value;
      return;
    }
    current[segment] = current[segment] ?? {};
    current = current[segment];
  });
}

function getPrimitiveDefaultValue(type: FormInputType) {
  switch (type) {
    case "number":
    case "decimal":
    case "slider":
    case "range":
      return 0;
    case "select":
    case "radio":
      return "";
    case "checkbox":
    case "switch":
      return false;
    case "select-query":
      return null;
    case "file":
      return null;
    default:
      return "";
  }
}

function toSnakeCase(value: string) {
  return value
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .replace(/[-\s]+/g, "_")
    .replace(/_{2,}/g, "_")
    .replace(/^_|_$/g, "")
    .toLowerCase();
}

function escapeRegex(value: string): string {
  return value.replace(/[-/\\^$+?.()|[\]{}]/g, "\\$&");
}

export function normalizeErrorFieldPath(
  field?: string | null
): string | null {
  if (!field) return null;
  const normalized = field
    .replace(/\[(\d+)\]/g, ".$1")
    .replace(/__/g, ".")
    .replace(/\.+/g, ".")
    .replace(/^\./, "")
    .replace(/\.$/, "");
  return normalized || null;
}

export function buildFieldMatcher(fieldPath: string): RegExp {
  const normalized = normalizeErrorFieldPath(fieldPath) ?? "";
  const pattern = normalized
    .split(".")
    .map((segment) => {
      if (segment === "*") return "[^.]+";
      if (/^\d+$/.test(segment)) return "\\d+";
      return escapeRegex(segment);
    })
    .join("\\.");
  return new RegExp(`^${pattern}$`);
}

export function resolveFieldMatches(
  fieldPath: string,
  fieldMeta: Record<string, any>
): string[] {
  const normalized = normalizeErrorFieldPath(fieldPath);
  if (!normalized) return [];
  const metaKeys = Object.keys(fieldMeta ?? {});
  if (metaKeys.includes(normalized)) {
    return [normalized];
  }
  const matcher = buildFieldMatcher(normalized);
  const matched = metaKeys.filter((key) =>
    matcher.test(normalizeErrorFieldPath(key) ?? key)
  );
  if (matched.length) {
    return matched;
  }
  const parentPath = normalized.split(".").slice(0, -1).join(".");
  if (parentPath && metaKeys.includes(parentPath)) {
    return [parentPath];
  }
  return [];
}

export function applyErrorsToFormFields(
  errors: MutationError[],
  form: UseFormReturn<any>
) {
  if (!errors.length) return;
  const state =
    typeof form.store.getState === "function"
      ? form.store.getState()
      : (form.store as any).state;
  const fieldMeta: Record<string, any> = (state as any)?.fieldMeta ?? {};

  errors.forEach((error) => {
    const normalizedField = normalizeErrorFieldPath(error.field);
    if (!normalizedField) return;
    const targets = resolveFieldMatches(normalizedField, fieldMeta);
    const applyTargets = targets.length ? targets : [normalizedField];
    applyTargets.forEach((targetName) => {
      form.setFieldMeta(targetName as any, (prev) => {
        const prevErrors = Array.isArray(prev?.errors)
          ? prev.errors
          : prev?.errors
          ? [prev.errors]
          : [];
        const nextErrors = Array.from(
          new Set([...prevErrors, error.message].filter(Boolean))
        );
        return {
          ...prev,
          isTouched: prev?.isTouched ?? true,
          isDirty: prev?.isDirty ?? false,
          isValid: false,
          errors: nextErrors,
          errorMap: {
            ...(prev?.errorMap ?? {}),
            onSubmit: error.message,
          },
        };
      });
    });
  });
}

function applyServerErrors(
  errors: MutationError[] | null | undefined,
  form: UseFormReturn<any>,
  setMutationErrors: React.Dispatch<React.SetStateAction<MutationError[]>>
) {
  const normalized =
    errors
      ?.filter((error): error is MutationError => Boolean(error))
      .map((error) => ({
        ...error,
        field: normalizeErrorFieldPath(error.field),
        message: error.message ?? "Une erreur est survenue.",
      })) ?? [];
  setMutationErrors(normalized);
  if (!normalized.length) return;
  applyErrorsToFormFields(normalized, form);
}

function stripUntouchedFieldValues(
  input: Record<string, any>,
  form: UseFormReturn<any>
): Record<string, any> {
  const state =
    typeof form.store.getState === "function"
      ? form.store.getState()
      : (form.store as any).state;
  const fieldMeta: Record<
    string,
    { isDirty?: boolean; isTouched?: boolean } | undefined
  > = (state as any)?.fieldMeta ?? {};
  const clone: Record<string, any> = { ...input };
  Object.keys(clone).forEach((fieldName) => {
    const meta = fieldMeta[fieldName];
    if (!meta || (meta.isDirty !== true && meta.isTouched !== true)) {
      clone[fieldName] = undefined;
    }
  });
  return clone;
}

function applyNestedPrefix(
  input: Record<string, any>,
  metadata: model_form_metadata | null
): Record<string, any> {
  if (!metadata?.nested) return input;
  const nestedNames = metadata.nested
    .map((n) => n.name ?? n.field_name ?? n.model_name)
    .filter((n): n is string => Boolean(n));

  if (!nestedNames.length) return input;

  const clone = { ...input };
  nestedNames.forEach((name) => {
    if (name in clone && clone[name] !== undefined) {
      clone[`nested_${name}`] = clone[name];
      delete clone[name];
    }
  });
  return clone;
}

function normalizeRelationshipInputValues(
  input: Record<string, any>,
  metadata: model_form_metadata | null
): Record<string, any> {
  if (!metadata) return input;
  const clone: Record<string, any> = { ...input };

  (metadata.relationships ?? []).forEach((relationship) => {
    const fieldName = relationship.name;
    if (!(fieldName in clone)) return;
    clone[fieldName] = normalizeRelationshipFieldValue(clone[fieldName]);
  });

  (metadata.nested ?? []).forEach((nested) => {
    // Check for both prefixed and original names to be safe,
    // though at this point they should be prefixed if applyNestedPrefix was called.
    const originalName =
      nested.name ?? nested.field_name ?? nested.model_name;
    if (!originalName) return;
    
    const prefixedName = `nested_${originalName}`;
    
    // Determine which key exists in the object
    let nestedKey: string | undefined;
    if (prefixedName in clone) {
      nestedKey = prefixedName;
    } else if (originalName in clone) {
      nestedKey = originalName;
    }
    
    if (!nestedKey) return;

    const nestedValue = clone[nestedKey];
    if (Array.isArray(nestedValue)) {
      clone[nestedKey] = nestedValue.map((entry) =>
        entry && typeof entry === "object"
          ? normalizeRelationshipInputValues(
              entry as Record<string, any>,
              nested
            )
          : entry
      );
      return;
    }
    if (nestedValue && typeof nestedValue === "object") {
      clone[nestedKey] = normalizeRelationshipInputValues(
        nestedValue as Record<string, any>,
        nested
      );
    }
  });

  return clone;
}

function normalizeRelationshipFieldValue(value: any): any {
  if (value === null || value === undefined) {
    return value;
  }
  if (Array.isArray(value)) {
    return value
      .map((entry) => normalizeRelationshipFieldValue(entry))
      .filter((entry) => entry !== undefined && entry !== null);
  }
  if (typeof value === "object") {
    const record = value as Record<string, any>;
    const identifier =
      record.value ?? record.id ?? record.pk ?? record.uuid ?? null;
    if (identifier === undefined || identifier === null) {
      return null;
    }
    return identifier;
  }
  return value;
}

function sanitizeEmptyScalarValues(
  input: Record<string, any>,
  metadata: model_form_metadata | null
): Record<string, any> {
  if (!metadata) {
    return input;
  }
  const dateLikeFields = new Set(
    metadata.fields
      .filter((field) =>
        ["DateField", "DateTimeField", "TimeField"].includes(
          field.field_type ?? ""
        )
      )
      .map((field) => field.name)
  );
  if (!dateLikeFields.size) {
    return input;
  }
  const clone: Record<string, any> = { ...input };
  dateLikeFields.forEach((fieldName) => {
    if (clone[fieldName] === "") {
      clone[fieldName] = undefined;
    }
  });
  return clone;
}

/**
 * Normalize choice values to the GraphQL enum names expected by the backend.
 * Mirrors the enum member naming strategy used in the Django generator.
 */
function normalizeChoiceEnumValues(
  input: Record<string, any>,
  metadata: model_form_metadata | null
): Record<string, any> {
  if (!metadata) return input;

  const clone: Record<string, any> = { ...input };

  const choiceFields = metadata.fields.filter((field) => field.choices?.length);

  choiceFields.forEach((field) => {
    if (!(field.name in clone)) return;
    const mapper = buildChoiceEnumMapper(field.choices ?? []);
    const currentValue = clone[field.name];
    clone[field.name] = normalizeChoiceFieldValue(currentValue, mapper);
  });

  // Recurse into nested metadata to normalize inner structures
  (metadata.nested ?? []).forEach((nested) => {
    const nestedKey = nested.name ?? nested.field_name ?? nested.model_name;
    if (!nestedKey || !(nestedKey in clone)) return;
    const nestedValue = clone[nestedKey];
    if (Array.isArray(nestedValue)) {
      clone[nestedKey] = nestedValue.map((entry) =>
        entry && typeof entry === "object"
          ? normalizeChoiceEnumValues(entry as Record<string, any>, nested)
          : entry
      );
    } else if (nestedValue && typeof nestedValue === "object") {
      clone[nestedKey] = normalizeChoiceEnumValues(
        nestedValue as Record<string, any>,
        nested
      );
    }
  });

  return clone;
}

function coerceNumericFieldValues(
  input: Record<string, any>,
  metadata: model_form_metadata | null
): Record<string, any> {
  if (!metadata) return input;

  const numericFieldNames = metadata.fields
    .filter((field) =>
      [
        "IntegerField",
        "SmallIntegerField",
        "PositiveSmallIntegerField",
        "PositiveIntegerField",
        "BigIntegerField",
        "AutoField",
        "BigAutoField",
      ].includes(field.field_type ?? "")
    )
    .map((field) => field.name);

  const decimalFieldNames = metadata.fields
    .filter((field) =>
      ["DecimalField", "FloatField"].includes(field.field_type ?? "")
    )
    .map((field) => field.name);

  if (!numericFieldNames.length && !decimalFieldNames.length) {
    return input;
  }

  const clone: Record<string, any> = { ...input };

  numericFieldNames.forEach((fieldName) => {
    const value = clone[fieldName];
    if (value === "" || value === null || value === undefined) {
      return;
    }
    if (typeof value === "string") {
      const parsed = parseInt(value, 10);
      if (!Number.isNaN(parsed)) {
        clone[fieldName] = parsed;
      }
    }
  });

  decimalFieldNames.forEach((fieldName) => {
    const value = clone[fieldName];
    if (value === "" || value === null || value === undefined) {
      return;
    }
    if (typeof value === "string") {
      const parsed = parseFloat(value);
      if (!Number.isNaN(parsed)) {
        clone[fieldName] = parsed;
      }
    }
  });

  return clone;
}

/**
 * Normalize a single field value (or list) using the provided enum mapper.
 */
function normalizeChoiceFieldValue(
  value: any,
  mapper: Map<string, string>
): any {
  if (value === null || value === undefined) return value;
  if (Array.isArray(value)) {
    return value.map((item) => normalizeChoiceFieldValue(item, mapper));
  }
  const enumValue = mapper.get(String(value));
  return enumValue ?? value;
}

/**
 * Build a mapping of raw choice values to the GraphQL enum member names.
 */
function buildChoiceEnumMapper(
  choices: { value: string; label: string }[]
): Map<string, string> {
  const mapper = new Map<string, string>();
  const usedNames = new Set<string>();
  choices.forEach((choice, index) => {
    const name = buildEnumMemberName(choice.value, index, usedNames);
    mapper.set(String(choice.value), name);
  });
  return mapper;
}

/**
 * Mirror the backend enum member naming convention so client variables match generated enums.
 */
function buildEnumMemberName(
  rawValue: unknown,
  index: number,
  usedNames: Set<string>
): string {
  const text = String(rawValue ?? "").trim();
  const candidate = text.replace(/[^a-zA-Z0-9]+/g, "_").toUpperCase();
  let name = candidate;
  if (!name || !/^[A-Z]/.test(name)) {
    name = name ? `CHOICE_${name}` : "CHOICE";
  }
  if (usedNames.has(name)) {
    name = `${name}_${index}`;
  }
  usedNames.add(name);
  return name;
}
