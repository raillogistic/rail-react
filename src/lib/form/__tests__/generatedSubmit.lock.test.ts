import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useGeneratedModelForm } from "../hooks/useGeneratedModelForm";
import { sampleModelFormContract } from "./fixtures/modelFormContract";

function createDeferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

describe("generated submit lock", () => {
  it("prevents re-entrant submit dispatch while a request is in-flight", async () => {
    const deferred = createDeferred<{
      ok: boolean;
      errors: unknown[];
      conflict: boolean;
      formErrorKey: string;
    }>();
    const executeMutation = vi.fn().mockImplementation(() => deferred.promise);

    const { result } = renderHook(() =>
      useGeneratedModelForm({
        generatedEnabled: true,
        contract: sampleModelFormContract,
        submitMode: "CREATE",
        executeMutation,
      }),
    );

    let firstSubmit: Promise<unknown> = Promise.resolve();
    act(() => {
      firstSubmit = result.current.submit({ name: "First", price: 10 });
    });

    let secondOutcome: Awaited<ReturnType<typeof result.current.submit>> | null =
      null;
    await act(async () => {
      secondOutcome = await result.current.submit({
        name: "Second",
        price: 11,
      });
    });

    expect(executeMutation).toHaveBeenCalledTimes(1);
    expect(secondOutcome?.ok).toBe(false);
    expect(secondOutcome?.errors[0]?.message).toMatch(/already in progress/i);

    deferred.resolve({
      ok: true,
      errors: [],
      conflict: false,
      formErrorKey: "__all__",
    });

    await act(async () => {
      await firstSubmit;
    });

    expect(result.current.submitState.lockActive).toBe(false);
    expect(result.current.submitState.isSubmitting).toBe(false);
  });
});
