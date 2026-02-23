import { describe, expect, it, vi } from "vitest";
import {
  fetchMetadataSnapshot,
  normalizeMetadataError,
} from "../gateway";

const buildMetadataPayload = () => ({
  app: "inventory",
  model: "Product",
  verboseName: "Product",
  verboseNamePlural: "Products",
  primaryKey: "id",
  ordering: [],
  uniqueTogether: [],
  fields: [],
  relationships: [],
  filters: [],
  filterConfig: null,
  relationFilters: [],
  mutations: [],
  permissions: {
    canList: true,
    canRetrieve: true,
    canCreate: true,
    canUpdate: true,
    canDelete: true,
    canBulkCreate: false,
    canBulkUpdate: false,
    canBulkDelete: false,
    canExport: false,
    denialReasons: null,
  },
  fieldGroups: [],
  templates: [],
  metadataVersion: "1",
  customMetadata: null,
});

describe("fetchMetadataSnapshot", () => {
  it("deduplicates in-flight requests with the same signature", async () => {
    const query = vi.fn().mockImplementation(
      () =>
        new Promise((resolve) => {
          setTimeout(() => {
            resolve({
              data: {
                modelSchema: buildMetadataPayload(),
              },
            });
          }, 5);
        }),
    );

    const client = { query } as any;
    const params = {
      app: "inventory",
      model: "Product",
      profile: "table" as const,
      objectId: null,
      include: [],
      skip: false,
      queryOptions: {},
    };

    await Promise.all([
      fetchMetadataSnapshot(client, params),
      fetchMetadataSnapshot(client, params),
    ]);

    expect(query).toHaveBeenCalledTimes(1);
  });
});

describe("normalizeMetadataError", () => {
  it("returns native Error instances unchanged", () => {
    const error = new Error("Boom");
    expect(normalizeMetadataError(error)).toBe(error);
  });

  it("normalizes non-error values into Error", () => {
    const normalized = normalizeMetadataError("failure");
    expect(normalized).toBeInstanceOf(Error);
    expect(normalized.message).toContain("Metadata request failed");
  });
});

