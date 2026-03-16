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
const RESET_MARKER_PREFIX = `${STORAGE_PREFIX}:hard-reset`;
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

function buildStorageKey(key: string): string {
 return `${STORAGE_PREFIX}:${key}`;
}

function buildResetMarkerKey(key: string): string {
 return `${RESET_MARKER_PREFIX}:${key}`;
}

export function getNormalizedTablePersistenceKeys(key: string): string[] {
 const trimmedKey = key.trim();
 if (!trimmedKey) {
 return [];
 }

 const variants = new Set<string>([trimmedKey]);
 if (trimmedKey.endsWith("/")) {
 const withoutTrailingSlash = trimmedKey.replace(/\/+$/, "");
 if (withoutTrailingSlash) {
 variants.add(withoutTrailingSlash);
 }
 } else {
 variants.add(`${trimmedKey}/`);
 }

 return Array.from(variants);
}

function hasPendingTablePersistenceReset(key: string): boolean {
 if (typeof window === "undefined") {
 return false;
 }

 try {
 return getNormalizedTablePersistenceKeys(key).some((candidateKey) =>
 localStorage.getItem(buildResetMarkerKey(candidateKey)) === "1",
 );
 } catch {
 return false;
 }
}

export function markPendingTablePersistenceReset(key: string): void {
 if (typeof window === "undefined") {
 return;
 }

 try {
 getNormalizedTablePersistenceKeys(key).forEach((candidateKey) => {
 localStorage.setItem(buildResetMarkerKey(candidateKey), "1");
 });
 } catch {
 // Ignore storage errors and continue the hard-refresh flow.
 }
}

