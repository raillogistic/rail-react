import { useEffect, useRef, useCallback, useState } from "react";
import { gql, useApolloClient, useMutation } from "@apollo/client";
import { useTable } from "../context/TableContext";
import { ColumnVisibilityState, ColumnWidthState, TableDensity } from "../types";
import { useAuthContext } from "@/features/auth/context";
import {
 UPSERT_USER_TABLE_CONFIG_MUTATION_RESOLVED,
 type UpsertUserTableConfigResponse,
 type UpsertUserTableConfigVariables,
} from "@/shared/api/graphql/legacy/mutations";

const STORAGE_PREFIX = "rail-table-v2";
const VISIBILITY_SCHEMA_VERSION = 3;

export interface PersistedTableState {
 columnOrder: string[];
 columnVisibility: ColumnVisibilityState;
 columnWidths?: ColumnWidthState;
 perPage: number;
 density: TableDensity;
 wrapCells: boolean;
 visibilityVersion?: number;
}

type TableConfigs = Record<string, unknown>;
type PersistedTableStateInput = Partial<PersistedTableState>;
type CurrentTableStateSnapshot = {
 columnOrder: string[];
 columnVisibility: ColumnVisibilityState;
 columnWidths: ColumnWidthState;
 perPage: number;
 density: TableDensity;
 wrapCells: boolean;
};

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
 tableConfigs?: TableConfigs | string | null;
 } | null;
 } | null;
};

function parseJsonObject(value: unknown): Record<string, unknown> | null {
 if (value == null) return null;

 if (typeof value === "string") {
 const raw = value.trim();
 if (!raw) return null;
 try {
 const parsed = JSON.parse(raw);
 if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
 return parsed as Record<string, unknown>;
 }
 return null;
 } catch {
 return null;
 }
 }

 if (typeof value === "object" && !Array.isArray(value)) {
 return value as Record<string, unknown>;
 }

 return null;
}

function parsePersistedTableStateInput(
 value: unknown,
): PersistedTableStateInput | null {
 const parsed = parseJsonObject(value);
 if (!parsed) return null;

 const next: PersistedTableStateInput = {};

 if (Array.isArray(parsed.columnOrder)) {
 const columnOrder = parsed.columnOrder.filter(
 (entry): entry is string => typeof entry === "string",
 );
 if (columnOrder.length > 0) {
 next.columnOrder = columnOrder;
 }
 }

 if (typeof parsed.columnVisibility === "object" && parsed.columnVisibility) {
 const visibility: ColumnVisibilityState = {};
 Object.entries(parsed.columnVisibility as Record<string, unknown>).forEach(
 ([columnId, visible]) => {
 if (typeof visible === "boolean") {
 visibility[columnId] = visible;
 }
 },
 );
 if (Object.keys(visibility).length > 0) {
 next.columnVisibility = visibility;
 }
 }

 if (typeof parsed.columnWidths === "object" && parsed.columnWidths) {
 const widths: ColumnWidthState = {};
 Object.entries(parsed.columnWidths as Record<string, unknown>).forEach(
 ([columnId, width]) => {
 if (typeof width === "number" && Number.isFinite(width) && width > 0) {
 widths[columnId] = width;
 }
 },
 );
 if (Object.keys(widths).length > 0) {
 next.columnWidths = widths;
 }
 }

 if (typeof parsed.perPage === "number" && Number.isFinite(parsed.perPage)) {
 next.perPage = parsed.perPage;
 }

 if (
 parsed.density === "compact" ||
 parsed.density === "comfortable" ||
 parsed.density === "spacious"
 ) {
 next.density = parsed.density;
 }

 if (typeof parsed.wrapCells === "boolean") {
 next.wrapCells = parsed.wrapCells;
 }
 if (
 typeof parsed.visibilityVersion === "number" &&
 Number.isFinite(parsed.visibilityVersion)
 ) {
 next.visibilityVersion = parsed.visibilityVersion;
 }

 if (!Object.keys(next).length) {
 return null;
 }

 return next;
}

function parsePersistedTableState(value: unknown): PersistedTableState | null {
 const parsed = parsePersistedTableStateInput(value);
 if (!parsed) return null;

 if (
 !parsed.columnOrder ||
 !parsed.columnVisibility ||
 typeof parsed.perPage !== "number" ||
 !parsed.density ||
 typeof parsed.wrapCells !== "boolean"
 ) {
 return null;
 }

 return parsed as PersistedTableState;
}

export function decodeTableConfigs(value: unknown): TableConfigs | null {
 return parseJsonObject(value);
}

