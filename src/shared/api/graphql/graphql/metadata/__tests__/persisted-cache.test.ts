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

const buildPartialFilterConfigStore = () => ({
  version: 1,
  entries: {
    "operations.Decharge": {
      table: {
        data: {
          modelSchema: {
            app: "operations",
            model: "Decharge",
            fields: [],
            relationships: [],
            filters: [],
            filterConfig: {
              __typename: "FilterConfigType",
              inputTypeName: "DechargeWhereInput",
              supportsQuick: true,
            },
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

  it("fills missing filterConfig fields from bootstrap-only persisted metadata", () => {
    userKey = `metadata-filter-config-test-${Date.now()}`;
    const storageKey = `${STORAGE_PREFIX}:${userKey}`;
    window.localStorage.setItem(
      storageKey,
      JSON.stringify(buildPartialFilterConfigStore()),
    );

    const writeQuery = vi.fn();
    const cache = { writeQuery } as unknown as InMemoryCache;

    const result = hydrateMetadataCache(cache, userKey);

    expect(result.hydrated).toBe(true);
    expect(result.entries).toBe(1);
    expect(writeQuery).toHaveBeenCalledTimes(1);

    const filterConfig = writeQuery.mock.calls[0]?.[0]?.data?.modelSchema
      ?.filterConfig as Record<string, unknown>;

    expect(filterConfig).toBeTruthy();
    expect(filterConfig.__typename).toBe("FilterConfigType");
    expect(filterConfig.style).toBe("nested");
    expect(filterConfig.argumentName).toBe("where");
    expect(filterConfig.inputTypeName).toBe("DechargeWhereInput");
    expect(filterConfig.supportsAnd).toBe(true);
    expect(filterConfig.supportsOr).toBe(true);
    expect(filterConfig.supportsNot).toBe(true);
    expect(filterConfig.dualModeEnabled).toBe(false);
    expect(filterConfig.supportsQuick).toBe(true);
    expect(filterConfig.supportsFts).toBe(false);
    expect(filterConfig.supportsAggregation).toBe(false);
    expect(filterConfig.presets).toEqual([]);
    expect(filterConfig.computedFilters).toEqual([]);
  });
});
