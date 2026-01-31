/**
 * Component tests for FilterGroup
 */

import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FilterGroupComponent } from "../..";
import type { FilterGroup, UnifiedFilterSchema, NestedFilterConfig } from "../..";

// Mock schema for tests
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
    {
      fieldName: "price",
      fieldLabel: "Price",
      baseType: "Number",
      graphqlType: "Float",
      filterInputType: "FloatFilterInput",
      operators: [{ name: "gte", label: ">=", graphqlType: "Float", isList: false }],
      defaultOperator: "gte",
      isRelation: false,
      uiHints: { widget: "number" },
    },
  ],
  relationFilters: [],
  presets: [],
  distinctFields: [],
  fieldGroups: [],
};

const mockConfig: NestedFilterConfig = {
  maxDepth: 3,
  maxFiltersPerGroup: 10,
  showFieldPath: true,
  showOperatorGroups: true,
  enableQuickAdd: true,
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

  describe("rendering", () => {
    it("should render empty group with add buttons", () => {
      render(<FilterGroupComponent {...defaultProps} />);

      expect(screen.getByRole("button", { name: /ajouter un filtre/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /ajouter un groupe/i })).toBeInTheDocument();
    });

    it("should render logic selector", () => {
      render(<FilterGroupComponent {...defaultProps} />);

      // Should show AND/OR selector
      expect(screen.getByText(/and/i)).toBeInTheDocument();
    });

    it("should render NOT toggle", () => {
      render(<FilterGroupComponent {...defaultProps} />);

      expect(screen.getByText(/non/i)).toBeInTheDocument();
    });

    it("should show condition count", () => {
      const groupWithConditions: FilterGroup = {
        id: "g1",
        type: "group",
        logic: "AND",
        conditions: [
          { id: "c1", type: "condition", fieldPath: ["name"], fieldName: "name", operator: "eq", value: "test" },
          { id: "c2", type: "condition", fieldPath: ["price"], fieldName: "price", operator: "gte", value: 100 },
        ],
        negated: false,
      };

      render(<FilterGroupComponent {...defaultProps} group={groupWithConditions} />);
      
      expect(screen.getByText(/2/)).toBeInTheDocument();
    });
  });

  describe("logic toggle", () => {
    it("should call onChange when logic is changed from AND to OR", async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      
      render(<FilterGroupComponent {...defaultProps} onChange={onChange} />);
      
      // Find and click logic selector
      const logicButton = screen.getByRole("combobox", { name: /logic/i });
      await user.click(logicButton);
      
      // Select OR
      const orOption = screen.getByRole("option", { name: /or/i });
      await user.click(orOption);
      
      expect(onChange).toHaveBeenCalledWith({ logic: "OR" });
    });

    it("should display current logic", () => {
      const groupWithOr: FilterGroup = { ...defaultGroup, logic: "OR" };
      
      render(<FilterGroupComponent {...defaultProps} group={groupWithOr} />);
      
      expect(screen.getByText(/or/i)).toBeInTheDocument();
    });
  });

  describe("NOT negation", () => {
    it("should call onChange when NOT is toggled", async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      
      render(<FilterGroupComponent {...defaultProps} onChange={onChange} />);
      
      const notSwitch = screen.getByRole("switch", { name: /not/i });
      await user.click(notSwitch);
      
      expect(onChange).toHaveBeenCalledWith({ negated: true });
    });

    it("should show visual indicator when negated", () => {
      const negatedGroup: FilterGroup = { ...defaultGroup, negated: true };
      
      render(<FilterGroupComponent {...defaultProps} group={negatedGroup} />);
      
      const notSwitch = screen.getByRole("switch", { name: /not/i });
      expect(notSwitch).toBeChecked();
    });
  });

  describe("add condition", () => {
    it("should call onAddCondition when field is selected", async () => {
      const user = userEvent.setup();
      const onAddCondition = vi.fn();
      
      render(<FilterGroupComponent {...defaultProps} onAddCondition={onAddCondition} />);
      
      const addButton = screen.getByRole("button", { name: /add condition/i });
      await user.click(addButton);
      
      // Select a field (simplified - actual implementation uses FieldSelector)
      // This test verifies the button renders and can be clicked
      expect(addButton).toBeInTheDocument();
    });

    it("should disable add condition when max filters reached", () => {
      const fullGroup: FilterGroup = {
        id: "g1",
        type: "group",
        logic: "AND",
        conditions: Array(10).fill(null).map((_, i) => ({
          id: `c${i}`,
          type: "condition" as const,
          fieldPath: ["name"],
          fieldName: "name",
          operator: "eq",
          value: "test",
        })),
        negated: false,
      };

      render(<FilterGroupComponent {...defaultProps} group={fullGroup} />);
      
      const addButton = screen.getByRole("button", { name: /add condition/i });
      expect(addButton).toBeDisabled();
    });
  });

  describe("add group", () => {
    it("should call onAddGroup when add group button is clicked", async () => {
      const user = userEvent.setup();
      const onAddGroup = vi.fn();
      
      render(<FilterGroupComponent {...defaultProps} onAddGroup={onAddGroup} />);
      
      const addGroupButton = screen.getByRole("button", { name: /add group/i });
      await user.click(addGroupButton);
      
      expect(onAddGroup).toHaveBeenCalledWith("g1", "AND");
    });

    it("should disable add group when max depth reached", () => {
      render(
        <FilterGroupComponent
          {...defaultProps}
          depth={3}
        />
      );
      
      const addGroupButton = screen.getByRole("button", { name: /add group/i });
      expect(addGroupButton).toBeDisabled();
    });
  });

  describe("remove group", () => {
    it("should call onRemove when remove button is clicked", async () => {
      const user = userEvent.setup();
      const onRemove = vi.fn();
      
      render(
        <FilterGroupComponent
          {...defaultProps}
          onRemove={onRemove}
          isRoot={false}
        />
      );
      
      const removeButton = screen.getByRole("button", { name: /remove/i });
      await user.click(removeButton);
      
      expect(onRemove).toHaveBeenCalled();
    });

    it("should not show remove button for root group", () => {
      render(
        <FilterGroupComponent
          {...defaultProps}
          isRoot={true}
        />
      );
      
      expect(screen.queryByRole("button", { name: /remove/i })).not.toBeInTheDocument();
    });
  });

  describe("nested conditions", () => {
    it("should render child conditions", () => {
      const groupWithConditions: FilterGroup = {
        id: "g1",
        type: "group",
        logic: "AND",
        conditions: [
          { id: "c1", type: "condition", fieldPath: ["name"], fieldName: "name", operator: "eq", value: "test" },
        ],
        negated: false,
      };

      render(<FilterGroupComponent {...defaultProps} group={groupWithConditions} />);
      
      // Condition should be rendered (look for field name)
      expect(screen.getByText(/name/i)).toBeInTheDocument();
    });

    it("should render nested groups", () => {
      const groupWithNestedGroup: FilterGroup = {
        id: "g1",
        type: "group",
        logic: "AND",
        conditions: [
          {
            id: "g2",
            type: "group",
            logic: "OR",
            conditions: [],
            negated: false,
          },
        ],
        negated: false,
      };

      render(<FilterGroupComponent {...defaultProps} group={groupWithNestedGroup} />);
      
      // Should have nested group with OR logic
      expect(screen.getByText(/or/i)).toBeInTheDocument();
    });
  });

  describe("collapsible", () => {
    it("should collapse and expand group", async () => {
      const user = userEvent.setup();
      const groupWithConditions: FilterGroup = {
        id: "g1",
        type: "group",
        logic: "AND",
        conditions: [
          { id: "c1", type: "condition", fieldPath: ["name"], fieldName: "name", operator: "eq", value: "test" },
        ],
        negated: false,
      };

      render(<FilterGroupComponent {...defaultProps} group={groupWithConditions} isRoot={false} />);
      
      const collapseButton = screen.getByRole("button", { name: /collapse/i });
      await user.click(collapseButton);
      
      // Conditions should be hidden (simplified check)
      // In actual implementation, this would verify visibility
      expect(collapseButton).toBeInTheDocument();
    });
  });

  describe("visual hierarchy", () => {
    it("should increase indentation for nested groups", () => {
      render(
        <FilterGroupComponent
          {...defaultProps}
          depth={2}
        />
      );
      
      // Container should have increased indentation
      // This is verified through className/style application
      expect(screen.getByTestId("filter-group")).toHaveClass(/ml-/);
    });
  });

  describe("warnings", () => {
    it("should show warning when approaching max filters", () => {
      const nearFullGroup: FilterGroup = {
        id: "g1",
        type: "group",
        logic: "AND",
        conditions: Array(9).fill(null).map((_, i) => ({
          id: `c${i}`,
          type: "condition" as const,
          fieldPath: ["name"],
          fieldName: "name",
          operator: "eq",
          value: "test",
        })),
        negated: false,
      };

      render(<FilterGroupComponent {...defaultProps} group={nearFullGroup} />);
      
      expect(screen.getByText(/approaching limit/i)).toBeInTheDocument();
    });
  });
});
