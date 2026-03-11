/**
 * Top-level props for the DynamicForm component.
 *
 * Organizes all configuration into five semantic groups:
 * state, behavior, layout, actions, and devtools.
 *
 * @module form/types/props
 */
import type React from "react";
import type { UseFormReturn } from "@tanstack/react-form";
import type { FormSchema } from "./schema";
import type { FormBehaviorConfig } from "./behavior";
import type { FormLayoutConfig } from "./layout";
import type { FormActionsConfig } from "./actions";

export type PrimitiveFormValue =
 | string
 | number
 | boolean
 | bigint
 | symbol
 | null
 | undefined
 | Date
 | File
 | Blob;

export type NonTraversableFormValue =
 | PrimitiveFormValue
 | ((...args: any[]) => unknown);

export type FormObjectValue<T> = T extends NonTraversableFormValue
 ? never
 : T extends readonly any[]
   ? never
   : T extends object
     ? T
     : never;

export type DeepPartialFormValue<T> = T extends NonTraversableFormValue
 ? T
 : T extends Array<infer TValue>
   ? Array<DeepPartialFormValue<TValue>>
   : T extends ReadonlyArray<infer TValue>
     ? ReadonlyArray<DeepPartialFormValue<TValue>>
     : T extends object
       ? { [K in keyof T]?: DeepPartialFormValue<T[K]> }
       : T;

export type FormFieldPath<T> = T extends object
 ? {
     [K in Extract<keyof T, string>]: FormObjectValue<NonNullable<T[K]>> extends never
       ? K
       : K | `${K}.${FormFieldPath<FormObjectValue<NonNullable<T[K]>>>}`;
   }[Extract<keyof T, string>]
 : never;

export type FormFieldPathValue<T, TPath extends string> =
 TPath extends `${infer THead}.${infer TRest}`
 ? THead extends keyof T
   ? FormFieldPathValue<NonNullable<T[THead]>, TRest>
   : never
 : TPath extends keyof T
   ? T[TPath]
   : never;

export type FormDefaultValues<TValues extends Record<string, any>> =
 DeepPartialFormValue<TValues> &
 Partial<{
   [TPath in FormFieldPath<TValues>]: FormFieldPathValue<TValues, TPath>;
 }>;

type DisallowedLegacyDynamicFormProps = {
 defaultValues?: never;
 disableAutoReset?: never;
 readOnly?: never;
 disabled?: never;
 isLoading?: never;
 isSubmitting?: never;
 onReady?: never;
 persistKey?: never;
 onSubmit?: never;
 onChange?: never;
 validate?: never;
 conditions?: never;
 computed?: never;
 dependencies?: never;
 autosave?: never;
 columns?: never;
 variant?: never;
 showSectionHeaders?: never;
 mode?: never;
 submitLabel?: never;
 resetLabel?: never;
 onReset?: never;
};

export interface FormStateConfig<TValues> {
 /** External TanStack form instance (for shared state across components) */
 form?: UseFormReturn<TValues>;
 /** Runtime defaults merged over schema defaults; supports nested objects and dotted field paths */
 defaultValues?: FormDefaultValues<TValues>;
 /** Skip automatic form resets when defaults change */
 disableAutoReset?: boolean;
 /** Global read-only mode - all fields become non-editable */
 readOnly?: boolean;
 /** Global disabled mode - all fields become disabled */
 disabled?: boolean;
 /** External loading state that disables interactions */
 isLoading?: boolean;
 /** External submit lifecycle loading state (separate from data loading). */
 isSubmitting?: boolean;
 /** Fired once the form instance is initialized */
 onReady?: (form: UseFormReturn<TValues>) => void;
 /**
 * Persistence key for localStorage.
 * If provided, form values will be saved to localStorage and restored on mount.
 */
 persistKey?: string;
}

export interface FormDevtoolsConfig<TValues> {
 /** Enable the debug panel */
 enabled?: boolean;
 /** Transform values before displaying in debug panel */
 transformValues?: (values: TValues) => any;
 /** Show field metadata alongside values */
 showFieldMeta?: boolean;
 /** Show submit diagnostics (invalid fields, reasons) */
 showDiagnostics?: boolean;
 /** Log changes to console */
 logChanges?: boolean;
}

export interface DynamicFormProps<
 TValues extends Record<string, any> = Record<string, any>,
> extends DisallowedLegacyDynamicFormProps {
 /** Declarative schema describing sections, fields, and initial values */
 schema: FormSchema<TValues>;
 /** State control: external form, defaults, loading, read-only */
 state?: FormStateConfig<TValues>;
 /** Behavior: submit, change, validation, conditions, computed, dependencies */
 behavior?: FormBehaviorConfig<TValues>;
 /** Layout: columns, variant, mode (standard/wizard/accordion/master-detail/review) */
 layout?: FormLayoutConfig<TValues>;
 /** Actions bar: submit/reset labels, position, extra slots */
 actions?: FormActionsConfig<TValues>;
 /** Developer tools: debug panel, diagnostics */
 devtools?: FormDevtoolsConfig<TValues>;
}
