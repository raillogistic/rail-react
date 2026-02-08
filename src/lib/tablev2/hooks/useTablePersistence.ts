import { useEffect, useRef, useCallback } from "react";
import { gql, useApolloClient, useMutation } from "@apollo/client";
import { useTable } from "../context/TableContext";
import { ColumnVisibilityState, TableDensity } from "../types";
import { useAuthContext } from "@/auth/context";
import {
  UPDATE_USER_SETTINGS_MUTATION_RESOLVED,
  type UpdateUserSettingsResponse,
  type UpdateUserSettingsVariables,
} from "@/graphql/mutations";

const STORAGE_PREFIX = "rail-table-v2";

export interface PersistedTableState {
  columnOrder: string[];
  columnVisibility: ColumnVisibilityState;
  perPage: number;
  density: TableDensity;
  wrapCells: boolean;
}

type TableConfigs = Record<string, PersistedTableState>;

const GET_USER_TABLE_CONFIGS = gql`
  query GetUserTableConfigs {
    me {
      id
      settings {
        id
        tableConfigs
      }
    }
  }
`;

type UserTableConfigsResponse = {
  me?: {
    id?: string | null;
    settings?: {
      id?: string | null;
      tableConfigs?: TableConfigs | null;
    } | null;
  } | null;
};

/**
 * Loads persisted table state from user settings or localStorage.
 * First tries user settings from auth context, then falls back to localStorage.
 */
export function loadPersistedTableState(
  key: string,
  userTableConfigs?: TableConfigs | null
): PersistedTableState | null {
  // First try to load from user settings
  if (userTableConfigs && userTableConfigs[key]) {
    return userTableConfigs[key];
  }

  // Fall back to localStorage
  if (typeof window === "undefined") return null;
  const storageKey = `${STORAGE_PREFIX}:${key}`;
  try {
    const stored = localStorage.getItem(storageKey);
    if (!stored) return null;
    return JSON.parse(stored) as PersistedTableState;
  } catch (e) {
    console.warn("Failed to load table state from localStorage", e);
    return null;
  }
}

export function useTablePersistence(key: string) {
  const apolloClient = useApolloClient();
  const { user } = useAuthContext();
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
  const hasLoadedRef = useRef(false);
  const initialKeyRef = useRef(key);
  const settingsIdRef = useRef<string | null>(null);
  const tableConfigsRef = useRef<TableConfigs | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Track current user settings ID
  useEffect(() => {
    const userSettings = user?.settings as { id?: string | number } | undefined;
    if (userSettings?.id != null) {
      settingsIdRef.current = String(userSettings.id);
    }
    // Also cache table configs from user settings
    const tableConfigs = (user?.settings as { table_configs?: TableConfigs } | undefined)?.table_configs;
    if (tableConfigs) {
      tableConfigsRef.current = tableConfigs;
    }
  }, [user?.settings]);

  const [updateUserSettings] = useMutation<
    UpdateUserSettingsResponse,
    UpdateUserSettingsVariables
  >(UPDATE_USER_SETTINGS_MUTATION_RESOLVED, {
    ignoreResults: true,
  });

  // Apply parsed state to table context
  const applyParsedState = useCallback(
    (parsed: Partial<PersistedTableState>) => {
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
    },
    [setColumnOrder, setColumnVisibility, setPerPage, setDensity, setWrapCells]
  );

  // Load state on mount (only once per key)
  useEffect(() => {
    // Reset loaded flag if key changes
    if (initialKeyRef.current !== key) {
      hasLoadedRef.current = false;
      initialKeyRef.current = key;
    }

    if (hasLoadedRef.current) return;
    hasLoadedRef.current = true;

    // Try to load from user's table_configs first
    const userTableConfigs = (user?.settings as { table_configs?: TableConfigs } | undefined)?.table_configs;
    if (userTableConfigs && userTableConfigs[key]) {
      applyParsedState(userTableConfigs[key]);
      return;
    }

    // Fall back to localStorage
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed: Partial<PersistedTableState> = JSON.parse(stored);
        applyParsedState(parsed);
      }
    } catch (e) {
      console.warn("Failed to load table state from localStorage", e);
    }
  }, [key, storageKey, user?.settings, applyParsedState]);

  // Fetch table configs from backend if not available in auth context
  useEffect(() => {
    const userId = user?.id ? String(user.id) : null;
    if (!userId) return;

    const userTableConfigs = (user?.settings as { table_configs?: TableConfigs } | undefined)?.table_configs;
    if (userTableConfigs) {
      // Already have table configs from auth context
      return;
    }

    let cancelled = false;

    const fetchTableConfigs = async () => {
      try {
        const { data } = await apolloClient.query<UserTableConfigsResponse>({
          query: GET_USER_TABLE_CONFIGS,
          fetchPolicy: "cache-first",
        });

        if (cancelled) return;

        const settings = data?.me?.settings;
        if (settings?.id) {
          settingsIdRef.current = String(settings.id);
        }
        if (settings?.tableConfigs) {
          tableConfigsRef.current = settings.tableConfigs;
          // Apply config for current key if found
          const config = settings.tableConfigs[key];
          if (config && !hasLoadedRef.current) {
            applyParsedState(config);
            hasLoadedRef.current = true;
          }
        }
      } catch {
        // Silently fail, localStorage fallback is already applied
      }
    };

    void fetchTableConfigs();

    return () => {
      cancelled = true;
    };
  }, [apolloClient, key, user?.id, user?.settings, applyParsedState]);

  // Save state to backend (debounced)
  const saveToBackend = useCallback(
    async (stateToSave: PersistedTableState) => {
      const settingsId = settingsIdRef.current;
      if (!settingsId) {
        // No settings record, save to localStorage only
        return;
      }

      try {
        // Merge with existing table configs
        const currentConfigs = tableConfigsRef.current || {};
        const updatedConfigs: TableConfigs = {
          ...currentConfigs,
          [key]: stateToSave,
        };

        await updateUserSettings({
          variables: {
            id: settingsId,
            input: {
              tableConfigs: updatedConfigs,
            },
          },
        });

        // Update local ref
        tableConfigsRef.current = updatedConfigs;
      } catch (e) {
        console.warn("Failed to save table state to backend", e);
      }
    },
    [key, updateUserSettings]
  );

  // Save state on change (debounced)
  useEffect(() => {
    // Skip saving during initial load
    if (!hasLoadedRef.current) return;

    // Clear any pending save
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }

    saveTimerRef.current = setTimeout(() => {
      const stateToSave: PersistedTableState = {
        columnOrder,
        columnVisibility,
        perPage,
        density,
        wrapCells,
      };

      // Always save to localStorage as fallback
      try {
        localStorage.setItem(storageKey, JSON.stringify(stateToSave));
      } catch (e) {
        console.warn("Failed to save table state to localStorage", e);
      }

      // Also save to backend if user is authenticated
      if (user?.id && settingsIdRef.current) {
        void saveToBackend(stateToSave);
      }
    }, 500);

    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, [
    storageKey,
    columnOrder,
    columnVisibility,
    perPage,
    density,
    wrapCells,
    user?.id,
    saveToBackend,
  ]);

  // Return a function to check if we have persisted state
  const hasPersistedState = useCallback(() => {
    // Check user settings first
    const userTableConfigs = (user?.settings as { table_configs?: TableConfigs } | undefined)?.table_configs;
    if (userTableConfigs && userTableConfigs[key]) {
      return true;
    }

    // Check localStorage
    try {
      return !!localStorage.getItem(storageKey);
    } catch {
      return false;
    }
  }, [key, storageKey, user?.settings]);

  return { hasPersistedState };
}
