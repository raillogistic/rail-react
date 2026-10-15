/**
 * useFilterPersistence - Persist filter state in localStorage, sessionStorage, or URL.
 */

import { useCallback } from "react";
import type { FilterFormState } from "../types";

export interface UseFilterPersistenceOptions {
 key: string;
 storage?: "localStorage" | "sessionStorage" | "url";
 debounce?: number;
}

export function useFilterPersistence({
 key,
 storage = "localStorage",
}: UseFilterPersistenceOptions) {
 const load = useCallback((): FilterFormState | null => {
 try {
 if (storage === "url") {
 const params = new URLSearchParams(window.location.search);
 const raw = params.get(key);
 if (!raw) return null;
 return JSON.parse(decodeURIComponent(raw));
 }
 const store = storage === "sessionStorage" ? window.sessionStorage : window.localStorage;
 const raw = store.getItem(key);
 if (!raw) return null;
 return JSON.parse(raw);
 } catch (err) {
 console.warn("[useFilterPersistence] Failed to load filters", err);
 return null;
 }
 }, [key, storage]);

 const save = useCallback(
 (state: FilterFormState) => {
 try {
 if (storage === "url") {
 const params = new URLSearchParams(window.location.search);
 params.set(key, encodeURIComponent(JSON.stringify(state)));
 const newUrl =`${window.location.pathname}?${params.toString()}`;
 window.history.replaceState({}, "", newUrl);
 return;
 }
 const store = storage === "sessionStorage" ? window.sessionStorage : window.localStorage;
 store.setItem(key, JSON.stringify(state));
 } catch (err) {
 console.warn("[useFilterPersistence] Failed to save filters", err);
 }
 },
 [key, storage]
 );

 const clear = useCallback(() => {
 try {
 if (storage === "url") {
 const params = new URLSearchParams(window.location.search);
 params.delete(key);
 const newUrl = params.toString()
 ?`${window.location.pathname}?${params.toString()}`
 : window.location.pathname;
 window.history.replaceState({}, "", newUrl);
 return;
 }
 const store = storage === "sessionStorage" ? window.sessionStorage : window.localStorage;
 store.removeItem(key);
 } catch (err) {
 console.warn("[useFilterPersistence] Failed to clear filters", err);
 }
 }, [key, storage]);

 return { load, save, clear };
}

export default useFilterPersistence;
