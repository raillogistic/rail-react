import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { FilterPanel } from "../..";
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

describe("FilterPanel", () => {
  it("renders inline layout", () => {
    const state: FilterFormState = {
      root: { id: "root", type: "group", logic: "AND", conditions: [], negated: false },
      selectedPresets: [],
      distinctOn: [],
      orderBy: [],
    };

    render(
      <FilterPanel
        schema={schema}
        state={state}
        config={config}
        onApply={vi.fn()}
        onClearAll={vi.fn()}
        onAddCondition={vi.fn()}
        onAddGroup={vi.fn()}
        onUpdateCondition={vi.fn()}
        onUpdateGroup={vi.fn()}
        onRemoveItem={vi.fn()}
        layout="inline"
      />
    );

    expect(screen.getByText(/filters/i)).toBeInTheDocument();
  });
});
