import { describe, expect, it } from "vitest";
import { diffValues } from "../hooks/useFormChangeTracking";

describe("diffValues", () => {
  it("detects no changes for identical objects", () => {
    expect(diffValues({ a: 1 }, { a: 1 })).toEqual([]);
  });

  it("detects primitive value change", () => {
    const diffs = diffValues({ a: 1 }, { a: 2 });
    expect(diffs).toHaveLength(1);
    expect(diffs[0]).toMatchObject({
      name: "a",
      previousValue: 1,
      nextValue: 2,
    });
  });

  it("detects added key", () => {
    const diffs = diffValues({ a: 1 }, { a: 1, b: 2 });
    expect(diffs).toHaveLength(1);
    expect(diffs[0]).toMatchObject({
      name: "b",
      previousValue: undefined,
      nextValue: 2,
    });
  });

  it("detects removed key", () => {
    const diffs = diffValues({ a: 1, b: 2 }, { a: 1 });
    expect(diffs).toHaveLength(1);
    expect(diffs[0]).toMatchObject({
      name: "b",
      previousValue: 2,
      nextValue: undefined,
    });
  });

  it("detects nested object changes", () => {
    const diffs = diffValues(
      { addr: { street: "A", city: "B" } },
      { addr: { street: "A", city: "C" } },
    );
    expect(diffs).toHaveLength(1);
    expect(diffs[0]).toMatchObject({
      name: "addr.city",
      previousValue: "B",
      nextValue: "C",
    });
  });

  it("detects array changes as a whole", () => {
    const diffs = diffValues({ tags: [1, 2] }, { tags: [1, 3] });
    expect(diffs).toHaveLength(1);
    expect(diffs[0]).toMatchObject({
      name: "tags",
      previousValue: [1, 2],
      nextValue: [1, 3],
    });
  });

  it("handles empty to non-empty", () => {
    const diffs = diffValues({}, { name: "test" });
    expect(diffs).toHaveLength(1);
    expect(diffs[0].name).toBe("name");
  });

  it("includes timestamp on each change", () => {
    const before = Date.now();
    const diffs = diffValues({ a: 1 }, { a: 2 });
    expect(diffs[0].timestamp).toBeGreaterThanOrEqual(before);
  });
});
