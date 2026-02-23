import type { ModelFormMutationOutcome } from "../../types/generatedContract";
import { normalizeGeneratedMutationErrors } from "../../utils/normalizeMutationErrors";
import { NestedMutationPayloadError } from "../../utils/nestedMutationPayload";

type BuildSubmitErrorOutcomeOptions = {
  formErrorKey: string;
  visibleFieldPaths: Set<string>;
};

type NormalizedSubmitErrorPayload = {
  field?: string;
  message?: string;
  code?: string | null;
  source?: "OPERATION" | "EXECUTION" | "TRANSPORT";
  meta?: Record<string, unknown> | null;
};

export function toExecutionErrorMessage(error: unknown) {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }
  return "Submit execution failed.";
}

function normalizeThrownErrors(error: unknown): NormalizedSubmitErrorPayload[] {
  if (error instanceof NestedMutationPayloadError) {
    return [error.toNormalizedError()];
  }
  if (error instanceof AggregateError) {
    return error.errors.flatMap((entry) => normalizeThrownErrors(entry));
  }
  return [
    {
      message: toExecutionErrorMessage(error),
      source: "EXECUTION",
    },
  ];
}

export function buildSubmitErrorOutcome(
  error: unknown,
  options: BuildSubmitErrorOutcomeOptions,
): ModelFormMutationOutcome {
  const normalizedErrors = normalizeGeneratedMutationErrors(
    normalizeThrownErrors(error).map((item) => ({
      field: item.field ?? options.formErrorKey,
      message: item.message ?? "Submit execution failed.",
      code: item.code ?? null,
      source: item.source ?? "EXECUTION",
      meta: item.meta ?? null,
    })),
    {
      formErrorKey: options.formErrorKey,
      visibleFieldPaths: options.visibleFieldPaths,
    },
  );

  return {
    ok: false,
    conflict: false,
    formErrorKey: options.formErrorKey,
    errors: normalizedErrors,
  };
}

export function unwrapMutationPayload(
  payload: unknown,
  operationName: string,
): Record<string, unknown> {
  if (!payload || typeof payload !== "object") {
    return {};
  }
  const dictionary = payload as Record<string, unknown>;
  if (dictionary.ok !== undefined || dictionary.errors !== undefined) {
    return dictionary;
  }
  const response = dictionary.response;
  if (response && typeof response === "object") {
    return response as Record<string, unknown>;
  }
  const operationData = dictionary[operationName];
  if (operationData && typeof operationData === "object") {
    return operationData as Record<string, unknown>;
  }
  const data = dictionary.data;
  if (data && typeof data === "object") {
    return unwrapMutationPayload(data, operationName);
  }
  return {};
}
