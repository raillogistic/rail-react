import { useEffect } from "react";
import { useTable } from "../context/TableContext";
import { ColumnVisibilityState, SortingState } from "../types";

const STORAGE_PREFIX = "rail-table-v2";

interface PersistedState {
  columnOrder: string[];
  columnVisibility: ColumnVisibilityState;
  perPage: number;
  sorting: SortingState[];
}

export function useTablePersistence(key: string) {
  const {
    columnOrder,
    columnVisibility,
    pagination: { perPage },
    sorting,
    setColumnOrder,
    setColumnVisibility,
    setPerPage,
    setSorting,
  } = useTable();

  const storageKey = `${STORAGE_PREFIX}:${key}`;

  // Load state on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed: Partial<PersistedState> = JSON.parse(stored);

        if (parsed.columnOrder && Array.isArray(parsed.columnOrder)) {
          setColumnOrder(parsed.columnOrder);
        }
        if (parsed.columnVisibility) {
          setColumnVisibility(parsed.columnVisibility);
        }
        if (parsed.perPage) {
          setPerPage(parsed.perPage);
        }
        if (parsed.sorting) {
          setSorting(parsed.sorting);
        }
      }
    } catch (e) {
      console.warn("Failed to load table state", e);
    }
  }, [storageKey, setColumnOrder, setColumnVisibility, setPerPage, setSorting]);

  // Save state on change
  useEffect(() => {
    // Debounce or just save? LocalStorage is sync but fast enough for these small objects usually.
    // For safety, we could use a timeout.
    const timer = setTimeout(() => {
      try {
        const stateToSave: PersistedState = {
          columnOrder,
          columnVisibility,
          perPage,
          sorting,
        };
        localStorage.setItem(storageKey, JSON.stringify(stateToSave));
      } catch (e) {
        console.warn("Failed to save table state", e);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [storageKey, columnOrder, columnVisibility, perPage, sorting]);
}
