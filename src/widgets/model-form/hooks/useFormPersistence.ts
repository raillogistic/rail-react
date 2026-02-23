import React from "react";
import type { UseFormReturn } from "@tanstack/react-form";

/**
 * Hook to persist form values to localStorage.
 *
 * @param form - The form instance
 * @param key - The localStorage key (if null/undefined, persistence is disabled)
 * @param enabled - Whether persistence is enabled
 */
export const useFormPersistence = <TValues extends Record<string, any>>(
  form: UseFormReturn<TValues>,
  key?: string,
  enabled: boolean = true,
) => {
  // Load initial values on mount
  React.useEffect(() => {
    if (!enabled || !key) return;

    try {
      const stored = localStorage.getItem(key);
      if (stored) {
        const parsed = JSON.parse(stored);
        // We defer the update slightly to ensure form is ready
        setTimeout(() => {
          form.baseStore.setState((s) => ({
            ...s,
            values: {
              ...s.values,
              ...parsed,
            },
          }));
        }, 0);
      }
    } catch (error) {
      console.warn(`[DynamicForm] Failed to load persisted values for key "${key}"`, error);
    }
  }, [key, enabled, form]);

  // Save values on change
  React.useEffect(() => {
    if (!enabled || !key) return;

    const unsubscribe = form.store.subscribe(() => {
      const values = form.store.state.values;
      try {
        localStorage.setItem(key, JSON.stringify(values));
      } catch (error) {
        console.warn(`[DynamicForm] Failed to save values for key "${key}"`, error);
      }
    });

    return () => unsubscribe();
  }, [key, enabled, form]);
};
