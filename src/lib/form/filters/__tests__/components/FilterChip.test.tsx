import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { FilterChip } from "../..";
import type { FilterCondition, UnifiedFilterSchema } from "../..";

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
      uiHints: { widget: "text" },
    },
  ],
  relationFilters: [],
  presets: [],
  distinctFields: [],
  fieldGroups: [],
};

describe("FilterChip", () => {
  it("renders label with remove button", () => {
    const condition: FilterCondition = {
      id: "c1",
      type: "condition",
      fieldPath: ["name"],
      fieldName: "name",
      operator: "eq",
      value: "Acme",
    };
    render(
      <FilterChip
        condition={condition}
        schema={schema}
        onRemove={vi.fn()}
        onClick={vi.fn()}
      />
    );
    expect(screen.getByText(/name/i)).toBeInTheDocument();
    expect(screen.getByRole("button")).toBeInTheDocument();
  });
});
