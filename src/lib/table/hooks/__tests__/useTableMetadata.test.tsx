import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useTableMetadata } from "../useTableMetadata";

const mockUseQuery = vi.fn();
const mockUseMetadata = vi.fn();
const mockReadPersisted = vi.fn();
const mockPersist = vi.fn();
const mockRecordUsage = vi.fn();

vi.mock("@apollo/client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@apollo/client")>();
  return {
    ...actual,
    useQuery: (...args: unknown[]) => mockUseQuery(...args),
  };
});

vi.mock("@/lib/graphql/metadata/gateway", () => ({
  useMetadata: (...args: unknown[]) => mockUseMetadata(...args),
}));

vi.mock("@/lib/graphql/metadata/persisted-cache", () => ({
  readPersistedTableMetadata: (...args: unknown[]) => mockReadPersisted(...args),
  persistTableMetadata: (...args: unknown[]) => mockPersist(...args),
  recordModelUsage: (...args: unknown[]) => mockRecordUsage(...args),
}));

describe("useTableMetadata", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns gateway metadata when available", () => {
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

    mockUseMetadata.mockReturnValue({
      metadata,
      loading: false,
      error: undefined,
    });
    mockUseQuery.mockReturnValue({
      data: undefined,
      loading: false,
      error: undefined,
    });
    mockReadPersisted.mockReturnValue(null);

    const { result } = renderHook(() => useTableMetadata("inventory", "Product"));

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeUndefined();
    expect(result.current.metadata?.model).toBe("Product");
    expect(result.current.metadata?.mutations).toEqual(metadata.mutations);
    expect(mockPersist).toHaveBeenCalled();
    expect(mockRecordUsage).toHaveBeenCalledWith("inventory", "Product");
  });

  it("falls back to persisted metadata when gateway returns null", () => {
    mockUseMetadata.mockReturnValue({
      metadata: null,
      loading: false,
      error: undefined,
    });
    mockUseQuery.mockReturnValue({
      data: undefined,
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
  });
});

