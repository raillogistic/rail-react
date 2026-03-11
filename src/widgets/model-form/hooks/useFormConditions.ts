/**
 * Hook for conditional field visibility.
 *
 * Evaluates visibility predicates against current form values and returns
 * a set of hidden field names. Supports both per-field`visible` callbacks
 * on field configs and the top-level`behavior.conditions` map.
 */
import React from "react";
import type { UseFormReturn } from "@tanstack/react-form";
import type { FormFieldConfig, FormSectionConfig } from "../types/schema";
import type { FieldConditionMap } from "../types/behavior";

export function useFormConditions<TValues extends Record<string, any>>(
 values: TValues,
 form: UseFormReturn<TValues>,
 sections: FormSectionConfig<TValues>[],
 conditions?: FieldConditionMap<TValues>,
): {
 hiddenFields: Set<string>;
 hiddenSections: Set<string>;
} {
 return React.useMemo(() => {
 const hiddenFields = new Set<string>();
 const hiddenSections = new Set<string>();
 const ctx = { form };

 // Evaluate section-level visibility
 sections.forEach((section, index) => {
 const sectionId = section.id ??`__section_${index}`;
 if (section.visible && !section.visible(values)) {
 hiddenSections.add(sectionId);
 }

 // Evaluate field-level visibility from field config
 section.fields.forEach((field) => {
 if (field.visible && !field.visible(values)) {
 hiddenFields.add(field.name);
 }
 });
 });

 // Evaluate conditions map
 if (conditions) {
 for (const [pattern, predicate] of Object.entries(conditions) as Array<
  [string, NonNullable<FieldConditionMap<TValues>[keyof FieldConditionMap<TValues>]>]
 >) {
 const isVisible = predicate(values, ctx);
 if (!isVisible) {
 if (pattern.includes("*")) {
 // Glob pattern: match against all known field names
 const regex = globToRegex(pattern);
 sections.forEach((section) => {
 collectFieldNames(section.fields).forEach((name) => {
 if (regex.test(name)) {
 hiddenFields.add(name);
 }
 });
 });
 } else {
 hiddenFields.add(pattern);
 }
 }
 }
 }

 return { hiddenFields, hiddenSections };
 }, [values, form, sections, conditions]);
}

function collectFieldNames(
 fields: FormFieldConfig[],
 prefix = "",
): string[] {
 const names: string[] = [];
 fields.forEach((field) => {
 const fullName = prefix ?`${prefix}.${field.name}` : field.name;
 names.push(fullName);
 if (
 (field.type === "object" || field.type === "list") &&
 "fields" in field
 ) {
 names.push(...collectFieldNames(field.fields, fullName));
 }
 });
 return names;
}

function globToRegex(pattern: string): RegExp {
 const escaped = pattern
 .replace(/[.+^${}()|[\]\\]/g, "\\$&")
 .replace(/\*/g, "[^.]+");
 return new RegExp(`^${escaped}$`);
}
