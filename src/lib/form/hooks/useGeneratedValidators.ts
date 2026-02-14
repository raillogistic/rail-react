import { useMemo } from "react";
import type { ValidatorFn } from "../types/schema";
import type {
  ModelFormContract,
  ModelFormContractField,
} from "../types/generatedContract";
import { asRecord } from "../utils/jsonCoercion";
import { getValueByPath } from "../utils/objectPath";

export type GeneratedValidatorExtensionMap = Record<
  string,
  ValidatorFn | ValidatorFn[]
>;

function toOptionalNumber(value: unknown): number | undefined {
  if (value === null || value === undefined) return undefined;
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : undefined;
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return undefined;
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

function coerceValueToNumber(value: unknown): number | undefined {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : undefined;
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return undefined;
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

function resolveValidatorLimit(
  field: ModelFormContractField,
  kind: "min" | "max",
): number | undefined {
  for (const validator of field.validators ?? []) {
    const validatorType = String(validator?.type ?? "").toLowerCase();
    const isTargetValidator =
      kind === "min"
        ? validatorType.includes("minvalue") ||
          validatorType === "min_value" ||
          validatorType === "minvaluevalidator"
        : validatorType.includes("maxvalue") ||
          validatorType === "max_value" ||
          validatorType === "maxvaluevalidator";
    if (!isTargetValidator) continue;

    const params = asRecord(validator?.params) ?? {};
    const candidate =
      kind === "min"
        ? (params.limit_value ??
            params.limitValue ??
            params.min_value ??
            params.minValue)
        : (params.limit_value ??
            params.limitValue ??
            params.max_value ??
            params.maxValue);
    const limit = toOptionalNumber(candidate);
    if (limit !== undefined) {
      return limit;
    }
  }
  return undefined;
}

function getConstraintValidators(field: ModelFormContractField): ValidatorFn[] {
  const validators: ValidatorFn[] = [];
  const constraints = asRecord(field.constraints) ?? {};

  if (field.required) {
    validators.push((value) => {
      if (value === undefined || value === null || value === "") {
        return `${field.label} is required.`;
      }
      return undefined;
    });
  }

  const maxLength = toOptionalNumber(
    (constraints as Record<string, unknown>).max_length,
  );
  if (Number.isFinite(maxLength) && maxLength > 0) {
    validators.push((value) => {
      if (typeof value === "string" && value.length > maxLength) {
        return `${field.label} must be at most ${maxLength} characters.`;
      }
      return undefined;
    });
  }

  const minValue =
    toOptionalNumber((constraints as Record<string, unknown>).min_value) ??
    resolveValidatorLimit(field, "min");
  if (minValue !== undefined) {
    validators.push((value) => {
      const numericValue = coerceValueToNumber(value);
      if (numericValue !== undefined && numericValue < minValue) {
        return `${field.label} must be greater than or equal to ${minValue}.`;
      }
      return undefined;
    });
  }

  const maxValue =
    toOptionalNumber((constraints as Record<string, unknown>).max_value) ??
    resolveValidatorLimit(field, "max");
  if (maxValue !== undefined) {
    validators.push((value) => {
      const numericValue = coerceValueToNumber(value);
      if (numericValue !== undefined && numericValue > maxValue) {
        return `${field.label} must be less than or equal to ${maxValue}.`;
      }
      return undefined;
    });
  }

  return validators;
}

function asValidatorList(value: ValidatorFn | ValidatorFn[] | undefined): ValidatorFn[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function resolveContractFieldName(field: ModelFormContractField): string {
  const declaredName = String(field.name ?? "").trim();
  if (declaredName) return declaredName;
  return String(field.path ?? field.fieldName ?? "").trim();
}

function contractFieldExtensionKeys(field: ModelFormContractField): string[] {
  const keys = new Set<string>();
  const add = (value: unknown) => {
    const normalized = String(value ?? "").trim();
    if (normalized) {
      keys.add(normalized);
    }
  };

  add(field.name);
  add(field.path);
  add(resolveContractFieldName(field));

  return Array.from(keys);
}

export function useGeneratedValidators(
  contract: ModelFormContract | null | undefined,
  extensions?: GeneratedValidatorExtensionMap,
) {
  const fieldValidators = useMemo(() => {
    const output: Record<string, ValidatorFn[]> = {};
    for (const field of contract?.fields ?? []) {
      const fieldName = resolveContractFieldName(field) || field.path;
      if (!fieldName) continue;
      const baseValidators = getConstraintValidators(field);
      const custom = contractFieldExtensionKeys(field).flatMap((key) =>
        asValidatorList(extensions?.[key]),
      );
      output[fieldName] = [...baseValidators, ...custom];
    }
    return output;
  }, [contract, extensions]);

  const formValidator = useMemo(() => {
    return (values: Record<string, any>) => {
      const errors: Record<string, string> = {};
      for (const [fieldName, validators] of Object.entries(fieldValidators)) {
        const value = getValueByPath(values, fieldName);
        for (const validator of validators) {
          const result = validator(value, { values, name: fieldName });
          if (typeof result === "string" && result.trim()) {
            errors[fieldName] = result;
            break;
          }
        }
      }
      return Object.keys(errors).length ? errors : undefined;
    };
  }, [fieldValidators]);

  return {
    fieldValidators,
    formValidator,
  };
}
