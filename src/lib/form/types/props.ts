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

// ─── State Config ────────────────────────────────────────────────────────────

export interface FormStateConfig<TValues> {
  /** External TanStack form instance (for shared state across components) */
  form?: UseFormReturn<TValues>;
  /** Runtime defaults merged over schema defaults */
  defaultValues?: Partial<TValues>;
  /** Skip automatic form resets when defaults change */
  disableAutoReset?: boolean;
  /** Global read-only mode — all fields become non-editable */
  readOnly?: boolean;
  /** Global disabled mode — all fields become disabled */
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

// ─── Devtools Config ─────────────────────────────────────────────────────────

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

// ─── DynamicForm Props ───────────────────────────────────────────────────────

export interface DynamicFormProps<
  TValues extends Record<string, any> = Record<string, any>,
> {
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
