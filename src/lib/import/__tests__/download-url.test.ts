import {
  buildModelImportTemplateDownloadUrl,
  resolveModelImportTemplateDownloadUrl,
} from "../download-url";

describe("import download url helpers", () => {
  it("builds v1 import template endpoint", () => {
    const url = buildModelImportTemplateDownloadUrl("store", "Product");
    expect(url).toContain("/api/v1/import/templates/store/product/?format=csv");
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

  it("overrides format when backend url already targets import template endpoint", () => {
    const url = resolveModelImportTemplateDownloadUrl({
      appLabel: "store",
      modelName: "Product",
      downloadUrl: "/api/v1/import/templates/store/product/?format=csv",
      format: "xlsx",
    });
    expect(url).toContain("/api/v1/import/templates/store/product/?format=xlsx");
  });
});
