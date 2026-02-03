import type { Dispatch, SetStateAction } from "react";
import type { UseFormReturn } from "@tanstack/react-form";
import type { MutationError } from "../../form/backend/types/mutations";

export function normalizeErrorFieldPath(field?: string | null): string | null {
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

export function applyServerErrors(
  errors: MutationError[] | null | undefined,
  form: UseFormReturn<any>,
  setMutationErrors: Dispatch<SetStateAction<MutationError[]>>
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

export function getValueAtPath(source: Record<string, any>, path: string) {
  if (!path) return undefined;
  const segments = path.split(".");
  let current: any = source;
  for (const segment of segments) {
    if (current === undefined || current === null) {
      return undefined;
    }
    const isIndex = /^\d+$/.test(segment);
    if (isIndex) {
      const index = Number(segment);
      current = Array.isArray(current) ? current[index] : undefined;
    } else {
      current = current?.[segment];
    }
  }
  return current;
}

export function hasValueChangedSinceError(
  fieldName: string,
  values: Record<string, any>,
  errorSnapshots: Map<string, any>
) {
  const previous = errorSnapshots.get(fieldName);
  const current = getValueAtPath(values, fieldName);
  return !deepEqual(previous, current);
}

export function deepEqual(a: any, b: any): boolean {
  if (a === b) {
    return true;
  }
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    for (let index = 0; index < a.length; index += 1) {
      if (!deepEqual(a[index], b[index])) {
        return false;
      }
    }
    return true;
  }
  if (a && b && typeof a === "object" && typeof b === "object") {
    const keysA = Object.keys(a);
    const keysB = Object.keys(b as Record<string, any>);
    if (keysA.length !== keysB.length) {
      return false;
    }
    for (const key of keysA) {
      if (!deepEqual(a[key], (b as Record<string, any>)[key])) {
        return false;
      }
    }
    return true;
  }
  return false;
}

function escapeRegex(value: string): string {
  return value.replace(/[-/\\^$+?.()|[\]{}]/g, "\\$&");
}
