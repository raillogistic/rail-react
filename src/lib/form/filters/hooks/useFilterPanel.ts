/**
 * useFilterPanel - Centralized filter panel state management.
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
  createInitialFilterState,
  generateId,
  countConditions,
  removeItemById,
  updateItemById,
} from "../state";
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
  addCondition: (fieldPath: string[], fieldName: string, operator: string, groupId?: string) => void;
  updateCondition: (id: string, updates: Partial<FilterCondition>) => void;
  removeCondition: (id: string) => void;
  addGroup: (parentId: string, logic: "AND" | "OR") => void;
  setGroupLogic: (groupId: string, logic: "AND" | "OR") => void;
  togglePreset: (presetId: string) => void;
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
}

export function useFilterPanel({
  schema,
  initialState,
  autoApply = false,
  autoApplyDelay = 500,
  onApply,
  persistKey,
}: UseFilterPanelOptions): UseFilterPanelReturn {
  const persistence = persistKey ? useFilterPersistence({ key: persistKey }) : null;
  const [state, setState] = useState<FilterFormState>(() => {
    if (initialState) return initialState;
    const persisted = persistence?.load();
    return persisted ?? createInitialFilterState();
  });

  const baselineRef = useRef(JSON.stringify(initialState ?? createInitialFilterState()));
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

  const activeCount = useMemo(() => countConditions(state.root) + state.selectedPresets.length, [state]);
  const hasChanges = useMemo(() => JSON.stringify(state) !== baselineRef.current, [state]);

  useEffect(() => {
    if (!persistKey) return;
    const handle = window.setTimeout(() => {
      persistence?.save(state);
      localStorage.setItem(`${persistKey}_recent`, JSON.stringify(recentFields));
      localStorage.setItem(`${persistKey}_favorites`, JSON.stringify(favoriteFields));
    }, 300);
    return () => window.clearTimeout(handle);
  }, [state, persistKey, persistence, recentFields, favoriteFields]);

  useEffect(() => {
    if (!autoApply || !onApply || !schema) return;
    const handle = window.setTimeout(() => {
      onApply(getVariablesInternal());
    }, autoApplyDelay);
    return () => window.clearTimeout(handle);
  }, [state, autoApply, autoApplyDelay, onApply, schema]);

  const addToRecent = useCallback((fieldPath: string[]) => {
    setRecentFields((prev) => {
      const next = [fieldPath, ...prev.filter((p) => p.join(".") !== fieldPath.join("."))];
      return next.slice(0, 5);
    });
  }, []);

  const toggleFavorite = useCallback((fieldPath: string[]) => {
    setFavoriteFields((prev) => {
      const exists = prev.some((p) => p.join(".") === fieldPath.join("."));
      if (exists) {
        return prev.filter((p) => p.join(".") !== fieldPath.join("."));
      }
      return [...prev, fieldPath];
    });
  }, []);

  const addCondition = useCallback(
    (fieldPath: string[], fieldName: string, operator: string, groupId?: string) => {
      const condition: FilterCondition = {
        id: generateId(),
        type: "condition",
        fieldPath,
        fieldName,
        operator,
        value: undefined,
      };
      setState((prev) => ({
        ...prev,
        root: addConditionToGroup(prev.root, groupId ?? prev.root.id, condition),
      }));
      addToRecent(fieldPath);
    },
    [addToRecent]
  );

  const updateCondition = useCallback((id: string, updates: Partial<FilterCondition>) => {
    setState((prev) => ({
      ...prev,
      root: updateItemById(prev.root, id, (item) => ({ ...item, ...updates })),
    }));
  }, []);

  const removeCondition = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      root: removeItemById(prev.root, id),
    }));
  }, []);

  const addGroup = useCallback((parentId: string, logic: "AND" | "OR") => {
    const group: FilterGroup = {
      id: generateId(),
      type: "group",
      logic,
      conditions: [],
      negated: false,
    };
    setState((prev) => ({
      ...prev,
      root: addGroupToGroup(prev.root, parentId, group),
    }));
  }, []);

  const setGroupLogic = useCallback((groupId: string, logic: "AND" | "OR") => {
    setState((prev) => ({
      ...prev,
      root: updateItemById(prev.root, groupId, (item) => ({ ...item, logic })),
    }));
  }, []);

  const togglePreset = useCallback((presetId: string) => {
    setState((prev) => ({
      ...prev,
      selectedPresets: prev.selectedPresets.includes(presetId)
        ? prev.selectedPresets.filter((id) => id !== presetId)
        : [...prev.selectedPresets, presetId],
    }));
  }, []);

  const setDistinctOn = useCallback((fields: string[]) => {
    setState((prev) => ({
      ...prev,
      distinctOn: fields,
    }));
  }, []);

  const setOrderBy = useCallback((fields: string[]) => {
    setState((prev) => ({
      ...prev,
      orderBy: fields,
    }));
  }, []);

  const clearAll = useCallback(() => {
    const next = createInitialFilterState();
    setState(next);
    persistence?.clear();
  }, [persistence]);

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
    togglePreset,
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
  };
}

function addConditionToGroup(group: FilterGroup, parentId: string, condition: FilterCondition): FilterGroup {
  if (group.id === parentId) {
    return { ...group, conditions: [...group.conditions, condition] };
  }
  return {
    ...group,
    conditions: group.conditions.map((item) =>
      item.type === "group" ? addConditionToGroup(item, parentId, condition) : item
    ),
  };
}

function addGroupToGroup(group: FilterGroup, parentId: string, newGroup: FilterGroup): FilterGroup {
  if (group.id === parentId) {
    return { ...group, conditions: [...group.conditions, newGroup] };
  }
  return {
    ...group,
    conditions: group.conditions.map((item) =>
      item.type === "group" ? addGroupToGroup(item, parentId, newGroup) : item
    ),
  };
}

export default useFilterPanel;
