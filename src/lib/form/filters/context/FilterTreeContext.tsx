/**
 * FilterTreeContext - React Context for filter tree state management.
 *
 * Provides tree state, schema context, and manipulation methods to child components.
 */

import React, {
  createContext,
  useContext,
  useCallback,
  useMemo,
  useReducer,
  useRef,
} from "react";
import type {
  FilterCondition,
  FilterGroup,
  FilterFormState,
  UnifiedFilterSchema,
  NestedFilterConfig,
} from "../types";
import type { TreePath, UpdateResult, TreeStats } from "../tree/types";
import {
  updateByPath,
  updateById,
  removeByPath,
  removeById,
  insertAt,
  appendChild,
  moveNode,
  findByPath,
  findById,
  getTreeStats,
  createGroup,
  createCondition,
  generateId,
} from "../tree/operations";
import {
  resolveSchemaContext,
  getFieldsAtPath,
  getRelationsAtPath,
} from "../tree/schemaContext";

// ============================================================================
// Types
// ============================================================================

export interface FilterTreeState extends FilterFormState {
  /** History for undo/redo */
  history: FilterGroup[];
  /** Current position in history */
  historyIndex: number;
  /** Maximum history size */
  maxHistorySize: number;
}

export type FilterTreeAction =
  | { type: "SET_ROOT"; payload: FilterGroup }
  | { type: "UPDATE_BY_PATH"; payload: { path: TreePath; updater: (node: FilterCondition | FilterGroup) => FilterCondition | FilterGroup } }
  | { type: "UPDATE_BY_ID"; payload: { id: string; updater: (node: FilterCondition | FilterGroup) => FilterCondition | FilterGroup } }
  | { type: "REMOVE_BY_PATH"; payload: TreePath }
  | { type: "REMOVE_BY_ID"; payload: string }
  | { type: "INSERT_AT"; payload: { parentPath: TreePath; index: number; node: FilterCondition | FilterGroup } }
  | { type: "APPEND_CHILD"; payload: { parentPath: TreePath; node: FilterCondition | FilterGroup } }
  | { type: "MOVE_NODE"; payload: { fromPath: TreePath; toParentPath: TreePath; toIndex: number } }
  | { type: "ADD_CONDITION"; payload: { parentPath: TreePath; fieldPath: string[]; fieldName: string; operator: string } }
  | { type: "ADD_GROUP"; payload: { parentPath: TreePath; logic: "AND" | "OR" } }
  | { type: "SET_GROUP_LOGIC"; payload: { path: TreePath; logic: "AND" | "OR" } }
  | { type: "TOGGLE_GROUP_NEGATION"; payload: TreePath }
  | { type: "SET_PRESETS"; payload: string[] }
  | { type: "TOGGLE_PRESET"; payload: string }
  | { type: "SET_DISTINCT_ON"; payload: string[] }
  | { type: "SET_ORDER_BY"; payload: string[] }
  | { type: "CLEAR_ALL" }
  | { type: "UNDO" }
  | { type: "REDO" }
  | { type: "RESET"; payload?: FilterFormState };

export interface FilterTreeContextValue {
  /** Current state */
  state: FilterTreeState;
  /** Root schema */
  schema: UnifiedFilterSchema;
  /** Configuration */
  config: NestedFilterConfig;
  /** Dispatch an action */
  dispatch: React.Dispatch<FilterTreeAction>;

  // Convenience methods
  /** Get node at path */
  getNodeAtPath: (path: TreePath) => FilterCondition | FilterGroup | null;
  /** Get node by ID */
  getNodeById: (id: string) => FilterCondition | FilterGroup | null;
  /** Get schema context for a field path */
  getSchemaContext: (fieldPath: readonly string[]) => ReturnType<typeof resolveSchemaContext>;
  /** Get available fields at a relation path */
  getFieldsAt: (relationPath: readonly string[]) => ReturnType<typeof getFieldsAtPath>;
  /** Get available relations at a path */
  getRelationsAt: (relationPath: readonly string[]) => ReturnType<typeof getRelationsAtPath>;
  /** Get tree statistics */
  getStats: () => TreeStats;
  /** Check if can undo */
  canUndo: boolean;
  /** Check if can redo */
  canRedo: boolean;

