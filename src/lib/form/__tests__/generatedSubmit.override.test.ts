import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useGeneratedModelForm } from "../hooks/useGeneratedModelForm";
import { sampleModelFormContract } from "./fixtures/modelFormContract";

describe("generated submit override safety", () => {
  it("normalizes custom override exceptions and releases submit lock", async () => {
    const submitOverride = vi.fn().mockRejectedValue(new Error("Override exploded"));

    const { result } = renderHook(() =>
      useGeneratedModelForm({
        generatedEnabled: true,
        contract: sampleModelFormContract,
        submitMode: "CREATE",
        submitOverride,
      }),
    );

    let outcome: Awaited<ReturnType<typeof result.current.submit>> | null = null;
    await act(async () => {
      outcome = await result.current.submit({ name: "Widget", price: 12 });
    });

    expect(submitOverride).toHaveBeenCalledTimes(1);
    expect(outcome?.ok).toBe(false);
    expect(outcome?.errors[0]?.source).toBe("EXECUTION");
    expect(outcome?.errors[0]?.message).toContain("Override exploded");
    expect(result.current.submitState.lockActive).toBe(false);
    expect(result.current.submitState.isSubmitting).toBe(false);
  });
});
