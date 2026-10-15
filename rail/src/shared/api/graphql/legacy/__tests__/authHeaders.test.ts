import { describe, expect, it } from "vitest";
import { hasExplicitAuthorizationHeader } from "@/shared/api/apollo/authHeaders";

describe("hasExplicitAuthorizationHeader", () => {
  it("detects lowercase authorization header", () => {
    expect(
      hasExplicitAuthorizationHeader({
        authorization: "Bearer explicit-token",
      }),
    ).toBe(true);
  });

  it("detects uppercase Authorization header", () => {
    expect(
      hasExplicitAuthorizationHeader({
        Authorization: "Bearer explicit-token",
      }),
    ).toBe(true);
  });

  it("returns false when authorization is missing or blank", () => {
    expect(hasExplicitAuthorizationHeader(undefined)).toBe(false);
    expect(hasExplicitAuthorizationHeader({})).toBe(false);
    expect(
      hasExplicitAuthorizationHeader({
        authorization: "   ",
      }),
    ).toBe(false);
  });
});
