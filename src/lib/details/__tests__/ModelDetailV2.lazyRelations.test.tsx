import { MockedProvider } from "@apollo/client/testing";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { MODEL_DETAIL_CONTRACT_QUERY } from "@/lib/metadata/queries";

import { ModelDetailV2 } from "../v2";
import { buildDetailQuery } from "../v2/utils/buildDetailQuery";

vi.mock("@/lib/table/components/BaseModelTable", () => ({
  BaseModelTable: ({ app, model }: { app: string; model: string }) => (
    <div data-testid="base-model-table-mock">
      {app}.{model}
    </div>
  ),
}));

const CONTRACT_VARIABLES = {
  input: {
    app: "test_app",
    model: "Product",
    objectId: "1",
  },
};

const DETAIL_QUERY = buildDetailQuery({
  modelName: "Product",
  fields: ["id", "name"],
});

describe("ModelDetailV2 lazy relation loading", () => {
  it("mounts relation BaseModelTable only after tab activation", async () => {
    const mocks = [
      {
        request: {
          query: MODEL_DETAIL_CONTRACT_QUERY,
          variables: CONTRACT_VARIABLES,
        },
        result: {
          data: {
            modelDetailContract: {
              ok: true,
              reason: null,
              contract: {
                appLabel: "test_app",
                modelName: "Product",
                queryRoot: "product",
                identifierArg: "id",
                layoutVersion: "v2",
                defaultIncludeFields: ["id", "name"],
                defaultExcludeFields: [],
                metadataVersion: "fixture-lazy-v1",
                permissions: {
                  modelReadable: true,
                  fieldVisibility: {
                    id: true,
                    name: true,
                  },
                  relationVisibility: {
                    orderItems: true,
                  },
                  actionExecutability: {},
                  sourceFlags: {},
                  policy: "FAIL_CLOSED",
                },
                layoutNodes: [
                  {
                    id: "overview",
                    type: "TAB",
                    title: "Overview",
                    order: 0,
                    relationSourceId: null,
                    visibilityRule: null,
                    fields: [],
                    children: [
                      {
                        id: "summary",
                        type: "SECTION",
                        title: "Summary",
                        order: 0,
                        relationSourceId: null,
                        visibilityRule: null,
                        fields: [{ name: "name", title: "Name", type: "CharField" }],
                        children: [],
                        actions: [],
                      },
                    ],
                    actions: [],
                  },
                  {
                    id: "orders",
                    type: "TAB",
                    title: "Orders",
                    order: 1,
                    relationSourceId: null,
                    visibilityRule: null,
                    fields: [],
                    children: [
                      {
                        id: "orders-table",
                        type: "TABLE",
                        title: "Order Items",
                        order: 0,
                        relationSourceId: "orderItems",
                        visibilityRule: null,
                        fields: [{ name: "desc", title: "Description", type: "CharField" }],
                        children: [],
                        actions: [],
                      },
                    ],
                    actions: [],
                  },
                ],
                relationDataSources: [
                  {
                    id: "orderItems",
                    relationName: "orderItems",
                    relatedApp: "test_app",
                    relatedModel: "OrderItem",
                    direction: "REVERSE",
                    mode: "TABLE",
                    loadStrategy: "LAZY",
                    queryName: "orderItemPage",
                    lookupField: null,
                    pagination: {
                      page_arg: "page",
                      per_page_arg: "perPage",
                      default_per_page: 20,
                    },
                    cacheKey: "test_app.Product:orderItems",
                  },
                ],
                actions: [],
              },
            },
          },
        },
      },
      {
        request: {
          query: DETAIL_QUERY,
          variables: {
            id: "1",
          },
        },
        result: {
          data: {
            record: {
              __typename: "Product",
              id: "1",
              name: "Desk",
            },
          },
        },
      },
    ];

    render(
      <MockedProvider mocks={mocks}>
        <ModelDetailV2 appName="test_app" modelName="Product" id="1" />
      </MockedProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText("Summary")).toBeInTheDocument();
    });
    expect(screen.getAllByText("Desk").length).toBeGreaterThan(0);
    expect(screen.queryByTestId("base-model-table-mock")).not.toBeInTheDocument();

    const relatedDataTab = screen.getByRole("tab", { name: "Related Data" });
    fireEvent.mouseDown(relatedDataTab);
    fireEvent.click(relatedDataTab);

    await waitFor(() => {
      expect(relatedDataTab).toHaveAttribute("data-state", "active");
    });
    const activeTabPanel = screen.getByRole("tabpanel");
    const tableToggle = within(activeTabPanel).getByTestId(
      /detail-table-accordion-toggle-/,
    );

    await waitFor(() => {
      expect(tableToggle).toBeInTheDocument();
    });
    expect(screen.queryByTestId("base-model-table-mock")).not.toBeInTheDocument();

    fireEvent.click(tableToggle);

    await waitFor(() => {
      expect(screen.getByTestId("base-model-table-mock")).toBeInTheDocument();
    });
    expect(screen.getByTestId("base-model-table-mock")).toHaveTextContent(
      "test_app.OrderItem",
    );
  });
});
