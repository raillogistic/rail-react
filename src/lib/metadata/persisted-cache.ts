import type { InMemoryCache } from "@apollo/client";
import { FILTER_METADATA_QUERY } from "@/lib/form/filters/queries";
import { GET_MODEL_SCHEMA } from "@/lib/table/queries";

const STORAGE_VERSION = 1;
const STORAGE_PREFIX = "rail:metadata-cache:v1";
const LATEST_USER_KEY = `${STORAGE_PREFIX}:latest_user`;
const DEPLOY_VERSION_KEY = `${STORAGE_PREFIX}:deploy_version`;
const RECENT_LIMIT = 25;

export type PersistedMetadataEntry = {
  data: unknown;
  updatedAt: number;
};

export type PersistedModelEntry = {
  filter?: PersistedMetadataEntry;
  table?: PersistedMetadataEntry;
};

type PersistedStore = {
  version: number;
  entries: Record<string, PersistedModelEntry>;
  recent: Record<string, number>;
};

const storeCache = new Map<string, PersistedStore>();
let activeUserKey: string | null = null;

const isBrowser = () =>
  typeof window !== "undefined" && typeof window.localStorage !== "undefined";

const buildStorageKey = (userKey: string) => `${STORAGE_PREFIX}:${userKey}`;
const buildModelKey = (app: string, model: string) => `${app}.${model}`;

const splitModelKey = (modelKey: string): [string, string] => {
  const dotIndex = modelKey.indexOf(".");
  if (dotIndex === -1) {
    return [modelKey, ""];
  }
  return [modelKey.slice(0, dotIndex), modelKey.slice(dotIndex + 1)];
};

const DENIED_PERMISSIONS = {
  canList: false,
  canRetrieve: false,
  canCreate: false,
  canUpdate: false,
  canDelete: false,
  canBulkCreate: false,
  canBulkUpdate: false,
  canBulkDelete: false,
  canExport: false,
  denialReasons: JSON.stringify(["Persisted metadata strips permission overlays"]),
};

function sanitizePersistedModelSchema<T>(schema: T): T {
  if (!schema || typeof schema !== "object") {
    return schema;
  }

  const source = schema as Record<string, unknown>;
  const fields = Array.isArray(source.fields)
    ? source.fields.map((field) =>
        field && typeof field === "object"
          ? { ...(field as Record<string, unknown>), writable: false }
          : field,
      )
    : source.fields;

  const relationships = Array.isArray(source.relationships)
    ? source.relationships.map((relation) =>
        relation && typeof relation === "object"
          ? {
              ...(relation as Record<string, unknown>),
              writable: false,
              canCreateInline: false,
            }
          : relation,
      )
    : source.relationships;

  return {
    ...source,
    fields,
    relationships,
    permissions: DENIED_PERMISSIONS,
    mutations: [],
    templates: [],
  } as T;
}

const readLatestUserKey = (): string | null => {
  if (!isBrowser()) return null;
  try {
    return window.localStorage.getItem(LATEST_USER_KEY);
  } catch {
    return null;
  }
};

const writeLatestUserKey = (userKey: string): void => {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(LATEST_USER_KEY, userKey);
  } catch {
    // ignore storage failures
  }
};

const buildDeployVersionKey = (userKey: string) =>
  `${DEPLOY_VERSION_KEY}:${userKey}`;

const readStore = (userKey: string): PersistedStore => {
  const cached = storeCache.get(userKey);
  if (cached) return cached;

  const empty: PersistedStore = {
    version: STORAGE_VERSION,
    entries: {},
    recent: {},
  };

  if (!isBrowser()) {
    storeCache.set(userKey, empty);
    return empty;
  }

  try {
    const raw = window.localStorage.getItem(buildStorageKey(userKey));
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<PersistedStore> | null;
      if (parsed && parsed.version === STORAGE_VERSION) {
        const store: PersistedStore = {
          version: STORAGE_VERSION,
          entries: parsed.entries ?? {},
          recent: parsed.recent ?? {},
        };
        storeCache.set(userKey, store);
        return store;
      }
    }
  } catch {
    // ignore parse/storage failures
  }

  storeCache.set(userKey, empty);
  return empty;
};

const writeStore = (userKey: string, store: PersistedStore): void => {
  storeCache.set(userKey, store);
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(buildStorageKey(userKey), JSON.stringify(store));
    writeLatestUserKey(userKey);
  } catch {
    // ignore storage failures
  }
};

export const setActiveMetadataUserKey = (userKey: string | null): void => {
  activeUserKey = userKey ?? null;
  if (userKey) {
    writeLatestUserKey(userKey);
  }
};

export const getActiveMetadataUserKey = (): string | null =>
  activeUserKey ?? readLatestUserKey();

const getStoreForRead = (): { userKey: string; store: PersistedStore } | null => {
  const userKey = getActiveMetadataUserKey();
  if (!userKey) return null;
  return { userKey, store: readStore(userKey) };
};

const getStoreForWrite = (): { userKey: string; store: PersistedStore } | null => {
  const userKey = activeUserKey ?? readLatestUserKey();
  if (!userKey) return null;
  return { userKey, store: readStore(userKey) };
};

