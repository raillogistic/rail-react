import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useTableMetadata } from "../useTableMetadata";
import { TABLE_BOOTSTRAP_METADATA_QUERY } from "@/shared/api/graphql/graphql/metadata/queries";

const mockUseQuery = vi.fn();
const mockUseLazyQuery = vi.fn();
const mockReadPersisted = vi.fn();
const mockPersist = vi.fn();
const mockRecordUsage = vi.fn();

vi.mock("@apollo/client", async () => {
  const actual = await vi.importActual<typeof import("@apollo/client")>(
    "@apollo/client",
  );
  return {
    ...actual,
    useQuery: (...args: unknown[]) => mockUseQuery(...args),
    useLazyQuery: (...args: unknown[]) => mockUseLazyQuery(...args),
  };
});

vi.mock("@/shared/api/graphql/graphql/metadata/persisted-cache", () => ({
  readPersistedTableMetadata: (...args: unknown[]) => mockReadPersisted(...args),
  persistTableMetadata: (...args: unknown[]) => mockPersist(...args),
  recordModelUsage: (...args: unknown[]) => mockRecordUsage(...args),
}));

describe("useTableMetadata", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockUseLazyQuery.mockReturnValue([
      vi.fn().mockResolvedValue(undefined),
      {
        data: undefined,
        loading: false,
        error: undefined,
        called: false,
      },
    ]);
  });

  it("returns bootstrap metadata when available", () => {
    const metadata = {
      app: "inventory",
      model: "Product",
      verboseName: "Product",
      verboseNamePlural: "Products",
      primaryKey: "id",
      fields: [],
      relationships: [],
      filterConfig: {
        inputTypeName: "ProductWhereInput",
        supportsQuick: true,
      },
      metadataVersion: "1",
    };

    mockUseQuery.mockReturnValue({
      data: {
        modelSchema: metadata,
      },
      loading: false,
      error: undefined,
    });
    mockReadPersisted.mockReturnValue(null);

    const { result } = renderHook(() => useTableMetadata("inventory", "Product"));

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeUndefined();
    expect(result.current.metadata?.model).toBe("Product");
    expect(result.current.metadata?.primaryKey).toBe("id");
    expect(mockPersist).toHaveBeenCalledWith("inventory", "Product", {
      modelSchema: expect.objectContaining({
        model: "Product",
      }),
    });
    expect(mockRecordUsage).toHaveBeenCalledWith("inventory", "Product");
    expect(mockUseQuery).toHaveBeenCalledWith(
      TABLE_BOOTSTRAP_METADATA_QUERY,
      expect.objectContaining({
        variables: { app: "inventory", model: "Product" },
        skip: false,
      }),
    );
  });

  it("falls back to persisted metadata when bootstrap query has no payload", () => {
    mockUseQuery.mockReturnValue({
      data: {
        modelSchema: null,
      },
      loading: false,
      error: undefined,
    });
    mockReadPersisted.mockReturnValue({
      app: "inventory",
      model: "Product",
      verboseName: "Product",
      verboseNamePlural: "Products",
      primaryKey: "id",
      fields: [],
      relationships: [],
      mutations: [{ name: "persistedMutation", allowed: true }],
      metadataVersion: "1",
    });

    const { result } = renderHook(() => useTableMetadata("inventory", "Product"));

    expect(result.current.metadata?.model).toBe("Product");
    expect(result.current.metadata?.mutations).toEqual([
      { name: "persistedMutation", allowed: true },
    ]);
    expect(mockPersist).not.toHaveBeenCalled();
  });

  it("requests capabilities on demand", async () => {
    const loadCapabilities = vi.fn().mockResolvedValue(undefined);

    mockUseQuery.mockReturnValue({
      data: {
        modelSchema: {
          app: "inventory",
          model: "Product",
          verboseName: "Product",
          verboseNamePlural: "Products",
          primaryKey: "id",
          fields: [],
          relationships: [],
        },
      },
      loading: false,
      error: undefined,
    });

    mockUseLazyQuery.mockReturnValue([
      loadCapabilities,
      {
        data: undefined,
        loading: false,
        error: undefined,
        called: false,
      },
    ]);

    const { result } = renderHook(() => useTableMetadata("inventory", "Product"));

    await result.current.ensureCapabilitiesLoaded();
    await result.current.ensureCapabilitiesLoaded();

    expect(loadCapabilities).toHaveBeenCalledWith({
      variables: { app: "inventory", model: "Product" },
    });
    expect(loadCapabilities).toHaveBeenCalledTimes(1);
  });
});
