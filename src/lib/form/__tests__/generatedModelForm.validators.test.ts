import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { useGeneratedValidators } from "../hooks/useGeneratedValidators";
import type { ModelFormContract } from "../types/generatedContract";
import { sampleModelFormContract } from "./fixtures/modelFormContract";

describe("useGeneratedValidators", () => {
  it("derives validators from contract constraints and custom extensions", () => {
    const contract: ModelFormContract = {
      ...sampleModelFormContract,
      fields: [
        {
          ...sampleModelFormContract.fields[0],
          required: true,
          constraints: JSON.stringify({ max_length: 4 }) as unknown as Record<
            string,
            unknown
          >,
        },
      ],
    };
    const { result } = renderHook(() =>
      useGeneratedValidators(contract, {
        name: (value) => (value === "bad" ? "Forbidden value." : undefined),
      }),
    );

    const validate = result.current.formValidator;
    expect(validate({ name: "" })?.name).toMatch(/(required|requis)/i);
    expect(validate({ name: "hello" })?.name).toMatch(/(at most|au maximum)\s*4/i);
    expect(validate({ name: "bad" })?.name).toContain("Forbidden");
    expect(validate({ name: "ok" })).toBeUndefined();
  });

  it("does not coerce null min/max constraints to zero", () => {
    const contract: ModelFormContract = {
      ...sampleModelFormContract,
      fields: [
        {
          ...sampleModelFormContract.fields[0],
          name: "inventoryCount",
          path: "inventory_count",
          fieldName: "inventory_count",
          label: "Quantite en stock",
          kind: "NUMBER",
          required: false,
          constraints: JSON.stringify({
            min_value: null,
            max_value: null,
          }) as unknown as Record<string, unknown>,
          validators: [],
        },
      ],
    };

    const { result } = renderHook(() => useGeneratedValidators(contract));
    const validate = result.current.formValidator;

    expect(validate({ inventoryCount: 5 })).toBeUndefined();
  });

  it("uses Django MinValue/MaxValue validators when constraints are absent", () => {
    const contract: ModelFormContract = {
      ...sampleModelFormContract,
      fields: [
        {
          ...sampleModelFormContract.fields[0],
          name: "inventoryCount",
          path: "inventory_count",
          fieldName: "inventory_count",
          label: "Quantite en stock",
          kind: "NUMBER",
          required: false,
          constraints: JSON.stringify({}) as unknown as Record<string, unknown>,
          validators: [
            {
              type: "MinValueValidator",
              params: JSON.stringify({ limit_value: 0 }) as unknown as Record<
                string,
                unknown
              >,
            },
            {
              type: "MaxValueValidator",
              params: JSON.stringify({
                limit_value: 2147483647,
              }) as unknown as Record<string, unknown>,
            },
          ],
        },
      ],
    };

    const { result } = renderHook(() => useGeneratedValidators(contract));
    const validate = result.current.formValidator;

    expect(validate({ inventoryCount: -1 })?.inventoryCount).toMatch(
      /(greater than or equal to|sup[ée]rieur.*[ée]gal).*(0)/i,
    );
    expect(validate({ inventoryCount: 5 })).toBeUndefined();
  });
});
