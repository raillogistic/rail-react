import { describe, expect, it } from "vitest";
import { userHasPermission } from "../permission-matching";

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
});
