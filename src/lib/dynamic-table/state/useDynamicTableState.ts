import { useCallback, useMemo, useState } from "react";
import type {
  ColumnSizingState,
  ExpandedState,
  PaginationState,
  RowSelectionState,
  Updater,
  VisibilityState,
} from "@tanstack/react-table";
import type {
  DynamicTableDensity,
  DynamicTableOrderByEntry,
  DynamicTableStateSnapshot,
} from "../types";

/**
 * Input options for `useDynamicTableState`.
 */
export interface UseDynamicTableStateOptions {
  /** Optional controlled state overrides. */
  state?: Partial<DynamicTableStateSnapshot>;
  /** Optional default values for uncontrolled state. */
  defaultState?: Partial<DynamicTableStateSnapshot>;
  /** Optional callback fired with the full merged state after updates. */
  onStateChange?: (nextState: DynamicTableStateSnapshot) => void;
  /** Optional callback fired when `orderBy` changes. */
  onOrderByChange?: (orderBy: DynamicTableOrderByEntry[]) => void;
  /** Optional callback fired when row selection changes. */
  onRowSelectionChange?: (selection: RowSelectionState) => void;
  /** Optional callback fired when expanded state changes. */
  onExpandedChange?: (expanded: ExpandedState) => void;
  /** Optional callback fired when pagination changes. */
  onPaginationChange?: (pagination: PaginationState) => void;
}

/**
 * Returned state controls for `DynamicTable`.
 */
export interface UseDynamicTableStateResult extends DynamicTableStateSnapshot {
  /** Updates `orderBy`. */
  setOrderBy: (updater: Updater<DynamicTableOrderByEntry[]>) => void;
  /** Updates column ordering. */
  setColumnOrder: (updater: Updater<string[]>) => void;
  /** Updates column visibility. */
  setColumnVisibility: (updater: Updater<VisibilityState>) => void;
  /** Updates column sizing. */
  setColumnSizing: (updater: Updater<ColumnSizingState>) => void;
  /** Updates row selection. */
  setRowSelection: (updater: Updater<RowSelectionState>) => void;
  /** Updates grouping columns. */
  setGrouping: (updater: Updater<string[]>) => void;
  /** Updates grouped-row expansion state. */
  setExpanded: (updater: Updater<ExpandedState>) => void;
  /** Updates pagination state. */
  setPagination: (updater: Updater<PaginationState>) => void;
  /** Updates drag mode toggle. */
  setDragModeEnabled: (updater: Updater<boolean>) => void;
  /** Updates density mode. */
  setDensity: (updater: Updater<DynamicTableDensity>) => void;
  /** Updates wrap mode. */
  setWrapCells: (updater: Updater<boolean>) => void;
}

/**
 * Default uncontrolled state used by `DynamicTable`.
 */
const DEFAULT_STATE: DynamicTableStateSnapshot = {
  orderBy: [],
  columnOrder: [],
  columnVisibility: {},
  columnSizing: {},
  rowSelection: {},
  grouping: [],
  expanded: {},
  pagination: {
    pageIndex: 0,
    pageSize: 20,
  },
  dragModeEnabled: false,
  density: "comfortable",
  wrapCells: false,
};

/**
 * Compares two boolean maps for exact key/value equality.
 */
function areBooleanMapsEqual(
  left: Record<string, boolean>,
  right: Record<string, boolean>,
): boolean {
  const leftKeys = Object.keys(left);
  const rightKeys = Object.keys(right);
  if (leftKeys.length !== rightKeys.length) {
    return false;
  }
  for (const key of leftKeys) {
    if (left[key] !== right[key]) {
      return false;
    }
  }
  return true;
}

/**
 * Compares TanStack expanded-state snapshots.
 */
function isExpandedStateEqual(
  left: ExpandedState,
  right: ExpandedState,
): boolean {
  if (left === right) {
    return true;
  }
  if (typeof left === "boolean" || typeof right === "boolean") {
    return left === right;
  }
  return areBooleanMapsEqual(left, right);
}

/**
 * Resolves TanStack updater values into concrete next state.
 */
function resolveUpdater<TValue>(
  updater: Updater<TValue>,
  previousValue: TValue,
): TValue {
  if (typeof updater === "function") {
    const updateFn = updater as (previousState: TValue) => TValue;
    return updateFn(previousValue);
  }
  return updater;
}

/**
 * Composes a complete snapshot by applying controlled overrides to base state.
 */
function composeSnapshot(
  baseState: DynamicTableStateSnapshot,
  controlledState?: Partial<DynamicTableStateSnapshot>,
): DynamicTableStateSnapshot {
  if (!controlledState) {
    return baseState;
  }

  return {
    ...baseState,
    ...controlledState,
    pagination: controlledState.pagination ?? baseState.pagination,
  };
}

