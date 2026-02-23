import { describe, expect, it } from "vitest";
import { buildManagerQuerySuffix, buildModelQueryField } from "../naming";

describe("graphql naming", () => {
  it("builds default query names", () => {
    expect(buildModelQueryField("User", "single")).toBe("user");
    expect(buildModelQueryField("User", "list")).toBe("userList");
    expect(buildModelQueryField("User", "page")).toBe("userPage");
  });

  it("builds manager suffix for non-default manager", () => {
    expect(buildManagerQuerySuffix("objects")).toBe("");
    expect(buildManagerQuerySuffix("published")).toBe("ByPublished");
    expect(buildModelQueryField("User", "page", "published")).toBe(
      "userPageByPublished",
    );
  });
});
