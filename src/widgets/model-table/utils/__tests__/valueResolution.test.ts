import { describe, expect, it } from "vitest";
import { resolveValueOptimized, buildAccessorPath } from "../valueResolution";

describe("valueResolution", () => {
  describe("buildAccessorPath", () => {
    it("splits dot notation into array", () => {
      expect(buildAccessorPath("user.profile.name")).toEqual(["user", "profile", "name"]);
    });

    it("handles single segments", () => {
      expect(buildAccessorPath("id")).toEqual(["id"]);
    });

    it("filters out empty segments", () => {
      expect(buildAccessorPath("user..name")).toEqual(["user", "name"]);
    });
  });

  describe("resolveValueOptimized", () => {
    const row = {
      id: 1,
      user: {
        profile: {
          name: "Alice",
          age: 30
        },
        settings: null
      },
      tags: ["admin", "editor"]
    };

    it("resolves shallow values", () => {
      expect(resolveValueOptimized(row, ["id"])).toBe(1);
    });

    it("resolves nested values", () => {
      expect(resolveValueOptimized(row, ["user", "profile", "name"])).toBe("Alice");
    });

    it("returns undefined for missing paths", () => {
      expect(resolveValueOptimized(row, ["user", "avatar"])).toBeUndefined();
      expect(resolveValueOptimized(row, ["other"])).toBeUndefined();
    });

    it("handles null values in path", () => {
      expect(resolveValueOptimized(row, ["user", "settings", "theme"])).toBeUndefined();
    });

    it("handles array access if segments are numeric strings (though usually not used in our table)", () => {
      expect(resolveValueOptimized(row, ["tags", "0"])).toBe("admin");
    });
  });
});
