/** Verify host-authenticated exports from the reusable reporting runtime. */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { downloadBinaryFile } from "../exportUtils";
import { getAuthorizationHeader } from "@/shared/api/auth/token-storage";

vi.mock("@/shared/api/auth/token-storage", () => ({
  getAuthorizationHeader: vi.fn(),
}));

vi.mock("@/shared/config/backend-endpoint", () => ({
  getRuntimeBackendConfig: vi.fn(() => ({ backendUrl: "http://backend.test" })),
}));

describe("downloadBinaryFile", () => {
  let mockFetch: ReturnType<typeof vi.fn>;
  let mockCreateObjectURL: ReturnType<typeof vi.fn>;
  let mockRevokeObjectURL: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      blob: () => Promise.resolve(new Blob(["mock-data"])),
    });
    global.fetch = mockFetch as unknown as typeof fetch;

    mockCreateObjectURL = vi.fn().mockReturnValue("blob:mock-url");
    mockRevokeObjectURL = vi.fn();
    window.URL.createObjectURL = mockCreateObjectURL as unknown as typeof window.URL.createObjectURL;
    window.URL.revokeObjectURL = mockRevokeObjectURL as unknown as typeof window.URL.revokeObjectURL;

    // Mock HTMLAnchorElement
    const mockClick = vi.fn();
    vi.spyOn(document, "createElement").mockImplementation((tagName: string) => {
      if (tagName === "a") {
        return { click: mockClick } as unknown as HTMLAnchorElement;
      }
      return document.createElement(tagName);
    });
  });

  it("should include Authorization header when available", async () => {
    vi.mocked(getAuthorizationHeader).mockReturnValue("Bearer mock-token");

    await downloadBinaryFile("/export", "test.xlsx");

    expect(mockFetch).toHaveBeenCalledWith("http://backend.test/export", {
      credentials: "include",
      headers: {
        Authorization: "Bearer mock-token",
      },
    });
  });

  it("should not include Authorization header when unavailable", async () => {
    vi.mocked(getAuthorizationHeader).mockReturnValue(null);

    await downloadBinaryFile("/export", "test.xlsx");

    expect(mockFetch).toHaveBeenCalledWith("http://backend.test/export", {
      credentials: "include",
      headers: {},
    });
  });
});
