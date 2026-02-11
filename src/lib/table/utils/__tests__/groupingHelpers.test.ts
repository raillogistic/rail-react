import { describe, expect, it } from "vitest";
import { resolveGroupingLabel } from "../groupingHelpers";

describe("groupingHelpers.resolveGroupingLabel", () => {
  it("formats boolean groups with field label in French", () => {
    expect(
      resolveGroupingLabel(
        { isActive: true },
        "isActive",
        { fieldLabel: "Est active", isBoolean: true },
      ),
    ).toBe("Est active = Oui");
    expect(
      resolveGroupingLabel(
        { isActive: false },
        "isActive",
        { fieldLabel: "Est active", isBoolean: true },
      ),
    ).toBe("Est active = Non");
  });

  it("formats string booleans to French labels for boolean fields", () => {
    expect(
      resolveGroupingLabel({ status: "true" }, "status", {
        fieldLabel: "Actif",
        isBoolean: true,
      }),
    ).toBe("Actif = Oui");
    expect(
      resolveGroupingLabel({ status: "false" }, "status", {
        fieldLabel: "Actif",
        isBoolean: true,
      }),
    ).toBe("Actif = Non");
  });

  it("keeps non-boolean grouping labels unchanged", () => {
    expect(resolveGroupingLabel({ status: "Archived" }, "status")).toBe(
      "Archived",
    );
    expect(
      resolveGroupingLabel({ owner: { desc: "Alice" } }, "owner"),
    ).toBe("Alice");
  });
});
