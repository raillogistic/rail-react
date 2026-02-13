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
    expect(validate({ name: "" })?.name).toContain("required");
    expect(validate({ name: "hello" })?.name).toContain("at most 4");
    expect(validate({ name: "bad" })?.name).toContain("Forbidden");
    expect(validate({ name: "ok" })).toBeUndefined();
  });
});
