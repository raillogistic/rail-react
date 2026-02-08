import { useEffect } from "react";
import { useTable } from "../context/TableContext";
import { ColumnVisibilityState, TableDensity } from "../types";

const STORAGE_PREFIX = "rail-table-v2";

interface PersistedState {
  columnOrder: string[];
  columnVisibility: ColumnVisibilityState;
  perPage: number;
  density: TableDensity;
  wrapCells: boolean;
}

export function useTablePersistence(key: string) {
  const {
    columnOrder,
    columnVisibility,
    pagination: { perPage },
    density,
    wrapCells,
    setColumnOrder,
    setColumnVisibility,
    setPerPage,
    setDensity,
    setWrapCells,
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
        if (
          parsed.density === "compact" ||
          parsed.density === "comfortable" ||
          parsed.density === "spacious"
        ) {
          setDensity(parsed.density);
        }
        if (typeof parsed.wrapCells === "boolean") {
          setWrapCells(parsed.wrapCells);
        }
      }
    } catch (e) {
      console.warn("Failed to load table state", e);
    }
  }, [
    storageKey,
    setColumnOrder,
    setColumnVisibility,
    setPerPage,
    setDensity,
    setWrapCells,
  ]);

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
          density,
          wrapCells,
        };
        localStorage.setItem(storageKey, JSON.stringify(stateToSave));
      } catch (e) {
        console.warn("Failed to save table state", e);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [storageKey, columnOrder, columnVisibility, perPage, density, wrapCells]);
}