function getConfigForKey(
 key: string,
 configsValue: unknown,
): PersistedTableStateInput | null {
 const configs = decodeTableConfigs(configsValue);
 if (!configs) return null;
 return parsePersistedTableStateInput(configs[key]);
}

function areStringArraysEqual(left: string[], right: string[]): boolean {
 if (left.length !== right.length) return false;
 for (let index = 0; index < left.length; index += 1) {
 if (left[index] !== right[index]) return false;
 }
 return true;
}

function areBooleanMapsEqual(
 left: ColumnVisibilityState,
 right: ColumnVisibilityState,
): boolean {
 const leftKeys = Object.keys(left);
 const rightKeys = Object.keys(right);
 if (leftKeys.length !== rightKeys.length) return false;
 for (const key of leftKeys) {
 if (left[key] !== right[key]) return false;
 }
 return true;
}

function areNumberMapsEqual(
 left: ColumnWidthState,
 right: ColumnWidthState,
): boolean {
 const leftKeys = Object.keys(left);
 const rightKeys = Object.keys(right);
 if (leftKeys.length !== rightKeys.length) return false;
 for (const key of leftKeys) {
 if (left[key] !== right[key]) return false;
 }
 return true;
}

/**
 * Loads persisted table state from user settings or localStorage.
 * First tries user settings from auth context, then falls back to localStorage.
 */
