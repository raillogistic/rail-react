import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useTableMetadata } from "../useTableMetadata";

const mockUseModelQueryMetadata = vi.fn();
const mockReadPersisted = vi.fn();
const mockPersist = vi.fn();
const mockRecordUsage = vi.fn();

vi.mock("@/lib/graphql", async () => {
  const actual = await vi.importActual<typeof import("@/lib/graphql")>(
    "@/lib/graphql",
  );
  return {
    ...actual,
    useModelQueryMetadata: (...args: unknown[]) =>
      mockUseModelQueryMetadata(...args),
  };
});

vi.mock("@/lib/graphql/metadata/persisted-cache", () => ({
  readPersistedTableMetadata: (...args: unknown[]) => mockReadPersisted(...args),
  persistTableMetadata: (...args: unknown[]) => mockPersist(...args),
  recordModelUsage: (...args: unknown[]) => mockRecordUsage(...args),
}));

describe("useTableMetadata", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns query metadata when available", () => {
    const metadata = {
      app: "inventory",
      model: "Product",
      verboseName: "Product",
      verboseNamePlural: "Products",
      primaryKey: "id",
      fields: [],
      relationships: [],
      filters: [],
      mutations: [{ name: "createProduct", allowed: true }],
      permissions: { canList: true },
      metadataVersion: "1",
    };

    mockUseModelQueryMetadata.mockReturnValue({
      metadata,
      loading: false,
      error: undefined,
    });
    mockReadPersisted.mockReturnValue(null);

    const { result } = renderHook(() => useTableMetadata("inventory", "Product"));

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeUndefined();
    expect(result.current.metadata?.model).toBe("Product");
    expect(result.current.metadata?.mutations).toEqual(metadata.mutations);
    expect(mockPersist).toHaveBeenCalledWith("inventory", "Product", {
      modelSchema: metadata,
    });
    expect(mockRecordUsage).toHaveBeenCalledWith("inventory", "Product");
    expect(mockUseModelQueryMetadata).toHaveBeenCalledWith(
      expect.objectContaining({
        app: "inventory",
        model: "Product",
        profile: "table",
        skip: false,
      }),
    );
  });

  it("falls back to persisted metadata when query metadata is null", () => {
    mockUseModelQueryMetadata.mockReturnValue({
      metadata: null,
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
      filters: [],
      mutations: [{ name: "persistedMutation", allowed: true }],
      permissions: { canList: true },
      metadataVersion: "1",
    });

    const { result } = renderHook(() => useTableMetadata("inventory", "Product"));

    expect(result.current.metadata?.model).toBe("Product");
    expect(result.current.metadata?.mutations).toEqual([]);
    expect(mockPersist).not.toHaveBeenCalled();
  });
});
