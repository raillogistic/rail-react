import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import DynamicDetail from "../v2/components/DynamicDetail";
import type { DetailViewContract } from "../v2/types";

vi.mock("@/lib/form", () => ({
  ModelForm: ({
    onlyFields,
    objectId,
  }: {
    onlyFields?: string[];
    objectId?: string | number | null;
  }) => (
    <div data-testid="section-model-form">
      fields:{(onlyFields || []).join(",")};id:{objectId === null || objectId === undefined ? "" : String(objectId)}
    </div>
  ),
}));

const EDITABLE_SECTION_CONTRACT: DetailViewContract = {
  appLabel: "store",
  modelName: "Product",
  queryRoot: "product",
  identifierArg: "id",
  layoutVersion: "v2",
  defaultIncludeFields: ["id", "name", "price"],
  defaultExcludeFields: [],
  metadataVersion: "fixture-section-edit-v1",
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
      id: "main",
      type: "SECTION",
      title: "Main",
      order: 0,
      relationSourceId: null,
      visibilityRule: null,
      actions: [],
      fields: [
        { name: "name", title: "Name", type: "CharField" },
        { name: "price", title: "Price", type: "DecimalField" },
      ],
      children: [],
    },
  ],
  relationDataSources: [],
  actions: [],
};

describe("DynamicDetail section editing", () => {
  it("opens a section-scoped ModelForm editor using section field names", () => {
    render(
      <DynamicDetail
        data={{
          contract: EDITABLE_SECTION_CONTRACT,
          record: { id: "10", name: "Desk", price: "199.00" },
        }}
        state={{ status: "ready" }}
      />,
    );

    fireEvent.click(screen.getByTestId("detail-section-toggle-overview:main"));

    const toggle = screen.getByTestId("detail-section-edit-toggle-main");
    expect(toggle).toBeInTheDocument();

    fireEvent.click(toggle);

    expect(screen.getByTestId("section-model-form")).toHaveTextContent(
      "fields:name,price;id:10",
    );
  });
});
