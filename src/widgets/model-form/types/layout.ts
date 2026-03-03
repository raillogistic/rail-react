/**
 * Layout configuration for DynamicForm.
 *
 * Controls columns, variant, section headers, field ordering, and rendering
 * mode (standard, wizard, accordion, master-detail, review).
 *
 * @module form/types/layout
 */
import type React from "react";
import type { UseFormReturn } from "@tanstack/react-form";

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

export type FormFieldOrderingPlacement =
 | "start"
 | "end"
 | "before"
 | "after"
 | "index";

export interface FormFieldOrderingRule {
 /** Target field name (within a section) to reposition. */
 field: string;
 /** Placement strategy for the target field. */
 place: FormFieldOrderingPlacement;
 /** Anchor field name used by`before`/`after`. */
 anchor?: string;
 /** Zero-based index used by`index`. */
 index?: number;
}

export interface FormFieldOrderingConfig {
 /** Enable or disable runtime ordering overrides. Defaults to true. */
 enabled?: boolean;
 /**
 * Explicit field-name sequence to apply in a section. Can be partial.
 * Unknown names are ignored.
 */
 order?: string[];
 /**
 * Explicit field-name sequence to place at the end of a section
 * (tail ordering). Can be partial.
 */
 tailing?: string[];
 /** Global rules applied to every section. */
 rules?: FormFieldOrderingRule[];
 /** Per-section rules keyed by section id. */
 sectionRules?: Record<string, FormFieldOrderingRule[]>;
}

export interface FormLayoutConfig<TValues = Record<string, any>> {
 /** Default column count for sections (1-6) */
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
 /** Field ordering overrides after schema/order-hint normalization. */
 ordering?: FormFieldOrderingConfig;
 /** Rendering mode */
 mode?: FormLayoutMode<TValues>;
}
