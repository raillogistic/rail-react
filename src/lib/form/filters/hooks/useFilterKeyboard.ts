/**
 * useFilterKeyboard - Keyboard shortcuts for filter panel.
 */

import { useEffect } from "react";

export interface UseFilterKeyboardOptions {
  onApply?: () => void;
  onCancel?: () => void;
  onAddFilter?: () => void;
  onRemoveFilter?: () => void;
  disabled?: boolean;
}

export function useFilterKeyboard({
  onApply,
  onCancel,
  onAddFilter,
  onRemoveFilter,
  disabled,
}: UseFilterKeyboardOptions) {
  useEffect(() => {
    if (disabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        onApply?.();
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "n") {
        e.preventDefault();
        onAddFilter?.();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "Backspace") {
        e.preventDefault();
        onRemoveFilter?.();
      }
      if (e.key === "Escape") {
        onCancel?.();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onApply, onCancel, onAddFilter, onRemoveFilter, disabled]);
}

export default useFilterKeyboard;
