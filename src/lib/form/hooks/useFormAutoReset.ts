/**
 * Hook for auto-resetting the form when computed defaults change.
 */
import React from "react";
import type { UseFormReturn } from "@tanstack/react-form";
import { deepEqual } from "./useFormDefaults";

export function useFormAutoReset<TValues extends Record<string, any>>(
  form: UseFormReturn<TValues>,
  computedDefaults: TValues,
  disabled: boolean,
) {
  const lastDefaultsRef = React.useRef(computedDefaults);

  React.useEffect(() => {
    if (disabled) {
      lastDefaultsRef.current = computedDefaults;
      return;
    }
    if (deepEqual(lastDefaultsRef.current, computedDefaults)) {
      return;
    }
    lastDefaultsRef.current = computedDefaults;
    form.reset(computedDefaults);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [computedDefaults, form, disabled]);
}
