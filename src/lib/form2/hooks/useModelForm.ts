import * as React from "react";
import {
  gql,
  useMutation,
  type MutationHookOptions,
  type MutationResult,
} from "@apollo/client";
import { useForm } from "@tanstack/react-form";
import { useFormMetadata } from "./useFormMetadata";
import type {
  UseModelFormOptions,
  UseModelFormResult,
  UseModelFormSubmitContext,
  FormMetadata,
} from "../types";
import {
  build_create_mutation,
  build_update_mutation,
  type CreateMutationResponse,
  type UpdateMutationResponse,
  type CreateMutationVariables,
  type UpdateMutationVariables,
  type MutationError,
  getMutationFieldName,
} from "../mutations";
import { buildFormSchema } from "../utils/schema-builders";
import { buildDefaultsFromSchema } from "../utils/defaults";
import {
  applyServerErrors,
  normalizeErrorFieldPath,
} from "../utils/errors";
import {
  stripUntouchedFieldValues,
  normalizeRelationshipInputValues,
  sanitizeEmptyScalarValues,
  coerceNumericFieldValues,
} from "../utils/values";

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
    objectId,
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
      nestedFields,
      exclude,
      only,
      excludeRelationships,
      onlyRelationships,
      objectId,
      skip,
      queryOptions,
    });

  const formMode: "create" | "update" =
    mutationMode === "update" ? "update" : "create";

  const schema = React.useMemo(() => {
    if (!metadata) return null;
    return buildFormSchema<TFormValues>(
      metadata,
      nestedMetadata,
      initialValues ?? {},
      formMode
    );
  }, [metadata, nestedMetadata, initialValues, formMode]);

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
      const fallbackKey = getMutationFieldName(
        modelName ?? "",
        mode === "update" ? "update" : "create"
      );
      return (data as any)?.[fallbackKey] ?? null;
    },
    [modelName]
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
  >(createDocument, mutationOptions ?? ({} as MutationHookOptions<any, any>));

  const [runUpdateMutation, updateState] = useMutation<
    UpdateMutationResponse<any>,
    UpdateMutationVariables<Record<string, any>>
  >(updateDocument, mutationOptions ?? ({} as MutationHookOptions<any, any>));

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
          } as UseModelFormSubmitContext<TFormValues>);
          return;
        }
        if (!mutationMode) return;
        if (!metadata) {
          throw new Error("Metadata is required to submit this form.");
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

        const relationshipNormalizedInput = normalizeRelationshipInputValues(
          processedInput,
          metadata,
          formMode
        );
        const normalizedInput = sanitizeEmptyScalarValues(
          relationshipNormalizedInput,
          metadata
        );
        const numericNormalizedInput = coerceNumericFieldValues(
          normalizedInput,
          metadata
        );

        applyServerErrors([], form, setMutationErrors);
        if (mutationMode === "update") {
          const targetId = mutationId ?? (value as any)?.id;
          if (!targetId) {
            throw new Error("An id is required to update this record.");
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
            throw new Error("Update mutation returned no data.");
          }
          if ((payload as any).errors?.length) {
            applyServerErrors((payload as any).errors, form, setMutationErrors);
            throw new Error(
              (payload as any).errors?.[0]?.message ?? "Update failed."
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
            throw new Error("Create mutation returned no data.");
          }
          if ((payload as any).errors?.length) {
            applyServerErrors((payload as any).errors, form, setMutationErrors);
            throw new Error(
              (payload as any).errors?.[0]?.message ?? "Create failed."
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
    createState: createState as MutationResult<CreateMutationResponse<any>>,
    updateState: updateState as MutationResult<UpdateMutationResponse<any>>,
    mutationErrors,
    clearMutationErrors,
  };
}

export type {
  UseModelFormOptions,
  UseModelFormResult,
  UseModelFormSubmitContext,
  FormMetadata,
};