export function clearPendingTablePersistenceReset(key: string): void {
 if (typeof window === "undefined") {
 return;
 }

 try {
 getNormalizedTablePersistenceKeys(key).forEach((candidateKey) => {
 localStorage.removeItem(buildResetMarkerKey(candidateKey));
 });
 } catch {
 // Ignore storage errors; the marker is best-effort only.
 }
}

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

 const coercePositiveNumber = (input: unknown): number | null => {
 if (typeof input === "number" && Number.isFinite(input) && input > 0) {
 return input;
 }
 if (typeof input === "string") {
 const numeric = Number(input.trim());
 if (Number.isFinite(numeric) && numeric > 0) {
 return numeric;
 }
 }
 return null;
 };
 const coerceNonNegativeNumber = (input: unknown): number | null => {
 if (typeof input === "number" && Number.isFinite(input) && input >= 0) {
 return input;
 }
 if (typeof input === "string") {
 const numeric = Number(input.trim());
 if (Number.isFinite(numeric) && numeric >= 0) {
 return numeric;
 }
 }
 return null;
 };

 const rawColumnOrder =
 parsed.columnOrder ?? parsed.column_order ?? parsed.columnorder;
 if (Array.isArray(rawColumnOrder)) {
 const columnOrder = rawColumnOrder.filter(
 (entry): entry is string => typeof entry === "string",
 );
 if (columnOrder.length > 0) {
 next.columnOrder = columnOrder;
 }
 }

 const rawColumnVisibility =
 parsed.columnVisibility ??
 parsed.column_visibility ??
 parsed.columnvisibility;
 if (typeof rawColumnVisibility === "object" && rawColumnVisibility) {
 const visibility: ColumnVisibilityState = {};
 Object.entries(rawColumnVisibility as Record<string, unknown>).forEach(
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

 const rawColumnWidths =
 parsed.columnWidths ?? parsed.column_widths ?? parsed.columnwidths;
 if (typeof rawColumnWidths === "object" && rawColumnWidths) {
 const widths: ColumnWidthState = {};
 Object.entries(rawColumnWidths as Record<string, unknown>).forEach(
 ([columnId, width]) => {
 const numericWidth = coercePositiveNumber(width);
 if (numericWidth !== null) {
 widths[columnId] = numericWidth;
 }
 },
 );
 if (Object.keys(widths).length > 0) {
 next.columnWidths = widths;
 }
 }

 const parsedPerPage = coercePositiveNumber(
 parsed.perPage ?? parsed.per_page ?? parsed.page_size,
 );
 if (parsedPerPage !== null) {
 next.perPage = Math.floor(parsedPerPage);
 }

 if (
 parsed.density === "compact" ||
 parsed.density === "comfortable" ||
 parsed.density === "spacious"
 ) {
 next.density = parsed.density;
 }

 const rawWrapCells = parsed.wrapCells ?? parsed.wrap_cells;
 if (typeof rawWrapCells === "boolean") {
 next.wrapCells = rawWrapCells;
 }
 const parsedVisibilityVersion = coerceNonNegativeNumber(
 parsed.visibilityVersion ?? parsed.visibility_version,
 );
 if (
 parsedVisibilityVersion !== null
 ) {
 next.visibilityVersion = Math.floor(parsedVisibilityVersion);
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
 const directConfig = parsePersistedTableStateInput(configs[key]);
 if (directConfig) {
 return directConfig;
 }

 const normalizedVariants = new Set<string>([key]);
 if (key.endsWith("/")) {
 const withoutSlash = key.replace(/\/+$/, "");
 if (withoutSlash) {
 normalizedVariants.add(withoutSlash);
 }
 } else {
 normalizedVariants.add(`${key}/`);
 }

 for (const candidateKey of normalizedVariants) {
 if (candidateKey === key) {
 continue;
 }
 const candidateConfig = parsePersistedTableStateInput(configs[candidateKey]);
 if (candidateConfig) {
 return candidateConfig;
 }
 }

 return null;
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

function arePersistedStatesEqual(
 left: PersistedTableState,
 right: PersistedTableState,
): boolean {
 return (
 areStringArraysEqual(left.columnOrder, right.columnOrder) &&
 areBooleanMapsEqual(left.columnVisibility, right.columnVisibility) &&
 areNumberMapsEqual(left.columnWidths ?? {}, right.columnWidths ?? {}) &&
 left.perPage === right.perPage &&
 left.density === right.density &&
 left.wrapCells === right.wrapCells &&
 (left.visibilityVersion ?? 0) === (right.visibilityVersion ?? 0)
 );
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
 if (hasPendingTablePersistenceReset(key)) {
 return null;
 }
 const userConfig = getConfigForKey(key, userTableConfigs);
 if (userConfig) {
 return parsePersistedTableState(userConfig);
 }
 if (!allowLocalFallback) return null;

 if (typeof window === "undefined") return null;
 try {
 for (const candidateKey of getNormalizedTablePersistenceKeys(key)) {
 const stored = localStorage.getItem(buildStorageKey(candidateKey));
 if (!stored) {
 continue;
 }
 const parsed = parsePersistedTableState(stored);
 if (parsed) {
 return parsed;
 }
 }
 return null;
 } catch (e) {
 console.warn("Failed to load table state from localStorage", e);
 return null;
 }
}

type UseTablePersistenceOptions = {
 bootstrapState?: PersistedTableStateInput | null;
 bootstrapStateReady?: boolean;
};

export function useTablePersistence(
 key: string,
 options?: UseTablePersistenceOptions,
) {
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
 const bootstrapState = options?.bootstrapState ?? null;
 const bootstrapStateReady = options?.bootstrapStateReady ?? true;

 const storageKey = buildStorageKey(key);
 const initialKeyRef = useRef(key);
 const hasHydratedRef = useRef(false);
 const hasAppliedPersistedStateRef = useRef(false);
 const tableConfigsRef = useRef<TableConfigs | null>(null);
 const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
 const backendRetryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
 const backendRetryAttemptRef = useRef(0);
 const pendingBackendStateRef = useRef<PersistedTableState | null>(null);
 const backendBootstrapStateRef = useRef<PersistedTableState | null>(null);
 const backendSaveInFlightRef = useRef(false);
 const remoteFetchInFlightRef = useRef(false);
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
 const settingsConfigs = decodeTableConfigs(readTableConfigsFromSettings());
 const pendingReset = hasPendingTablePersistenceReset(key);
 if (!settingsConfigs) {
 return;
 }

 tableConfigsRef.current = settingsConfigs;
 const config = pendingReset ? null : getConfigForKey(key, settingsConfigs);
 if (config) {
 applyParsedState(config);
 hasAppliedPersistedStateRef.current = true;
 }
 }, [key, readTableConfigsFromSettings, applyParsedState]);

 useEffect(() => {
 if (initialKeyRef.current !== key) {
 initialKeyRef.current = key;
 hasHydratedRef.current = false;
  hasAppliedPersistedStateRef.current = false;
  lastRemoteFetchKeyRef.current = null;
  remoteFetchInFlightRef.current = false;
  setHydrated(false);
  setRemoteSyncSettled(false);
  pendingBackendStateRef.current = null;
  backendBootstrapStateRef.current = null;
  backendRetryAttemptRef.current = 0;
  if (backendRetryTimerRef.current) {
    clearTimeout(backendRetryTimerRef.current);
    backendRetryTimerRef.current = null;
  }
 }

 if (hasHydratedRef.current) return;
 if (!bootstrapStateReady) return;

 const bootstrapPersistedState = parsePersistedTableStateInput(bootstrapState);
 if (bootstrapPersistedState) {
 applyParsedState(bootstrapPersistedState);
 hasAppliedPersistedStateRef.current = true;
 hasHydratedRef.current = true;
 setHydrated(true);
 return;
 }

 const restoredState = loadPersistedTableState(
 key,
 readTableConfigsFromSettings(),
 {
 allowLocalFallback: true,
 },
 );
 if (restoredState) {
 applyParsedState(restoredState);
 hasAppliedPersistedStateRef.current = true;
 hasHydratedRef.current = true;
 setHydrated(true);
 return;
 }

 if (!user?.id) {
 clearPendingTablePersistenceReset(key);
 }

 hasHydratedRef.current = true;
 setHydrated(true);
 }, [
 key,
 storageKey,
 readTableConfigsFromSettings,
 applyParsedState,
 bootstrapState,
 bootstrapStateReady,
 user?.id,
 ]);

 useEffect(() => {
 const userId = user?.id ? String(user.id) : null;
 if (!userId) {
 setRemoteSyncSettled(true);
 return;
 }

 setRemoteSyncSettled(false);

 const settingsConfigsRaw = readTableConfigsFromSettings();
 const settingsConfigs = decodeTableConfigs(settingsConfigsRaw);
 const pendingReset = hasPendingTablePersistenceReset(key);
 if (settingsConfigs) {
 tableConfigsRef.current = settingsConfigs;
 const config = pendingReset ? null : getConfigForKey(key, settingsConfigs);
 if (config) {
 applyParsedState(config);
 hasAppliedPersistedStateRef.current = true;
    }
  }

 const remoteFetchKey =`${userId}|${key}`;
 if (
 lastRemoteFetchKeyRef.current === remoteFetchKey &&
 !remoteFetchInFlightRef.current
 ) {
 setRemoteSyncSettled(true);
 return;
 }
 if (remoteFetchInFlightRef.current) {
 return;
 }

 let cancelled = false;
 remoteFetchInFlightRef.current = true;

 const fetchTableConfigs = async () => {
 try {
 const { data } = await apolloClient.query<UserTableConfigsResponse>({
 query: GET_USER_TABLE_CONFIGS,
 // Always refresh on startup/reload so cross-browser changes are applied.
 fetchPolicy: "network-only",
 });

 if (cancelled) return;
 lastRemoteFetchKeyRef.current = remoteFetchKey;

 const serverConfigs = decodeTableConfigs(data?.me?.settings?.tableConfigs);
 if (!serverConfigs) return;

 tableConfigsRef.current = serverConfigs;
 const config = pendingReset ? null : getConfigForKey(key, serverConfigs);
 if (config) {
 // Server value is authoritative and must override local fallback values.
 applyParsedState(config);
 hasAppliedPersistedStateRef.current = true;
 }
 if (pendingReset && !getConfigForKey(key, serverConfigs)) {
 clearPendingTablePersistenceReset(key);
 }
 } catch {
 // Silently fail, localStorage fallback is already applied.
 } finally {
 remoteFetchInFlightRef.current = false;
 if (!cancelled) {
 setRemoteSyncSettled(true);
 }
 }
 };

 void fetchTableConfigs();

 return () => {
 cancelled = true;
 remoteFetchInFlightRef.current = false;
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
 backendBootstrapStateRef.current = {
  columnOrder: currentStateRef.current.columnOrder,
  columnVisibility: currentStateRef.current.columnVisibility,
  columnWidths: currentStateRef.current.columnWidths,
  perPage: currentStateRef.current.perPage,
  density: currentStateRef.current.density,
  wrapCells: currentStateRef.current.wrapCells,
  visibilityVersion: VISIBILITY_SCHEMA_VERSION,
 };
 }, [key, remoteSyncSettled, user?.id]);

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
 getNormalizedTablePersistenceKeys(key).forEach((candidateKey) => {
 localStorage.setItem(buildStorageKey(candidateKey), JSON.stringify(stateToSave));
 });
 } catch (e) {
 console.warn("Failed to save table state to localStorage", e);
 }

 if (user?.id) {
 if (!remoteSyncSettled) {
 return;
 }
 const bootstrapState = backendBootstrapStateRef.current;
 if (bootstrapState && arePersistedStatesEqual(stateToSave, bootstrapState)) {
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
 if (parsePersistedTableStateInput(bootstrapState)) {
 return true;
 }
 if (getConfigForKey(key, readTableConfigsFromSettings())) {
 return true;
 }
 if (user?.id) return false;

 try {
 return !!localStorage.getItem(storageKey);
 } catch {
 return false;
 }
 }, [bootstrapState, key, storageKey, readTableConfigsFromSettings, user?.id]);

 return { hasPersistedState, hydrated };
}
