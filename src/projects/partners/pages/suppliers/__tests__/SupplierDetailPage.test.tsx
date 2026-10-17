/** Verify category spending summaries and the supplier's closed-order filter. */
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { SupplierDetailPage } from "../SupplierDetailPage";
import { PartnerRoutesContext } from "../../../routeSelection";

const { useQuery, tableMock, getAllRoutes } = vi.hoisted(() => ({
  useQuery: vi.fn(),
  getAllRoutes: vi.fn(() => [{ id: "achat:purchase-orders:detail", path: "/achat/bons-de-commande/:id" }]),
  tableMock: vi.fn((_props: unknown) => { void _props; return <div>Closed order history</div>; }),
}));

vi.mock("@/widgets/model-table", () => ({ DynamicModelTable: tableMock }));
vi.mock("@/app/router/manifestRegistry", () => ({ getAllRoutes }));

vi.mock("@apollo/client", async () => {
  const actual = await vi.importActual<typeof import("@apollo/client")>(
    "@apollo/client",
  );
  return {
    ...actual,
    useQuery,
  };
});

vi.mock("../../../components/SupplierAttachmentListSection", () => ({
  SupplierAttachmentListSection: () => <div data-testid="supplier-attachments" />,
}));

describe("SupplierDetailPage", () => {
  beforeEach(() => {
    useQuery.mockReset();
    tableMock.mockClear();
    getAllRoutes.mockReturnValue([{ id: "achat:purchase-orders:detail", path: "/achat/bons-de-commande/:id" }]);
  });

  it("renders spending cockpit data based on closed purchase orders", () => {
    useQuery.mockReturnValue({
      data: {
        supplier: {
          id: "sup-1",
          name: "ABC SARL",
          isActive: true,
          isSupplier: true,
          annualClosedSpending: "300.00",
          annualClosedOrderCount: 1,
          annualLimitTotal: "1000.00",
          annualRemainingAmount: "700.00",
          annualProgressPercent: 30,
          annualLimitExceeded: false,
          annualSpendingYear: 2026,
          categorySpendingSummaries: [{ categoryId: "cat-1", categoryName: "Fournitures",
            annualLimit: "1000.00", approvedSpending: "300.00", remainingAmount: "700.00",
            progressPercent: 30, limitExceeded: false }],
          approvedFromBatch: {
            id: "batch-1",
            name: "Liste juin",
            status: "approved",
          },
          lots: [{ id: "lot-1", code: "L12", name: "Transport" }],
          contacts: [],
        },
        purchaseOrderList: [
          {
            id: "bc-1",
            orderNumber: "BC-2026-0001",
            draftReference: "BC-BR-1",
            title: "Commande close",
            closedAt: "2026-06-18T10:00:00Z",
            totalHt: "300.00",
            status: "closed",
          },
        ],
      },
      loading: false,
      error: undefined,
    });

    render(
      <MemoryRouter initialEntries={["/achat/administration/fournisseurs/sup-1"]}>
        <Routes>
          <Route
            path="/achat/administration/fournisseurs/:id"
            element={<SupplierDetailPage />}
          />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText(/pilotage des plafonds/i)).toBeInTheDocument();
    expect(screen.getByText("ABC SARL")).toBeInTheDocument();
    expect(screen.getByText("Lots d'activité")).toBeInTheDocument();
    expect(screen.getByText("L12 — Transport")).toBeInTheDocument();
    expect(screen.getAllByText(/700,00/).length).toBeGreaterThan(0);
    fireEvent.mouseDown(screen.getByRole("tab", { name: "Historique BC clôturés" }), { button: 0, ctrlKey: false });
    expect(tableMock.mock.calls[0]?.[0]).toEqual(expect.objectContaining({
      app: "purchasing", model: "PurchaseOrder",
      initVariables: { where: { supplier: { eq: "sup-1" }, status: { eq: "closed" } } },
      baseTable: { fields: expect.any(Array) },
      detail: { type: "link", hrefTemplate: "/achat/bons-de-commande/:id" },
    }));
  });

  it("hides links to excluded intake pages and absent host purchase-order pages", () => {
    getAllRoutes.mockReturnValue([]);
    useQuery.mockReturnValue({ data: { supplier: {
      id: "sup-1", name: "ABC", contacts: [], lots: [], categorySpendingSummaries: [],
      approvedFromBatch: { id: "batch-1", name: "Liste juin", status: "approved" },
    } }, loading: false });
    render(<MemoryRouter initialEntries={["/fournisseurs/sup-1"]}>
      <Routes><Route path="/fournisseurs/:id" element={
        <PartnerRoutesContext.Provider value={{ isRouteEnabled: () => false }}>
          <SupplierDetailPage />
        </PartnerRoutesContext.Provider>
      } /></Routes>
    </MemoryRouter>);
    expect(screen.queryByRole("link", { name: "Ouvrir la liste d'insertion" })).not.toBeInTheDocument();
    fireEvent.mouseDown(screen.getByRole("tab", { name: "Historique BC clôturés" }), { button: 0, ctrlKey: false });
    expect(tableMock.mock.calls[0]?.[0]).toEqual(expect.objectContaining({ detail: undefined }));
  });
});
