import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useGeneratedBulkMutations } from "../hooks/useGeneratedBulkMutations";

describe("useGeneratedBulkMutations", () => {
 it("returns atomic failure state when backend rejects one row", async () => {
 const executeMutation = vi.fn().mockResolvedValue({
 ok: false,
 errors: [{ field: "__all__", message: "Atomic rollback", rowIndex: 1 }],
 objects: [],
 });

 const { result } = renderHook(() =>
 useGeneratedBulkMutations({
 mutationBindings: {
 createOperation: "createProduct",
 updateOperation: "updateProduct",
 bulkCreateOperation: "bulkCreateProduct",
 bulkUpdateOperation: "bulkUpdateProduct",
 updateTargetPolicy: "PRIMARY_KEY_ONLY",
 bulkCommitPolicy: "ATOMIC",
 conflictPolicy: "REJECT_STALE",
 },
 executeMutation,
 }),
 );

 const outcome = await result.current.runBulkCreate([{ name: "A" }]);
 expect(outcome.ok).toBe(false);
 expect(outcome.objects).toEqual([]);
 expect(outcome.errors[0].field).toContain("items.1");
 });
});
