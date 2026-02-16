import { describe, expect, it } from "vitest";

import {
  normalizeFieldDescriptor,
  normalizeFieldDescriptors,
} from "../v2/metadata/normalizeFieldDescriptor";

describe("field descriptor normalization", () => {
  it("normalizes string descriptors to descriptor objects", () => {
    expect(normalizeFieldDescriptor("name")).toEqual({
      name: "name",
      title: null,
      type: null,
      include: null,
      exclude: null,
      nested: null,
      formatterKey: null,
      permissionKey: null,
    });
  });

  it("normalizes object descriptors and drops invalid entries", () => {
    const descriptors = normalizeFieldDescriptors([
      "name",
      {
        name: "price",
        title: "Cost",
        type: "DecimalField",
        include: true,
        exclude: false,
      },
      {
        name: "",
      },
    ]);

    expect(descriptors).toHaveLength(2);
    expect(descriptors[1]).toMatchObject({
      name: "price",
      title: "Cost",
      type: "DecimalField",
      include: true,
      exclude: false,
    });
  });
});
