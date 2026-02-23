import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { useGeneratedFormMetrics } from "../hooks/useGeneratedFormMetrics";

describe("useGeneratedFormMetrics", () => {
  it("tracks first-attempt correction success KPI", () => {
    const { result } = renderHook(() => useGeneratedFormMetrics());

    result.current.recordAttempt({ ok: false, hadValidationErrors: true });
    result.current.recordAttempt({ ok: true });

    const snapshot = result.current.getSnapshot();
    expect(snapshot.totalSubmissions).toBe(2);
    expect(snapshot.firstAttemptCorrectionSuccesses).toBe(1);
    expect(snapshot.correctionRate).toBeGreaterThan(0);
  });
});
