import React from "react";
import type { FormFieldConfig, FormSchema, FormSectionConfig } from "../types/schema";
import {
  createSubmitDispatchGuard,
  selectGeneratedSubmitOperation,
} from "../mutations";
import type {
  ModelFormContract,
  ModelFormInitialData,
  ModelFormMode,
  ModelFormMutationOutcome,
  ModelFormRuntimeOverride,
} from "../types/generatedContract";
import type { ModelFormSubmitState } from "../types.model";
import { asRecord, parseJsonValue } from "../utils/jsonCoercion";
import {
  getValueByPath,
  mergeValueByPath,
  setValueByPath,
  unsetValueByPath,
} from "../utils/objectPath";
import { normalizeGeneratedMutationErrors } from "../utils/normalizeMutationErrors";
import {
  CANONICAL_FORM_ERROR_KEY,
  resolveCanonicalFormErrorKey,
} from "../utils/errors";
import {
  ERROR_NORMALIZATION_BUDGET_MS,
  SUBMIT_ORCHESTRATION_BUDGET_MS,
  measureErrorNormalization,
  measureSubmitOrchestration,
} from "../utils/submitPerformance";
import { buildSubmitPayload, type SubmitPayloadEnvelope } from "../utils/buildSubmitPayload";
import { resolveSubmitIdentifier } from "../utils/resolveSubmitIdentifier";
import {
  buildSubmitErrorOutcome,
  unwrapMutationPayload,
  toExecutionErrorMessage,
} from "./generatedSubmit/submitExecution";

const INITIAL_SUBMIT_STATE: ModelFormSubmitState = {
  status: "IDLE",
  isSubmitting: false,
  lockActive: false,
  outcome: null,
};

export type GeneratedSubmitExecutionContext = {
  mode: "CREATE" | "UPDATE";
  values: Record<string, unknown>;
  resolvedValues: Record<string, unknown>;
  envelope: SubmitPayloadEnvelope;
};

export type UseGeneratedModelFormOptions = {
  contract?: ModelFormContract | null;
  initialData?: ModelFormInitialData | null;
  runtimeOverrides?: ModelFormRuntimeOverride[];
  generatedEnabled?: boolean;
  legacySchema?: FormSchema<Record<string, any>>;
  submitMode?: ModelFormMode;
  objectId?: string | number | null;
  identifierKeyOverride?: string | null;
  executeMutation?: (
    operationName: string,
    variables: Record<string, unknown>,
    envelope: SubmitPayloadEnvelope,
  ) => Promise<unknown>;
  submitOverride?: (
    context: GeneratedSubmitExecutionContext,
  ) => Promise<unknown>;
};

type SubmitResult = {
  outcome: ModelFormMutationOutcome;
  orchestrationDurationMs: number;
  normalizationDurationMs: number;
};

function mapKindToInputType(kind: string): FormFieldConfig["type"] {
  switch (kind) {
    case "TEXTAREA":
      return "textarea";
    case "NUMBER":
      return "number";
    case "DECIMAL":
      return "decimal";
    case "BOOLEAN":
      return "switch";
    case "DATE":
      return "date";
    case "TIME":
      return "time";
    case "DATETIME":
      return "datetime-local";
    case "CHOICE":
      return "select";
    case "MULTI_CHOICE":
      return "select";
    case "JSON":
      return "json";
    case "FILE":
      return "file";
    case "RELATION":
      return "select-query";
    default:
      return "text";
  }
}

function applyOverrides(
  input: Record<string, any>,
  overrides: ModelFormRuntimeOverride[] = [],
): Record<string, any> {
  return (overrides ?? []).reduce((state, override) => {
    if (!override?.path) return state;
    const action = (override.action ?? "REPLACE").toUpperCase();
    if (action === "UNSET") {
      return unsetValueByPath(state, override.path);
    }
    if (action === "MERGE" && override.value && typeof override.value === "object") {
      return mergeValueByPath(
        state,
        override.path,
        override.value as Record<string, unknown>,
      );
    }
    return setValueByPath(state, override.path, override.value);
  }, { ...(input ?? {}) });
}