  // High-level operations
  /** Add a condition to the tree */
  addCondition: (
    fieldPath: string[],
    fieldName: string,
    operator: string,
    parentPath?: TreePath
  ) => void;
  /** Add a group to the tree */
  addGroup: (logic: "AND" | "OR", parentPath?: TreePath) => void;
  /** Update a condition's value */
  updateConditionValue: (id: string, value: unknown) => void;
  /** Update a condition's operator */
  updateConditionOperator: (id: string, operator: string) => void;
  /** Remove a node */
  removeNode: (id: string) => void;
  /** Clear all filters */
  clearAll: () => void;
  /** Toggle a preset */
  togglePreset: (presetId: string) => void;
  /** Set distinct on fields */
  setDistinctOn: (fields: string[]) => void;
  /** Set order by fields */
  setOrderBy: (fields: string[]) => void;
  /** Undo last action */
  undo: () => void;
  /** Redo last undone action */
  redo: () => void;
}

// ============================================================================
// Reducer
// ============================================================================

function createInitialState(
  initialState?: FilterFormState,
  maxHistorySize: number = 50
): FilterTreeState {
  const root = initialState?.root ?? createGroup();
  return {
    root,
    selectedPresets: initialState?.selectedPresets ?? [],
    distinctOn: initialState?.distinctOn ?? [],
    orderBy: initialState?.orderBy ?? [],
    history: [root],
    historyIndex: 0,
    maxHistorySize,
  };
}

function pushToHistory(state: FilterTreeState, newRoot: FilterGroup): FilterTreeState {
  // Remove any redo history
  const newHistory = state.history.slice(0, state.historyIndex + 1);
  newHistory.push(newRoot);

  // Trim to max size
  if (newHistory.length > state.maxHistorySize) {
    newHistory.shift();
  }

  return {
    ...state,
    root: newRoot,
    history: newHistory,
    historyIndex: newHistory.length - 1,
  };
}

function filterTreeReducer(
  state: FilterTreeState,
  action: FilterTreeAction
): FilterTreeState {
  switch (action.type) {
    case "SET_ROOT": {
      return pushToHistory(state, action.payload);
    }

    case "UPDATE_BY_PATH": {
      const result = updateByPath(state.root, action.payload.path, action.payload.updater);
      if (!result.success) return state;
      return pushToHistory(state, result.root);
    }

    case "UPDATE_BY_ID": {
      const result = updateById(state.root, action.payload.id, action.payload.updater);
      if (!result.success) return state;
      return pushToHistory(state, result.root);
    }

    case "REMOVE_BY_PATH": {
      const result = removeByPath(state.root, action.payload);
      if (!result.success) return state;
      return pushToHistory(state, result.root);
    }

    case "REMOVE_BY_ID": {
      const result = removeById(state.root, action.payload);
      if (!result.success) return state;
      return pushToHistory(state, result.root);
    }

    case "INSERT_AT": {
      const result = insertAt(
        state.root,
        action.payload.parentPath,
        action.payload.index,
        action.payload.node
      );
      if (!result.success) return state;
      return pushToHistory(state, result.root);
    }

    case "APPEND_CHILD": {
      const result = appendChild(
        state.root,
        action.payload.parentPath,
        action.payload.node
      );
      if (!result.success) return state;
      return pushToHistory(state, result.root);
    }

    case "MOVE_NODE": {
      const result = moveNode(
        state.root,
        action.payload.fromPath,
        action.payload.toParentPath,
        action.payload.toIndex
      );
      if (!result.success) return state;
      return pushToHistory(state, result.root);
    }

    case "ADD_CONDITION": {
      const condition = createCondition(
        action.payload.fieldPath,
        action.payload.fieldName,
        action.payload.operator
      );
      const result = appendChild(state.root, action.payload.parentPath, condition);
      if (!result.success) return state;
      return pushToHistory(state, result.root);
    }

    case "ADD_GROUP": {
      const group = createGroup(action.payload.logic);
      const result = appendChild(state.root, action.payload.parentPath, group);
      if (!result.success) return state;
      return pushToHistory(state, result.root);
    }

    case "SET_GROUP_LOGIC": {
      const result = updateByPath(state.root, action.payload.path, (node) => {
        if (node.type !== "group") return node;
        return { ...node, logic: action.payload.logic };
      });
      if (!result.success) return state;
      return pushToHistory(state, result.root);
    }

    case "TOGGLE_GROUP_NEGATION": {
      const result = updateByPath(state.root, action.payload, (node) => {
        if (node.type !== "group") return node;
        return { ...node, negated: !node.negated };
      });
      if (!result.success) return state;
      return pushToHistory(state, result.root);
    }

    case "SET_PRESETS": {
      return { ...state, selectedPresets: action.payload };
    }

    case "TOGGLE_PRESET": {
      const presetId = action.payload;
      const selectedPresets = state.selectedPresets.includes(presetId)
        ? state.selectedPresets.filter((id) => id !== presetId)
        : [...state.selectedPresets, presetId];
      return { ...state, selectedPresets };
    }

    case "SET_DISTINCT_ON": {
      return { ...state, distinctOn: action.payload };
    }

    case "SET_ORDER_BY": {
      return { ...state, orderBy: action.payload };
    }

    case "CLEAR_ALL": {
      const newRoot = createGroup();
      return pushToHistory({
        ...state,
        selectedPresets: [],
        distinctOn: [],
        orderBy: [],
      }, newRoot);
    }

    case "UNDO": {
      if (state.historyIndex <= 0) return state;
      const newIndex = state.historyIndex - 1;
      return {
        ...state,
        root: state.history[newIndex],
        historyIndex: newIndex,
      };
    }

    case "REDO": {
      if (state.historyIndex >= state.history.length - 1) return state;
      const newIndex = state.historyIndex + 1;
      return {
        ...state,
        root: state.history[newIndex],
        historyIndex: newIndex,
      };
    }

    case "RESET": {
      return createInitialState(action.payload, state.maxHistorySize);
    }

    default:
      return state;
  }
}

