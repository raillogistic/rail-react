import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { InlineFieldSelector } from "../..";
import { Button } from "@/lib/components/ui/button";
import type { UnifiedFilterSchema } from "../..";

const schema: UnifiedFilterSchema = {
  app: "store",
  model: "Product",
  verboseName: "Product",
  verboseNamePlural: "Products",
  config: {
    inputTypeName: "ProductWhereInput",
    supportsAnd: true,
    supportsOr: true,
    supportsNot: true,
    supportsFts: false,
    supportsAggregation: false,
    supportsDistinct: true,
  },
  fields: [
    {
      name: "name",
      fieldName: "name",
      fieldLabel: "Name",
      baseType: "String",
      graphqlType: "String",
      filterInputType: "StringFilterInput",
      operators: [{ name: "eq", label: "Equals", graphqlType: "String", isList: false }],
      defaultOperator: "eq",
      isRelation: false,
      uiHints: { widget: "text", showInQuickFilter: true },
    },
  ],
  relationFilters: [],
  presets: [],
  distinctFields: [],
  fieldGroups: [],
};

const config = {
  maxDepth: 3,
  enableLogicalOperators: true,
  enableNot: true,
  defaultM2MOperator: "_some",
  enableInlineRelationFilters: true,
  maxFiltersPerGroup: 10,
  autoApply: false,
  autoApplyDelay: 500,
};

describe("InlineFieldSelector", () => {
  it("opens and shows search input", async () => {
    const user = userEvent.setup();
    render(
      <InlineFieldSelector
        schema={schema}
        config={config}
        onSelect={vi.fn()}
        trigger={<Button>Pick</Button>}
      />
    );

    await user.click(screen.getByRole("button", { name: /pick/i }));
    expect(screen.getByPlaceholderText(/search fields/i)).toBeInTheDocument();
  });
});