function resolveRelationFieldName(relation: {
  name?: string | null;
  path?: string | null;
}) {
  const declaredName = String(relation.name ?? "").trim();
  if (declaredName) return declaredName;
  return String(relation.path ?? "").trim();
}

function relationFieldCandidates(relation: {
  name?: string | null;
  path?: string | null;
}) {
  const candidates = new Set<string>();
  const add = (value?: string | null) => {
    const normalized = String(value ?? "").trim();
    if (normalized) {
      candidates.add(normalized);
    }
  };

  add(relation.name);
  add(relation.path);
  return Array.from(candidates);
}

function resolveContractFieldName(field: {
  name?: string | null;
  fieldName?: string | null;
  path?: string | null;
}) {
  const declaredName = String(field.name ?? "").trim();
  if (declaredName) return declaredName;
  return String(field.path ?? field.fieldName ?? "").trim();
}

function contractFieldCandidates(field: {
  name?: string | null;
  fieldName?: string | null;
  path?: string | null;
}) {
  const candidates = new Set<string>();
  const add = (value?: string | null) => {
    const normalized = String(value ?? "").trim();
    if (normalized) {
      candidates.add(normalized);
    }
  };

  add(field.name);
  add(field.path);

  return Array.from(candidates);
}

function resolveInitialPathValue(
  values: Record<string, any>,
  path: string,
): unknown {
  if (Object.prototype.hasOwnProperty.call(values, path)) {
    return values[path];
  }

  const nestedValue = getValueByPath(values, path);
  if (nestedValue !== undefined) {
    return nestedValue;
  }

  return undefined;
}

function normalizeInitialValuesByContract(
  values: Record<string, any>,
  contract?: ModelFormContract | null,
): Record<string, any> {
  if (!contract) {
    return { ...values };
  }

  let nextValues: Record<string, any> = {};
  let resolvedCount = 0;

  for (const field of contract.fields ?? []) {
    let resolved: unknown = undefined;
    for (const candidate of contractFieldCandidates(field)) {
      resolved = resolveInitialPathValue(values, candidate);
      if (resolved !== undefined) break;
    }
    if (resolved === undefined) continue;

    const normalizedFieldName = resolveContractFieldName(field) || field.path;
    if (!normalizedFieldName) continue;
    nextValues = setValueByPath(nextValues, normalizedFieldName, resolved);
    resolvedCount += 1;
  }

  for (const relation of contract.relations ?? []) {
    let resolved: unknown = undefined;
    for (const candidate of relationFieldCandidates(relation)) {
      resolved = resolveInitialPathValue(values, candidate);
      if (resolved !== undefined) break;
    }
    if (resolved === undefined) continue;

    const relationFieldName = resolveRelationFieldName(relation) || relation.path;
    if (!relationFieldName) continue;
    nextValues = setValueByPath(nextValues, relationFieldName, resolved);
    resolvedCount += 1;
  }

  if (resolvedCount === 0) {
    return { ...values };
  }

  return nextValues;
}

function isGeneratedIdentifierField(field: {
  name?: string;
  path: string;
  fieldName?: string;
}): boolean {
  const contractName = resolveContractFieldName(field)
    .split(".")
    .filter(Boolean)
    .at(-1)
    ?.toLowerCase();
  const fieldName = String(field.fieldName ?? "").trim().toLowerCase();
  const leafToken = String(field.path ?? "")
    .split(".")
    .filter(Boolean)
    .at(-1)
    ?.toLowerCase();
  return contractName === "id" || fieldName === "id" || leafToken === "id";
}

