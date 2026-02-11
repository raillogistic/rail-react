/**
 * Layout configuration for DynamicForm.
 *
 * Controls columns, variant, section headers, and rendering mode
 * (standard, wizard, accordion, master-detail, review).
 *
 * @module form/types/layout
 */
import type React from "react";
import type { UseFormReturn } from "@tanstack/react-form";

// ─── Layout Mode ─────────────────────────────────────────────────────────────

export type FormLayoutMode<TValues = Record<string, any>> =
  | { type: "standard" }
  | {
      type: "wizard";
      showProgress?: boolean;
      allowSkip?: boolean;
      /** Dynamic step resolution based on current values */
      resolveSteps?: (values: TValues) => number[];
    }
  | {
      type: "accordion";
      defaultExpanded?: string[] | "all" | "first";
      allowMultiple?: boolean;
    }
  | {
      type: "master-detail";
      renderPreview: (values: TValues) => React.ReactNode;
      previewClassName?: string;
      splitRatio?: [number, number];
      renderToolbar?: (context: {
        form: UseFormReturn<TValues>;
      }) => React.ReactNode;
    }
  | {
      type: "review";
      renderSummary?: (values: TValues) => React.ReactNode;
      lockOnSubmit?: boolean;
    };

// ─── Layout Config ───────────────────────────────────────────────────────────

export interface FormLayoutConfig<TValues = Record<string, any>> {
  /** Default column count for sections (1–6) */
  columns?: number;
  /** Vertical gap between rows */
  gap?: number | string;
  /** Adapts spacing for different contexts */
  variant?: "default" | "compact" | "popup";
  /** Show section headers (title + description) */
  showSectionHeaders?: boolean;
  /** CSS class for the outer <form> element */
  className?: string;
  /** CSS class for the form body (scrollable area) */
  bodyClassName?: string;
  /** Rendering mode */
  mode?: FormLayoutMode<TValues>;
}
