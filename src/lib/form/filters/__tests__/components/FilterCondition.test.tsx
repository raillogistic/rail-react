/**
 * Component tests for FilterCondition
 */

import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { FilterConditionComponent } from "../..";
import type { FilterCondition, UnifiedFilterSchema } from "../..";

const mockSchema: UnifiedFilterSchema = {
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

describe("FilterConditionComponent", () => {
  const defaultCondition: FilterCondition = {
    id: "c1",
    type: "condition",
    fieldPath: ["name"],
    fieldName: "name",
    operator: "eq",
    value: "",
  };

  const defaultProps = {
    condition: defaultCondition,
    schema: mockSchema,
    onChange: vi.fn(),
    onRemove: vi.fn(),
    config: {
      maxDepth: 3,
      enableLogicalOperators: true,
      enableNot: true,
      defaultM2MOperator: "_some",
      enableInlineRelationFilters: true,
      maxFiltersPerGroup: 10,
      autoApply: false,
      autoApplyDelay: 500,
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders field label, operator, and value input", () => {
    render(<FilterConditionComponent {...defaultProps} />);
    expect(screen.getByText(/name/i)).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: /operator/i })).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: /value/i })).toBeInTheDocument();
  });
});
