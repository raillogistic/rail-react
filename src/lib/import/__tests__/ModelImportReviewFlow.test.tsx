import { useState } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ImportReviewGrid } from "../components/ImportReviewGrid";
import { ImportUploadPanel } from "../components/ImportUploadPanel";
import type { ModelImportRow, ModelImportTemplate } from "../types";

const TEMPLATE: ModelImportTemplate = {
  templateId: "test_app/product/template",
  appLabel: "test_app",
  modelName: "Product",
  version: "v1",
  exactVersion: "v1",
  matchingKeyFields: ["id"],
  requiredColumns: [{ name: "name", required: true, dataType: "CharField" }],
  optionalColumns: [{ name: "price", required: false, dataType: "DecimalField" }],
  acceptedFormats: ["CSV", "XLSX"],
  maxRows: 10000,
  maxFileSizeBytes: 25 * 1024 * 1024,
  downloadUrl: "/api/excel/test_app/product/template/",
};

function ReviewHarness({
  onUpload,
  onPatch,
}: {
  onUpload: (file: File, format: "CSV" | "XLSX") => Promise<void>;
  onPatch: (rowNumber: number, nameValue: string) => Promise<void>;
}) {
  const [rows, setRows] = useState<ModelImportRow[]>([
    {
      id: "row-1",
      rowNumber: 2,
      editedValues: { name: "", price: "10.00" },
      normalizedValues: null,
      matchingKey: null,
      action: "CREATE",
      status: "INVALID",
      issueCount: 1,
      updatedAt: new Date().toISOString(),
    },
  ]);

  return (
    <div>
      <ImportUploadPanel template={TEMPLATE} onUpload={onUpload} />
      <ImportReviewGrid
        rows={rows}
        onPatchRows={async (patches) => {
          const patch = patches[0];
          const nameValue = String(patch.editedValues.name ?? "");
          await onPatch(patch.rowNumber, nameValue);
          setRows((previous) =>
            previous.map((row) =>
              row.rowNumber === patch.rowNumber
                ? {
                    ...row,
                    editedValues: { ...row.editedValues, ...patch.editedValues },
                    status: nameValue ? "VALID" : "INVALID",
                    issueCount: nameValue ? 0 : 1,
                  }
                : row,
            ),
          );
        }}
      />
    </div>
  );
}

describe("ModelImport review flow", () => {
  it("uploads a file and supports inline correction/save", async () => {
    const user = userEvent.setup();
    const uploadSpy = vi.fn(async () => undefined);
    const patchSpy = vi.fn(async () => undefined);

    render(<ReviewHarness onUpload={uploadSpy} onPatch={patchSpy} />);

    const fileInput = screen.getByLabelText(/fichier de donnees d'import/i);
    const file = new File(["id,name,price\n,Widget,10"], "import.csv", { type: "text/csv" });
    await user.upload(fileInput, file);

    await user.click(screen.getByRole("button", { name: /televerser et analyser/i }));
    await waitFor(() => {
      expect(uploadSpy).toHaveBeenCalledTimes(1);
    });

    const nameInput = screen.getByLabelText("Ligne 2 name");
    await user.clear(nameInput);
    await user.type(nameInput, "Widget A");
    await user.click(screen.getByRole("button", { name: /enregistrer la ligne/i }));

    await waitFor(() => {
      expect(patchSpy).toHaveBeenCalledWith(2, "Widget A");
      expect(screen.getByText("0")).toBeInTheDocument();
    });
  });
});
