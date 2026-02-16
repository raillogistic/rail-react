import { describe, expect, it } from "vitest";

import {
  calculateP95,
  evaluateDetailPerformanceBudgets,
} from "../v2/utils/performance";

describe("ModelDetailV2 performance budgets", () => {
  it("calculates p95 deterministically from sample arrays", () => {
    expect(calculateP95([])).toBeUndefined();
    expect(calculateP95([100, 200, 300, 400, 500])).toBe(500);
    expect(calculateP95([100, 200, 250, 260, 270, 280, 290, 300, 310, 320])).toBe(320);
  });

  it("enforces initial/lazy p95 thresholds", () => {
    const passing = evaluateDetailPerformanceBudgets({
      initialSamplesMs: [900, 1200, 1300, 1400, 1500],
      lazySamplesMs: [600, 700, 800, 1000, 1200],
    });
    expect(passing.pass).toBe(true);
    expect(passing.initialPass).toBe(true);
    expect(passing.lazyPass).toBe(true);

    const failing = evaluateDetailPerformanceBudgets({
      initialSamplesMs: [1500, 1700, 1900, 2100, 2200],
      lazySamplesMs: [800, 900, 1200, 1600, 1700],
    });
    expect(failing.pass).toBe(false);
    expect(failing.initialPass).toBe(false);
    expect(failing.lazyPass).toBe(false);
  });
});
