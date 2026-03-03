import type { UseFormReturn } from "@tanstack/react-form";
import { describe, expect, it } from "vitest";

import { resolveRequiredError } from "../inputs/common";
import { createValidators } from "../renderers/FieldRenderer";
import type { BaseFieldConfig, FormFieldConfig } from "../types/schema";

describe("required boolean validation", () => {
 it("does not treat false as missing for checkbox/switch fields", () => {
 const config: BaseFieldConfig = {
 name: "is_active",
 type: "switch",
 label: "Active",
 required: true,
 };

 expect(resolveRequiredError(config, false, true)).toBeUndefined();
 expect(resolveRequiredError(config, true, true)).toBeUndefined();
 expect(resolveRequiredError(config, undefined, true)).toBe(
 "Ce champ est obligatoire",
 );
 });

 it("does not emit required error from createValidators for false", () => {
 const config = {
 name: "is_active",
 type: "checkbox",
 label: "Active",
 required: true,
 } as FormFieldConfig;

 const form = {
 state: { values: {} },
 } as unknown as UseFormReturn<Record<string, unknown>>;

 const validators = createValidators(config, form, "is_active");
 const onSubmit = validators?.onSubmit;
 expect(onSubmit?.({ value: false })).toBeUndefined();
 expect(onSubmit?.({ value: undefined })).toBe("This field is required");
 });
});
