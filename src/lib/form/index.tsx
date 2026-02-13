import DynamicForm from "./inputs/form";
import ModelForm from "./components/ModelForm";
import type { FormSchema } from "./types/schema";
import type { ModelFormContract } from "./types/generatedContract";

export default DynamicForm;
export { DynamicForm };
export { ModelForm };

// Schema, field, and props types
export * from "./types/index";

// Model-form level types (ModelFormProps, nested fields, etc.)
export * from "./types.model";

// Mutations
export * from "./mutations";

// Input factory
export { registerInputRenderer, resolveInputComponent } from "./inputs/factory";

// Hooks
export { useFormDefaults, buildDefaultsFromSchema } from "./hooks/useFormDefaults";
export { useFormChangeTracking } from "./hooks/useFormChangeTracking";
export { useFormAutoReset } from "./hooks/useFormAutoReset";
export { useFormConditions } from "./hooks/useFormConditions";
export { useFormComputed } from "./hooks/useFormComputed";
export { useFormDependencies } from "./hooks/useFormDependencies";
export { useFormValidation } from "./hooks/useFormValidation";

// Generated form contract integration
export * from "./generated";

export function resolveModelFormSchema(options: {
  generatedEnabled: boolean;
  contract?: ModelFormContract | null;
  generatedSchema?: FormSchema<Record<string, any>> | null;
  legacySchema?: FormSchema<Record<string, any>> | null;
}): FormSchema<Record<string, any>> | null {
  if (options.generatedEnabled && options.contract && options.generatedSchema) {
    return options.generatedSchema;
  }
  return options.legacySchema ?? null;
}
