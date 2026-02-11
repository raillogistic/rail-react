import { describe, expect, it } from "vitest";
import { normalizeFieldOrder } from "../inputs/fieldOrder";
import type { FormFieldConfig } from "../types/schema";

describe("normalizeFieldOrder", () => {
  it("returns fields unchanged when no order hints", () => {
    const fields: FormFieldConfig[] = [
      { name: "a", type: "text", label: "A" },
      { name: "b", type: "text", label: "B" },
    ];
    const result = normalizeFieldOrder(fields);
    expect(result.map((f) => f.name)).toEqual(["a", "b"]);
  });

  it("sorts fields by order hint", () => {
    const fields: FormFieldConfig[] = [
      { name: "b", type: "text", label: "B", order: 2 },
      { name: "a", type: "text", label: "A", order: 1 },
      { name: "c", type: "text", label: "C", order: 0 },
    ];
    const result = normalizeFieldOrder(fields);
    expect(result.map((f) => f.name)).toEqual(["c", "a", "b"]);
  });

  it("stable sorts by name when order is equal", () => {
    const fields: FormFieldConfig[] = [
      { name: "b", type: "text", label: "B", order: 1 },
      { name: "a", type: "text", label: "A", order: 1 },
    ];
    const result = normalizeFieldOrder(fields);
    expect(result.map((f) => f.name)).toEqual(["a", "b"]);
  });

  it("handles nested object field ordering", () => {
    const fields: FormFieldConfig[] = [
      {
        name: "details",
        type: "object",
        label: "Details",
        fields: [
          { name: "z", type: "text", label: "Z", order: 2 },
          { name: "a", type: "text", label: "A", order: 1 },
        ],
      },
    ];
    const result = normalizeFieldOrder(fields);
    const nested = (result[0] as any).fields;
    expect(nested.map((f: any) => f.name)).toEqual(["a", "z"]);
  });

  it("handles empty fields array", () => {
    expect(normalizeFieldOrder([])).toEqual([]);
  });

  it("handles single field", () => {
    const fields: FormFieldConfig[] = [
      { name: "only", type: "text", label: "Only" },
    ];
    const result = normalizeFieldOrder(fields);
    expect(result.map((f) => f.name)).toEqual(["only"]);
  });
});
