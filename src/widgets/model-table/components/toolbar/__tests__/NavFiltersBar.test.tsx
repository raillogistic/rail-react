import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TableProvider, useTable } from "../../../context/TableContext";
import { NavFiltersBar } from "../NavFiltersBar";
import type { ModelTableNavFiltersConfig } from "../../../config/types";

const mockUseModelPageQuery = vi.fn();

vi.mock("@/shared/api/graphql/graphql", () => ({
  useModelPageQuery: (...args: unknown[]) => mockUseModelPageQuery(...args),
}));

vi.mock("../../../context/MetadataContext", () => ({
  useMetadata: () => ({
    app: "operations",
    model: "Decharge",
    metadata: {
      filterConfig: { supportsQuick: true },
    },
  }),
}));

const navFilters: ModelTableNavFiltersConfig = {
  count: true,
  groups: [
    {
      key: "status",
      label: "Status",
      items: [
        { key: "all", label: "All", clear: true },
        {
          key: "draft",
          label: "Draft",
          variables: { where: { statut: { eq: "draft" } } },
        },
        {
          key: "validated",
          label: "Validated",
          variables: { where: { statut: { eq: "validated" } } },
        },
      ],
    },
  ],
};

function SelectionProbe() {
  const { navFilterSelections } = useTable();
  return (
    <div data-testid="nav-selection">
      {navFilterSelections.status ?? "none"}
    </div>
  );
}

describe("NavFiltersBar", () => {
  beforeEach(() => {
    mockUseModelPageQuery.mockImplementation(
      (input: {
        variables?: {
          where?: { statut?: { eq?: string } };
        };
      }) => {
        const status = input.variables?.where?.statut?.eq;
        const totalCount =
          status === "draft"
            ? 12
            : status === "validated"
              ? 56
              : 120;
        return {
          data: {
            pageInfo: {
              totalCount,
            },
          },
        };
      },
    );
  });

  it("keeps one active item per group and allows clearing with all", async () => {
    const user = userEvent.setup();

    render(
      <TableProvider initialState={{ navFilterSelections: { status: "all" } }}>
        <NavFiltersBar navFilters={navFilters} />
        <SelectionProbe />
      </TableProvider>,
    );

    expect(screen.getByTestId("nav-selection")).toHaveTextContent("all");
    expect(screen.getByRole("radio", { name: "Validated" })).toHaveTextContent(
      "Validated(56)",
    );
    expect(mockUseModelPageQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        selectionOptions: {
          selection: "id",
        },
      }),
    );

    await user.click(screen.getByRole("radio", { name: "Validated" }));
    expect(screen.getByTestId("nav-selection")).toHaveTextContent("validated");

    await user.click(screen.getByRole("radio", { name: "Draft" }));
    expect(screen.getByTestId("nav-selection")).toHaveTextContent("draft");

    await user.click(screen.getByRole("radio", { name: "All" }));
    expect(screen.getByTestId("nav-selection")).toHaveTextContent("all");
  });

  it("resets pagination to the first page when selection changes", async () => {
    const user = userEvent.setup();

    function PaginationProbe() {
      const { pagination, setPage } = useTable();

      return (
        <>
          <button type="button" onClick={() => setPage(3)}>
            set-page
          </button>
          <div data-testid="page">{pagination.page}</div>
        </>
      );
    }

    render(
      <TableProvider initialState={{ navFilterSelections: { status: "all" } }}>
        <NavFiltersBar navFilters={navFilters} />
        <PaginationProbe />
      </TableProvider>,
    );

    await user.click(screen.getByRole("button", { name: "set-page" }));
    expect(screen.getByTestId("page")).toHaveTextContent("3");

    await user.click(screen.getByRole("radio", { name: "Validated" }));
    expect(screen.getByTestId("page")).toHaveTextContent("1");
  });
});
