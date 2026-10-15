import { describe, expect, it } from "vitest";
import {
  createFallbackSessionId,
  normalizeSessionIdClaim,
  selectSessionIdFromTokenPayload,
} from "../sessionIds";

describe("sessionIds", () => {
  it("normalizes string and numeric session id claims", () => {
    expect(normalizeSessionIdClaim("  session-1 ")).toBe("session-1");
    expect(normalizeSessionIdClaim(42)).toBe("42");
    expect(normalizeSessionIdClaim("")).toBeNull();
    expect(normalizeSessionIdClaim(null)).toBeNull();
  });

  it("selects session id from preferred token payload claims", () => {
    expect(
      selectSessionIdFromTokenPayload({
        session_id: "sid-1",
        sessionId: "sid-2",
        sid: "sid-3",
        jti: "sid-4",
      }),
    ).toBe("sid-1");

    expect(
      selectSessionIdFromTokenPayload({
        sessionId: "sid-2",
      }),
    ).toBe("sid-2");

    expect(
      selectSessionIdFromTokenPayload({
        sid: "sid-3",
      }),
    ).toBe("sid-3");

    expect(
      selectSessionIdFromTokenPayload({
        jti: "sid-4",
      }),
    ).toBe("sid-4");
  });

  it("returns unique fallback ids", () => {
    const first = createFallbackSessionId();
    const second = createFallbackSessionId();

    expect(first).toMatch(/^client-session-/);
    expect(second).toMatch(/^client-session-/);
    expect(first).not.toBe(second);
  });
});
