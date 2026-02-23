import type { InMemoryCache } from "@apollo/client";
import { describe, expect, it, vi, afterEach } from "vitest";
import {
  clearPersistedMetadataStore,
  hydrateMetadataCache,
} from "../persisted-cache";

const STORAGE_PREFIX = "rail:metadata-cache:v1";

const buildLegacyStore = () => ({
  version: 1,
  entries: {
    "inventory.Product": {
      filter: {
        data: {
          modelSchema: {
            app: "inventory",
            model: "Product",
            fields: [],
            relationships: [],
            filterConfig: null,
          },
          filterSchema: [],
        },
        updatedAt: Date.now(),
      },
      table: {
        data: {
          modelSchema: {
            app: "inventory",
            model: "Product",
            fields: [],
            relationships: [],
            filters: [],
            filterConfig: null,
          },
        },
        updatedAt: Date.now(),
      },
    },
  },
  recent: {},
});

describe("hydrateMetadataCache", () => {
  let userKey = "";

  afterEach(() => {
    if (!userKey) {
      return;
    }
    clearPersistedMetadataStore(userKey);
    userKey = "";
  });

  it("normalizes legacy persisted modelSchema fields for Apollo writeQuery", () => {
    userKey = `metadata-hydration-test-${Date.now()}`;
    const storageKey = `${STORAGE_PREFIX}:${userKey}`;
    window.localStorage.setItem(storageKey, JSON.stringify(buildLegacyStore()));

    const writeQuery = vi.fn();
    const cache = { writeQuery } as unknown as InMemoryCache;

    const result = hydrateMetadataCache(cache, userKey);

    expect(result.hydrated).toBe(true);
    expect(result.entries).toBe(2);
    expect(writeQuery).toHaveBeenCalledTimes(2);

    const modelSchemas = writeQuery.mock.calls
      .map(([args]) => args?.data?.modelSchema)
      .filter(Boolean) as Array<Record<string, unknown>>;

    expect(modelSchemas.length).toBe(2);
    for (const schema of modelSchemas) {
      expect(Array.isArray(schema.relationFilters)).toBe(true);
      expect(Array.isArray(schema.fieldGroups)).toBe(true);
    }
  });
});