export function loadPersistedTableState(
 key: string,
 userTableConfigs?: unknown,
 options?: {
 allowLocalFallback?: boolean;
 },
): PersistedTableState | null {
 const allowLocalFallback = options?.allowLocalFallback ?? true;
 const userConfig = getConfigForKey(key, userTableConfigs);
 if (userConfig) {
 return parsePersistedTableState(userConfig);
 }
 if (!allowLocalFallback) return null;

 if (typeof window === "undefined") return null;
 const storageKey =`${STORAGE_PREFIX}:${key}`;
 try {
 const stored = localStorage.getItem(storageKey);
 if (!stored) return null;
 return parsePersistedTableState(stored);
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
 columnWidths,
 pagination: { perPage },
 density,
 wrapCells,
 setColumnOrder,
 setColumnVisibility,
 setColumnWidths,
 setPerPage,
 setDensity,
 setWrapCells,
 } = useTable();

 const storageKey =`${STORAGE_PREFIX}:${key}`;
 const initialKeyRef = useRef(key);
 const hasHydratedRef = useRef(false);
 const hasAppliedPersistedStateRef = useRef(false);
 const tableConfigsRef = useRef<TableConfigs | null>(null);
 const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
 const backendRetryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
 const backendRetryAttemptRef = useRef(0);
 const pendingBackendStateRef = useRef<PersistedTableState | null>(null);
 const backendSaveInFlightRef = useRef(false);
 const lastRemoteFetchKeyRef = useRef<string | null>(null);
 const [hydrated, setHydrated] = useState(false);
  const [remoteSyncSettled, setRemoteSyncSettled] = useState(false);
  const currentStateRef = useRef<CurrentTableStateSnapshot>({
 columnOrder,
 columnVisibility,
 columnWidths,
 perPage,
 density,
 wrapCells,
 });

 const [upsertUserTableConfig] = useMutation<
 UpsertUserTableConfigResponse,
 UpsertUserTableConfigVariables
 >(UPSERT_USER_TABLE_CONFIG_MUTATION_RESOLVED, {
 ignoreResults: false,
 });

 useEffect(() => {
 currentStateRef.current = {
 columnOrder,
 columnVisibility,
 columnWidths,
 perPage,
 density,
 wrapCells,
 };
 }, [columnOrder, columnVisibility, columnWidths, perPage, density, wrapCells]);

 const readTableConfigsFromSettings = useCallback(() => {
 const settings = user?.settings as
 | { table_configs?: unknown; tableConfigs?: unknown }
 | undefined;
 return settings?.table_configs ?? settings?.tableConfigs ?? null;
 }, [user?.settings]);

 useEffect(() => {
 const parsed = decodeTableConfigs(readTableConfigsFromSettings());
 if (parsed) {
 tableConfigsRef.current = parsed;
 }
 }, [readTableConfigsFromSettings]);

 const applyParsedState = useCallback(
 (parsed: PersistedTableStateInput) => {
 const currentState = currentStateRef.current;

 if (parsed.columnOrder && Array.isArray(parsed.columnOrder)) {
 if (!areStringArraysEqual(parsed.columnOrder, currentState.columnOrder)) {
 setColumnOrder(parsed.columnOrder);
 }
 }
 if (parsed.columnVisibility) {
 if (
 !areBooleanMapsEqual(parsed.columnVisibility, currentState.columnVisibility)
 ) {
 setColumnVisibility(parsed.columnVisibility);
 }
 }
 if (parsed.columnWidths) {
 if (!areNumberMapsEqual(parsed.columnWidths, currentState.columnWidths)) {
 setColumnWidths(parsed.columnWidths);
 }
 }
 if (typeof parsed.perPage === "number") {
 if (parsed.perPage !== currentState.perPage) {
 setPerPage(parsed.perPage);
 }
 }
 if (
 parsed.density === "compact" ||
 parsed.density === "comfortable" ||
 parsed.density === "spacious"
 ) {
 if (parsed.density !== currentState.density) {
 setDensity(parsed.density);
 }
 }
 if (typeof parsed.wrapCells === "boolean") {
 if (parsed.wrapCells !== currentState.wrapCells) {
 setWrapCells(parsed.wrapCells);
 }
 }
 },
 [
 setColumnOrder,
 setColumnVisibility,
 setColumnWidths,
 setPerPage,
 setDensity,
 setWrapCells,
 ],
 );

 useEffect(() => {
 if (initialKeyRef.current !== key) {
 initialKeyRef.current = key;
 hasHydratedRef.current = false;
 hasAppliedPersistedStateRef.current = false;
 lastRemoteFetchKeyRef.current = null;
 setHydrated(false);
  setRemoteSyncSettled(false);
  pendingBackendStateRef.current = null;
  backendRetryAttemptRef.current = 0;
  if (backendRetryTimerRef.current) {
    clearTimeout(backendRetryTimerRef.current);
    backendRetryTimerRef.current = null;
  }
 }

 if (hasHydratedRef.current) return;

 const userConfig = getConfigForKey(key, readTableConfigsFromSettings());
 if (userConfig) {
 applyParsedState(userConfig);
 hasAppliedPersistedStateRef.current = true;
 hasHydratedRef.current = true;
 setHydrated(true);
 return;
 }

 const isAuthenticated = !!user?.id;
 if (!isAuthenticated) {
 try {
 const stored = localStorage.getItem(storageKey);
 if (stored) {
 const parsed = parsePersistedTableStateInput(stored);
 if (parsed) {
 applyParsedState(parsed);
 hasAppliedPersistedStateRef.current = true;
 }
 }
 } catch (e) {
 console.warn("Failed to load table state from localStorage", e);
 }
 }

 hasHydratedRef.current = true;
 setHydrated(true);
 }, [
 key,
 storageKey,
 readTableConfigsFromSettings,
 applyParsedState,
 user?.id,
 ]);

 useEffect(() => {
 const userId = user?.id ? String(user.id) : null;
 if (!userId) {
 setRemoteSyncSettled(true);
 return;
 }

 setRemoteSyncSettled(false);

 const remoteFetchKey =`${userId}|${key}`;
 if (lastRemoteFetchKeyRef.current === remoteFetchKey) {
 setRemoteSyncSettled(true);
 return;
 }
 lastRemoteFetchKeyRef.current = remoteFetchKey;

 const settingsConfigsRaw = readTableConfigsFromSettings();
 const settingsConfigs = decodeTableConfigs(settingsConfigsRaw);
 if (settingsConfigs) {
 tableConfigsRef.current = settingsConfigs;
 const config = getConfigForKey(key, settingsConfigs);
 if (config) {
 applyParsedState(config);
 hasAppliedPersistedStateRef.current = true;
 }
 }

 let cancelled = false;

 const fetchTableConfigs = async () => {
 try {
 const { data } = await apolloClient.query<UserTableConfigsResponse>({
 query: GET_USER_TABLE_CONFIGS,
 // Always refresh on startup/reload so cross-browser changes are applied.
 fetchPolicy: "network-only",
 });

 if (cancelled) return;

 const serverConfigs = decodeTableConfigs(data?.me?.settings?.tableConfigs);
 if (!serverConfigs) return;

 tableConfigsRef.current = serverConfigs;
 const config = getConfigForKey(key, serverConfigs);
 if (config) {
 // Server value is authoritative and must override local fallback values.
 applyParsedState(config);
 hasAppliedPersistedStateRef.current = true;
 }
 } catch {
 // Silently fail, localStorage fallback is already applied.
 } finally {
 if (!cancelled) {
 setRemoteSyncSettled(true);
 }
 }
 };

 void fetchTableConfigs();

 return () => {
 cancelled = true;
 };
 }, [
 apolloClient,
 key,
 user?.id,
 readTableConfigsFromSettings,
 applyParsedState,
 ]);

 const saveToBackend = useCallback(
 async (stateToSave: PersistedTableState) => {
 const response = await upsertUserTableConfig({
 variables: {
 key,
 tableConfig: stateToSave,
 },
 });

 const payload = response.data?.upsert_user_table_config;
 if (!payload?.ok) {
 const reasons =
 payload?.errors && payload.errors.length > 0
 ? payload.errors.join(", ")
 : "unknown backend rejection";
 throw new Error(`Table config save rejected: ${reasons}`);
 }

 const returnedConfigs = decodeTableConfigs(payload.table_configs);
 if (returnedConfigs) {
 tableConfigsRef.current = returnedConfigs;
 return;
 }

 const currentConfigs = tableConfigsRef.current || {};
 tableConfigsRef.current = {
 ...currentConfigs,
 [key]: stateToSave,
 };
 },
 [key, upsertUserTableConfig],
 );

 const flushPendingBackendSave = useCallback(async () => {
 if (backendSaveInFlightRef.current) {
 return;
 }
 if (!user?.id || !remoteSyncSettled) {
 return;
 }
 const pending = pendingBackendStateRef.current;
 if (!pending) {
 return;
 }

 backendSaveInFlightRef.current = true;
 try {
 await saveToBackend(pending);
 if (
 pendingBackendStateRef.current &&
 pendingBackendStateRef.current === pending
 ) {
 pendingBackendStateRef.current = null;
 }
 backendRetryAttemptRef.current = 0;
 if (backendRetryTimerRef.current) {
 clearTimeout(backendRetryTimerRef.current);
 backendRetryTimerRef.current = null;
 }
 } catch (e) {
 const nextAttempt = backendRetryAttemptRef.current + 1;
 backendRetryAttemptRef.current = nextAttempt;
 const retryDelayMs = Math.min(30000, 1000 * 2 ** (nextAttempt - 1));
 console.warn(
 `Failed to save table state to backend (attempt ${nextAttempt}). Retrying in ${retryDelayMs}ms.`,
 e,
 );
 if (backendRetryTimerRef.current) {
 clearTimeout(backendRetryTimerRef.current);
 }
 backendRetryTimerRef.current = setTimeout(() => {
 backendRetryTimerRef.current = null;
 void flushPendingBackendSave();
 }, retryDelayMs);
 } finally {
 backendSaveInFlightRef.current = false;
 if (
 pendingBackendStateRef.current &&
 pendingBackendStateRef.current !== pending &&
 user?.id &&
 remoteSyncSettled
 ) {
 void flushPendingBackendSave();
 }
 }
 }, [remoteSyncSettled, saveToBackend, user?.id]);

 useEffect(() => {
 if (!user?.id || !remoteSyncSettled) {
 return;
 }
 if (!pendingBackendStateRef.current) {
 return;
 }
 void flushPendingBackendSave();
 }, [flushPendingBackendSave, remoteSyncSettled, user?.id]);

 useEffect(() => {
 if (!hasHydratedRef.current) return;

 if (saveTimerRef.current) {
 clearTimeout(saveTimerRef.current);
 }

 saveTimerRef.current = setTimeout(() => {
 const stateToSave: PersistedTableState = {
 columnOrder,
 columnVisibility,
 columnWidths,
 perPage,
 density,
 wrapCells,
 visibilityVersion: VISIBILITY_SCHEMA_VERSION,
 };

 try {
 localStorage.setItem(storageKey, JSON.stringify(stateToSave));
 } catch (e) {
 console.warn("Failed to save table state to localStorage", e);
 }

 if (user?.id) {
 if (!remoteSyncSettled) {
 return;
 }
 pendingBackendStateRef.current = stateToSave;
 void flushPendingBackendSave();
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
 columnWidths,
 perPage,
 density,
 wrapCells,
 user?.id,
 remoteSyncSettled,
 flushPendingBackendSave,
 ]);

 useEffect(() => {
 return () => {
 if (backendRetryTimerRef.current) {
 clearTimeout(backendRetryTimerRef.current);
 }
 };
 }, []);

 const hasPersistedState = useCallback(() => {
 if (getConfigForKey(key, readTableConfigsFromSettings())) {
 return true;
 }
 if (user?.id) return false;

 try {
 return !!localStorage.getItem(storageKey);
 } catch {
 return false;
 }
 }, [key, storageKey, readTableConfigsFromSettings, user?.id]);

 return { hasPersistedState, hydrated };
}
