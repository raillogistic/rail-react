import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ActiveFiltersBar } from "../..";
import type { FilterFormState, UnifiedFilterSchema } from "../..";

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

describe("ActiveFiltersBar", () => {
  it("renders add filter button when empty", () => {
    const state: FilterFormState = {
      root: { id: "root", type: "group", logic: "AND", conditions: [], negated: false },
      selectedPresets: [],
      distinctOn: [],
      orderBy: [],
    };
    render(
      <ActiveFiltersBar
        state={state}
        schema={schema}
        onRemoveCondition={vi.fn()}
        onClearAll={vi.fn()}
        onAddFilter={vi.fn()}
      />
    );
    expect(screen.getByRole("button", { name: /add filter/i })).toBeInTheDocument();
  });
});
