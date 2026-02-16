import { describe, expect, it } from "vitest";
import { validateDetailsPageSchema, type DetailsPageSchema } from "../sectionTypes";

describe("details schema validation", () => {
  it("fails when section ids are duplicated", () => {
    const schema: DetailsPageSchema = {
      header: [
        {
          id: "dup",
          kind: "header",
          render: () => null,
        },
      ],
      body: [
        {
          id: "dup",
          kind: "general",
          render: () => null,
        },
      ],
    };

    const result = validateDetailsPageSchema(schema);
    expect(result.valid).toBe(false);
    expect(result.errors.some((error) => error.includes("duplicate section id"))).toBe(true);
  });

  it("passes for a valid schema", () => {
    const schema: DetailsPageSchema = {
      header: [
        {
          id: "header-main",
          kind: "header",
          render: () => null,
        },
      ],
      tabs: [
        {
          id: "tab-main",
          title: "Main",
          sections: [
            {
              id: "section-main",
              kind: "general",
              render: () => null,
            },
          ],
        },
      ],
    };

    const result = validateDetailsPageSchema(schema);
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });
});
