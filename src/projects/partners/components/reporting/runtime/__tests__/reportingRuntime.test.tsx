/** Unit tests for reporting payload rendering and filter controls. */

import { fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
vi.mock("recharts", async () => {
  const actual = await vi.importActual<typeof import("recharts")>("recharts");
  return {
    ...actual,
    ResponsiveContainer: ({ children }: { children: ReactNode }) => <div>{children}</div>,
    PieChart: ({ children }: { children: ReactNode }) => <svg>{children}</svg>,
    Pie: ({ children }: { children: ReactNode }) => <g>{children}</g>,
    Cell: () => null,
    Tooltip: () => null,
  };
});
vi.mock("@/widgets/model-form/inputs/query", () => ({
  default: ({
    config,
    field,
  }: {
    config: { name: string };
    field: { handleChange: (value: number) => void };
  }) => (
    <button type="button" onClick={() => field.handleChange(42)}>
      query-{config.name}
    </button>
  ),
}));

import { ReportingFilterBar } from "../ReportingFilterBar";
import { ReportingChartFactory } from "../ReportingChartFactory";
import { ReportingKpi } from "../ReportingKpi";
import { ReportingRecordsTable } from "../ReportingRecordsTable";
import { ReportingWidget } from "../ReportingWidget";
import type { ReportingReportBlock } from "../types";

const block = (overrides: Partial<ReportingReportBlock>): ReportingReportBlock => ({
  block_id: "1",
  layout: { w: 12 },
  visualization: {
    id: "1",
    code: "test",
    title: "Montant total",
    kind: "kpi",
    config: { metric: "amount", format: "currency" },
  },
  dataset: {
    mode: "aggregate",
    rows: [{ amount: 150.5 }],
    columns: [{ name: "amount", kind: "metric" }],
  },
  ...overrides,
});

describe("reporting runtime", () => {
  it("renders the singleton KPI metric with currency formatting", () => {
    render(
      <ReportingKpi
        block={block({
          visualization: {
            id: "1",
            code: "test",
            title: "Montant total",
            description: "Engagements du perimetre actif",
            kind: "kpi",
            config: { metric: "amount", format: "currency" },
          },
        })}
      />,
    );

    expect(screen.getByText(/150,50/)).toBeInTheDocument();
    expect(screen.getByText(/150,50/)).toHaveTextContent("DA");
    expect(screen.getByText("Engagements du perimetre actif")).toBeInTheDocument();
  });

  it("uses column formats and distinguishes missing KPI data from zero", () => {
    const { rerender } = render(
      <ReportingKpi
        block={block({
          visualization: {
            id: "rate",
            code: "rate",
            title: "Taux",
            kind: "kpi",
            config: { metric: "rate" },
          },
          dataset: {
            mode: "aggregate",
            rows: [{ rate: 0.125 }],
            columns: [{ name: "rate", kind: "metric", format: "percent" }],
          },
        })}
      />,
    );

    expect(screen.getByText("12,5 %")).toBeInTheDocument();

    rerender(
      <ReportingKpi
        block={block({
          visualization: {
            id: "days",
            code: "days",
            title: "Delai",
            kind: "kpi",
            config: { metric: "days", format: "days" },
          },
          dataset: {
            mode: "aggregate",
            rows: [{ days: 4.5 }],
            columns: [{ name: "days", kind: "metric" }],
          },
        })}
      />,
    );

    expect(screen.getByText("4,5 j")).toBeInTheDocument();

    rerender(
      <ReportingKpi
        block={block({
          visualization: {
            id: "missing",
            code: "missing",
            title: "Delai",
            kind: "kpi",
            config: { metric: "days", format: "days" },
          },
          dataset: {
            mode: "aggregate",
            rows: [{}],
            columns: [{ name: "days", kind: "metric" }],
          },
        })}
      />,
    );

    expect(screen.getByText("—")).toBeInTheDocument();
    expect(screen.queryByText("0 j")).not.toBeInTheDocument();
  });

  it("renders a gauge from its metric and configured target", () => {
    render(
      <ReportingChartFactory
        block={block({
          visualization: {
            id: "gauge",
            code: "urgent",
            title: "Urgentes",
            kind: "gauge",
            config: { metric: "urgent_count", target: 20 },
          },
          dataset: {
            mode: "aggregate",
            rows: [{ urgent_count: 7 }],
            columns: [{ name: "urgent_count", kind: "metric" }],
          },
        })}
      />,
    );

    expect(screen.getByText("7")).toBeInTheDocument();
    expect(screen.getByText("Objectif: 20")).toBeInTheDocument();
  });

  it("renders only explicitly configured table columns", () => {
    render(
      <ReportingRecordsTable
        block={block({
          visualization: {
            id: "2",
            code: "table",
            title: "Details",
            kind: "table",
            config: {
              columns: [{ field: "reference", label: "Reference" }],
            },
          },
          dataset: {
            mode: "records",
            rows: [{ reference: "BC-001", hidden: "secret" }],
          },
        })}
      />,
    );

    expect(screen.getByText("BC-001")).toBeInTheDocument();
    expect(screen.queryByText("secret")).not.toBeInTheDocument();
  });

  it("warns when the dataset contains more rows than the rendered page", () => {
    render(
      <ReportingWidget
        block={block({
          visualization: {
            id: "2",
            code: "table",
            title: "Details",
            kind: "table",
            config: {
              columns: [{ field: "reference", label: "Reference" }],
            },
          },
          dataset: {
            mode: "records",
            rows: [{ reference: "BC-001" }],
            returned_count: 1,
            has_more: true,
          },
        })}
      />,
    );

    expect(screen.getByRole("status")).toHaveTextContent(
      "Affichage limité aux 1 premiers résultats.",
    );
  });

  it("applies native select and date filter values", () => {
    const onFiltersChange = vi.fn();
    render(
      <ReportingFilterBar
        filters={{}}
        onFiltersChange={onFiltersChange}
        availableFilters={[
          {
            name: "status",
            field: "status",
            lookup: "exact",
            label: "Statut",
            type: "select",
            options: [{ value: "approved", label: "Approuve" }],
          },
          {
            name: "date_from",
            field: "created_at",
            lookup: "gte",
            label: "Date de debut",
            type: "date",
          },
        ]}
      />,
    );

    fireEvent.change(screen.getByLabelText("Statut"), {
      target: { value: "approved" },
    });
    fireEvent.change(screen.getByLabelText("Date de debut"), {
      target: { value: "2026-06-01" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Appliquer" }));

    expect(onFiltersChange).toHaveBeenCalledWith({
      status: "approved",
      date_from: "2026-06-01",
    });
  });

  it("uses query selectors for foreign-key filters", () => {
    const onFiltersChange = vi.fn();
    render(
      <ReportingFilterBar
        filters={{}}
        onFiltersChange={onFiltersChange}
        availableFilters={[
          {
            name: "department",
            field: "department_id",
            lookup: "exact",
            label: "Departement",
            type: "query",
            relatedModel: "organization.Department",
            graphql: {
              listFieldName: "departmentList",
              labelField: "name",
            },
          },
        ]}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "query-department" }));
    fireEvent.click(screen.getByRole("button", { name: "Appliquer" }));

    expect(onFiltersChange).toHaveBeenCalledWith({
      department: 42,
    });
  });
});
