import DynamicForm from "./inputs/form";

export default DynamicForm;
export { DynamicForm };

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
