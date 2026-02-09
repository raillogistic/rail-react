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
  build_create_mutation,
  build_update_mutation,
  type CreateMutationResponse,
  type UpdateMutationResponse,
  type CreateMutationVariables,
  type UpdateMutationVariables,
  type MutationError,
  toOperationField,
} from "./types/mutations";
import { GET_MODEL_SCHEMA_FULL } from "@/lib/tablev2/queries";
import type {
  ModelSchema,
  FieldSchema,
  RelationshipSchema,
} from "@/lib/tablev2/types";
import {
  buildMetadataScopeKey,
  isCacheEntryFresh,
  stableSerialize,
  readMetadataCacheEntry,
  useMetadataCacheEntry,
  writeMetadataCacheEntry,
  METADATA_CACHE_TTL_MS,
} from "@/lib/metadata/cache";

/* -------------------------------------------------------------------------- */
/*                               Metadata types                               */
/* -------------------------------------------------------------------------- */

export type FormMetadata = ModelSchema;

type ModelSchemaQueryResult = { modelSchema: FormMetadata | null };
type ModelSchemaQueryVariables = {
  app: string;
  model: string;
  objectId?: string;
};

const DEFAULT_FETCH_POLICY: QueryHookOptions["fetchPolicy"] = "network-only";
const EMPTY_STRING_ARRAY: string[] = [];
const EMPTY_NESTED_TARGETS: Array<{ name: string; app: string; model: string }> =
  [];

function normalizeStringArray(value?: string[]) {
  if (!value || value.length === 0) {
    return EMPTY_STRING_ARRAY;
  }
  const filtered = value.filter(Boolean);
  return filtered.length ? filtered : EMPTY_STRING_ARRAY;
}

function normalizeCustomStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((entry): entry is string => typeof entry === "string");
}

function parseCustomMetadata<T = Record<string, any>>(
  value: unknown
): T | null {
  if (value === null || value === undefined) {
    return null;
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return null;
    try {
      return JSON.parse(trimmed) as T;
    } catch {
      return null;
    }
  }
  if (typeof value === "object") {
    return value as T;
  }
  return null;
}

function resolveNestedTargets(
  metadata: FormMetadata | null,
  nestedFields: string[]
) {
  if (!metadata || nestedFields.length === 0) {
    return EMPTY_NESTED_TARGETS;
  }
  return nestedFields
    .map((fieldName) => {
      const relation = metadata.relationships.find(
        (rel) => rel.name === fieldName || rel.fieldName === fieldName
      );
      if (!relation) return null;
      return {
        name: fieldName,
        app: relation.relatedApp,
        model: relation.relatedModel,
      };
    })
    .filter(
      (value): value is { name: string; app: string; model: string } =>
        Boolean(value)
    );
}

function normalizeOrderingValue(value: string): string {
  if (!value) return value;
  return value.startsWith("-") ? value.slice(1) : value;
}

function resolveFormConfig(metadata: FormMetadata | null) {
  const custom = parseCustomMetadata<Record<string, any>>(
    metadata?.customMetadata
  );
  const form = (custom?.form ?? custom?.formConfig ?? {}) as Record<
    string,
    any
  >;
  const title =
    form.title ?? form.formTitle ?? form.form_title ?? custom?.formTitle;
  const description =
    form.description ??
    form.formDescription ??
    form.form_description ??
    custom?.formDescription ??
    custom?.description;
  const fieldOrder = normalizeCustomStringArray(
    form.fieldOrder ?? form.field_order
  );
  const excludeFields = normalizeCustomStringArray(
    form.excludeFields ?? form.exclude_fields
  );
  const readonlyFields = normalizeCustomStringArray(
    form.readonlyFields ?? form.readonly_fields
  );
  const ordering =
    fieldOrder.length > 0
      ? fieldOrder
      : (metadata?.ordering ?? []).map(normalizeOrderingValue);
  return {
    title,
    description,
    fieldOrder: ordering,
    excludeFields,
    readonlyFields,
  };
}

