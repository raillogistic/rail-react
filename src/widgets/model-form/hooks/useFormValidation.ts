/**
 * Hook for form-level (cross-field) validation.
 *
 * Runs the validate function from behavior config and schema validators
 * on submit, applying errors to specific fields.
 */
import React from "react";
import type { UseFormReturn } from "@tanstack/react-form";
import type { FormValidator } from "../types/schema";
import type { FormErrors } from "../types/behavior";

interface UseFormValidationOptions<TValues> {
 form?: UseFormReturn<TValues>;
 validate?: (values: TValues) => FormErrors<TValues> | undefined;
 schemaValidators?: FormValidator<TValues>[];
}

export function useFormValidation<TValues extends Record<string, any>>(
 options: UseFormValidationOptions<TValues>,
) {
 const { form, validate, schemaValidators } = options;
 const [formErrors, setFormErrors] = React.useState<
 Record<string, string>
 >({});

 const runValidation = React.useCallback(
 (
 values: TValues,
 formOverride?: UseFormReturn<TValues>,
 ): boolean => {
 const errors: Record<string, string> = {};
 const targetForm = formOverride ?? form;

 // Run behavior.validate
 if (validate) {
 const result = validate(values);
 if (result) {
 Object.assign(errors, result);
 }
 }

 // Run schema.validators
 if (schemaValidators) {
 for (const validator of schemaValidators) {
 const result = validator(values);
 if (result) {
 Object.assign(errors, result);
 }
 }
 }

 setFormErrors(errors);

 // Apply errors to form fields
 if (targetForm?.setFieldMeta) {
 for (const [fieldName, message] of Object.entries(errors)) {
 targetForm.setFieldMeta(fieldName as any, (prev) => ({
 ...prev,
 isValid: false,
 errors: [message],
 errorMap: {
 ...(prev?.errorMap ?? {}),
 onSubmit: message,
 },
 }));
 }
 }

 return Object.keys(errors).length === 0;
 },
 [form, validate, schemaValidators],
 );

 const clearFormErrors = React.useCallback(() => {
 setFormErrors({});
 }, []);

 return { formErrors, runValidation, clearFormErrors };
}
