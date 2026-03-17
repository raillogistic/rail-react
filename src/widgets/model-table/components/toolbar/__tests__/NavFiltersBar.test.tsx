import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { TableProvider, useTable } from "../../../context/TableContext";
import { NavFiltersBar } from "../NavFiltersBar";
import type { ModelTableNavFiltersConfig } from "../../../config/types";

const navFilters: ModelTableNavFiltersConfig = {
  groups: [
    {
      key: "status",
      label: "Status",
      items: [
        { key: "all", label: "All", clear: true },
        { key: "draft", label: "Draft" },
        { key: "validated", label: "Validated", count: 56 },
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
  it("keeps one active item per group and allows clearing with all", async () => {
    const user = userEvent.setup();

    render(
      <TableProvider initialState={{ navFilterSelections: { status: "all" } }}>
        <NavFiltersBar navFilters={navFilters} />
        <SelectionProbe />
      </TableProvider>,
    );

    expect(screen.getByTestId("nav-selection")).toHaveTextContent("all");
    expect(screen.getByRole("radio", { name: "Validated(56)" })).toBeInTheDocument();

    await user.click(screen.getByRole("radio", { name: "Validated(56)" }));
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

    await user.click(screen.getByRole("radio", { name: "Validated(56)" }));
    expect(screen.getByTestId("page")).toHaveTextContent("1");
  });
});