/* -------------------------------------------------------------------------- */
/*                             Metadata fetch hooks                           */
/* -------------------------------------------------------------------------- */

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
  queryOptions?: Omit<
    QueryHookOptions<ModelSchemaQueryResult, ModelSchemaQueryVariables>,
    "variables"
  >;
}

export interface UseFormMetadataResult {
  metadata: FormMetadata | null;
  nestedMetadata: Record<string, FormMetadata>;
  loading: boolean;
  error: ApolloError | undefined;
  refetch: () => Promise<FormMetadata | null>;
}

export function useFormMetadata({
  appName,
  modelName,
  objectId,
  nestedFields = [],
  exclude = [],
  only = [],
  excludeRelationships = [],
  onlyRelationships = [],
  skip = false,
  queryOptions,
}: UseFormMetadataOptions): UseFormMetadataResult {
  const client = useApolloClient();
  const nestedSignature = React.useMemo(
    () => stableSerialize(nestedFields ?? EMPTY_STRING_ARRAY),
    [nestedFields]
  );
  const excludeSignature = React.useMemo(
    () => stableSerialize(exclude ?? EMPTY_STRING_ARRAY),
    [exclude]
  );
  const onlySignature = React.useMemo(
    () => stableSerialize(only ?? EMPTY_STRING_ARRAY),
    [only]
  );
  const excludeRelSignature = React.useMemo(
    () => stableSerialize(excludeRelationships ?? EMPTY_STRING_ARRAY),
    [excludeRelationships]
  );
  const onlyRelSignature = React.useMemo(
    () => stableSerialize(onlyRelationships ?? EMPTY_STRING_ARRAY),
    [onlyRelationships]
  );

  const resolvedNestedFields = React.useMemo(
    () => normalizeStringArray(nestedFields),
    [nestedSignature]
  );
  const resolvedExclude = React.useMemo(
    () => normalizeStringArray(exclude),
    [excludeSignature]
  );
  const resolvedOnly = React.useMemo(
    () => normalizeStringArray(only),
    [onlySignature]
  );
  const resolvedExcludeRelationships = React.useMemo(
    () => normalizeStringArray(excludeRelationships),
    [excludeRelSignature]
  );
  const resolvedOnlyRelationships = React.useMemo(
    () => normalizeStringArray(onlyRelationships),
    [onlyRelSignature]
  );
  const signature = React.useMemo(
    () =>
      stableSerialize({
        objectId: objectId ?? null,
      }),
    [objectId]
  );
  const scopeKey = React.useMemo(
    () => buildMetadataScopeKey(appName, modelName, signature),
    [appName, modelName, signature]
  );
  const cachedEntry = useMetadataCacheEntry<FormMetadata>("form", scopeKey);
  const variables = React.useMemo(
    () => ({
      app: appName,
      model: modelName,
      objectId: objectId ?? undefined,
    }),
    [appName, modelName, objectId]
  );
  const metadataQueryOptions = React.useMemo(
    () => ({
      fetchPolicy: queryOptions?.fetchPolicy ?? DEFAULT_FETCH_POLICY,
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
      ModelSchemaQueryResult,
      ModelSchemaQueryVariables
    >({
      query: GET_MODEL_SCHEMA_FULL,
      variables,
      fetchPolicy: metadataQueryOptions.fetchPolicy,
      errorPolicy: metadataQueryOptions.errorPolicy,
      context: metadataQueryOptions.context,
    });
    const payload = result.data?.modelSchema ?? null;
    if (payload) {
      writeMetadataCacheEntry(
        "form",
        scopeKey,
        payload.metadataVersion,
        payload
      );
    }
    return payload as FormMetadata | null;
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

  const rawMetadata = skip ? null : cachedEntry?.data ?? null;
  const hasFilters =
    resolvedExclude.length > 0 ||
    resolvedOnly.length > 0 ||
    resolvedExcludeRelationships.length > 0 ||
    resolvedOnlyRelationships.length > 0;
  const metadata = React.useMemo(() => {
    if (!rawMetadata) return null;
    if (!hasFilters) return rawMetadata;
    return applyMetadataFilters(rawMetadata, {
      exclude: resolvedExclude,
      only: resolvedOnly,
      excludeRelationships: resolvedExcludeRelationships,
      onlyRelationships: resolvedOnlyRelationships,
    });
  }, [
    rawMetadata,
    hasFilters,
    resolvedExclude,
    resolvedOnly,
    resolvedExcludeRelationships,
    resolvedOnlyRelationships,
  ]);

  const baseLoading =
    !skip && !rawMetadata && (networkState.loading || shouldFetch);

  const [nestedMetadata, setNestedMetadata] = React.useState<
    Record<string, FormMetadata>
  >({});
  const [nestedLoading, setNestedLoading] = React.useState(false);
  const [nestedError, setNestedError] = React.useState<ApolloError | undefined>(
    undefined
  );

  const nestedTargets = React.useMemo(() => {
    if (!rawMetadata || resolvedNestedFields.length === 0) {
      return EMPTY_NESTED_TARGETS;
    }
    return resolveNestedTargets(rawMetadata, resolvedNestedFields);
  }, [rawMetadata, resolvedNestedFields]);

  React.useEffect(() => {
    if (nestedTargets.length === 0) {
      if (
        nestedLoading ||
        nestedError ||
        Object.keys(nestedMetadata).length > 0
      ) {
        setNestedMetadata({});
        setNestedLoading(false);
        setNestedError(undefined);
      }
      return;
    }

    let cancelled = false;
    setNestedLoading(true);
    setNestedError(undefined);

    const loadNested = async () => {
      const results: Record<string, FormMetadata> = {};
      for (const target of nestedTargets) {
        const nestedSignature = stableSerialize({ objectId: null });
        const nestedScopeKey = buildMetadataScopeKey(
          target.app,
          target.model,
          nestedSignature
        );
        const cached = readMetadataCacheEntry<FormMetadata>(
          "form",
          nestedScopeKey
        );
        if (isCacheEntryFresh(cached, METADATA_CACHE_TTL_MS)) {
          if (cached?.data) {
            results[target.name] = cached.data;
          }
          continue;
        }
        const response = await client.query<
          ModelSchemaQueryResult,
          ModelSchemaQueryVariables
        >({
          query: GET_MODEL_SCHEMA_FULL,
          variables: { app: target.app, model: target.model },
          fetchPolicy: metadataQueryOptions.fetchPolicy,
          errorPolicy: metadataQueryOptions.errorPolicy,
          context: metadataQueryOptions.context,
        });
        const payload = response.data?.modelSchema ?? null;
        if (payload) {
          writeMetadataCacheEntry(
            "form",
            nestedScopeKey,
            payload.metadataVersion,
            payload
          );
          results[target.name] = payload as FormMetadata;
        }
      }
      return results;
    };

    loadNested()
      .then((results) => {
        if (!cancelled) {
          setNestedMetadata(results ?? {});
          setNestedLoading(false);
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setNestedError(error as ApolloError);
          setNestedLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [
    client,
    metadataQueryOptions.context,
    metadataQueryOptions.errorPolicy,
    metadataQueryOptions.fetchPolicy,
    nestedTargets,
  ]);

  return {
    metadata,
    nestedMetadata,
    loading: baseLoading || nestedLoading,
    error: networkState.error ?? nestedError,
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

export function useModelForm<
  TFormValues extends Record<string, any> = Record<string, any>
>(options: UseModelFormOptions<TFormValues>): UseModelFormResult<TFormValues> {
  const {
    appName,
    modelName,
    objectId,
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

  const { metadata, nestedMetadata, loading, error, refetch } =
    useFormMetadata({
    appName,
    modelName,
    objectId,
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

  const schema = React.useMemo<FormSchema<TFormValues> | null>(() => {
    if (!metadata) return null;
    return buildSchemaFromMetadata<TFormValues>(
      metadata,
      nestedMetadata,
      initialValues ?? {},
      formMode
    );
  }, [metadata, nestedMetadata, initialValues, formMode]);

  const nestedFieldNames = React.useMemo(
    () => normalizeStringArray(nestedFields),
    [nestedFields]
  );

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
        
        const prefixedInput = applyNestedPrefix(
          processedInput,
          nestedFieldNames,
          nestedMetadata
        );
        const relationshipNormalizedInput = normalizeRelationshipInputValues(
          prefixedInput,
          metadata,
          nestedMetadata
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
          const { id: _ignoredId, ...updateInput } =
            (numericNormalizedInput ?? {}) as Record<string, any>;
          const result = await runUpdateMutation({
            variables: {
              id: String(targetId),
              input: updateInput,
            },
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
    nestedMetadata,
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

function applyMetadataFilters(
  metadata: FormMetadata,
  filters: {
    exclude: string[];
    only: string[];
    excludeRelationships: string[];
    onlyRelationships: string[];
  }
): FormMetadata {
  const excludeSet = new Set(filters.exclude);
  const onlySet = new Set(filters.only);
  const excludeRelSet = new Set(filters.excludeRelationships);
  const onlyRelSet = new Set(filters.onlyRelationships);

  const filteredFields = metadata.fields.filter((field) => {
    if (excludeSet.has(field.name) || excludeSet.has(field.fieldName)) {
      return false;
    }
    if (onlySet.size > 0) {
      return onlySet.has(field.name) || onlySet.has(field.fieldName);
    }
    return true;
  });

  const filteredRelationships = metadata.relationships.filter((relationship) => {
    if (
      excludeRelSet.has(relationship.name) ||
      excludeRelSet.has(relationship.fieldName)
    ) {
      return false;
    }
    if (onlyRelSet.size > 0) {
      return (
        onlyRelSet.has(relationship.name) ||
        onlyRelSet.has(relationship.fieldName)
      );
    }
    return true;
  });

  return {
    ...metadata,
    fields: filteredFields,
    relationships: filteredRelationships,
  };
}

export function buildSchemaFromMetadata<TFormValues extends Record<string, any>>(
  metadata: FormMetadata,
  nestedMetadata: Record<string, FormMetadata>,
  initialValues: Partial<TFormValues>,
  mode: "create" | "update"
): FormSchema<TFormValues> {
  const combinedFields = collectFieldConfigs(metadata, nestedMetadata, mode);
  const config = resolveFormConfig(metadata);
  const sectionTitle = config.title ?? metadata.verboseName;
  const sectionDescription = config.description ?? undefined;

  const sections: FormSectionConfig[] = combinedFields.length
    ? [
        {
          id: "primary",
          title: sectionTitle,
          description: sectionDescription,
          fields: combinedFields,
        },
      ]
    : [];

  if (sections.length === 0) {
    return {
      id: `${metadata.app}.${metadata.model}`,
      fields: [],
      initialValues,
      meta: {
        appName: metadata.app,
        modelName: metadata.model,
      },
    };
  }

  return {
    id: `${metadata.app}.${metadata.model}`,
    sections,
    initialValues,
    meta: {
      appName: metadata.app,
      modelName: metadata.model,
    },
  };
}

export function collectFieldConfigs(
  metadata: FormMetadata,
  nestedMetadata: Record<string, FormMetadata>,
  mode: "create" | "update"
): FormFieldConfig[] {
  const config = resolveFormConfig(metadata);
  const readonly = new Set(config.readonlyFields ?? []);
  const excluded = new Set(config.excludeFields ?? []);
  const primitiveFields = metadata.fields
    .filter((field) => {
      if (excluded.has(field.name) || excluded.has(field.fieldName)) {
        return false;
      }
      if (field.readable === false) {
        return false;
      }
      if (mode === "create" && field.editable === false) {
        return false;
      }
      return true;
    })
    .map((field) => mapFieldSchema(field, readonly))
    .filter((field): field is FormFieldConfig => Boolean(field));

  const relationshipFields = metadata.relationships
    .filter((relationship) => {
      if (
        excluded.has(relationship.name) ||
        excluded.has(relationship.fieldName)
      ) {
        return false;
      }
      if (relationship.readable === false) {
        return false;
      }
      if (relationship.editable === false || relationship.writable === false) {
        return false;
      }
      return true;
    })
    .map((relationship) => mapRelationshipSchema(relationship, readonly))
    .filter((field): field is FormFieldConfig => Boolean(field));

  const nestedFields = Object.entries(nestedMetadata)
    .map(([fieldName, nestedMeta]) => {
      const relation = metadata.relationships.find(
        (rel) => rel.name === fieldName || rel.fieldName === fieldName
      );
      return mapNestedMetadata(fieldName, relation, nestedMeta, mode);
    })
    .filter((field): field is FormFieldConfig => Boolean(field));

  const ordering = config.fieldOrder ?? [];
  return sortFieldsByOrder(
    [...primitiveFields, ...relationshipFields, ...nestedFields],
    ordering
  );
}

function mapFieldSchema(
  field: FieldSchema,
  readonlyFields: Set<string>
): FormFieldConfig | null {
  const custom = parseCustomMetadata<Record<string, any>>(field.customMetadata);
  const inputType = resolveInputType(field, custom);
  const placeholder = custom?.placeholder;
  const className = custom?.className ?? custom?.class;
  const dataAttributes = custom?.dataAttributes ?? custom?.data_attributes;
  const order = typeof custom?.order === "number" ? custom.order : undefined;

  const visibility = String(field.visibility ?? "").toLowerCase();
  const hiddenFromVisibility =
    visibility === "hidden" || visibility === "redacted";
  const hiddenOverride = custom?.hidden ?? custom?.hide;
  const isJsonField = Boolean(field.isJson) || field.fieldType === "JSONField";
  const hidden =
    hiddenFromVisibility ||
    (hiddenOverride !== undefined ? Boolean(hiddenOverride) : isJsonField);

  const readOnlyOverride = custom?.readOnly ?? custom?.readonly;
  const resolvedReadOnly =
    readOnlyOverride !== undefined
      ? readOnlyOverride
      : readonlyFields.has(field.name) ||
        !field.editable ||
        field.writable === false;

  const base = {
    name: field.name,
    label: field.verboseName || field.name,
    description: field.helpText || undefined,
    placeholder: placeholder || undefined,
    required: field.required,
    defaultValue: field.defaultValue,
    disabled: custom?.disabled ?? !field.editable,
    readOnly: resolvedReadOnly,
    className,
    dataAttributes,
    order,
    hidden: hidden || field.readable === false,
  };

  const choiceOptions = normalizeChoiceOptions(field.choices);
  if (choiceOptions.length) {
    const multiple = Boolean(
      custom?.multiple || custom?.multi || custom?.multiselect
    );
    const config: ChoiceFieldConfig = {
      ...base,
      type: inputType === "radio" ? "radio" : "select",
      options: choiceOptions,
      multiple,
    };
    if (config.multiple && config.defaultValue === undefined) {
      config.defaultValue = [];
    }
    return config;
  }

  if (
    inputType === "number" ||
    inputType === "decimal" ||
    inputType === "slider" ||
    inputType === "range"
  ) {
    const config: NumberFieldConfig = {
      ...base,
      type: inputType,
      min: field.minValue ?? undefined,
      max: field.maxValue ?? undefined,
      step: inferDecimalStep(field.decimalPlaces, inputType),
    };
    return config;
  }

  if (
    inputType === "text" ||
    inputType === "textarea" ||
    inputType === "email" ||
    inputType === "password" ||
    inputType === "json"
  ) {
    const config: TextFieldConfig = {
      ...base,
      type: inputType,
      minLength: field.minLength ?? undefined,
      maxLength: field.maxLength ?? undefined,
    };
    return config;
  }

  if (inputType === "checkbox" || inputType === "switch") {
    return {
      ...base,
      type: inputType,
      defaultValue:
        typeof base.defaultValue === "boolean" ? base.defaultValue : false,
    };
  }

  if (inputType === "file") {
    return {
      ...base,
      type: inputType,
    };
  }

  return {
    ...base,
    type: inputType,
  };
}

function normalizeChoiceOptions(
  choices: FieldSchema["choices"]
): Array<{ value: string | number; label: string; disabled?: boolean }> {
  if (!Array.isArray(choices) || choices.length === 0) {
    return [];
  }
  return choices
    .map((choice) => {
      if (!choice) return null;
      const rawValue = (choice as { value?: unknown }).value;
      if (rawValue === undefined || rawValue === null) {
        return null;
      }
      const value =
        typeof rawValue === "string" || typeof rawValue === "number"
          ? rawValue
          : String(rawValue);
      const label =
        typeof choice.label === "string" && choice.label.length > 0
          ? choice.label
          : String(value);
      return {
        value,
        label,
        disabled: choice.disabled,
      };
    })
    .filter(
      (
        option
      ): option is { value: string | number; label: string; disabled?: boolean } =>
        Boolean(option)
    );
}

function mapRelationshipSchema(
  relationship: RelationshipSchema,
  readonlyFields: Set<string>
): FormFieldConfig | null {
  const relatedModel = relationship.relatedApp
    ? `${relationship.relatedApp}.${relationship.relatedModel}`
    : relationship.relatedModel;
  const custom = parseCustomMetadata<Record<string, any>>(
    relationship.customMetadata
  );
  const inlineCreate = resolveInlineCreateConfig(relationship, custom);
  const readOnlyOverride = custom?.readOnly ?? custom?.readonly;
  const resolvedReadOnly =
    readOnlyOverride !== undefined
      ? readOnlyOverride
      : readonlyFields.has(relationship.name) ||
        !relationship.editable ||
        relationship.writable === false;

  const config: QueryChoiceFieldConfig = {
    name: relationship.name,
    label: relationship.verboseName || relationship.name,
    description: relationship.helpText || undefined,
    type: "select-query",
    multiple: relationship.isToMany,
    required: relationship.required,
    defaultValue: relationship.isToMany ? [] : null,
    placeholder: custom?.placeholder || undefined,
    relatedModel,
    disabled: custom?.disabled ?? !relationship.editable,
    readOnly: resolvedReadOnly,
    className: custom?.className ?? custom?.class,
    inlineCreate: inlineCreate ?? undefined,
    hidden: relationship.readable === false,
  };
  return config;
}

function mapNestedMetadata(
  fieldName: string,
  relation: RelationshipSchema | undefined,
  nestedMeta: FormMetadata,
  mode: "create" | "update"
): FormFieldConfig | null {
  const nestedFields = collectFieldConfigs(nestedMeta, {}, mode);
  if (nestedFields.length === 0) {
    return null;
  }
  const label = nestedMeta.verboseName || relation?.verboseName || fieldName;
  const description = undefined;
  const multiple = relation?.isToMany ?? false;
  if (multiple) {
    const config: ListFieldConfig = {
      name: fieldName,
      label,
      description,
      type: "list",
      fields: nestedFields,
      defaultValue: [],
      required: relation?.required ?? false,
      addLabel: label ? `Ajouter ${label}` : undefined,
      itemLabel: label || undefined,
    };
    return config;
  }
  return {
    name: fieldName,
    label,
    description,
    type: "object",
    fields: nestedFields,
    required: relation?.required ?? false,
  };
}

function resolveInlineCreateConfig(
  relationship: RelationshipSchema,
  custom: Record<string, any> | null
) {
  if (custom?.inlineCreate === false) {
    return { enabled: false };
  }
  if (custom?.inlineCreate && typeof custom.inlineCreate === "object") {
    return { ...custom.inlineCreate };
  }
  if (relationship.canCreateInline) {
    return { enabled: true };
  }
  return null;
}

function resolveInputType(
  field: FieldSchema,
  custom: Record<string, any> | null
): FormInputType {
  const customType = custom?.inputType ?? custom?.input_type;
  if (customType) {
    return customType as FormInputType;
  }
  const widget = custom?.widget ?? custom?.widgetType ?? custom?.widget_type;
  if (field.choices?.length) {
    if (widget === "radio") return "radio";
    return "select";
  }
  switch (widget) {
    case "textarea":
      return "textarea";
    case "checkbox":
      return "checkbox";
    case "number":
      return field.fieldType === "DecimalField" ? "decimal" : "number";
    case "date":
      return "date";
    case "datetime-local":
      return "datetime-local";
    case "multiselect":
      return "select";
    case "email":
      return "email";
    case "url":
      return "text";
    default:
      break;
  }
  switch (field.fieldType) {
    case "DecimalField":
    case "FloatField":
      return "decimal";
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

function resolveNestedFieldNames(
  nestedFieldNames: string[],
  nestedMetadata: Record<string, FormMetadata>
) {
  const keys = Object.keys(nestedMetadata ?? {});
  return keys.length ? keys : nestedFieldNames;
}

function applyNestedPrefix(
  input: Record<string, any>,
  nestedFieldNames: string[],
  nestedMetadata: Record<string, FormMetadata>
): Record<string, any> {
  const nestedNames = resolveNestedFieldNames(
    nestedFieldNames,
    nestedMetadata
  );
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
  metadata: FormMetadata | null,
  nestedMetadata: Record<string, FormMetadata>
): Record<string, any> {
  if (!metadata) return input;
  const clone: Record<string, any> = { ...input };

  metadata.relationships.forEach((relationship) => {
    const fieldName = relationship.name;
    if (!(fieldName in clone)) return;
    clone[fieldName] = normalizeRelationshipFieldValue(clone[fieldName]);
  });

  const nestedNames = resolveNestedFieldNames([], nestedMetadata);
  nestedNames.forEach((nestedName) => {
    const nestedMeta = nestedMetadata[nestedName];
    if (!nestedMeta) return;
    // Check for both prefixed and original names to be safe,
    // though at this point they should be prefixed if applyNestedPrefix was called.
    const prefixedName = `nested_${nestedName}`;

    let nestedKey: string | undefined;
    if (prefixedName in clone) {
      nestedKey = prefixedName;
    } else if (nestedName in clone) {
      nestedKey = nestedName;
    }

    if (!nestedKey) return;

    const nestedValue = clone[nestedKey];
    if (Array.isArray(nestedValue)) {
      clone[nestedKey] = nestedValue.map((entry) =>
        entry && typeof entry === "object"
          ? normalizeRelationshipInputValues(
              entry as Record<string, any>,
              nestedMeta,
              {}
            )
          : entry
      );
      return;
    }
    if (nestedValue && typeof nestedValue === "object") {
      clone[nestedKey] = normalizeRelationshipInputValues(
        nestedValue as Record<string, any>,
        nestedMeta,
        {}
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
  metadata: FormMetadata | null
): Record<string, any> {
  if (!metadata) {
    return input;
  }
  const dateLikeFields = new Set(
    metadata.fields
      .filter((field) =>
        field.isDate ||
        field.isDatetime ||
        ["DateField", "DateTimeField", "TimeField"].includes(
          field.fieldType ?? ""
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
  metadata: FormMetadata | null,
  nestedMetadata: Record<string, FormMetadata>
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
  Object.entries(nestedMetadata ?? {}).forEach(([nestedKey, nestedMeta]) => {
    if (!nestedKey || !(nestedKey in clone)) return;
    const nestedValue = clone[nestedKey];
    if (Array.isArray(nestedValue)) {
      clone[nestedKey] = nestedValue.map((entry) =>
        entry && typeof entry === "object"
          ? normalizeChoiceEnumValues(entry as Record<string, any>, nestedMeta, {})
          : entry
      );
    } else if (nestedValue && typeof nestedValue === "object") {
      clone[nestedKey] = normalizeChoiceEnumValues(
        nestedValue as Record<string, any>,
        nestedMeta,
        {}
      );
    }
  });

  return clone;
}

function coerceNumericFieldValues(
  input: Record<string, any>,
  metadata: FormMetadata | null
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
      ].includes(field.fieldType ?? "")
    )
    .map((field) => field.name);

  const decimalFieldNames = metadata.fields
    .filter((field) =>
      ["DecimalField", "FloatField"].includes(field.fieldType ?? "")
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
