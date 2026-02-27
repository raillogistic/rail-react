import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useMetadataWarmup } from "../useMetadataWarmup";

const mockUseApolloClient = vi.fn();
const mockGetPersistedDeployVersion = vi.fn();
const mockHasPersistedMetadataEntries = vi.fn();
const mockHydrateMetadataCache = vi.fn();
const mockSetActiveMetadataUserKey = vi.fn();
const mockWarmupMetadataCache = vi.fn();

vi.mock("@apollo/client", async () => {
  const actual = await vi.importActual<typeof import("@apollo/client")>(
    "@apollo/client",
  );
  return {
    ...actual,
    useApolloClient: () => mockUseApolloClient(),
  };
});

vi.mock("../persisted-cache", () => ({
  getPersistedDeployVersion: (...args: unknown[]) =>
    mockGetPersistedDeployVersion(...args),
  hasPersistedMetadataEntries: (...args: unknown[]) =>
    mockHasPersistedMetadataEntries(...args),
  hydrateMetadataCache: (...args: unknown[]) =>
    mockHydrateMetadataCache(...args),
  setActiveMetadataUserKey: (...args: unknown[]) =>
    mockSetActiveMetadataUserKey(...args),
}));

vi.mock("../warmup", () => ({
  warmupMetadataCache: (...args: unknown[]) => mockWarmupMetadataCache(...args),
}));

describe("useMetadataWarmup", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    const cache = { writeQuery: vi.fn() };
    mockUseApolloClient.mockReturnValue({ cache });
    mockGetPersistedDeployVersion.mockReturnValue(null);
    mockHasPersistedMetadataEntries.mockReturnValue(false);
    mockHydrateMetadataCache.mockReturnValue({
      hydrated: true,
      entries: 1,
      userKey: "user-1",
    });
    mockWarmupMetadataCache.mockResolvedValue(undefined);
  });

  it("hydrates persisted cache and skips warmup when routeHints are empty", async () => {
    const cache = { writeQuery: vi.fn() };
    mockUseApolloClient.mockReturnValue({ cache });

    const { result } = renderHook(() =>
      useMetadataWarmup({
        enabled: true,
        userKey: "user-1",
        routeHints: [],
      }),
    );

    await waitFor(() => {
      expect(result.current.hydrated).toBe(true);
    });

    expect(result.current.warming).toBe(false);
    expect(mockSetActiveMetadataUserKey).toHaveBeenCalledWith("user-1");
    expect(mockSetActiveMetadataUserKey).not.toHaveBeenCalledWith(null);
    expect(mockHydrateMetadataCache).toHaveBeenCalledWith(cache, "user-1");
    expect(mockWarmupMetadataCache).not.toHaveBeenCalled();
  });
});

