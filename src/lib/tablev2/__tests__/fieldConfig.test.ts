import { describe, expect, it } from "vitest";
import {
  isAccessorExcluded,
  normalizeBaseModelTableFieldsInput,
} from "../utils";

describe("tablev2 field config helpers", () => {
  it("normalizes legacy array syntax", () => {
    const result = normalizeBaseModelTableFieldsInput(["name", "email"]);
    expect(result.display).toEqual(["name", "email"]);
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
    expect(result.display).toEqual(["name"]);
    expect(result.exclude).toEqual(["password"]);
    expect(result.render).toBe(render);
  });

  it("matches excluded roots for dot and dunder accessors", () => {
    const excluded = new Set(["customer"]);
    expect(isAccessorExcluded("customer.name", excluded)).toBe(true);
    expect(isAccessorExcluded("customer__name", excluded)).toBe(true);
    expect(isAccessorExcluded("status", excluded)).toBe(false);
  });
});