/**
 * Resolves controlled/uncontrolled table state and returns stable setters.
 */
export function useDynamicTableState(
  options: UseDynamicTableStateOptions,
): UseDynamicTableStateResult {
  const {
    state,
    defaultState,
    onStateChange,
    onOrderByChange,
    onRowSelectionChange,
    onExpandedChange,
    onPaginationChange,
  } = options;

  const initialState = useMemo<DynamicTableStateSnapshot>(
    () => ({
      ...DEFAULT_STATE,
      ...defaultState,
      pagination: defaultState?.pagination ?? DEFAULT_STATE.pagination,
    }),
    [defaultState],
  );

  const [uncontrolledOrderBy, setUncontrolledOrderBy] = useState<DynamicTableOrderByEntry[]>(initialState.orderBy);
  const [uncontrolledColumnOrder, setUncontrolledColumnOrder] = useState<string[]>(initialState.columnOrder);
  const [uncontrolledColumnVisibility, setUncontrolledColumnVisibility] = useState<VisibilityState>(initialState.columnVisibility);
  const [uncontrolledColumnSizing, setUncontrolledColumnSizing] = useState<ColumnSizingState>(initialState.columnSizing);
  const [uncontrolledRowSelection, setUncontrolledRowSelection] = useState<RowSelectionState>(initialState.rowSelection);
  const [uncontrolledGrouping, setUncontrolledGrouping] = useState<string[]>(initialState.grouping);
  const [uncontrolledExpanded, setUncontrolledExpanded] = useState<ExpandedState>(initialState.expanded);
  const [uncontrolledPagination, setUncontrolledPagination] = useState<PaginationState>(initialState.pagination);
  const [uncontrolledDragModeEnabled, setUncontrolledDragModeEnabled] = useState<boolean>(initialState.dragModeEnabled);
  const [uncontrolledDensity, setUncontrolledDensity] = useState<DynamicTableDensity>(initialState.density);
  const [uncontrolledWrapCells, setUncontrolledWrapCells] = useState<boolean>(initialState.wrapCells);

  const baseSnapshot = useMemo<DynamicTableStateSnapshot>(
    () => ({
      orderBy: uncontrolledOrderBy,
      columnOrder: uncontrolledColumnOrder,
      columnVisibility: uncontrolledColumnVisibility,
      columnSizing: uncontrolledColumnSizing,
      rowSelection: uncontrolledRowSelection,
      grouping: uncontrolledGrouping,
      expanded: uncontrolledExpanded,
      pagination: uncontrolledPagination,
      dragModeEnabled: uncontrolledDragModeEnabled,
      density: uncontrolledDensity,
      wrapCells: uncontrolledWrapCells,
    }),
    [
      uncontrolledOrderBy,
      uncontrolledColumnOrder,
      uncontrolledColumnVisibility,
      uncontrolledColumnSizing,
      uncontrolledRowSelection,
      uncontrolledGrouping,
      uncontrolledExpanded,
      uncontrolledPagination,
      uncontrolledDragModeEnabled,
      uncontrolledDensity,
      uncontrolledWrapCells,
    ],
  );

  const snapshot = useMemo(
    () => composeSnapshot(baseSnapshot, state),
    [baseSnapshot, state],
  );

  /**
   * Emits a full next-state snapshot to external listeners.
   */
  const emitState = useCallback(
    (partialState: Partial<DynamicTableStateSnapshot>) => {
      if (!onStateChange) {
        return;
      }
      onStateChange({
        ...snapshot,
        ...partialState,
        pagination: partialState.pagination ?? snapshot.pagination,
      });
    },
    [onStateChange, snapshot],
  );

  /**
   * Updates `orderBy` with controlled/uncontrolled behavior.
   */
  const setOrderBy = useCallback(
    (updater: Updater<DynamicTableOrderByEntry[]>) => {
      const nextValue = resolveUpdater(updater, snapshot.orderBy);
      if (!state || state.orderBy === undefined) {
        setUncontrolledOrderBy(nextValue);
      }
      onOrderByChange?.(nextValue);
      emitState({ orderBy: nextValue });
    },
    [emitState, onOrderByChange, snapshot.orderBy, state],
  );

  /**
   * Updates column ordering with controlled/uncontrolled behavior.
   */
  const setColumnOrder = useCallback(
    (updater: Updater<string[]>) => {
      const nextValue = resolveUpdater(updater, snapshot.columnOrder);
      if (!state || state.columnOrder === undefined) {
        setUncontrolledColumnOrder(nextValue);
      }
      emitState({ columnOrder: nextValue });
    },
    [emitState, snapshot.columnOrder, state],
  );

  /**
   * Updates column visibility with controlled/uncontrolled behavior.
   */
  const setColumnVisibility = useCallback(
    (updater: Updater<VisibilityState>) => {
      const nextValue = resolveUpdater(updater, snapshot.columnVisibility);
      if (!state || state.columnVisibility === undefined) {
        setUncontrolledColumnVisibility(nextValue);
      }
      emitState({ columnVisibility: nextValue });
    },
    [emitState, snapshot.columnVisibility, state],
  );

  /**
   * Updates column sizing with controlled/uncontrolled behavior.
   */
  const setColumnSizing = useCallback(
    (updater: Updater<ColumnSizingState>) => {
      const nextValue = resolveUpdater(updater, snapshot.columnSizing);
      if (!state || state.columnSizing === undefined) {
        setUncontrolledColumnSizing(nextValue);
      }
      emitState({ columnSizing: nextValue });
    },
    [emitState, snapshot.columnSizing, state],
  );

  /**
   * Updates row selection with controlled/uncontrolled behavior.
   */
  const setRowSelection = useCallback(
    (updater: Updater<RowSelectionState>) => {
      const nextValue = resolveUpdater(updater, snapshot.rowSelection);
      if (!state || state.rowSelection === undefined) {
        setUncontrolledRowSelection(nextValue);
      }
      onRowSelectionChange?.(nextValue);
      emitState({ rowSelection: nextValue });
    },
    [emitState, onRowSelectionChange, snapshot.rowSelection, state],
  );

  /**
   * Updates grouping state with controlled/uncontrolled behavior.
   */
  const setGrouping = useCallback(
    (updater: Updater<string[]>) => {
      const nextValue = resolveUpdater(updater, snapshot.grouping);
      if (!state || state.grouping === undefined) {
        setUncontrolledGrouping(nextValue);
      }
      emitState({ grouping: nextValue });
    },
    [emitState, snapshot.grouping, state],
  );

  /**
   * Updates expanded state with controlled/uncontrolled behavior.
   */
  const setExpanded = useCallback(
    (updater: Updater<ExpandedState>) => {
      const nextValue = resolveUpdater(updater, snapshot.expanded);
      if (isExpandedStateEqual(nextValue, snapshot.expanded)) {
        return;
      }
      if (!state || state.expanded === undefined) {
        setUncontrolledExpanded(nextValue);
      }
      onExpandedChange?.(nextValue);
      emitState({ expanded: nextValue });
    },
    [emitState, onExpandedChange, snapshot.expanded, state],
  );

  /**
   * Updates pagination state with controlled/uncontrolled behavior.
   */
  const setPagination = useCallback(
    (updater: Updater<PaginationState>) => {
      const nextValue = resolveUpdater(updater, snapshot.pagination);
      if (!state || state.pagination === undefined) {
        setUncontrolledPagination(nextValue);
      }
      onPaginationChange?.(nextValue);
      emitState({ pagination: nextValue });
    },
    [emitState, onPaginationChange, snapshot.pagination, state],
  );

  /**
   * Updates drag-mode state with controlled/uncontrolled behavior.
   */
  const setDragModeEnabled = useCallback(
    (updater: Updater<boolean>) => {
      const nextValue = resolveUpdater(updater, snapshot.dragModeEnabled);
      if (!state || state.dragModeEnabled === undefined) {
        setUncontrolledDragModeEnabled(nextValue);
      }
      emitState({ dragModeEnabled: nextValue });
    },
    [emitState, snapshot.dragModeEnabled, state],
  );

  /**
   * Updates density state with controlled/uncontrolled behavior.
   */
  const setDensity = useCallback(
    (updater: Updater<DynamicTableDensity>) => {
      const nextValue = resolveUpdater(updater, snapshot.density);
      if (!state || state.density === undefined) {
        setUncontrolledDensity(nextValue);
      }
      emitState({ density: nextValue });
    },
    [emitState, snapshot.density, state],
  );

  /**
   * Updates wrap-cells state with controlled/uncontrolled behavior.
   */
  const setWrapCells = useCallback(
    (updater: Updater<boolean>) => {
      const nextValue = resolveUpdater(updater, snapshot.wrapCells);
      if (!state || state.wrapCells === undefined) {
        setUncontrolledWrapCells(nextValue);
      }
      emitState({ wrapCells: nextValue });
    },
    [emitState, snapshot.wrapCells, state],
  );

  return {
    ...snapshot,
    setOrderBy,
    setColumnOrder,
    setColumnVisibility,
    setColumnSizing,
    setRowSelection,
    setGrouping,
    setExpanded,
    setPagination,
    setDragModeEnabled,
    setDensity,
    setWrapCells,
  };
}
