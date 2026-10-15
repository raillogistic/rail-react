import { beforeEach, describe, expect, it, vi } from "vitest";

describe("tokenStorage security behavior", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
    localStorage.clear();
    sessionStorage.clear();
  });

  it("does not persist refresh tokens to web storage by default", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { tokenStorage } = await import("../token-storage");

    tokenStorage.setRefreshToken("refresh-token-value");

    expect(tokenStorage.getRefreshToken()).toBeNull();
    expect(sessionStorage.getItem("rail_refresh_token")).toBeNull();
    warnSpy.mockRestore();
  });

  it("publishes auth session change events when session activity changes", async () => {
    const { tokenStorage, AUTH_SESSION_EVENT } = await import("../token-storage");
    const events: Array<{ isActive?: boolean }> = [];
    const listener = (event: Event) => {
      const detail = (event as CustomEvent<{ isActive?: boolean }>).detail;
      events.push(detail ?? {});
    };

    window.addEventListener(AUTH_SESSION_EVENT, listener);
    tokenStorage.setSessionActive(true);
    tokenStorage.setSessionActive(false);
    window.removeEventListener(AUTH_SESSION_EVENT, listener);

    expect(sessionStorage.getItem("rail_session_active")).toBeNull();
    expect(events).toEqual([{ isActive: true }, { isActive: false }]);
  });
});
