import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import DynamicDetail from "../v2/components/DynamicDetail";
import type { DetailViewContract } from "../v2/types";

const CUSTOMIZATION_CONTRACT: DetailViewContract = {
  appLabel: "test_app",
  modelName: "Product",
  queryRoot: "product",
  identifierArg: "id",
  layoutVersion: "v2",
  defaultIncludeFields: ["id", "name", "price", "secretCode"],
  defaultExcludeFields: [],
  metadataVersion: "fixture-customization-v1",
  permissions: {
    modelReadable: true,
    fieldVisibility: {
      id: true,
      name: true,
      price: true,
      secretCode: true,
      "category.desc": true,
    },
    relationVisibility: {},
    actionExecutability: {},
    sourceFlags: {},
    policy: "FAIL_CLOSED",
  },
  layoutNodes: [
    {
      id: "main",
      type: "SECTION",
      title: "Main",
      order: 0,
      relationSourceId: null,
      visibilityRule: null,
      fields: [
        { name: "name", title: "Name", type: "CharField" },
        { name: "price", title: "Price", type: "DecimalField" },
        { name: "secretCode", title: "Secret", type: "CharField" },
      ],
      children: [],
      actions: [],
    },
  ],
  relationDataSources: [],
  actions: [],
};

describe("DynamicDetail customization precedence", () => {
  it("applies model/section include-exclude precedence and nested descriptors", () => {
    render(
      <DynamicDetail
        data={{
          contract: CUSTOMIZATION_CONTRACT,
          record: {
            id: "1",
            name: "Desk",
            price: 120,
            secretCode: "SECRET",
            category: {
              desc: "Office",
            },
          },
          customization: {
            modelFields: [
              { name: "price", exclude: true },
              { name: "secretCode", exclude: true },
              "category.desc",
            ],
            sectionFields: {
              main: [
                { name: "name", exclude: true },
                { name: "price", exclude: false, include: true, title: "Cost" },
              ],
            },
          },
        }}
        state={{ status: "ready" }}
        rendering={{
          customRenderers: {
            price: (value) => `USD ${value}`,
          },
        }}
      />,
    );

    screen
      .getAllByTestId(/detail-section-toggle-/)
      .forEach((toggle) => fireEvent.click(toggle));
    const section = screen.getByTestId(/detail-section-shell-.*main/);

    expect(screen.getByText("Cost")).toBeInTheDocument();
    expect(screen.getAllByText("USD 120").length).toBeGreaterThan(0);
    expect(screen.getByText("Office")).toBeInTheDocument();
    expect(within(section).queryByText("Desk")).not.toBeInTheDocument();
    expect(screen.queryByText("SECRET")).not.toBeInTheDocument();
  });
});