export const getPersistedDeployVersion = (userKey: string): string | null => {
  if (!isBrowser()) return null;
  try {
    return window.localStorage.getItem(buildDeployVersionKey(userKey));
  } catch {
    return null;
  }
};

export const setPersistedDeployVersion = (
  userKey: string,
  version: string | null,
): void => {
  if (!isBrowser()) return;
  try {
    const key = buildDeployVersionKey(userKey);
    if (!version) {
      window.localStorage.removeItem(key);
    } else {
      window.localStorage.setItem(key, version);
    }
  } catch {
    // ignore storage failures
  }
};

export const recordModelUsage = (app: string, model: string): void => {
  const context = getStoreForWrite();
  if (!context) return;
  const { userKey, store } = context;
  const key = buildModelKey(app, model);
  store.recent[key] = Date.now();

  const recentKeys = Object.entries(store.recent);
  if (recentKeys.length > RECENT_LIMIT) {
    recentKeys
      .sort((a, b) => a[1] - b[1])
      .slice(0, recentKeys.length - RECENT_LIMIT)
      .forEach(([oldKey]) => {
        delete store.recent[oldKey];
      });
  }

  writeStore(userKey, store);
};

export const clearPersistedMetadataStore = (userKey: string): void => {
  storeCache.delete(userKey);
  if (!isBrowser()) return;
  try {
    window.localStorage.removeItem(buildStorageKey(userKey));
    window.localStorage.removeItem(buildDeployVersionKey(userKey));
  } catch {
    // ignore storage failures
  }
};

export const hasPersistedMetadataEntries = (userKey: string): boolean => {
  const store = readStore(userKey);
  return Object.keys(store.entries).length > 0;
};

export const getRecentModelKeys = (userKey: string, limit = RECENT_LIMIT): string[] => {
  const store = readStore(userKey);
  return Object.entries(store.recent)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([key]) => key);
};

export const readPersistedModelEntry = (
  app: string,
  model: string,
): PersistedModelEntry | null => {
  const context = getStoreForRead();
  if (!context) return null;
  const key = buildModelKey(app, model);
  return context.store.entries[key] ?? null;
};

export const readPersistedFilterMetadata = (
  app: string,
  model: string,
): unknown | null => {
  const entry = readPersistedModelEntry(app, model);
  return entry?.filter?.data ?? null;
};

export const readPersistedTableMetadata = (
  app: string,
  model: string,
): unknown | null => {
  const entry = readPersistedModelEntry(app, model);
  const payload = entry?.table?.data as { modelSchema?: unknown } | undefined;
  return payload?.modelSchema ?? null;
};

export const persistFilterMetadata = (
  app: string,
  model: string,
  data: unknown,
): void => {
  const context = getStoreForWrite();
  if (!context) return;
  const { userKey, store } = context;
  const key = buildModelKey(app, model);
  const entry = store.entries[key] ?? {};
  const payload =
    data && typeof data === "object"
      ? (data as { modelSchema?: unknown; filterSchema?: unknown })
      : {};
  entry.filter = {
    data: {
      ...payload,
      modelSchema: sanitizePersistedModelSchema(payload.modelSchema),
    },
    updatedAt: Date.now(),
  };
  store.entries[key] = entry;
  writeStore(userKey, store);
};

export const persistTableMetadata = (
  app: string,
  model: string,
  data: unknown,
): void => {
  const context = getStoreForWrite();
  if (!context) return;
  const { userKey, store } = context;
  const key = buildModelKey(app, model);
  const entry = store.entries[key] ?? {};
  const payload =
    data && typeof data === "object"
      ? (data as { modelSchema?: unknown })
      : {};
  entry.table = {
    data: {
      ...payload,
      modelSchema: sanitizePersistedModelSchema(payload.modelSchema),
    },
    updatedAt: Date.now(),
  };
  store.entries[key] = entry;
  writeStore(userKey, store);
};

export const isEntryStale = (
  entry: PersistedMetadataEntry | undefined,
  ttlMs: number,
): boolean => {
  if (!entry) return true;
  return Date.now() - entry.updatedAt > ttlMs;
};

export const hydrateMetadataCache = (
  cache: InMemoryCache,
  userKey?: string,
): { hydrated: boolean; entries: number; userKey: string | null } => {
  const resolvedUserKey = userKey ?? getActiveMetadataUserKey();
  if (!resolvedUserKey) {
    return { hydrated: false, entries: 0, userKey: null };
  }

  const store = readStore(resolvedUserKey);
  let hydratedEntries = 0;

  Object.entries(store.entries).forEach(([modelKey, entry]) => {
    const [app, model] = splitModelKey(modelKey);
    if (!app || !model) return;

    if (entry.filter?.data) {
      cache.writeQuery({
        query: FILTER_METADATA_QUERY,
        variables: { app, model },
        data: entry.filter.data as Record<string, unknown>,
      });
      hydratedEntries += 1;
    }

    if (entry.table?.data) {
      cache.writeQuery({
        query: GET_MODEL_SCHEMA,
        variables: { app, model },
        data: entry.table.data as Record<string, unknown>,
      });
      hydratedEntries += 1;
    }
  });

  return { hydrated: true, entries: hydratedEntries, userKey: resolvedUserKey };
};
