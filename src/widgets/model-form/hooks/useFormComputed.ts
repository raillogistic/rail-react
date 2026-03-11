/**
 * Hook for computed/derived field values.
 *
 * Watches form values and updates computed fields when their dependencies change.
 */
import React from "react";
import type { UseFormReturn } from "@tanstack/react-form";
import type { ComputedFieldMap } from "../types/behavior";

export function useFormComputed<TValues extends Record<string, any>>(
 values: TValues,
 form: UseFormReturn<TValues>,
 computed?: ComputedFieldMap<TValues>,
) {
 const lastComputedRef = React.useRef<Record<string, any>>({});

 React.useEffect(() => {
 if (!computed) return;
 const ctx = { form };
 let hasChanges = false;
 const updates: Array<{ name: string; value: any }> = [];

 for (const [fieldName, derive] of Object.entries(computed) as Array<
  [string, NonNullable<ComputedFieldMap<TValues>[keyof ComputedFieldMap<TValues>]>]
 >) {
 const nextValue = derive(values, ctx);
 const prevValue = lastComputedRef.current[fieldName];

 if (!shallowEqual(prevValue, nextValue)) {
 updates.push({ name: fieldName, value: nextValue });
 hasChanges = true;
 }
 }

 if (hasChanges) {
 const nextSnapshot = { ...lastComputedRef.current };
 updates.forEach(({ name, value }) => {
 nextSnapshot[name] = value;
 form.setFieldValue(name as any, value);
 });
 lastComputedRef.current = nextSnapshot;
 }
  
 }, [values, computed, form]);
}

function shallowEqual(a: any, b: any): boolean {
 if (a === b) return true;
 if (typeof a !== typeof b) return false;
 if (typeof a === "object" && a !== null && b !== null) {
 return JSON.stringify(a) === JSON.stringify(b);
 }
 return false;
}
