/**
 * useFilterPanel - Refactored with tree utilities.
 *
 * Centralized filter panel state management using immutable tree operations.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  FilterCondition,
  FilterFormState,
  FilterGroup,
  FilterPreset,
  NestedFilterConfig,
  UnifiedFilterSchema,
} from "../types";
import {
  findById,
  updateById,
  removeById,
  appendChild,
  getTreeStats,
  createGroup,
  createCondition,
  cloneNode,
} from "../tree/operations";
import { buildQueryVariables } from "../queryBuilder";
import { useFilterPersistence } from "./useFilterPersistence";

export interface UseFilterPanelOptions {
  schema: UnifiedFilterSchema | null;
  config?: Partial<NestedFilterConfig>;
  initialState?: FilterFormState;
  autoApply?: boolean;
  autoApplyDelay?: number;
  onApply?: (variables: any) => void;
  persistKey?: string;
}

export interface UseFilterPanelReturn {
  state: FilterFormState;
  activeCount: number;
  hasChanges: boolean;
  setRoot: (root: FilterGroup) => void;
  addCondition: (
    fieldPath: string[],
    fieldName: string,
    operator: string,
    groupId?: string
  ) => void;
  updateCondition: (id: string, updates: Partial<FilterCondition>) => void;
  removeCondition: (id: string) => void;
  addGroup: (parentId: string, logic: "AND" | "OR") => void;
  setGroupLogic: (groupId: string, logic: "AND" | "OR") => void;
  toggleGroupNegation: (groupId: string) => void;
  togglePreset: (presetId: string) => void;
  setSelectedPresets: (presetIds: string[]) => void;
  setDistinctOn: (fields: string[]) => void;
  setOrderBy: (fields: string[]) => void;
  clearAll: () => void;
  applyPreset: (preset: FilterPreset) => void;
  reset: () => void;
  apply: () => void;
  getVariables: () => any;
  recentFields: string[][];
  addToRecent: (fieldPath: string[]) => void;
  favoriteFields: string[][];
  toggleFavorite: (fieldPath: string[]) => void;
  // New tree-based utilities
  findNode: (id: string) => FilterCondition | FilterGroup | null;
  getStats: () => ReturnType<typeof getTreeStats>;
  duplicateNode: (id: string) => void;
}

function createInitialFilterState(): FilterFormState {
  return {
    root: createGroup(),
    selectedPresets: [],
    distinctOn: [],
    orderBy: [],
  };
}

export function useFilterPanel({
  schema,
  initialState,
  autoApply = false,
  autoApplyDelay = 500,
  onApply,
  persistKey,
}: UseFilterPanelOptions): UseFilterPanelReturn {
  // Always call the hook to follow Rules of Hooks, but only use it if persistKey is provided
  const persistence = useFilterPersistence({ key: persistKey ?? "" });
  const shouldPersist = Boolean(persistKey);

  const [state, setState] = useState<FilterFormState>(() => {
    if (initialState) return initialState;
    const persisted = shouldPersist ? persistence?.load() : null;
    return persisted ?? createInitialFilterState();
  });

  const baselineRef = useRef(
    JSON.stringify(initialState ?? createInitialFilterState())
  );

  const [recentFields, setRecentFields] = useState<string[][]>(() => {
    if (!persistKey) return [];
    try {
      return JSON.parse(localStorage.getItem(`${persistKey}_recent`) ?? "[]");
    } catch {
      return [];
    }
  });

  const [favoriteFields, setFavoriteFields] = useState<string[][]>(() => {
    if (!persistKey) return [];
    try {
      return JSON.parse(localStorage.getItem(`${persistKey}_favorites`) ?? "[]");
    } catch {
      return [];
    }
  });

  // Use tree stats for active count
  const stats = useMemo(() => getTreeStats(state.root), [state.root]);
  const activeCount = useMemo(
    () => stats.activeConditionCount + state.selectedPresets.length,
    [stats.activeConditionCount, state.selectedPresets.length]
  );

  const hasChanges = useMemo(
    () => JSON.stringify(state) !== baselineRef.current,
    [state]
  );

  // Persistence effect
  useEffect(() => {
    if (!shouldPersist) return;
    const handle = window.setTimeout(() => {
      persistence.save(state);
      localStorage.setItem(`${persistKey}_recent`, JSON.stringify(recentFields));
      localStorage.setItem(`${persistKey}_favorites`, JSON.stringify(favoriteFields));
    }, 300);
    return () => window.clearTimeout(handle);
  }, [state, shouldPersist, persistKey, persistence, recentFields, favoriteFields]);

  // Auto-apply effect
  useEffect(() => {
    if (!autoApply || !onApply || !schema) return;
    const handle = window.setTimeout(() => {
      onApply(getVariablesInternal());
    }, autoApplyDelay);
    return () => window.clearTimeout(handle);
  }, [state, autoApply, autoApplyDelay, onApply, schema]);

  const addToRecent = useCallback((fieldPath: string[]) => {
    setRecentFields((prev) => {
      const key = fieldPath.join(".");
      const next = [fieldPath, ...prev.filter((p) => p.join(".") !== key)];
      return next.slice(0, 5);
    });
  }, []);

  const toggleFavorite = useCallback((fieldPath: string[]) => {
    setFavoriteFields((prev) => {
      const key = fieldPath.join(".");
      const exists = prev.some((p) => p.join(".") === key);
      if (exists) {
        return prev.filter((p) => p.join(".") !== key);
      }
      return [...prev, fieldPath];
    });
  }, []);

  // Tree-based operations
  const addCondition = useCallback(
    (
      fieldPath: string[],
      fieldName: string,
      operator: string,
      groupId?: string
    ) => {
      const condition = createCondition(fieldPath, fieldName, operator);

      setState((prev) => {
        // Find the parent group
        const parentId = groupId ?? prev.root.id;
        const found = findById(prev.root, parentId);

        if (!found || found.node.type !== "group") {
          // Fallback: add to root
          return {
            ...prev,
            root: {
              ...prev.root,
              conditions: [...prev.root.conditions, condition],
            },
          };
        }

        // Use tree operation to append
        const result = appendChild(prev.root, found.path, condition);
        return result.success ? { ...prev, root: result.root } : prev;
      });

      addToRecent(fieldPath);
    },
    [addToRecent]
  );

  const updateCondition = useCallback(
    (id: string, updates: Partial<FilterCondition>) => {
      setState((prev) => {
        const result = updateById(prev.root, id, (node) => ({
          ...node,
          ...updates,
        }));
        return result.success ? { ...prev, root: result.root } : prev;
      });
    },
    []
  );

  const removeCondition = useCallback((id: string) => {
    setState((prev) => {
      const result = removeById(prev.root, id);
      return result.success ? { ...prev, root: result.root } : prev;
    });
  }, []);

  const addGroup = useCallback((parentId: string, logic: "AND" | "OR") => {
    const group = createGroup(logic);

    setState((prev) => {
      const found = findById(prev.root, parentId);

      if (!found || found.node.type !== "group") {
        // Fallback: add to root
        return {
          ...prev,
          root: {
            ...prev.root,
            conditions: [...prev.root.conditions, group],
          },
        };
      }

      const result = appendChild(prev.root, found.path, group);
      return result.success ? { ...prev, root: result.root } : prev;
    });
  }, []);

  const setGroupLogic = useCallback((groupId: string, logic: "AND" | "OR") => {
    setState((prev) => {
      const result = updateById(prev.root, groupId, (node) => {
        if (node.type !== "group") return node;
        return { ...node, logic };
      });
      return result.success ? { ...prev, root: result.root } : prev;
    });
  }, []);

  const toggleGroupNegation = useCallback((groupId: string) => {
    setState((prev) => {
      const result = updateById(prev.root, groupId, (node) => {
        if (node.type !== "group") return node;
        return { ...node, negated: !node.negated };
      });
      return result.success ? { ...prev, root: result.root } : prev;
    });
  }, []);

  const togglePreset = useCallback((presetId: string) => {
    setState((prev) => ({
      ...prev,
      selectedPresets: prev.selectedPresets.includes(presetId)
        ? prev.selectedPresets.filter((id) => id !== presetId)
        : [...prev.selectedPresets, presetId],
    }));
  }, []);

  const setSelectedPresets = useCallback((presetIds: string[]) => {
    setState((prev) => ({
      ...prev,
      selectedPresets: presetIds,
    }));
  }, []);

  const setDistinctOn = useCallback((fields: string[]) => {
    setState((prev) => ({ ...prev, distinctOn: fields }));
  }, []);

  const setOrderBy = useCallback((fields: string[]) => {
    setState((prev) => ({ ...prev, orderBy: fields }));
  }, []);

  const clearAll = useCallback(() => {
    const next = createInitialFilterState();
    setState(next);
    if (shouldPersist) {
      persistence.clear();
    }
  }, [shouldPersist, persistence]);

  const reset = useCallback(() => {
    const next = initialState ?? createInitialFilterState();
    setState(next);
  }, [initialState]);

  const applyPreset = useCallback((preset: FilterPreset) => {
    setState((prev) => ({
      ...prev,
      selectedPresets: prev.selectedPresets.includes(preset.id)
        ? prev.selectedPresets
        : [...prev.selectedPresets, preset.id],
    }));
  }, []);

  const getVariablesInternal = useCallback(() => {
    if (!schema) return {};
    return buildQueryVariables({
      filterState: state.root,
      schema,
      selectedPresets: state.selectedPresets,
      distinctOn: state.distinctOn,
      orderBy: state.orderBy,
    });
  }, [schema, state]);

  const apply = useCallback(() => {
    if (!onApply) return;
    onApply(getVariablesInternal());
  }, [onApply, getVariablesInternal]);

  // New tree utilities
  const findNode = useCallback(
    (id: string) => findById(state.root, id)?.node ?? null,
    [state.root]
  );

  const getStats = useCallback(() => getTreeStats(state.root), [state.root]);

  const duplicateNode = useCallback((id: string) => {
    setState((prev) => {
      const found = findById(prev.root, id);
      if (!found || found.path.length === 0) return prev; // Can't duplicate root

      const cloned = cloneNode(found.node, true);
      const parentPath = found.path.slice(0, -1);
      const result = appendChild(prev.root, parentPath, cloned);

      return result.success ? { ...prev, root: result.root } : prev;
    });
  }, []);

  return {
    state,
    activeCount,
    hasChanges,
    setRoot: (root) => setState((prev) => ({ ...prev, root })),
    addCondition,
    updateCondition,
    removeCondition,
    addGroup,
    setGroupLogic,
    toggleGroupNegation,
    togglePreset,
    setSelectedPresets,
    setDistinctOn,
    setOrderBy,
    clearAll,
    applyPreset,
    reset,
    apply,
    getVariables: getVariablesInternal,
    recentFields,
    addToRecent,
    favoriteFields,
    toggleFavorite,
    findNode,
    getStats,
    duplicateNode,
  };
}

export default useFilterPanel;
