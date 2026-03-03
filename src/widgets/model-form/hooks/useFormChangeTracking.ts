/**
 * Hook for tracking form value changes via deep diffing.
 *
 * Reports granular ChangeRecord entries and maintains a debug-mode change log.
 */
import React from "react";
import type { UseFormReturn } from "@tanstack/react-form";
import type { ChangeRecord } from "../types/schema";

interface UseFormChangeTrackingOptions<TValues> {
 formValues: TValues;
 form: UseFormReturn<TValues>;
 computedDefaults: TValues;
 onChange?: (
 values: TValues,
 changes: ChangeRecord[],
 form: UseFormReturn<TValues>,
 ) => void;
 debug?: boolean;
 logChanges?: boolean;
}

export function useFormChangeTracking<
 TValues extends Record<string, any>,
>(options: UseFormChangeTrackingOptions<TValues>) {
 const { formValues, form, computedDefaults, onChange, debug, logChanges } =
 options;
 const [changeLog, setChangeLog] = React.useState<ChangeRecord[]>([]);
 const lastValuesRef = React.useRef<TValues>(computedDefaults);

 React.useEffect(() => {
 if (!onChange && !debug) {
 lastValuesRef.current = formValues as TValues;
 return;
 }
 const diffs = diffValues(lastValuesRef.current, formValues as TValues);
 if (diffs.length > 0) {
 lastValuesRef.current = formValues as TValues;
 if (debug) {
 setChangeLog((prev) => [...prev, ...diffs].slice(-100));
 }
 if (logChanges) {
  
 console.log("[DynamicForm] changes:", diffs);
 }
 onChange?.(formValues as TValues, diffs, form);
 }
 }, [formValues, form, onChange, debug, logChanges]);

 return { changeLog };
}

// ─── Diff Engine ─────────────────────────────────────────────────────────────

function isPlainObject(value: unknown): value is Record<string, any> {
 return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function diffValues(
 previous: any,
 next: any,
 path = "",
): ChangeRecord[] {
 const changes: ChangeRecord[] = [];
 if (isPlainObject(previous) && isPlainObject(next)) {
 const keys = new Set([...Object.keys(previous), ...Object.keys(next)]);
 keys.forEach((key) => {
 changes.push(
 ...diffValues(
 previous[key],
 next[key],
 path ?`${path}.${key}` : key,
 ),
 );
 });
 return changes;
 }
 if (Array.isArray(previous) && Array.isArray(next)) {
 if (JSON.stringify(previous) !== JSON.stringify(next)) {
 changes.push({
 name: path,
 previousValue: previous,
 nextValue: next,
 timestamp: Date.now(),
 });
 }
 return changes;
 }
 if (previous !== next) {
 changes.push({
 name: path,
 previousValue: previous,
 nextValue: next,
 timestamp: Date.now(),
 });
 }
 return changes;
}
