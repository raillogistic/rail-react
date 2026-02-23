import { describe, expect, it } from "vitest";

import { shouldEnforceOperationDeny } from "../utils/operationPermissions";

describe("operation permission enforcement", () => {
  it("enforces explicit permission-denied reasons", () => {
    expect(
      shouldEnforceOperationDeny(
        {
          allowed: false,
          requiredPermissions: ["store.change_order"],
          requiresAuthentication: true,
          reason: "Permission required: store.change_order",
        },
        "UPDATE",
      ),
    ).toBe(true);
  });

  it("enforces explicit authentication-denied reasons", () => {
    expect(
      shouldEnforceOperationDeny(
        {
          allowed: false,
          requiredPermissions: [],
          requiresAuthentication: true,
          reason: "Authentication required",
        },
        "UPDATE",
      ),
    ).toBe(true);
  });

  it("does not enforce provisional update deny without missing-permission reason", () => {
    expect(
      shouldEnforceOperationDeny(
        {
          allowed: false,
          requiredPermissions: [],
          requiresAuthentication: true,
          reason: "Condition d'accès non satisfaite",
        },
        "UPDATE",
      ),
    ).toBe(false);
  });

  it("still enforces non-update deny when allowed is false", () => {
    expect(
      shouldEnforceOperationDeny(
        {
          allowed: false,
          requiredPermissions: [],
          requiresAuthentication: false,
          reason: null,
        },
        "CREATE",
      ),
    ).toBe(true);
  });
});
