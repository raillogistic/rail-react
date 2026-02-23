import { describe, expect, it } from "vitest";
import {
  buildManagerQuerySuffix,
  buildModelQueryField,
} from "../queryNaming";

describe("queryNaming", () => {
  it("builds default manager query names with camelCase model token", () => {
    expect(buildModelQueryField("User", "single")).toBe("user");
    expect(buildModelQueryField("User", "list")).toBe("userList");
    expect(buildModelQueryField("User", "page")).toBe("userPage");
  });

  it("normalizes model separators for query names", () => {
    expect(buildModelQueryField("reporting_dataset", "page")).toBe(
      "reportingDatasetPage",
    );
  });

  it("adds ByManager suffix for non-default managers", () => {
    expect(buildManagerQuerySuffix("objects")).toBe("");
    expect(buildManagerQuerySuffix("published")).toBe("ByPublished");
    expect(buildManagerQuerySuffix("sales_manager")).toBe("BySalesManager");
    expect(buildModelQueryField("User", "page", "published")).toBe(
      "userPageByPublished",
    );
  });
});
