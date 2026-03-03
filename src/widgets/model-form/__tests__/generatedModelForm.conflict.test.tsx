import { describe, expect, it } from "vitest";

import { normalizeGeneratedErrorsForForm } from "../utils/errors";

describe("generated conflict error mapping", () => {
 it("maps conflict errors to form-level refresh-required state", () => {
 const mapped = normalizeGeneratedErrorsForForm([
 {
 field: "__all__",
 message: "The record is stale. Refresh and retry.",
 code: "CONFLICT",
 source: "OPERATION",
 },
 ]);

 expect(mapped).toHaveLength(1);
 expect(mapped[0].field).toBe("__all__");
 expect(mapped[0].code).toBe("CONFLICT");
 expect(mapped[0].message.toLowerCase()).toContain("refresh");
 });
});
