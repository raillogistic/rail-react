import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import DynamicDetail from "../v2/components/DynamicDetail";
import type { DetailViewContract } from "../v2/types";

const NESTED_CONTRACT: DetailViewContract = {
  appLabel: "test_app",
  modelName: "Product",
  queryRoot: "product",
  identifierArg: "id",
  layoutVersion: "v2",
  defaultIncludeFields: ["id", "name", "category"],
  defaultExcludeFields: [],
  metadataVersion: "fixture-nested-v1",
  permissions: {
    modelReadable: true,
    fieldVisibility: {
      id: true,
      name: true,
      category: true,
      desc: true,
    },
    relationVisibility: {
      category: true,
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
      fields: [],
      relationSourceId: null,
      visibilityRule: null,
      actions: [],
      children: [
        {
          id: "main",
          type: "SECTION",
          title: "Main",
          order: 0,
          relationSourceId: null,
          visibilityRule: null,
          actions: [],
          fields: [{ name: "name", title: "Name", type: "CharField" }],
          children: [],
        },
        {
          id: "category",
          type: "SECTION",
          title: "Category",
          order: 1,
          relationSourceId: "category",
          visibilityRule: null,
          actions: [],
          fields: [{ name: "desc", title: "Category label", type: "CharField" }],
          children: [],
        },
      ],
    },
  ],
  relationDataSources: [
    {
      id: "category",
      relationName: "category",
      relatedApp: "test_app",
      relatedModel: "Category",
      direction: "FORWARD",
      mode: "SECTION",
      loadStrategy: "PRIMARY",
      queryName: "categoryPage",
      lookupField: "id",
      pagination: null,
      cacheKey: "test_app.Product:category",
    },
  ],
  actions: [],
};

describe("DynamicDetail nested layouts", () => {
  it("renders nested relation object fields inside configured sections", () => {
    render(
      <DynamicDetail
        data={{
          contract: NESTED_CONTRACT,
          record: {
            id: "1",
            name: "Desk",
            category: {
              id: "cat-1",
              desc: "Office",
            },
          },
        }}
        state={{ status: "ready" }}
      />,
    );

    expect(screen.getByText("Main")).toBeInTheDocument();
    screen
      .getAllByTestId(/detail-section-toggle-/)
      .forEach((toggle) => fireEvent.click(toggle));
    expect(screen.getAllByText("Desk").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Category").length).toBeGreaterThan(0);
    expect(screen.getByText("Category label")).toBeInTheDocument();
    expect(screen.getAllByText("Office").length).toBeGreaterThan(0);
  });
});
