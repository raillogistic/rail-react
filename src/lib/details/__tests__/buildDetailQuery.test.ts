import { describe, expect, it } from "vitest";

import { buildDetailQuery } from "../v2/utils/buildDetailQuery";

describe("buildDetailQuery", () => {
  it("uses canonical <modelname>(id: ID!) query root", () => {
    const query = buildDetailQuery({
      modelName: "Product",
      fields: ["name", "price"],
    });
    const source = query.loc?.source.body ?? "";

    expect(source).toContain("record: product(id: $id)");
    expect(source).toContain("query ProductDetail($id: ID!)");
  });

  it("always includes id and filters invalid field names", () => {
    const query = buildDetailQuery({
      modelName: "Product",
      fields: ["name", "price", "__bad field__", "value }"],
    });
    const source = query.loc?.source.body ?? "";

    expect(source).toContain("id");
    expect(source).toContain("name");
    expect(source).toContain("price");
    expect(source).not.toContain("__bad field__");
    expect(source).not.toContain("value }");
  });

  it("builds nested relation selections using desc fields", () => {
    const query = buildDetailQuery({
      modelName: "Product",
      fields: ["name", "category"],
      relationSelections: {
        category: ["desc"],
      },
    });
    const source = query.loc?.source.body ?? "";

    expect(source).toContain("category {");
    expect(source).toContain("desc");
  });

  it("supports dotted field paths as nested selections", () => {
    const query = buildDetailQuery({
      modelName: "Product",
      fields: ["name", "category.desc"],
    });
    const source = query.loc?.source.body ?? "";

    expect(source).toContain("category {");
    expect(source).toContain("desc");
  });
});