export function buildSchemaFromContract(
  contract: ModelFormContract,
): FormSchema<Record<string, any>> {
  const fieldsByPath = new Map<string, FormFieldConfig>();
  const resolveFieldByContractPath = (
    path: string,
  ): FormFieldConfig | undefined => fieldsByPath.get(path);

  const buildGeneratedRelationField = (
    relation: ModelFormContract["relations"][number],
  ): FormFieldConfig => {
    const relationFieldName = resolveRelationFieldName(relation) || relation.path;
    const relatedModel = [relation.relatedAppLabel, relation.relatedModelName]
      .filter(Boolean)
      .join(".");
    return {
      name: relationFieldName,
      type: "select-query",
      label: relation.label,
      required: false,
      readOnly: false,
      defaultValue: relation.toMany ? [] : null,
      multiple: relation.toMany,
      relatedModel: relatedModel || relation.relatedModelName,
      graphql: relatedModel
        ? {
            relatedModel,
          }
        : undefined,
      meta: {
        relationName: relationFieldName,
        relationPath: relation.path,
        relationType: relation.relationType,
        relatedAppLabel: relation.relatedAppLabel,
        relatedModelName: relation.relatedModelName,
      },
    } as FormFieldConfig;
  };

  for (const field of contract.fields) {
    if (field.hidden || field.readOnly || isGeneratedIdentifierField(field)) continue;
    const contractFieldName = resolveContractFieldName(field) || field.path;
    if (!contractFieldName) continue;
    const type = mapKindToInputType(field.kind);
    const uiConfig = asRecord(field.ui);
    const metadata = asRecord(field.metadata);
    const baseConfig: FormFieldConfig = {
      name: contractFieldName,
      type,
      label: field.label,
      required: field.required,
      readOnly: field.readOnly,
      defaultValue: parseJsonValue(field.defaultValue),
      inputProps: (uiConfig as Record<string, any>) ?? undefined,
      meta: {
        graphqlType: field.graphqlType,
        pythonType: field.pythonType,
        fieldPath: field.path,
      },
    } as FormFieldConfig;

    if (type === "select") {
      const choices = (metadata as Record<string, any>)?.choices;
      (baseConfig as any).options = Array.isArray(choices)
        ? choices.map((choice: any) => ({
            label: String(choice.label ?? choice.value),
            value: choice.value,
          }))
        : [];
      if (field.kind === "MULTI_CHOICE") {
        (baseConfig as any).multiple = true;
      }
    }

    const aliases = contractFieldCandidates(field);
    if (aliases.length === 0) {
      fieldsByPath.set(contractFieldName, baseConfig);
    } else {
      aliases.forEach((alias) => {
        fieldsByPath.set(alias, baseConfig);
      });
    }
  }

  for (const relation of contract.relations ?? []) {
    const relationFieldName = resolveRelationFieldName(relation) || relation.path;
    if (!relationFieldName) continue;
    if (!fieldsByPath.has(relationFieldName)) {
      fieldsByPath.set(relationFieldName, buildGeneratedRelationField(relation));
    }
    if (relation.path && !fieldsByPath.has(relation.path)) {
      const relationField = fieldsByPath.get(relationFieldName);
      if (relationField) {
        fieldsByPath.set(relation.path, relationField);
      }
    }
  }

  const assignedPaths = new Set<string>();
  const sections: FormSectionConfig[] = (contract.sections ?? [])
    .filter((section) => section.visible)
    .map((section) => {
      const sectionFields = section.fieldPaths
        .map((path) => {
          const field = resolveFieldByContractPath(path);
          if (field) {
            assignedPaths.add(field.name);
          }
          return field;
        })
        .filter(Boolean) as FormFieldConfig[];
      return {
        id: section.id,
        title: section.title ?? undefined,
        description: section.description ?? undefined,
        fields: sectionFields,
      };
    })
    .filter((section) => section.fields.length > 0);

  const danglingFields = Array.from(fieldsByPath.values()).filter(
    (field) => !assignedPaths.has(field.name),
  );

  if (danglingFields.length > 0) {
    const seen = new Set<string>();
    const deduped = danglingFields.filter((field) => {
      if (seen.has(field.name)) return false;
      seen.add(field.name);
      return true;
    });
    if (sections.length > 0) {
      sections[0] = {
        ...sections[0],
        fields: [...sections[0].fields, ...deduped],
      };
    } else {
      sections.push({
        id: "default",
        fields: deduped,
      });
    }
  }

  return {
    id: contract.id,
    sections,
  };
}

