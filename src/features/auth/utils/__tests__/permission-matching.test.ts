import { describe, expect, it } from "vitest";
import {
  userHasPermission,
  userHasRole,
  userMeetsRouteAccessRequirement,
} from "../permission-matching";

describe("userHasPermission", () => {
  it("retains wildcard semantics for punctuation, line breaks and repeated stars", () => {
    const patterns = ['store.*', '*.view_*', 'a**b', 'a*b*c', 'a.b*', 'a[bc]*', '*a*', 'a*\nb', '*.*'];
    const values = ['store.view_order', 'app.view_user', 'ab', 'a.b', 'a[bc]d', 'a\nb', 'a\rb', 'a\u2028b', '  abc  ', 'no-match'];
    for (const pattern of patterns) {
      const escaped = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\\\*/g, '.*');
      for (const value of values) {
        const expected = pattern === '*.*' || new RegExp(`^${escaped}$`).test(value.trim());
        expect(userHasPermission({ permissions: [pattern] }, value)).toBe(expected);
      }
    }
    expect(userHasPermission({ permissions: ['a*'.repeat(12) + 'b'] }, 'a'.repeat(24) + 'c')).toBe(false);
  });

  it("does not retain permission or role decisions after in-place revocation", () => {
    const user = { permissions: ['catalog.view_order'], roles: [{ name: 'approver', permissions: ['catalog.change_order'] }] };
    expect(userHasPermission(user, 'catalog.view_order')).toBe(true);
    user.permissions.length = 0;
    expect(userHasPermission(user, 'catalog.view_order')).toBe(false);
    expect(userHasPermission(user, 'catalog.change_order')).toBe(true);
    user.roles[0].permissions.length = 0;
    expect(userHasPermission(user, 'catalog.change_order')).toBe(false);
  });
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
