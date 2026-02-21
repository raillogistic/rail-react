import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DynamicTable } from "../components/DynamicTable";

describe("DynamicTable behaviors", () => {
  it("emits row selection updates when select-all is toggled", async () => {
    const onRowSelectionChange = vi.fn();
    const user = userEvent.setup();

    render(
      <DynamicTable
        rows={[
          { id: "1", name: "Ada" },
          { id: "2", name: "Grace" },
        ]}
        columns={[
          {
            id: "name",
            accessorKey: "name",
            title: "Name",
          },
        ]}
        features={{ enableSelection: true }}
        onRowSelectionChange={onRowSelectionChange}
      />,
    );

    await user.click(screen.getByLabelText("Select all rows"));

    expect(onRowSelectionChange).toHaveBeenCalledWith({
      "1": true,
      "2": true,
    });
  });

  it("emits orderBy updates from header sort menu actions", async () => {
    const onOrderByChange = vi.fn();
    const user = userEvent.setup();

    render(
      <DynamicTable
        rows={[
          { id: "1", name: "Ada" },
          { id: "2", name: "Grace" },
        ]}
        columns={[
          {
            id: "name",
            accessorKey: "name",
            title: "Name",
          },
        ]}
        onOrderByChange={onOrderByChange}
      />,
    );

    await user.click(screen.getByLabelText("Open column menu for Name"));
    await user.click(screen.getByText("Sort ascending"));

    expect(onOrderByChange).toHaveBeenCalledWith(["name"]);
  });
});

