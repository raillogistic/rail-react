import { describe, expect, it } from "vitest";

import { normalizeGeneratedErrorsForForm } from "../utils/errors";

describe("generated bulk error mapping", () => {
  it("maps row-index errors to items.<row>.<field> and falls back to __all__", () => {
    const errors = normalizeGeneratedErrorsForForm([
      {
        field: "name",
        message: "Invalid name",
        rowIndex: 2,
        source: "OPERATION",
      },
      {
        field: "__all__",
        message: "Row failed",
        rowIndex: 4,
        source: "OPERATION",
      },
    ]);

    expect(errors[0].field).toBe("items.2.name");
    expect(errors[1].field).toBe("items.4.__all__");
  });
});
