import * as React from "react";
import type { DragEndEvent } from "@dnd-kit/core";
import type { Table as RTTable } from "@tanstack/react-table";

/**
 * Options used to persist column visibility and order.
 * @template TData Table row data type.
 * @property table - The TanStack table instance to synchronize with.
 * @property storageKey - Base localStorage key used to persist column state.
 * @property columnVisibility - Current column visibility map coming from the table state.
 * @property columnDragEnabled - Whether drag-and-drop ordering is enabled.
 * @property onColumnOrderChange - Callback fired after column order changes.
 * @property onColumnVisibilityChange - Callback fired after visibility changes.
 */
export type UseColumnPersistenceOptions<TData> = {
  table: RTTable<TData>;
  storageKey: string;
  columnVisibility: Record<string, boolean>;
  columnDragEnabled: boolean;
  onColumnOrderChange?: (order: string[]) => void;
  onColumnVisibilityChange?: (visible: string[]) => void;
};

/**
 * Result returned by {@link useColumnPersistence}.
 * @property columnsLoadedFromStorage - True once persisted visibility is applied.
 * @property orderLoadedFromStorage - True once persisted order is applied.
 * @property handleDragEnd - Handler to pass to dnd-kit for persisting order changes.
 */
export type UseColumnPersistenceResult = {
  columnsLoadedFromStorage: boolean;
  orderLoadedFromStorage: boolean;
  handleDragEnd?: (event: DragEndEvent) => void;
};

/**
 * Persists column visibility and order in localStorage and rehydrates them on mount.
 * This keeps the table state consistent across reloads without leaking implementation details.
 */
export function useColumnPersistence<TData>({
  table,
  storageKey,
  columnVisibility,
  columnDragEnabled,
  onColumnOrderChange,
  onColumnVisibilityChange,
}: UseColumnPersistenceOptions<TData>): UseColumnPersistenceResult {
  const [columnsLoadedFromStorage, setColumnsLoadedFromStorage] =
    React.useState<boolean>(false);
  const [orderLoadedFromStorage, setOrderLoadedFromStorage] =
    React.useState<boolean>(false);
  const orderStorageKey = React.useMemo(
    () => `${storageKey}:order`,
    [storageKey]
  );

  // Load persisted column visibility once columns are available.
  React.useEffect(() => {
    if (columnsLoadedFromStorage) return;
    const cols = table.getAllLeafColumns();
    if (!cols || cols.length === 0) return;
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const visibleIds: string[] = JSON.parse(raw);
        cols.forEach((col) => {
          const isVisible = visibleIds.includes(col.id);
          col.toggleVisibility(isVisible);
        });
      }
    } catch {
      // ignore malformed storage
    } finally {
      setColumnsLoadedFromStorage(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table, storageKey, columnsLoadedFromStorage]);

  // Load persisted order when drag is enabled.
  React.useEffect(() => {
    if (!columnDragEnabled) return;
    if (orderLoadedFromStorage) return;
    const cols = table.getAllLeafColumns();
    if (!cols || cols.length === 0) return;
    try {
      const raw = localStorage.getItem(orderStorageKey);
      if (raw) {
        const savedOrder: string[] = JSON.parse(raw);
        const existingIds = new Set(cols.map((c) => c.id));
        const sanitizedOrder = savedOrder.filter((id) =>
          existingIds.has(id)
        );
        if (sanitizedOrder.length > 0) {
          table.setColumnOrder(sanitizedOrder);
        }
      }
    } catch {
      // ignore malformed storage
    } finally {
      setOrderLoadedFromStorage(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table, orderStorageKey, orderLoadedFromStorage, columnDragEnabled]);

  // Persist visibility after it is fully loaded.
  React.useEffect(() => {
    if (!columnsLoadedFromStorage) return;
    try {
      const visibleIds = table
        .getAllLeafColumns()
        .filter((c) => c.getIsVisible())
        .map((c) => c.id);
      localStorage.setItem(storageKey, JSON.stringify(visibleIds));
      onColumnVisibilityChange?.(visibleIds);
    } catch {
      // ignore storage errors
    }
  }, [
    columnVisibility,
    columnsLoadedFromStorage,
    onColumnVisibilityChange,
    storageKey,
    table,
  ]);

  const handleDragEnd = React.useCallback(
    (event: DragEndEvent) => {
      if (!columnDragEnabled) return;
      const { active, over } = event;
      if (!over || active.id === over.id) return;
      const currentStateOrder = table.getState().columnOrder;
      const baseColumns = table.getAllLeafColumns().map((c) => c.id);
      const currentOrder =
        currentStateOrder && currentStateOrder.length > 0
          ? currentStateOrder
          : baseColumns;
      const oldIndex = currentOrder.indexOf(String(active.id));
      const newIndex = currentOrder.indexOf(String(over.id));
      if (oldIndex === -1 || newIndex === -1) return;
      const nextOrder = [...currentOrder];
      nextOrder.splice(oldIndex, 1);
      nextOrder.splice(newIndex, 0, String(active.id));
      table.setColumnOrder(nextOrder);
      try {
        localStorage.setItem(orderStorageKey, JSON.stringify(nextOrder));
        onColumnOrderChange?.(nextOrder);
      } catch {
        // ignore storage errors
      }
    },
    [table, orderStorageKey, columnDragEnabled, onColumnOrderChange]
  );

  return {
    columnsLoadedFromStorage,
    orderLoadedFromStorage,
    handleDragEnd: columnDragEnabled ? handleDragEnd : undefined,
  };
}
