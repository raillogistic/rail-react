/**
 * Actions bar configuration for DynamicForm.
 *
 * Controls submit/reset buttons, positioning, extra slots,
 * confirmation dialogs, and dirty indicators.
 *
 * @module form/types/actions
 */
import type React from "react";
import type { UseFormReturn } from "@tanstack/react-form";

export interface FormActionsConfig<TValues = Record<string, any>> {
  /** Submit button label (default: "Save") */
  submitLabel?: string;
  /** Reset button label (default: "Reset") */
  resetLabel?: string;
  /** Hide the default action bar entirely */
  hidden?: boolean;
  /** Position of the actions bar */
  position?: "bottom" | "top" | "both" | "sticky-bottom";
  /** Additional buttons rendered alongside submit/reset */
  extra?:
    | React.ReactNode
    | ((ctx: {
        form: UseFormReturn<TValues>;
        isSubmitting: boolean;
        canSubmit: boolean;
      }) => React.ReactNode);
  /** Confirmation dialog before submit */
  confirmSubmit?: {
    enabled: boolean;
    title?: string;
    message?: string;
  };
  /** Show a "dirty" indicator badge */
  showDirtyIndicator?: boolean;
  /** Configuration for Undo/Redo history controls */
  undoRedo?: {
    enabled: boolean;
    showInActionBar?: boolean; // If true, shows in the main actions bar. If false, might be rendered elsewhere or strictly via keyboard.
  };
}
