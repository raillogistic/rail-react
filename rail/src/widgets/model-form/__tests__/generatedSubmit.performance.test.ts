import { describe, expect, it } from "vitest";

import { normalizeGeneratedMutationErrors } from "../utils/normalizeMutationErrors";
import {
 ERROR_NORMALIZATION_BUDGET_MS,
 SUBMIT_ORCHESTRATION_BUDGET_MS,
 measureErrorNormalization,
 measureSubmitOrchestration,
} from "../utils/submitPerformance";

describe("generated submit performance budgets", () => {
 it("keeps submit orchestration helper within the 25ms budget", () => {
 const { measurement } = measureSubmitOrchestration(() => ({
 mode: "CREATE",
 operationName: "createProduct",
 variables: { input: { name: "Widget", price: 12 } },
 }));

 expect(measurement.durationMs).toBeLessThanOrEqual(SUBMIT_ORCHESTRATION_BUDGET_MS);
 expect(measurement.withinBudget).toBe(true);
 });

 it("keeps normalization helper within the 10ms budget for 100 errors", () => {
 const errorBatch = Array.from({ length: 100 }, (_, index) => ({
 field:`items[${index}].name`,
 message:`Error ${index}`,
 source: "OPERATION",
 }));

 const { result, measurement } = measureErrorNormalization(() =>
 normalizeGeneratedMutationErrors(errorBatch),
 );

 expect(result).toHaveLength(100);
 expect(measurement.durationMs).toBeLessThanOrEqual(ERROR_NORMALIZATION_BUDGET_MS);
 expect(measurement.withinBudget).toBe(true);
 });
});
