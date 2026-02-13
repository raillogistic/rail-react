import { useMemo } from "react";
import type { ValidatorFn } from "../types/schema";
import type {
  ModelFormContract,
  ModelFormContractField,
} from "../types/generatedContract";
import { asRecord } from "../utils/jsonCoercion";

export type GeneratedValidatorExtensionMap = Record<
  string,
  ValidatorFn | ValidatorFn[]
>;

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

  const maxLength = Number((constraints as Record<string, unknown>).max_length);
  if (Number.isFinite(maxLength) && maxLength > 0) {
    validators.push((value) => {
      if (typeof value === "string" && value.length > maxLength) {
        return `${field.label} must be at most ${maxLength} characters.`;
      }
      return undefined;
    });
  }

  const minValue = Number((constraints as Record<string, unknown>).min_value);
  if (Number.isFinite(minValue)) {
    validators.push((value) => {
      if (typeof value === "number" && value < minValue) {
        return `${field.label} must be greater than or equal to ${minValue}.`;
      }
      return undefined;
    });
  }

  const maxValue = Number((constraints as Record<string, unknown>).max_value);
  if (Number.isFinite(maxValue)) {
    validators.push((value) => {
      if (typeof value === "number" && value > maxValue) {
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

export function useGeneratedValidators(
  contract: ModelFormContract | null | undefined,
  extensions?: GeneratedValidatorExtensionMap,
) {
  const fieldValidators = useMemo(() => {
    const output: Record<string, ValidatorFn[]> = {};
    for (const field of contract?.fields ?? []) {
      const baseValidators = getConstraintValidators(field);
      const custom = asValidatorList(extensions?.[field.path]);
      output[field.path] = [...baseValidators, ...custom];
    }
    return output;
  }, [contract, extensions]);

  const formValidator = useMemo(() => {
    return (values: Record<string, any>) => {
      const errors: Record<string, string> = {};
      for (const [path, validators] of Object.entries(fieldValidators)) {
        const value = values?.[path];
        for (const validator of validators) {
          const result = validator(value, { values, name: path });
          if (typeof result === "string" && result.trim()) {
            errors[path] = result;
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
