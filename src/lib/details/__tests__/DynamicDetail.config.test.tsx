import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import DynamicDetail from "../v2/components/DynamicDetail";
import type { DetailViewContract } from "../v2/types";

vi.mock("@/lib/form", () => ({
  ModelForm: () => <div data-testid="section-model-form-mock" />,
}));

const CONFIG_CONTRACT: DetailViewContract = {
  appLabel: "test_app",
  modelName: "Product",
  queryRoot: "product",
  identifierArg: "id",
  layoutVersion: "v2",
  defaultIncludeFields: ["id", "name", "price"],
  defaultExcludeFields: [],
  metadataVersion: "fixture-config-v1",
  permissions: {
    modelReadable: true,
    fieldVisibility: {
      id: true,
      name: true,
      price: true,
    },
    relationVisibility: {},
    actionExecutability: {},
    sourceFlags: {
      backend: {
        canUpdate: true,
      },
    },
    policy: "FAIL_CLOSED",
  },
  layoutNodes: [
    {
      id: "overview-tab",
      type: "TAB",
      title: "Overview",
      order: 0,
      relationSourceId: null,
      visibilityRule: null,
      fields: [],
      actions: [],
      children: [
        {
          id: "main-section",
          type: "SECTION",
          title: "Main",
          order: 0,
          relationSourceId: null,
          visibilityRule: null,
          fields: [
            { name: "name", title: "Name", type: "CharField" },
            { name: "price", title: "Price", type: "DecimalField" },
          ],
          children: [],
          actions: [],
        },
      ],
    },
    {
      id: "advanced-tab",
      type: "TAB",
      title: "Advanced",
      order: 1,
      relationSourceId: null,
      visibilityRule: null,
      fields: [],
      actions: [],
      children: [
        {
          id: "advanced-section",
          type: "SECTION",
          title: "Advanced Section",
          order: 0,
          relationSourceId: null,
          visibilityRule: null,
          fields: [{ name: "price", title: "Price", type: "DecimalField" }],
          children: [],
          actions: [],
        },
      ],
    },
  ],
  relationDataSources: [],
  actions: [],
};

describe("DynamicDetail grouped config", () => {
  it("supports grouped state/layout/actions/rendering configuration", () => {
    render(
      <DynamicDetail
        data={{
          contract: CONFIG_CONTRACT,
          record: { id: "1", name: "Desk", price: "199.00" },
        }}
        state={{
          status: "ready",
          messages: {
            readOnly: "Read-only by config",
          },
          renderReadOnlyNotice: ({ message }) => (
            <div data-testid="custom-readonly-banner">{message}</div>
          ),
        }}
        layout={{
          showTabs: false,
        }}
        actions={{
          showSectionActions: false,
        }}
        rendering={{
          renderModelActions: () => (
            <div data-testid="custom-model-actions">Model action slot</div>
          ),
          renderSection: ({ node, defaultSection }) => (
            <div data-testid={`custom-section-${node.id}`}>{defaultSection()}</div>
          ),
        }}
      />,
    );

    expect(screen.getByTestId("custom-readonly-banner")).toHaveTextContent(
      "Read-only by config",
    );
    expect(screen.getByTestId("custom-model-actions")).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("detail-section-toggle-overview-tab:main-section"));
    expect(screen.getByTestId("custom-section-main-section")).toBeInTheDocument();
    expect(screen.getAllByText("Desk").length).toBeGreaterThan(0);
    expect(screen.queryByRole("tab")).not.toBeInTheDocument();
  });

  it("emits behavior callbacks for tab switch and section edit state", async () => {
    const onTabChange = vi.fn();
    const onSectionEditChange = vi.fn();

    render(
      <DynamicDetail
        data={{
          contract: CONFIG_CONTRACT,
          record: { id: "1", name: "Desk", price: "199.00" },
        }}
        state={{ status: "ready" }}
        behavior={{
          onTabChange,
          onSectionEditChange,
        }}
      />,
    );

    const tabs = screen.getAllByRole("tab");
    if (tabs.length > 1) {
      fireEvent.click(tabs[1]!);
    }

    await waitFor(() => {
      expect(onTabChange).toHaveBeenCalled();
    });

    fireEvent.click(screen.getByRole("tab", { name: "Overview" }));

    await waitFor(() => {
      expect(screen.getByTestId("detail-section-toggle-overview-tab:main-section")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("detail-section-toggle-overview-tab:main-section"));

    fireEvent.click(screen.getByTestId("detail-section-edit-toggle-main-section"));

    await waitFor(() => {
      expect(onSectionEditChange).toHaveBeenCalledWith("main-section");
    });
  });
});
