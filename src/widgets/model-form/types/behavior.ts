/**
 * Behavior configuration for DynamicForm.
 *
 * Controls submission, change tracking, conditional visibility,
 * computed fields, field dependencies, autosave, and form-level validation.
 *
 * @module form/types/behavior
 */
import type { UseFormReturn } from "@tanstack/react-form";
import type { ChangeRecord } from "./schema";
import type { FormFieldPath } from "./props";

// ─── Submit Context ──────────────────────────────────────────────────────────

export interface FormSubmitContext<TValues> {
 form: UseFormReturn<TValues>;
 isInternal: boolean;
}

// ─── Condition Map ───────────────────────────────────────────────────────────

export type FormFieldSelector<TValues> =
 | FormFieldPath<TValues>
 | `${FormFieldPath<TValues>}.*`;

/**
 * Maps field names (or glob patterns like "address.*") to visibility predicates.
 * When a predicate returns`false` the field is hidden.
 */
export type FieldConditionMap<TValues> = Partial<Record<
 FormFieldSelector<TValues>,
 (values: TValues, ctx: { form: UseFormReturn<TValues> }) => boolean
>>;

// ─── Computed Field Map ──────────────────────────────────────────────────────

/**
 * Maps field names to derivation functions.
 * The return value is written into the form state when dependencies change.
 */
export type ComputedFieldMap<TValues> = Partial<Record<
 FormFieldPath<TValues>,
 (values: TValues, ctx: { form: UseFormReturn<TValues> }) => any
>>;

// ─── Field Dependency Map ────────────────────────────────────────────────────

export type FieldDependencyEffect = "reload" | "clear" | "reset";

export type FieldDependencyMap<TValues> = Partial<Record<
 FormFieldPath<TValues>,
 {
 /** Fields to watch for changes */
 watch: FormFieldPath<TValues>[];
 /** Action to take when a watched field changes */
 effect: FieldDependencyEffect;
 }
>>;

// ─── Form Errors ─────────────────────────────────────────────────────────────

export type FormErrors<TValues> = Partial<Record<FormFieldPath<TValues>, string>>;

// ─── Autosave Config ─────────────────────────────────────────────────────────

export interface FormAutosaveConfig<TValues> {
 enabled: boolean;
 debounceMs?: number;
 onSave: (values: TValues, changes: ChangeRecord[]) => Promise<void> | void;
}

// ─── Behavior Config ─────────────────────────────────────────────────────────

export interface FormBehaviorConfig<TValues> {
 /** Called on final submit */
 onSubmit?: (
 values: TValues,
 ctx: FormSubmitContext<TValues>,
 ) => Promise<void> | void;

 /** Called on any field change with diff details */
 onChange?: (
 values: TValues,
 changes: ChangeRecord[],
 form: UseFormReturn<TValues>,
 ) => void;

 /** Form-level cross-field validation (runs on submit) */
 validate?: (values: TValues) => FormErrors<TValues> | undefined;

 /** Conditional field visibility based on current values */
 conditions?: FieldConditionMap<TValues>;

 /** Computed/derived field values that update reactively */
 computed?: ComputedFieldMap<TValues>;

 /** Field dependency declarations for cascading reloads */
 dependencies?: FieldDependencyMap<TValues>;

 /** Autosave configuration */
 autosave?: FormAutosaveConfig<TValues>;
}
