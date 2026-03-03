import { describe, expect, it } from "vitest";

import { normalizeGeneratedMutationErrors } from "../utils/normalizeMutationErrors";

describe("generated submit error normalization", () => {
 it("maps hidden or conditionally-rendered field errors to canonical __all__", () => {
 const normalized = normalizeGeneratedMutationErrors(
 [
 {
 field: "internalNotes",
 message: "You cannot edit this field.",
 source: "OPERATION",
 },
 ],
 {
 formErrorKey: "__all__",
 visibleFieldPaths: ["name", "price"],
 },
 );

 expect(normalized).toHaveLength(1);
 expect(normalized[0].field).toBe("__all__");
 expect(normalized[0].meta?.originalField).toBe("internalNotes");
 });
});
