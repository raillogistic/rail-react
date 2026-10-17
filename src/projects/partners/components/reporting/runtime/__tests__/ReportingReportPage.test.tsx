/** Unit tests for fixed-code reporting dashboard routes. */

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ReportingReportPage } from "../ReportingReportPage";

const mockUseReportingReport = vi.fn();

vi.mock("react-router-dom", () => ({
  useNavigate: () => vi.fn(),
  useParams: () => ({}),
  useSearchParams: () => [new URLSearchParams(), vi.fn()],
}));

vi.mock("../useReportingReport", () => ({
  useReportingReport: (...args: unknown[]) => mockUseReportingReport(...args),
}));

vi.mock("../ReportingExportMenu", () => ({
  ReportingExportMenu: () => <div>export-menu</div>,
}));

vi.mock("../ReportingFilterBar", () => ({
  ReportingFilterBar: () => <div>filter-bar</div>,
}));

vi.mock("../ReportingGrid", () => ({
  ReportingGrid: () => <div>report-grid</div>,
}));

describe("ReportingReportPage", () => {
  it("uses the explicit report code when the route has no code param", () => {
    mockUseReportingReport.mockReturnValue({
      data: {
        report: {
          code: "achat_bc_overview",
          title: "Dashboard BC",
          description: "Vue BC",
          theme: "light",
        },
        visualizations: [],
        filters: [],
        export_formats: [],
      },
      loading: false,
      error: null,
      filters: {},
      updateFilters: vi.fn(),
      fetchReport: vi.fn(),
    });

    render(<ReportingReportPage reportCode="achat_bc_overview" />);

    expect(mockUseReportingReport).toHaveBeenCalledWith("achat_bc_overview");
    expect(screen.queryByText("Parametre code manquant.")).not.toBeInTheDocument();
    expect(screen.getByText("Dashboard BC")).toBeInTheDocument();
  });

  it("announces a refresh while keeping the current report visible", () => {
    mockUseReportingReport.mockReturnValue({
      data: {
        report: {
          code: "achat_bc_overview",
          title: "Dashboard BC",
          description: "Vue BC",
          theme: "light",
        },
        visualizations: [],
        filters: [],
        export_formats: [],
      },
      loading: true,
      error: null,
      filters: {},
      updateFilters: vi.fn(),
      fetchReport: vi.fn(),
    });

    const { container } = render(
      <ReportingReportPage reportCode="achat_bc_overview" />,
    );

    expect(screen.getByRole("status")).toHaveTextContent(
      "Actualisation des données…",
    );
    expect(container.querySelector('[aria-busy="true"]')).toBeInTheDocument();
    expect(screen.getByText("report-grid")).toBeInTheDocument();
  });
});
