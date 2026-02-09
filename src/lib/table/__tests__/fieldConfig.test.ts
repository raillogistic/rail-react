import { describe, expect, it } from "vitest";
import {
  isAccessorExcluded,
  mergeBaseModelTableFields,
  normalizeBaseModelTableFieldsInput,
} from "../utils";

describe("table field config helpers", () => {
  it("normalizes legacy array syntax", () => {
    const result = normalizeBaseModelTableFieldsInput(["name", "email"]);
    expect(result.include).toEqual(["name", "email"]);
    expect(result.exclude).toEqual([]);
    expect(result.render).toEqual({});
  });

  it("supports object helper syntax", () => {
    const render = {
      name: () => "ok",
    };
    const result = normalizeBaseModelTableFieldsInput({
      include: ["name"],
      exclude: [" password ", ""],
      render,
    });
    expect(result.include).toEqual(["name"]);
    expect(result.add).toEqual([]);
    expect(result.exclude).toEqual(["password"]);
    expect(result.render).toBe(render);
  });

  it("normalizes add fields", () => {
    const result = normalizeBaseModelTableFieldsInput({
      add: [
        { accessor: " status " },
        { accessor: "", title: "x" },
      ],
    });
    expect(result.add).toEqual([{ accessor: "status" }]);
  });

  it("matches excluded roots for dot and dunder accessors", () => {
    const excluded = new Set(["customer"]);
    expect(isAccessorExcluded("customer.name", excluded)).toBe(true);
    expect(isAccessorExcluded("customer__name", excluded)).toBe(true);
    expect(isAccessorExcluded("status", excluded)).toBe(false);
  });

  it("merges add fields into defaults using explicit ordering", () => {
    const fields = mergeBaseModelTableFields({
      defaults: ["name", "email"],
      add: [
        { accessor: "status", order: 1 },
        { accessor: "notes", order: { after: "email" } },
        { accessor: "id", order: { before: "name" } },
      ],
    });
    const accessors = fields.map((entry) =>
      typeof entry === "string" ? entry : entry.accessor,
    );
    expect(accessors).toEqual(["id", "name", "status", "email", "notes"]);
  });

  it("updates title for existing accessor via add", () => {
    const fields = mergeBaseModelTableFields({
      include: ["status"],
      defaults: [],
      add: [{ accessor: "status", title: "Etat" }],
    });
    expect(fields).toEqual([{ accessor: "status", title: "Etat" }]);
  });
});
