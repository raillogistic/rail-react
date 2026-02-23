import { render, screen } from "@testing-library/react";
import { ImportIssuesPanel } from "../components/ImportIssuesPanel";
import { ImportReviewGrid } from "../components/ImportReviewGrid";
import { ImportUploadPanel } from "../components/ImportUploadPanel";
import type { ModelImportTemplate } from "../types";

const TEMPLATE: ModelImportTemplate = {
  templateId: "test_app/product/template",
  appLabel: "test_app",
  modelName: "Product",
  version: "v1",
  exactVersion: "v1",
  matchingKeyFields: ["id"],
  requiredColumns: [{ name: "name", required: true, dataType: "CharField" }],
  optionalColumns: [],
  acceptedFormats: ["CSV", "XLSX"],
  maxRows: 10000,
  maxFileSizeBytes: 25 * 1024 * 1024,
  downloadUrl: "/api/excel/test_app/product/template/",
};

describe("ModelImport accessibility and error states", () => {
  it("exposes labeled controls and readable issue errors", () => {
    render(
      <div>
        <ImportUploadPanel template={TEMPLATE} onUpload={async () => undefined} />
        <ImportReviewGrid
          rows={[
            {
              id: "row-1",
              rowNumber: 3,
              editedValues: JSON.stringify({ name: "" }) as unknown as Record<string, unknown>,
              normalizedValues: null,
              matchingKey: null,
              action: "CREATE",
              status: "INVALID",
              issueCount: 1,
              updatedAt: new Date().toISOString(),
            },
          ]}
          onPatchRows={async () => undefined}
        />
        <ImportIssuesPanel
          issues={[
            {
              id: "issue-1",
              rowNumber: 3,
              fieldPath: "name",
              code: "MISSING_REQUIRED_COLUMN",
              severity: "ERROR",
              message: "Field 'name' is required.",
              stage: "PARSE",
            },
          ]}
        />
      </div>,
    );

    expect(screen.getByLabelText(/fichier de donnees d'import/i)).toBeInTheDocument();
    expect(screen.getByLabelText("Ligne 3 name")).toBeInTheDocument();
    expect(screen.getByLabelText(/filtrer les problemes/i)).toBeInTheDocument();
    expect(screen.getByText("MISSING_REQUIRED_COLUMN")).toBeInTheDocument();
  });

  it("renders template-provided columns even when row payload misses a key", () => {
    render(
      <ImportReviewGrid
        rows={[
          {
            id: "row-2",
            rowNumber: 4,
            editedValues: { name: "Widget" },
            normalizedValues: null,
            matchingKey: null,
            action: "CREATE",
            status: "VALID",
            issueCount: 0,
            updatedAt: new Date().toISOString(),
          },
        ]}
        templateColumns={["sku", "name"]}
        onPatchRows={async () => undefined}
      />,
    );

    expect(screen.getByLabelText("Ligne 4 sku")).toBeInTheDocument();
    expect(screen.getByLabelText("Ligne 4 name")).toBeInTheDocument();
  });
});