function normalizeSubmitMode(mode: ModelFormMode | undefined): "CREATE" | "UPDATE" {
  return mode === "UPDATE" ? "UPDATE" : "CREATE";
}

export function useGeneratedModelForm(options: UseGeneratedModelFormOptions) {
  const {
    contract,
    initialData,
    runtimeOverrides = [],
    generatedEnabled = true,
    legacySchema,
    submitMode,
    objectId,
    identifierKeyOverride,
    executeMutation,
    submitOverride,
  } = options;

  const usingGenerated = Boolean(generatedEnabled && contract);
  const rawSubmitMode = submitMode ?? contract?.mode ?? "CREATE";
  const activeSubmitMode = normalizeSubmitMode(rawSubmitMode);
  const formErrorKey = resolveCanonicalFormErrorKey(
    contract?.errorPolicy?.canonicalFormErrorKey ?? CANONICAL_FORM_ERROR_KEY,
  );
  const submitGuardRef = React.useRef(createSubmitDispatchGuard());
  const [submitState, setSubmitState] = React.useState<ModelFormSubmitState>(
    INITIAL_SUBMIT_STATE,
  );

  const visibleFieldPaths = React.useMemo(
    () =>
      new Set(
        [
          ...(contract?.fields ?? [])
            .filter((field) => !field.hidden)
            .flatMap((field) => {
              const canonicalName = resolveContractFieldName(field);
              return [
                canonicalName,
                ...contractFieldCandidates(field),
              ].filter(Boolean) as string[];
            }),
          ...((contract?.relations ?? []).flatMap((relation) => {
            const fieldName = resolveRelationFieldName(relation);
            return [fieldName, relation.path].filter(Boolean) as string[];
          }) ?? []),
        ],
      ),
    [contract],
  );

  const baseValues = React.useMemo(() => {
    const parsedValues = parseJsonValue(initialData?.values);
    if (!parsedValues || typeof parsedValues !== "object" || Array.isArray(parsedValues)) {
      return {};
    }

    return normalizeInitialValuesByContract(
      parsedValues as Record<string, any>,
      contract,
    );
  }, [initialData, contract]);

  const runtimeValues = React.useMemo(
    () => applyOverrides(baseValues, runtimeOverrides),
    [baseValues, runtimeOverrides],
  );

  const schema = React.useMemo<FormSchema<Record<string, any>>>(() => {
    if (!usingGenerated || !contract) {
      return legacySchema ?? { sections: [], fields: [] };
    }
    const generated = buildSchemaFromContract(contract);
    generated.initialValues = runtimeValues;
    return generated;
  }, [usingGenerated, contract, legacySchema, runtimeValues]);

  const buildSubmissionValues = React.useCallback(
    (values: Record<string, any>) => {
      return applyOverrides(values, runtimeOverrides);
    },
    [runtimeOverrides],
  );

  const canSubmit = Boolean(
    usingGenerated &&
      contract &&
      rawSubmitMode !== "VIEW" &&
      (executeMutation || submitOverride),
  );

  const submit = React.useCallback(
    async (
      values: Record<string, any>,
    ): Promise<ModelFormMutationOutcome> => {
      if (!canSubmit || !contract) {
        return buildErrorOutcome(
          "Generated submit executor is not configured.",
          formErrorKey,
          visibleFieldPaths,
        );
      }

      try {
        const result = await submitGuardRef.current.run<SubmitResult>(async () => {
          setSubmitState((prev) => ({
            ...prev,
            status: "SUBMITTING",
            isSubmitting: true,
            lockActive: true,
          }));

          const {
            result: orchestration,
            measurement: orchestrationMeasurement,
          } = measureSubmitOrchestration(() => {
            const mode = activeSubmitMode;
            const operationName = selectGeneratedSubmitOperation(
              contract.mutationBindings,
              mode,
              contract.modelName,
            );
            const resolvedValues = buildSubmissionValues(values);
            const identifier = resolveSubmitIdentifier({
              mode,
              values: resolvedValues,
              objectId,
              mutationBindings: contract.mutationBindings,
              identifierKeyOverride,
            });
            const envelope = buildSubmitPayload({
              mode,
              operationName,
              resolvedValues,
              relations: contract.relations,
              identifier,
            });
            return { mode, resolvedValues, envelope };
          });

          const executionPayload = submitOverride
            ? await submitOverride({
                mode: orchestration.mode,
                values,
                resolvedValues: orchestration.resolvedValues,
                envelope: orchestration.envelope,
              })
            : await executeMutation?.(
                orchestration.envelope.operationName,
                orchestration.envelope.variables,
                orchestration.envelope,
              );

          const payload = unwrapMutationPayload(
            executionPayload,
            orchestration.envelope.operationName,
          );

          const {
            result: normalizedErrors,
            measurement: normalizationMeasurement,
          } = measureErrorNormalization(() =>
            normalizeGeneratedMutationErrors(payload.errors ?? [], {
              formErrorKey,
              visibleFieldPaths,
            }),
          );

          const conflict =
            Boolean(payload.conflict) ||
            normalizedErrors.some((error) => Boolean(error.conflict));
          const ok = Boolean(payload.ok) && normalizedErrors.length === 0 && !conflict;

          const outcome: ModelFormMutationOutcome = {
            ok,
            errors: normalizedErrors,
            conflict,
            formErrorKey: resolveCanonicalFormErrorKey(
              String(payload.formErrorKey ?? formErrorKey),
            ),
          };

          const status: ModelFormSubmitState["status"] = ok
            ? "SUCCEEDED"
            : conflict
              ? "FAILED_CONFLICT"
              : normalizedErrors.length > 0
                ? "FAILED_VALIDATION"
                : "FAILED_EXECUTION";

          setSubmitState({
            status,
            isSubmitting: false,
            lockActive: false,
            outcome,
          });

          return {
            outcome,
            orchestrationDurationMs: orchestrationMeasurement.durationMs,
            normalizationDurationMs: normalizationMeasurement.durationMs,
          };
        });

        if (result.orchestrationDurationMs > SUBMIT_ORCHESTRATION_BUDGET_MS) {
          console.warn(
            `Generated submit orchestration exceeded budget: ${result.orchestrationDurationMs.toFixed(2)}ms.`,
          );
        }
        if (result.normalizationDurationMs > ERROR_NORMALIZATION_BUDGET_MS) {
          console.warn(
            `Generated submit normalization exceeded budget: ${result.normalizationDurationMs.toFixed(2)}ms.`,
          );
        }

        return result.outcome;
      } catch (error) {
        const outcome = buildSubmitErrorOutcome(error, {
          formErrorKey,
          visibleFieldPaths,
        });
        const primaryMessage =
          outcome.errors[0]?.message ?? toExecutionErrorMessage(error);
        const isReentrantError = /already in progress/i.test(primaryMessage);
        const hasValidationErrors = outcome.errors.some(
          (entry) => entry.source === "OPERATION",
        );

        if (!isReentrantError) {
          setSubmitState({
            status: hasValidationErrors ? "FAILED_VALIDATION" : "FAILED_EXECUTION",
            isSubmitting: false,
            lockActive: false,
            outcome,
          });
        }

        return outcome;
      }
    },
    [
      canSubmit,
      contract,
      activeSubmitMode,
      buildSubmissionValues,
      executeMutation,
      formErrorKey,
      identifierKeyOverride,
      objectId,
      rawSubmitMode,
      submitOverride,
      visibleFieldPaths,
    ],
  );

  return {
    usingGenerated,
    schema,
    mutationBindings: contract?.mutationBindings,
    errorPolicy: contract?.errorPolicy,
    initialValues: runtimeValues,
    buildSubmissionValues,
    submit,
    submitState,
    canSubmit,
  };
}
