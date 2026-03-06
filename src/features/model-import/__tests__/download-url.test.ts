import {
  buildModelImportTemplateDownloadUrl,
  resolveModelImportTemplateDownloadUrl,
} from "../download-url";

describe("import download url helpers", () => {
  it("builds v1 import template endpoint", () => {
    const url = buildModelImportTemplateDownloadUrl("store", "Product");
    expect(url).toContain("/api/v1/import/templates/store/product/?format=csv");
  });

  it("builds v1 import template endpoint with selected fields", () => {
    const url = buildModelImportTemplateDownloadUrl("store", "Product", "xlsx", [
      "name",
      "price",
      "price",
    ]);
    expect(url).toContain("/api/v1/import/templates/store/product/?format=xlsx");
    expect(url).toContain("fields=name");
    expect(url).toContain("fields=price");
  });

  it("rewrites legacy excel template endpoint to v1 import endpoint", () => {
    const url = resolveModelImportTemplateDownloadUrl({
      appLabel: "store",
      modelName: "Product",
      downloadUrl: "/api/excel/store/product/template/",
    });
    expect(url).toContain("/api/v1/import/templates/store/product/?format=csv");
  });

  it("rewrites legacy excel template endpoint and keeps selected xlsx format", () => {
    const url = resolveModelImportTemplateDownloadUrl({
      appLabel: "store",
      modelName: "Product",
      downloadUrl: "/api/excel/store/product/template/",
      format: "xlsx",
    });
    expect(url).toContain("/api/v1/import/templates/store/product/?format=xlsx");
  });

  it("rewrites versioned excel template endpoint to v1 import endpoint", () => {
    const url = resolveModelImportTemplateDownloadUrl({
      appLabel: "store",
      modelName: "Product",
      downloadUrl: "/api/v1/excel/store/product/template/",
      format: "xlsx",
    });
    expect(url).toContain("/api/v1/import/templates/store/product/?format=xlsx");
  });

  it("overrides format when backend url already targets import template endpoint", () => {
    const url = resolveModelImportTemplateDownloadUrl({
      appLabel: "store",
      modelName: "Product",
      downloadUrl: "/api/v1/import/templates/store/product/?format=csv",
      format: "xlsx",
    });
    expect(url).toContain("/api/v1/import/templates/store/product/?format=xlsx");
  });

  it("overrides selected fields when backend url already targets import template endpoint", () => {
    const url = resolveModelImportTemplateDownloadUrl({
      appLabel: "store",
      modelName: "Product",
      downloadUrl: "/api/v1/import/templates/store/product/?format=csv&fields=id",
      fields: ["name", "category"],
    });
    expect(url).toContain("/api/v1/import/templates/store/product/?format=csv");
    expect(url).toContain("fields=name");
    expect(url).toContain("fields=category");
    expect(url).not.toContain("fields=id");
  });
});
