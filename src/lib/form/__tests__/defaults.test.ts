import { describe, expect, it } from "vitest";
import {
  buildDefaultsFromSchema,
  deepMergeDefaults,
  deepEqual,
  getPrimitiveDefaultValue,
  buildDefaultsFromFields,
} from "../hooks/useFormDefaults";
import type { FormSchema, FormFieldConfig } from "../types/schema";

describe("buildDefaultsFromSchema", () => {
  it("returns empty object for empty schema", () => {
    const schema: FormSchema = { sections: [] };
    expect(buildDefaultsFromSchema(schema)).toEqual({});
  });

  it("builds defaults from flat fields", () => {
    const schema: FormSchema = {
      fields: [
        { name: "name", type: "text", label: "Name" },
        { name: "age", type: "number", label: "Age" },
        { name: "active", type: "switch", label: "Active" },
      ],
    };
    expect(buildDefaultsFromSchema(schema)).toEqual({
      name: "",
      age: 0,
      active: false,
    });
  });

  it("builds defaults from sections", () => {
    const schema: FormSchema = {
      sections: [
        {
          id: "basic",
          fields: [
            { name: "title", type: "text", label: "Title" },
            { name: "count", type: "number", label: "Count" },
          ],
        },
        {
          id: "flags",
          fields: [
            { name: "enabled", type: "checkbox", label: "Enabled" },
          ],
        },
      ],
    };
    expect(buildDefaultsFromSchema(schema)).toEqual({
      title: "",
      count: 0,
      enabled: false,
    });
  });

  it("respects explicit defaultValue on fields", () => {
    const schema: FormSchema = {
      fields: [
        {
          name: "status",
          type: "select",
          label: "Status",
          options: [{ label: "Open", value: "open" }],
          defaultValue: "open",
        },
        { name: "score", type: "number", label: "Score", defaultValue: 42 },
      ],
    };
    expect(buildDefaultsFromSchema(schema)).toEqual({
      status: "open",
      score: 42,
    });
  });

  it("handles nested object fields", () => {
    const schema: FormSchema = {
      fields: [
        {
          name: "address",
          type: "object",
          label: "Address",
          fields: [
            { name: "street", type: "text", label: "Street" },
            { name: "zip", type: "text", label: "ZIP" },
          ],
        },
      ],
    };
    expect(buildDefaultsFromSchema(schema)).toEqual({
      address: { street: "", zip: "" },
    });
  });

  it("handles list fields with default empty array", () => {
    const schema: FormSchema = {
      fields: [
        {
          name: "items",
          type: "list",
          label: "Items",
          fields: [{ name: "name", type: "text", label: "Name" }],
        },
      ],
    };
    expect(buildDefaultsFromSchema(schema)).toEqual({ items: [] });
  });

  it("handles custom field with default empty string", () => {
    const schema: FormSchema = {
      fields: [
        {
          name: "custom",
          type: "custom",
          label: "Custom",
          render: () => null,
        },
      ],
    };
    expect(buildDefaultsFromSchema(schema)).toEqual({ custom: "" });
  });
});

describe("buildDefaultsFromFields", () => {
  it("builds defaults for a field array", () => {
    const fields: FormFieldConfig[] = [
      { name: "a", type: "text", label: "A" },
      { name: "b", type: "number", label: "B" },
    ];
    expect(buildDefaultsFromFields(fields)).toEqual({ a: "", b: 0 });
  });
});

describe("getPrimitiveDefaultValue", () => {
  it("returns 0 for number types", () => {
    expect(getPrimitiveDefaultValue("number")).toBe(0);
    expect(getPrimitiveDefaultValue("decimal")).toBe(0);
    expect(getPrimitiveDefaultValue("slider")).toBe(0);
    expect(getPrimitiveDefaultValue("range")).toBe(0);
  });

  it("returns empty string for text types", () => {
    expect(getPrimitiveDefaultValue("text")).toBe("");
    expect(getPrimitiveDefaultValue("email")).toBe("");
    expect(getPrimitiveDefaultValue("select")).toBe("");
    expect(getPrimitiveDefaultValue("radio")).toBe("");
  });

  it("returns false for boolean types", () => {
    expect(getPrimitiveDefaultValue("checkbox")).toBe(false);
    expect(getPrimitiveDefaultValue("switch")).toBe(false);
  });

  it("returns empty array for select-query", () => {
    expect(getPrimitiveDefaultValue("select-query")).toEqual([]);
  });

  it("returns null for file", () => {
    expect(getPrimitiveDefaultValue("file")).toBeNull();
  });
});

describe("deepMergeDefaults", () => {
  it("merges flat objects", () => {
    expect(deepMergeDefaults({ a: 1 }, { b: 2 })).toEqual({ a: 1, b: 2 });
  });

  it("later sources override earlier", () => {
    expect(deepMergeDefaults({ a: 1 }, { a: 2 })).toEqual({ a: 2 });
  });

  it("deeply merges nested objects", () => {
    expect(
      deepMergeDefaults(
        { addr: { street: "A", city: "B" } },
        { addr: { city: "C" } },
      ),
    ).toEqual({ addr: { street: "A", city: "C" } });
  });

  it("arrays replace entirely (no merge)", () => {
    expect(
      deepMergeDefaults({ tags: [1, 2] }, { tags: [3] }),
    ).toEqual({ tags: [3] });
  });

  it("handles three sources", () => {
    expect(
      deepMergeDefaults({ a: 1 }, { b: 2 }, { a: 3, c: 4 }),
    ).toEqual({ a: 3, b: 2, c: 4 });
  });

  it("skips null/undefined sources", () => {
    expect(deepMergeDefaults({ a: 1 }, null as any)).toEqual({ a: 1 });
  });
});

describe("deepEqual", () => {
  it("primitives", () => {
    expect(deepEqual(1, 1)).toBe(true);
    expect(deepEqual(1, 2)).toBe(false);
    expect(deepEqual("a", "a")).toBe(true);
    expect(deepEqual("a", "b")).toBe(false);
    expect(deepEqual(null, null)).toBe(true);
    expect(deepEqual(null, undefined)).toBe(false);
  });

  it("arrays", () => {
    expect(deepEqual([1, 2], [1, 2])).toBe(true);
    expect(deepEqual([1, 2], [1, 3])).toBe(false);
    expect(deepEqual([1], [1, 2])).toBe(false);
  });

  it("objects", () => {
    expect(deepEqual({ a: 1 }, { a: 1 })).toBe(true);
    expect(deepEqual({ a: 1 }, { a: 2 })).toBe(false);
    expect(deepEqual({ a: 1 }, { a: 1, b: 2 })).toBe(false);
  });

  it("nested structures", () => {
    expect(
      deepEqual(
        { a: { b: [1, 2] } },
        { a: { b: [1, 2] } },
      ),
    ).toBe(true);
    expect(
      deepEqual(
        { a: { b: [1, 2] } },
        { a: { b: [1, 3] } },
      ),
    ).toBe(false);
  });
});
