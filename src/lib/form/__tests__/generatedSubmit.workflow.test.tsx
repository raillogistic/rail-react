import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import {
  selectGeneratedSubmitOperation,
} from "../mutations";
import { useGeneratedModelForm } from "../hooks/useGeneratedModelForm";
import { sampleModelFormContract } from "./fixtures/modelFormContract";

describe("generated submit workflow", () => {
  it("selects submit operation from mode-driven bindings", () => {
    expect(
      selectGeneratedSubmitOperation(
        {
          createOperation: "createProductFromContract",
          updateOperation: "updateProductFromContract",
        },
        "CREATE",
      ),
    ).toBe("createProductFromContract");

    expect(
      selectGeneratedSubmitOperation(
        {
          createOperation: "createProductFromContract",
          updateOperation: "updateProductFromContract",
        },
        "UPDATE",
      ),
    ).toBe("updateProductFromContract");
  });

  it("dispatches create/update submissions and maps runtime overrides into payload", async () => {
    const createExecutor = vi.fn().mockResolvedValue({
      ok: true,
      errors: [],
      conflict: false,
      formErrorKey: "__all__",
    });

    const { result } = renderHook(() =>
      useGeneratedModelForm({
        generatedEnabled: true,
        contract: sampleModelFormContract,
        submitMode: "CREATE",
        runtimeOverrides: [{ path: "price", value: 42, action: "REPLACE" }],
        executeMutation: createExecutor,
      }),
    );

    await act(async () => {
      await result.current.submit({ name: "Widget", price: 5 });
    });

    expect(createExecutor).toHaveBeenCalledTimes(1);
    expect(createExecutor).toHaveBeenCalledWith(
      "createProduct",
      { input: { name: "Widget", price: 42 } },
      expect.objectContaining({
        operationName: "createProduct",
      }),
    );

    const updateExecutor = vi.fn().mockResolvedValue({
      ok: true,
      errors: [],
      conflict: false,
      formErrorKey: "__all__",
    });

    const updateHook = renderHook(() =>
      useGeneratedModelForm({
        generatedEnabled: true,
        contract: sampleModelFormContract,
        submitMode: "UPDATE",
        identifierKeyOverride: "sku",
        executeMutation: updateExecutor,
      }),
    );

    await act(async () => {
      await updateHook.result.current.submit({
        sku: "SKU-001",
        name: "Widget",
        price: 12,
      });
    });

    expect(updateExecutor).toHaveBeenCalledTimes(1);
    expect(updateExecutor).toHaveBeenCalledWith(
      "updateProduct",
      {
        sku: "SKU-001",
        input: { sku: "SKU-001", name: "Widget", price: 12 },
      },
      expect.objectContaining({
        operationName: "updateProduct",
        identifier: { key: "sku", value: "SKU-001" },
      }),
    );
  });
});
