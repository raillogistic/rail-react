/**
 * Component tests for FilterGroup
 */

import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FilterGroupComponent } from "../..";
import type { FilterGroup, UnifiedFilterSchema, NestedFilterConfig } from "../..";

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

const mockConfig: NestedFilterConfig = {
  maxDepth: 3,
  enableLogicalOperators: true,
  enableNot: true,
  defaultM2MOperator: "_some",
  enableInlineRelationFilters: true,
  maxFiltersPerGroup: 10,
  autoApply: false,
  autoApplyDelay: 500,
};

describe("FilterGroupComponent", () => {
  const defaultGroup: FilterGroup = {
    id: "g1",
    type: "group",
    logic: "AND",
    conditions: [],
    negated: false,
  };

  const defaultProps = {
    group: defaultGroup,
    schema: mockSchema,
    config: mockConfig,
    onChange: vi.fn(),
    onAddCondition: vi.fn(),
    onAddGroup: vi.fn(),
    onUpdateCondition: vi.fn(),
    onRemoveItem: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders match label and toggle", () => {
    render(<FilterGroupComponent {...defaultProps} />);
    expect(screen.getByText(/match all/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "ALL" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "ANY" })).toBeInTheDocument();
  });

  it("calls onChange when logic toggled", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<FilterGroupComponent {...defaultProps} onChange={onChange} />);
    await user.click(screen.getByRole("button", { name: "ANY" }));
    expect(onChange).toHaveBeenCalledWith({ logic: "OR" });
  });

  it("renders add filter and add group buttons", () => {
    render(<FilterGroupComponent {...defaultProps} />);
    expect(screen.getByRole("button", { name: /add filter/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /add group/i })).toBeInTheDocument();
  });

  it("disables add group when max depth reached", () => {
    render(<FilterGroupComponent {...defaultProps} depth={3} />);
    expect(screen.getByRole("button", { name: /add group/i })).toBeDisabled();
  });

  it("renders nested condition label", () => {
    const groupWithCondition: FilterGroup = {
      ...defaultGroup,
      conditions: [
        { id: "c1", type: "condition", fieldPath: ["name"], fieldName: "name", operator: "eq", value: "test" },
      ],
    };
    render(<FilterGroupComponent {...defaultProps} group={groupWithCondition} />);
    expect(screen.getByRole("button", { name: /name/i })).toBeInTheDocument();
  });

  it("hides remove button for root group", () => {
    render(<FilterGroupComponent {...defaultProps} isRoot />);
    expect(screen.queryByLabelText(/remove group/i)).not.toBeInTheDocument();
  });
});
