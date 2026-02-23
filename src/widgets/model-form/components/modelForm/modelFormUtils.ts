import type {
  ModelFormMode,
  ModelFormMutationOutcome,
  ModelFormRuntimeOverride,
} from "../../types/generatedContract";

export type GeneratedMutationPayload = {
  ok?: boolean;
  errors?: unknown;
  conflict?: boolean;
  formErrorKey?: string;
};

export const EMPTY_RUNTIME_OVERRIDES: ModelFormRuntimeOverride[] = [];
export const EMPTY_PATHS: string[] = [];

export function normalizeMode(mode?: string | null): ModelFormMode {
  const normalized = String(mode ?? "CREATE").toUpperCase();
  if (normalized === "UPDATE" || normalized === "VIEW") {
    return normalized;
  }
  return "CREATE";
}

export function isModelFormModeWithInitialData(mode: ModelFormMode): boolean {
  return mode === "UPDATE" || mode === "VIEW";
}

export function toError(value: unknown): Error {
  if (value instanceof Error) return value;
  return new Error(String(value ?? "Unknown ModelForm error."));
}

export function mergeValidationErrors(
  baseErrors: Record<string, string> | undefined,
  customErrors: Record<string, string> | undefined,
): Record<string, string> | undefined {
  const merged = {
    ...(baseErrors ?? {}),
    ...(customErrors ?? {}),
  };
  return Object.keys(merged).length > 0 ? merged : undefined;
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function deepMergeRecords(
  ...sources: Array<Record<string, unknown> | undefined>
): Record<string, unknown> | undefined {
  let hasSource = false;
  const result: Record<string, unknown> = {};

  for (const source of sources) {
    if (!source) continue;
    hasSource = true;

    for (const [key, sourceValue] of Object.entries(source)) {
      const existingValue = result[key];

      if (Array.isArray(sourceValue)) {
        result[key] = [...sourceValue];
        continue;
      }

      if (isRecord(sourceValue)) {
        if (isRecord(existingValue)) {
          result[key] =
            deepMergeRecords(existingValue, sourceValue) ?? sourceValue;
          continue;
        }
        result[key] = deepMergeRecords(sourceValue) ?? sourceValue;
        continue;
      }

      result[key] = sourceValue;
    }
  }

  return hasSource ? result : undefined;
}

export function getMutationPayload(
  operationName: string,
  data: Record<string, unknown> | null | undefined,
): GeneratedMutationPayload {
  if (!data || typeof data !== "object") {
    return {};
  }
  const response = data.response;
  if (response && typeof response === "object") {
    return response as GeneratedMutationPayload;
  }
  const byOperationName = data[operationName];
  if (byOperationName && typeof byOperationName === "object") {
    return byOperationName as GeneratedMutationPayload;
  }
  return {};
}

export function toActionSubmitOutcome(outcome: ModelFormMutationOutcome | null) {
  if (!outcome) return null;
  return {
    ok: Boolean(outcome.ok),
    conflict: Boolean(outcome.conflict),
    errorCount: Array.isArray(outcome.errors) ? outcome.errors.length : 0,
  };
}
