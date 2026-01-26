/**
 * Component tests for FilterCondition
 */

import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FilterConditionComponent } from "../..";
import type { FilterCondition, FilterableField, UnifiedFilterSchema } from "../..";

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
      operators: [
        { name: "eq", label: "Equals", graphqlType: "String", isList: false },
        { name: "contains", label: "Contains", graphqlType: "String", isList: false },
        { name: "icontains", label: "Contains (case-insensitive)", graphqlType: "String", isList: false },
      ],
      defaultOperator: "contains",
      isRelation: false,
      uiHints: { widget: "text" },
    },
    {
      fieldName: "price",
      fieldLabel: "Price",
      baseType: "Number",
      graphqlType: "Float",
      filterInputType: "FloatFilterInput",
      operators: [
        { name: "eq", label: "Equals", graphqlType: "Float", isList: false },
        { name: "gte", label: ">=", graphqlType: "Float", isList: false },
        { name: "lte", label: "<=", graphqlType: "Float", isList: false },
      ],
      defaultOperator: "eq",
      isRelation: false,
      uiHints: { widget: "number" },
    },
    {
      fieldName: "isActive",
      fieldLabel: "Is Active",
      baseType: "Boolean",
      graphqlType: "Boolean",
      filterInputType: "BooleanFilterInput",
      operators: [
        { name: "eq", label: "Equals", graphqlType: "Boolean", isList: false },
      ],
      defaultOperator: "eq",
      isRelation: false,
      uiHints: { widget: "boolean" },
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
    operator: "contains",
    value: "",
  };

  const defaultProps = {
    condition: defaultCondition,
    schema: mockSchema,
    onChange: vi.fn(),
    onRemove: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("rendering", () => {
    it("should render field name", () => {
      render(<FilterConditionComponent {...defaultProps} />);
      
      expect(screen.getByText(/name/i)).toBeInTheDocument();
    });

    it("should render operator selector", () => {
      render(<FilterConditionComponent {...defaultProps} />);
      
      expect(screen.getByRole("combobox", { name: /operator/i })).toBeInTheDocument();
    });

    it("should render value input", () => {
      render(<FilterConditionComponent {...defaultProps} />);
      
      expect(screen.getByRole("textbox", { name: /value/i })).toBeInTheDocument();
    });

    it("should render remove button", () => {
      render(<FilterConditionComponent {...defaultProps} />);
      
      expect(screen.getByRole("button", { name: /remove/i })).toBeInTheDocument();
    });
  });

  describe("field path display", () => {
    it("should show simple field name", () => {
      render(<FilterConditionComponent {...defaultProps} />);
      
      expect(screen.getByText("name")).toBeInTheDocument();
    });

    it("should show nested field path as breadcrumb", () => {
      const nestedCondition: FilterCondition = {
        id: "c1",
        type: "condition",
        fieldPath: ["category", "name"],
        fieldName: "name",
        operator: "eq",
        value: "",
      };

      render(<FilterConditionComponent {...defaultProps} condition={nestedCondition} />);
      
      expect(screen.getByText(/category/i)).toBeInTheDocument();
      expect(screen.getByText(/name/i)).toBeInTheDocument();
    });
  });

  describe("operator selection", () => {
    it("should call onChange when operator is changed", async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      
      render(<FilterConditionComponent {...defaultProps} onChange={onChange} />);
      
      const operatorSelect = screen.getByRole("combobox", { name: /operator/i });
      await user.click(operatorSelect);
      
      const equalsOption = screen.getByRole("option", { name: /equals/i });
      await user.click(equalsOption);
      
      expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ operator: "eq" }));
    });

    it("should display current operator", () => {
      const condition: FilterCondition = {
        ...defaultCondition,
        operator: "eq",
      };

      render(<FilterConditionComponent {...defaultProps} condition={condition} />);
      
      expect(screen.getByText(/equals/i)).toBeInTheDocument();
    });

    it("should group operators by category", async () => {
      const user = userEvent.setup();
      
      render(<FilterConditionComponent {...defaultProps} />);
      
      const operatorSelect = screen.getByRole("combobox", { name: /operator/i });
      await user.click(operatorSelect);
      
      // Should show operator groups like "Text Search", "Equality"
      expect(screen.getByText(/text search/i) || screen.getByText(/equality/i)).toBeInTheDocument();
    });
  });

  describe("value input", () => {
    it("should call onChange when value is changed", async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      
      render(<FilterConditionComponent {...defaultProps} onChange={onChange} />);
      
      const valueInput = screen.getByRole("textbox", { name: /value/i });
      await user.type(valueInput, "test");
      
      expect(onChange).toHaveBeenCalled();
    });

    it("should display current value", () => {
      const condition: FilterCondition = {
        ...defaultCondition,
        value: "test value",
      };

      render(<FilterConditionComponent {...defaultProps} condition={condition} />);
      
      const valueInput = screen.getByRole("textbox", { name: /value/i });
      expect(valueInput).toHaveValue("test value");
    });

    it("should use number input for numeric fields", () => {
      const numericCondition: FilterCondition = {
        id: "c1",
        type: "condition",
        fieldPath: ["price"],
        fieldName: "price",
        operator: "gte",
        value: 100,
      };

      render(<FilterConditionComponent {...defaultProps} condition={numericCondition} />);
      
      const valueInput = screen.getByRole("spinbutton", { name: /value/i });
      expect(valueInput).toHaveValue(100);
    });

    it("should use boolean selector for boolean fields", () => {
      const booleanCondition: FilterCondition = {
        id: "c1",
        type: "condition",
        fieldPath: ["isActive"],
        fieldName: "isActive",
        operator: "eq",
        value: true,
      };

      render(<FilterConditionComponent {...defaultProps} condition={booleanCondition} />);
      
      expect(screen.getByRole("combobox", { name: /value/i })).toBeInTheDocument();
    });
  });

  describe("relation operator", () => {
    it("should show relation operator selector for M2M fields", () => {
      const relationCondition: FilterCondition = {
        id: "c1",
        type: "condition",
        fieldPath: ["tags", "name"],
        fieldName: "name",
        operator: "eq",
        value: "",
        relationOperator: "_some",
      };

      // Add M2M relation to schema
      const schemaWithRelation: UnifiedFilterSchema = {
        ...mockSchema,
        relationFilters: [
          {
            fieldName: "tags",
            fieldLabel: "Tags",
            relationType: "MANY_TO_MANY",
            relatedApp: "store",
            relatedModel: "Tag",
            nestedFilterType: "TagWhereInput",
            supportsDirectFilter: false,
            supportsSome: true,
            supportsEvery: true,
            supportsNone: true,
            supportsCount: false,
            supportsIsNull: false,
          },
        ],
      };

      render(
        <FilterConditionComponent
          {...defaultProps}
          condition={relationCondition}
          schema={schemaWithRelation}
        />
      );
      
      expect(screen.getByRole("combobox", { name: /relation/i })).toBeInTheDocument();
    });

    it("should call onChange when relation operator is changed", async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      
      const relationCondition: FilterCondition = {
        id: "c1",
        type: "condition",
        fieldPath: ["tags", "name"],
        fieldName: "name",
        operator: "eq",
        value: "",
        relationOperator: "_some",
      };

      const schemaWithRelation: UnifiedFilterSchema = {
        ...mockSchema,
        relationFilters: [
          {
            fieldName: "tags",
            fieldLabel: "Tags",
            relationType: "MANY_TO_MANY",
            relatedApp: "store",
            relatedModel: "Tag",
            nestedFilterType: "TagWhereInput",
            supportsDirectFilter: false,
            supportsSome: true,
            supportsEvery: true,
            supportsNone: true,
            supportsCount: false,
            supportsIsNull: false,
          },
        ],
      };

      render(
        <FilterConditionComponent
          {...defaultProps}
          condition={relationCondition}
          schema={schemaWithRelation}
          onChange={onChange}
        />
      );
      
      const relationSelect = screen.getByRole("combobox", { name: /relation/i });
      await user.click(relationSelect);
      
      const everyOption = screen.getByRole("option", { name: /every/i });
      await user.click(everyOption);
      
      expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ relationOperator: "_every" }));
    });
  });

  describe("remove condition", () => {
    it("should call onRemove when remove button is clicked", async () => {
      const user = userEvent.setup();
      const onRemove = vi.fn();
      
      render(<FilterConditionComponent {...defaultProps} onRemove={onRemove} />);
      
      const removeButton = screen.getByRole("button", { name: /remove/i });
      await user.click(removeButton);
      
      expect(onRemove).toHaveBeenCalled();
    });
  });

  describe("validation", () => {
    it("should show error for invalid value", () => {
      const condition: FilterCondition = {
        ...defaultCondition,
        value: "",
        error: "Value is required",
      };

      render(<FilterConditionComponent {...defaultProps} condition={condition} />);
      
      expect(screen.getByText(/value is required/i)).toBeInTheDocument();
    });

    it("should highlight field with error", () => {
      const condition: FilterCondition = {
        ...defaultCondition,
        value: "",
        error: "Value is required",
      };

      render(<FilterConditionComponent {...defaultProps} condition={condition} />);
      
      const valueInput = screen.getByRole("textbox", { name: /value/i });
      expect(valueInput).toHaveClass(/error|invalid|destructive/);
    });
  });

  describe("help text", () => {
    it("should show field help text when available", () => {
      const schemaWithHelp: UnifiedFilterSchema = {
        ...mockSchema,
        fields: [
          {
            ...mockSchema.fields[0],
            helpText: "Enter product name to search",
          },
        ],
      };

      render(<FilterConditionComponent {...defaultProps} schema={schemaWithHelp} />);
      
      expect(screen.getByText(/enter product name/i)).toBeInTheDocument();
    });
  });

  describe("drag handle", () => {
    it("should render drag handle for reordering", () => {
      render(<FilterConditionComponent {...defaultProps} />);
      
      // Drag handle should be present (icon or dedicated element)
      expect(screen.getByTestId("drag-handle") || screen.getByLabelText(/drag/i)).toBeInTheDocument();
    });
  });

  describe("accessibility", () => {
    it("should have accessible labels for inputs", () => {
      render(<FilterConditionComponent {...defaultProps} />);
      
      expect(screen.getByLabelText(/operator/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/value/i)).toBeInTheDocument();
    });

    it("should support keyboard navigation", async () => {
      const user = userEvent.setup();
      render(<FilterConditionComponent {...defaultProps} />);
      
      await user.tab();
      expect(screen.getByRole("combobox", { name: /operator/i })).toHaveFocus();
      
      await user.tab();
      expect(screen.getByRole("textbox", { name: /value/i })).toHaveFocus();
    });
  });
});
