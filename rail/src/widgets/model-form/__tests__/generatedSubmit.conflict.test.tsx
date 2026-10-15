import { describe, expect, it } from "vitest";

import { normalizeGeneratedErrorsForForm } from "../utils/errors";
import { resolveConflictRefreshInstruction } from "../renderers/FieldRenderer";

describe("generated submit conflict handling", () => {
 it("maps conflicts to canonical field and exposes refresh-required guidance", () => {
 const normalized = normalizeGeneratedErrorsForForm([
 {
 field: null,
 message: "Record version mismatch.",
 code: "CONFLICT",
 source: "OPERATION",
 },
 ]);

 expect(normalized).toHaveLength(1);
 expect(normalized[0].field).toBe("__all__");
 expect(normalized[0].details?.conflict).toBe(true);
 expect(normalized[0].details?.refreshRequired).toBe(true);

 const hint = resolveConflictRefreshInstruction({
 errorMap: {
 onSubmitConflictInstruction:
 "Conflict detected. Refresh the form data and retry.",
 },
 });
 expect(hint).toContain("Refresh");
 });
});
