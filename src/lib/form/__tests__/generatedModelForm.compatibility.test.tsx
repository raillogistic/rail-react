import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { useGeneratedModelForm } from "../hooks/useGeneratedModelForm";
import type { FormSchema } from "../types/schema";
import { sampleModelFormContract } from "./fixtures/modelFormContract";

describe("generated-form compatibility fallback", () => {
  it("uses legacy schema when generated opt-in is disabled", () => {
    const legacySchema: FormSchema<Record<string, any>> = {
      fields: [{ name: "legacyName", type: "text", label: "Legacy Name" }],
    };

    const { result } = renderHook(() =>
      useGeneratedModelForm({
        generatedEnabled: false,
        contract: sampleModelFormContract,
        legacySchema,
      }),
    );

    expect(result.current.usingGenerated).toBe(false);
    expect(result.current.schema.fields?.[0]?.name).toBe("legacyName");
  });
});
