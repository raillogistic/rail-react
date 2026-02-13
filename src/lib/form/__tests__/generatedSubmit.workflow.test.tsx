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

  it("normalizes snake_case values to camelCase before dispatching generated mutations", async () => {
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
        executeMutation: createExecutor,
      }),
    );

    await act(async () => {
      await result.current.submit({
        cost_price: "13.74",
        created_at: "2026-02-07T19:38:42.943382+00:00",
        metadata_blob: {
          updated_from: "StoreProductUpdateModelFormExample",
        },
      });
    });

    expect(createExecutor).toHaveBeenCalledTimes(1);
    expect(createExecutor).toHaveBeenCalledWith(
      "createProduct",
      {
        input: {
          costPrice: "13.74",
          createdAt: "2026-02-07T19:38:42.943382+00:00",
          metadataBlob: {
            updatedFrom: "StoreProductUpdateModelFormExample",
          },
        },
      },
      expect.objectContaining({
        operationName: "createProduct",
      }),
    );
  });

  it("resolves snake_case update identifiers from camelCase values", async () => {
    const updateExecutor = vi.fn().mockResolvedValue({
      ok: true,
      errors: [],
      conflict: false,
      formErrorKey: "__all__",
    });

    const { result } = renderHook(() =>
      useGeneratedModelForm({
        generatedEnabled: true,
        contract: {
          ...sampleModelFormContract,
          mutationBindings: {
            ...sampleModelFormContract.mutationBindings,
            updateIdentifierKey: "sku_code",
          },
        },
        submitMode: "UPDATE",
        executeMutation: updateExecutor,
      }),
    );

    await act(async () => {
      await result.current.submit({
        skuCode: "SKU-001",
        name: "Widget",
      });
    });

    expect(updateExecutor).toHaveBeenCalledTimes(1);
    expect(updateExecutor).toHaveBeenCalledWith(
      "updateProduct",
      {
        sku_code: "SKU-001",
        input: {
          skuCode: "SKU-001",
          name: "Widget",
        },
      },
      expect.objectContaining({
        identifier: { key: "sku_code", value: "SKU-001" },
      }),
    );
  });
});
