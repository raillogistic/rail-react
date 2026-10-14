/** Verifies the export dialog field-selection defaults. */
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ModelTableExportDialog } from "../components/ExportDialog";

const { metadataState, tableState } = vi.hoisted(() => ({
  metadataState: {
    actionBootstrapLoading: false,
    metadata: {
      app: "catalog",
      model: "Product",
      verboseNamePlural: "Products",
      fields: [{ name: "name", fieldName: "name", verboseName: "Name" }],
      permissions: { canExport: true },
    },
  },
  tableState: {
    columnOrder: ["name"],
    columnVisibility: {},
    filterVariables: {},
    groupingField: null,
  },
}));

vi.mock("../context/MetadataContext", () => ({ useMetadata: () => metadataState }));
vi.mock("../context/TableContext", () => ({ useTable: () => tableState }));

vi.mock("../components/ExportFieldTree", () => ({
  ExportFieldTree: () => null,
  isReadableField: () => true,
}));

describe("ModelTableExportDialog", () => {
  it("opens with all export fields unselected", async () => {
    render(<ModelTableExportDialog />);

    fireEvent.click(screen.getByRole("button", { name: /Exporter/ }));

    expect(
      await screen.findByRole("button", { name: /G.n.rer/ }),
    ).toBeDisabled();
  });
});
