import { beforeEach, describe, expect, it, vi } from "vitest";

const getAuthorizationHeaderMock = vi.fn();
const getSecureHeadersMock = vi.fn();
const getRuntimeBackendConfigMock = vi.fn();

vi.mock("@/shared/api/auth/token-storage", () => ({
  getAuthorizationHeader: () => getAuthorizationHeaderMock(),
  getSecureHeaders: () => getSecureHeadersMock(),
}));

vi.mock("@/shared/config/backend-endpoint", () => ({
  getRuntimeBackendConfig: () => getRuntimeBackendConfigMock(),
}));

import {
  fetchProtectedFile,
  getProtectedFileDisplayName,
  resolveProtectedFileRequestFilename,
  resolveProtectedFileUrl,
} from "../protected-file";

describe("protected-file helpers", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    getAuthorizationHeaderMock.mockReturnValue("Bearer test-token");
    getSecureHeadersMock.mockReturnValue({ "X-CSRFToken": "csrf-token" });
    getRuntimeBackendConfigMock.mockReturnValue({
      backendUrl: "https://backend.example",
      apiEndpoint: "https://backend.example/graphql/gql/",
      authEndpoint: "https://backend.example/graphql/auth/",
      exportEndpoint: "https://backend.example/api/v1/export/",
      csrfEndpoint: "https://backend.example/csrf/",
    });
  });

  it("builds protected backend urls from raw file field values", () => {
    expect(resolveProtectedFileUrl("decharge/BC_LOGICIEL_GDS.pdf")).toBe(
      "https://backend.example/api/v1/media/decharge/BC_LOGICIEL_GDS.pdf",
    );
  });

  it("normalizes public media urls to the protected media endpoint", () => {
    expect(
      resolveProtectedFileUrl("https://backend.example/media/decharge/report final.pdf"),
    ).toBe(
      "https://backend.example/api/v1/media/decharge/report%20final.pdf",
    );
  });

  it("extracts readable filenames from file values and response headers", () => {
    expect(getProtectedFileDisplayName("decharge/report%20final.pdf")).toBe(
      "report final.pdf",
    );
    expect(
      resolveProtectedFileRequestFilename(
        `inline; filename*=UTF-8''rapport%20final.pdf`,
        "decharge/report.pdf",
      ),
    ).toBe("rapport final.pdf");
  });

  it("fetches files with cookie and authorization support", async () => {
    const blob = new Blob(["pdf"], { type: "application/pdf" });
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(blob, {
        status: 200,
        headers: {
          "Content-Disposition": 'inline; filename="piece_jointe.pdf"',
        },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await fetchProtectedFile("decharge/piece_jointe.pdf");

    expect(fetchMock).toHaveBeenCalledWith(
      "https://backend.example/api/v1/media/decharge/piece_jointe.pdf",
      expect.objectContaining({
        method: "GET",
        credentials: "include",
        headers: expect.objectContaining({
          Authorization: "Bearer test-token",
          "X-CSRFToken": "csrf-token",
        }),
      }),
    );
    expect(result.filename).toBe("piece_jointe.pdf");
    expect(result.requestUrl).toBe(
      "https://backend.example/api/v1/media/decharge/piece_jointe.pdf",
    );
  });
});