// ============================================================================
// Context
// ============================================================================

const FilterTreeContext = createContext<FilterTreeContextValue | null>(null);

export interface FilterTreeProviderProps {
  children: React.ReactNode;
  schema: UnifiedFilterSchema;
  config: NestedFilterConfig;
  initialState?: FilterFormState;
  maxHistorySize?: number;
  onChange?: (state: FilterFormState) => void;
}

export function FilterTreeProvider({
  children,
  schema,
  config,
  initialState,
  maxHistorySize = 50,
  onChange,
}: FilterTreeProviderProps): React.JSX.Element {
  const [state, dispatch] = useReducer(
    filterTreeReducer,
    { initialState, maxHistorySize },
    ({ initialState, maxHistorySize }) => createInitialState(initialState, maxHistorySize)
  );

  // Notify parent of changes
  const prevStateRef = useRef(state);
  React.useEffect(() => {
    if (prevStateRef.current !== state && onChange) {
      onChange({
        root: state.root,
        selectedPresets: state.selectedPresets,
        distinctOn: state.distinctOn,
        orderBy: state.orderBy,
      });
    }
    prevStateRef.current = state;
  }, [state, onChange]);

  // Memoized getters
  const getNodeAtPath = useCallback(
    (path: TreePath) => findByPath(state.root, path)?.node ?? null,
    [state.root]
  );

  const getNodeById = useCallback(
    (id: string) => findById(state.root, id)?.node ?? null,
    [state.root]
  );

  const getSchemaContext = useCallback(
    (fieldPath: readonly string[]) => resolveSchemaContext(schema, fieldPath),
    [schema]
  );

  const getFieldsAt = useCallback(
    (relationPath: readonly string[]) => getFieldsAtPath(schema, relationPath),
    [schema]
  );

  const getRelationsAt = useCallback(
    (relationPath: readonly string[]) => getRelationsAtPath(schema, relationPath),
    [schema]
  );

  const getStats = useCallback(() => getTreeStats(state.root), [state.root]);

  // High-level operations
  const addCondition = useCallback(
    (
      fieldPath: string[],
      fieldName: string,
      operator: string,
      parentPath: TreePath = []
    ) => {
      dispatch({
        type: "ADD_CONDITION",
        payload: { parentPath, fieldPath, fieldName, operator },
      });
    },
    []
  );

  const addGroup = useCallback(
    (logic: "AND" | "OR", parentPath: TreePath = []) => {
      dispatch({ type: "ADD_GROUP", payload: { parentPath, logic } });
    },
    []
  );

  const updateConditionValue = useCallback((id: string, value: unknown) => {
    dispatch({
      type: "UPDATE_BY_ID",
      payload: {
        id,
        updater: (node) => {
          if (node.type !== "condition") return node;
          return { ...node, value };
        },
      },
    });
  }, []);

  const updateConditionOperator = useCallback((id: string, operator: string) => {
    dispatch({
      type: "UPDATE_BY_ID",
      payload: {
        id,
        updater: (node) => {
          if (node.type !== "condition") return node;
          return { ...node, operator };
        },
      },
    });
  }, []);

  const removeNode = useCallback((id: string) => {
    dispatch({ type: "REMOVE_BY_ID", payload: id });
  }, []);

  const clearAll = useCallback(() => {
    dispatch({ type: "CLEAR_ALL" });
  }, []);

  const togglePreset = useCallback((presetId: string) => {
    dispatch({ type: "TOGGLE_PRESET", payload: presetId });
  }, []);

  const setDistinctOn = useCallback((fields: string[]) => {
    dispatch({ type: "SET_DISTINCT_ON", payload: fields });
  }, []);

  const setOrderBy = useCallback((fields: string[]) => {
    dispatch({ type: "SET_ORDER_BY", payload: fields });
  }, []);

  const undo = useCallback(() => {
    dispatch({ type: "UNDO" });
  }, []);

  const redo = useCallback(() => {
    dispatch({ type: "REDO" });
  }, []);

  const value = useMemo<FilterTreeContextValue>(
    () => ({
      state,
      schema,
      config,
      dispatch,
      getNodeAtPath,
      getNodeById,
      getSchemaContext,
      getFieldsAt,
      getRelationsAt,
      getStats,
      canUndo: state.historyIndex > 0,
      canRedo: state.historyIndex < state.history.length - 1,
      addCondition,
      addGroup,
      updateConditionValue,
      updateConditionOperator,
      removeNode,
      clearAll,
      togglePreset,
      setDistinctOn,
      setOrderBy,
      undo,
      redo,
    }),
    [
      state,
      schema,
      config,
      getNodeAtPath,
      getNodeById,
      getSchemaContext,
      getFieldsAt,
      getRelationsAt,
      getStats,
      addCondition,
      addGroup,
      updateConditionValue,
      updateConditionOperator,
      removeNode,
      clearAll,
      togglePreset,
      setDistinctOn,
      setOrderBy,
      undo,
      redo,
    ]
  );

  return (
    <FilterTreeContext.Provider value={value}>
      {children}
    </FilterTreeContext.Provider>
  );
}

// ============================================================================
// Hook
// ============================================================================

export function useFilterTree(): FilterTreeContextValue {
  const context = useContext(FilterTreeContext);
  if (!context) {
    throw new Error("useFilterTree must be used within a FilterTreeProvider");
  }
  return context;
}

/**
 * Hook to get just the tree state without the full context.
 */
export function useFilterTreeState(): FilterTreeState {
  const { state } = useFilterTree();
  return state;
}

/**
 * Hook to get just the tree actions.
 */
export function useFilterTreeActions() {
  const {
    dispatch,
    addCondition,
    addGroup,
    updateConditionValue,
    updateConditionOperator,
    removeNode,
    clearAll,
    togglePreset,
    setDistinctOn,
    setOrderBy,
    undo,
    redo,
  } = useFilterTree();

  return {
    dispatch,
    addCondition,
    addGroup,
    updateConditionValue,
    updateConditionOperator,
    removeNode,
    clearAll,
    togglePreset,
    setDistinctOn,
    setOrderBy,
    undo,
    redo,
  };
}

export default FilterTreeContext;
