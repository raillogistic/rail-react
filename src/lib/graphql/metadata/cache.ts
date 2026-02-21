import * as React from "react";

export type MetadataKind = "table" | "form";

export interface MetadataCacheEntry<TPayload> {
  scopeKey: string;
  version: string;
  data: TPayload;
  cachedAt: number;
}

export const METADATA_CACHE_TTL_MS = 1000 * 60 * 5;
const MAX_VERSION_HISTORY = 2;

const stores: Record<MetadataKind, Map<string, MetadataCacheEntry<unknown>>> = {
  table: new Map(),
  form: new Map(),
};

const latestVersionIndex: Record<MetadataKind, Map<string, string>> = {
  table: new Map(),
  form: new Map(),
};

type CacheListener = () => void;
const cacheListeners = new Set<CacheListener>();

function notifyListeners() {
  cacheListeners.forEach((listener) => {
    try {
      listener();
    } catch {
      // Ignore listener failures to keep cache notifications flowing
    }
  });
}

export function subscribeMetadataCache(listener: CacheListener) {
  cacheListeners.add(listener);
  return () => cacheListeners.delete(listener);
}

function makeVersionKey(scopeKey: string, version: string) {
  return `${scopeKey}:v:${version}`;
}

export function buildMetadataScopeKey(appName: string, modelName: string, signature: string) {
  return `${appName}:${modelName}:${signature}`;
}

function pruneOldEntries(kind: MetadataKind, scopeKey: string) {
  const store = stores[kind];
  const entries = Array.from(store.entries()).filter(([, entry]) => entry.scopeKey === scopeKey);
  if (entries.length <= MAX_VERSION_HISTORY) {
    return;
  }
  entries
    .sort((a, b) => a[1].cachedAt - b[1].cachedAt)
    .slice(0, entries.length - MAX_VERSION_HISTORY)
    .forEach(([key]) => store.delete(key));
}

export function writeMetadataCacheEntry<TPayload>(
  kind: MetadataKind,
  scopeKey: string,
  version: string | undefined | null,
  data: TPayload,
): MetadataCacheEntry<TPayload> {
  const finalVersion = version ?? "unknown";
  const key = makeVersionKey(scopeKey, finalVersion);
  const entry: MetadataCacheEntry<TPayload> = {
    scopeKey,
    version: finalVersion,
    data,
    cachedAt: Date.now(),
  };
  stores[kind].set(key, entry);
  latestVersionIndex[kind].set(scopeKey, key);
  pruneOldEntries(kind, scopeKey);
  notifyListeners();
  return entry;
}

function readLatestEntry<TPayload>(kind: MetadataKind, scopeKey: string) {
  const versionKey = latestVersionIndex[kind].get(scopeKey);
  if (!versionKey) {
    return null;
  }
  return (stores[kind].get(versionKey) as MetadataCacheEntry<TPayload>) ?? null;
}

export function useMetadataCacheEntry<TPayload>(kind: MetadataKind, scopeKey: string | null | undefined) {
  const getSnapshot = React.useCallback(
    () => (scopeKey ? readLatestEntry<TPayload>(kind, scopeKey) : null),
    [kind, scopeKey],
  );
  return React.useSyncExternalStore(subscribeMetadataCache, getSnapshot, getSnapshot);
}

/**
 * Reads the latest cache entry for a metadata scope.
 */
export function readMetadataCacheEntry<TPayload>(kind: MetadataKind, scopeKey: string) {
  return readLatestEntry<TPayload>(kind, scopeKey);
}

/**
 * Clears all cached versions for a scope key.
 */
export function clearMetadataScope(kind: MetadataKind, scopeKey: string) {
  const scopeEntries = Array.from(stores[kind].keys()).filter(
    (key) => stores[kind].get(key)?.scopeKey === scopeKey,
  );
  scopeEntries.forEach((key) => stores[kind].delete(key));
  latestVersionIndex[kind].delete(scopeKey);
  if (scopeEntries.length) {
    notifyListeners();
  }
}

/**
 * Returns true when a cache entry exists and is within TTL.
 */
export function isCacheEntryFresh(entry: MetadataCacheEntry<unknown> | null, ttlMs: number = METADATA_CACHE_TTL_MS) {
  if (!entry) {
    return false;
  }
  return Date.now() - entry.cachedAt < ttlMs;
}

/**
 * Deterministic serializer used for cache signatures and dedupe keys.
 */
export function stableSerialize(value: unknown): string {
  if (value === null) return "null";
  if (value === undefined) return "undefined";
  if (typeof value === "number" && Number.isNaN(value)) return "NaN";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((entry) => stableSerialize(entry)).join(",")}]`;
  }
  const entries = Object.entries(value as Record<string, unknown>)
    .map(([key, entry]) => `${JSON.stringify(key)}:${stableSerialize(entry)}`)
    .sort();
  return `{${entries.join(",")}}`;
}
