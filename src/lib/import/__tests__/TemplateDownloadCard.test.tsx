import { render, screen } from "@testing-library/react";
import { TemplateDownloadCard } from "../components/TemplateDownloadCard";
import type { ModelImportTemplate } from "../types";

const TEMPLATE: ModelImportTemplate = {
  templateId: "test_app/product/template",
  appLabel: "test_app",
  modelName: "Product",
  version: "v1",
  exactVersion: "v1",
  matchingKeyFields: ["id"],
  requiredColumns: [
    { name: "name", required: true, dataType: "CharField" },
    { name: "price", required: true, dataType: "DecimalField" },
  ],
  optionalColumns: [{ name: "inventory_count", required: false, dataType: "IntegerField" }],
  acceptedFormats: ["CSV", "XLSX"],
  maxRows: 10000,
  maxFileSizeBytes: 25 * 1024 * 1024,
  downloadUrl: "/api/excel/test_app/product/template/",
};

describe("TemplateDownloadCard", () => {
  it("renders template metadata and download link", () => {
    render(<TemplateDownloadCard template={TEMPLATE} />);

    expect(screen.getByText("Modele d'import")).toBeInTheDocument();
    expect(screen.getByText(/version/i)).toBeInTheDocument();
    expect(screen.getByText("name, price")).toBeInTheDocument();
    expect(screen.getByText("id")).toBeInTheDocument();

    expect(screen.getByRole("button", { name: /telecharger csv/i })).toBeInTheDocument();
  });
});
