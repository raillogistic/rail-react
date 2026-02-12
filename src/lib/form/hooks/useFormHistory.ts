import React from "react";
import type { UseFormReturn } from "@tanstack/react-form";
import type { ChangeRecord } from "../types/schema";

interface HistoryState<T> {
  past: T[];
  future: T[];
}

/**
 * Hook to manage undo/redo history for the form.
 */
export const useFormHistory = <TValues extends Record<string, any>>(
  form: UseFormReturn<TValues>,
  enabled: boolean = false,
  maxHistory: number = 50,
  debounceMs: number = 300,
) => {
  const [history, setHistory] = React.useState<HistoryState<TValues>>({
    past: [],
    future: [],
  });

  // We need to ignore updates triggered by undo/redo themselves
  const isInternalUpdate = React.useRef(false);

  // Debounce tracking
  const debounceTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentValuesRef = React.useRef<TValues>(form.store.state.values as TValues);
  const snapshotRef = React.useRef<TValues>(form.store.state.values as TValues);
  const isDebouncing = React.useRef(false);

  // Subscribe to form changes to push to history
  React.useEffect(() => {
    if (!enabled) return;

    // Initialize refs
    currentValuesRef.current = form.store.state.values as TValues;
    snapshotRef.current = form.store.state.values as TValues;

    const unsubscribe = form.store.subscribe(() => {
      const newValues = form.store.state.values as TValues;
      // console.log("History Sub: change detected", JSON.stringify(newValues));

      if (isInternalUpdate.current) {
        // console.log("History Sub: internal update ignored");
        isInternalUpdate.current = false;
        // Reset debounce state on undo/redo
        if (debounceTimer.current) clearTimeout(debounceTimer.current);
        isDebouncing.current = false;
        currentValuesRef.current = form.store.state.values as TValues;
        snapshotRef.current = form.store.state.values as TValues;
        return;
      }

      // Ignore if no change (deep check ideally, but stringify is okay for now)
      if (JSON.stringify(newValues) === JSON.stringify(currentValuesRef.current)) {
        // console.log("History Sub: no change in values");
        return;
      }

      if (!isDebouncing.current) {
        // Start of a new burst. Record the state BEFORE the burst started.
        // console.log("History Sub: starting debounce. Snapshotting:", JSON.stringify(currentValuesRef.current));
        snapshotRef.current = currentValuesRef.current;
        isDebouncing.current = true;
      }

      currentValuesRef.current = newValues;

      if (debounceTimer.current) clearTimeout(debounceTimer.current);

      debounceTimer.current = setTimeout(() => {
        // Burst finished. Push the snapshot to history.
        // console.log("History Sub: debounce finished. Pushing:", JSON.stringify(snapshotRef.current));
        setHistory((prev) => {
          // console.log("History State Update: adding to past", prev.past.length);
          const newPast = [...prev.past, snapshotRef.current].slice(-maxHistory);
          // console.log("New Past:", JSON.stringify(newPast));
          return {
            past: newPast,
            future: [], // Clear future on new change
          };
        });
        isDebouncing.current = false;
      }, debounceMs);
    });

    return () => {
      unsubscribe();
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [form, enabled, maxHistory, debounceMs]);

  const undo = React.useCallback(() => {
    if (history.past.length === 0) return;

    const previous = history.past[history.past.length - 1];
    const newPast = history.past.slice(0, -1);
    const current = form.store.state.values as TValues;

    // Trigger update
    isInternalUpdate.current = true;
    // console.log("Undo: restoring", JSON.stringify(previous));
    form.baseStore.setState((s) => ({
      ...s,
      values: previous,
    }));

    setHistory({
      past: newPast,
      future: [current, ...history.future],
    });
  }, [form, history]);

  const redo = React.useCallback(() => {
    if (history.future.length === 0) return;

    const next = history.future[0];
    const newFuture = history.future.slice(1);
    const current = form.store.state.values as TValues;

    isInternalUpdate.current = true;
    // console.log("Redo: restoring", JSON.stringify(next));
    form.baseStore.setState((s) => ({
      ...s,
      values: next,
    }));

    setHistory({
      past: [...history.past, current],
      future: newFuture,
    });
  }, [form, history]);

  return {
    undo,
    redo,
    canUndo: history.past.length > 0,
    canRedo: history.future.length > 0,
    history,
  };
};
