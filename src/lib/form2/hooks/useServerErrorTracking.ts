import * as React from "react";
import { toast } from "@/lib/components/ui/sonner";
import type { UseFormReturn } from "@tanstack/react-form";
import type { MutationError } from "../types";
import {
  getValueAtPath,
  hasValueChangedSinceError,
  isBlockingError,
  normalizeErrorFieldPath,
} from "../utils/errors";

export function useServerErrorTracking(options: {
  form: UseFormReturn<any>;
  mutationErrors: MutationError[];
  fieldMeta: Record<string, any>;
  clearMutationErrors: (fieldName?: string) => void;
}) {
  const { form, mutationErrors, fieldMeta, clearMutationErrors } = options;
  const serverErrorFieldsRef = React.useRef<Set<string>>(new Set());
  const serverErrorValuesRef = React.useRef<Map<string, any>>(new Map());
  const lastServerErrorSignatureRef = React.useRef<string>("");

  React.useEffect(() => {
    const blockingErrors = mutationErrors.filter(isBlockingError);
    if (blockingErrors.length === 0) {
      serverErrorFieldsRef.current = new Set();
      lastServerErrorSignatureRef.current = "";
      serverErrorValuesRef.current = new Map();
      return;
    }
    const normalizedErrorFields = blockingErrors
      .map((err) => normalizeErrorFieldPath(err.field))
      .filter((field): field is string => Boolean(field));
    serverErrorFieldsRef.current = new Set(normalizedErrorFields);
    const valuesSnapshot =
      typeof form.store.getState === "function"
        ? form.store.getState().values
        : (form.store as any).state?.values ?? {};
    const snapshot = new Map<string, any>();
    normalizedErrorFields.forEach((fieldName) => {
      snapshot.set(fieldName, getValueAtPath(valuesSnapshot, fieldName));
    });
    serverErrorValuesRef.current = snapshot;
    const signature = blockingErrors
      .map(
        (err) =>
          `${normalizeErrorFieldPath(err.field) ?? "form"}:${err.message}`
      )
      .join("|");
    if (signature === lastServerErrorSignatureRef.current) {
      return;
    }
    lastServerErrorSignatureRef.current = signature;
    toast.error("Server returned validation errors.");
  }, [mutationErrors, form]);

  React.useEffect(() => {
    const erroredFields = serverErrorFieldsRef.current;
    if (!erroredFields.size) {
      return;
    }
    const valuesSnapshot =
      typeof form.store.getState === "function"
        ? form.store.getState().values
        : (form.store as any).state?.values ?? {};
    Object.entries(fieldMeta).forEach(([name, meta]) => {
      const normalizedName = normalizeErrorFieldPath(name) ?? name;
      if (!erroredFields.has(normalizedName) || !meta) {
        return;
      }
      const hasChangedSinceError = hasValueChangedSinceError(
        normalizedName,
        valuesSnapshot,
        serverErrorValuesRef.current
      );
      if (hasChangedSinceError) {
        erroredFields.delete(normalizedName);
        serverErrorValuesRef.current.delete(normalizedName);
        clearMutationErrors(normalizedName);
        form.setFieldMeta(name as any, (previous) => {
          const nextErrorMap = { ...(previous?.errorMap ?? {}) };
          const serverMessage = nextErrorMap.onSubmit;
          delete nextErrorMap.onSubmit;
          const nextErrors = Array.isArray(previous?.errors)
            ? previous.errors.filter((message) => message !== serverMessage)
            : previous?.errors;
          return {
            ...previous,
            isValid: !nextErrors || nextErrors.length === 0,
            errorMap: nextErrorMap,
            errors: nextErrors,
          };
        });
      }
    });
  }, [fieldMeta, clearMutationErrors, form]);
}
