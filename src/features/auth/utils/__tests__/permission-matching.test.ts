import { describe, expect, it } from "vitest";
import {
  userHasPermission,
  userHasRole,
  userMeetsRouteAccessRequirement,
} from "../permission-matching";

describe("userHasPermission", () => {
  it("matches direct string permissions", () => {
    expect(
      userHasPermission(
        { permissions: ["store.view_order"], roles: ["admin"] },
        "store.view_order",
      ),
    ).toBe(true);
  });

  it("matches role-derived permission objects", () => {
    expect(
      userHasPermission(
        {
          permissions: [],
          roles: [
            {
              permissions: [{ codename: "store.change_order" }],
            },
          ],
        },
        "store.change_order",
      ),
    ).toBe(true);
  });

  it("matches role-derived permission strings", () => {
    expect(
      userHasPermission(
        {
          permissions: [],
          roles: [{ permissions: ["store.delete_order"] }],
        },
        "store.delete_order",
      ),
    ).toBe(true);
  });

  it("supports wildcard direct permissions", () => {
    expect(
      userHasPermission(
        {
          permissions: ["store.*"],
          roles: ["manager"],
        },
        "store.change_order",
      ),
    ).toBe(true);
  });

  it("treats superusers as authorized for all permissions", () => {
    expect(
      userHasPermission(
        {
          is_superuser: true,
          permissions: [],
          roles: [],
        },
        "store.change_order",
      ),
    ).toBe(true);
  });
});

describe("userHasRole", () => {
  it("matches role names from detailed role objects", () => {
    expect(
      userHasRole(
        {
          roles: [{ name: "ops_manager" }],
        },
        "ops_manager",
      ),
    ).toBe(true);
  });

  it("treats superusers as superadmin", () => {
    expect(
      userHasRole(
        {
          is_superuser: true,
          roles: [],
        },
        "superadmin",
      ),
    ).toBe(true);
  });
});

describe("userMeetsRouteAccessRequirement", () => {
  it("requires authentication by default", () => {
    expect(
      userMeetsRouteAccessRequirement(
        null,
        {
          allPermissions: ["store.view_order"],
        },
        { isAuthenticated: false },
      ),
    ).toBe(false);
  });

  it("supports public routes with role requirements", () => {
    expect(
      userMeetsRouteAccessRequirement(
        {
          roles: ["ops_manager"],
        },
        {
          requireAuthentication: false,
          anyRoles: ["ops_manager"],
        },
        { isAuthenticated: true },
      ),
    ).toBe(true);
  });
});
