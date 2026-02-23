/**
 * Hook for field dependency tracking.
 *
 * When a watched field changes, applies the configured effect
 * (clear, reset, or reload) to the dependent field.
 */
import React from "react";
import type { UseFormReturn } from "@tanstack/react-form";
import type { FieldDependencyMap } from "../types/behavior";

export function useFormDependencies<TValues extends Record<string, any>>(
  values: TValues,
  form: UseFormReturn<TValues>,
  dependencies?: FieldDependencyMap,
) {
  const prevWatchedRef = React.useRef<Record<string, any>>({});

  React.useEffect(() => {
    if (!dependencies) return;

    const changedWatched = new Set<string>();

    // Detect which watched fields changed
    for (const dep of Object.values(dependencies)) {
      for (const watchField of dep.watch) {
        const current = getNestedValue(values, watchField);
        const previous = prevWatchedRef.current[watchField];
        if (current !== previous) {
          changedWatched.add(watchField);
        }
      }
    }

    // Update snapshot
    const nextSnapshot: Record<string, any> = {};
    for (const dep of Object.values(dependencies)) {
      for (const watchField of dep.watch) {
        nextSnapshot[watchField] = getNestedValue(values, watchField);
      }
    }

    // Skip on first render (only track diffs after initialization)
    const isFirstRender = Object.keys(prevWatchedRef.current).length === 0;
    prevWatchedRef.current = nextSnapshot;
    if (isFirstRender || changedWatched.size === 0) return;

    // Apply effects
    for (const [fieldName, dep] of Object.entries(dependencies)) {
      const shouldTrigger = dep.watch.some((w) => changedWatched.has(w));
      if (!shouldTrigger) continue;

      switch (dep.effect) {
        case "clear":
          form.setFieldValue(fieldName as any, "" as any);
          break;
        case "reset":
          form.setFieldValue(fieldName as any, undefined as any);
          break;
        case "reload":
          // Reload triggers a re-mount by clearing and restoring
          // This forces select-query fields to re-fetch
          form.setFieldMeta(fieldName as any, (prev) => ({
            ...prev,
            isDirty: true,
          }));
          break;
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values, dependencies, form]);
}

function getNestedValue(obj: Record<string, any>, path: string): any {
  const segments = path.split(".");
  let current: any = obj;
  for (const segment of segments) {
    if (current === undefined || current === null) return undefined;
    current = current[segment];
  }
  return current;
}
