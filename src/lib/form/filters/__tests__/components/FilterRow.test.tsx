import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { FilterRow } from "../..";
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

describe("FilterRow", () => {
  it("renders field selector, operator, and value input", () => {
    const condition: FilterCondition = {
      id: "c1",
      type: "condition",
      fieldPath: ["name"],
      fieldName: "name",
      operator: "eq",
      value: "",
    };
    render(
      <FilterRow
        condition={condition}
        schema={schema}
        config={config}
        onChange={vi.fn()}
        onRemove={vi.fn()}
        onFieldChange={vi.fn()}
      />
    );

    expect(screen.getByRole("button", { name: /name/i })).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: /operator/i })).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: /value/i })).toBeInTheDocument();
  });
});
