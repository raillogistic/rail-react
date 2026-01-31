/**
 * Component tests for FieldSelector
 */

import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FieldSelector } from "../..";
import type { FilterableField, UnifiedFilterSchema } from "../..";

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
      group: "basic",
    },
    {
      name: "price",
      fieldName: "price",
      fieldLabel: "Price",
      baseType: "Number",
      graphqlType: "Float",
      filterInputType: "FloatFilterInput",
      operators: [{ name: "gte", label: ">=", graphqlType: "Float", isList: false }],
      defaultOperator: "gte",
      isRelation: false,
      uiHints: { widget: "number" },
      group: "basic",
    },
    {
      name: "status",
      fieldName: "status",
      fieldLabel: "Status",
      baseType: "String",
      graphqlType: "String",
      filterInputType: "StringFilterInput",
      operators: [{ name: "eq", label: "Equals", graphqlType: "String", isList: false }],
      defaultOperator: "eq",
      isRelation: false,
      uiHints: { widget: "select" },
      group: "status",
    },
    {
      name: "category",
      fieldName: "category",
      fieldLabel: "Category",
      baseType: "Relationship",
      graphqlType: "Category",
      filterInputType: "CategoryWhereInput",
      operators: [],
      defaultOperator: "eq",
      isRelation: true,
      relationConfig: {
        relatedApp: "store",
        relatedModel: "Category",
        lookupField: "id",
        searchFields: ["name"],
      },
      uiHints: { widget: "combobox" },
    },
  ],
  relationFilters: [],
  presets: [],
  distinctFields: [],
  fieldGroups: [
    { key: "basic", label: "Basic Info", fields: ["name", "price"], description: "Basic product info" },
    { key: "status", label: "Status & Lifecycle", fields: ["status"], description: null },
  ],
};

describe("FieldSelector", () => {
  const defaultProps = {
    schema: mockSchema,
    onSelect: vi.fn(),
    currentFieldPath: [] as string[],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("rendering", () => {
    it("should render field selector button", () => {
      render(<FieldSelector {...defaultProps} />);
      
      expect(screen.getByRole("button", { name: /select field/i })).toBeInTheDocument();
    });

    it("should show field list when opened", async () => {
      const user = userEvent.setup();
      render(<FieldSelector {...defaultProps} />);
      
      await user.click(screen.getByRole("button", { name: /select field/i }));
      
      expect(screen.getByText("Name")).toBeInTheDocument();
      expect(screen.getByText("Price")).toBeInTheDocument();
      expect(screen.getByText("Status")).toBeInTheDocument();
    });
  });

  describe("field groups", () => {
    it("should group fields by category", async () => {
      const user = userEvent.setup();
      render(<FieldSelector {...defaultProps} />);
      
      await user.click(screen.getByRole("button", { name: /select field/i }));
      
      expect(screen.getByText("Basic Info")).toBeInTheDocument();
      expect(screen.getByText("Status & Lifecycle")).toBeInTheDocument();
    });

    it("should show ungrouped fields separately", async () => {
      const user = userEvent.setup();
      render(<FieldSelector {...defaultProps} />);
      
      await user.click(screen.getByRole("button", { name: /select field/i }));
      
      // Category field has no group
      expect(screen.getByText("Category")).toBeInTheDocument();
    });

    it("should show group descriptions on hover", async () => {
      const user = userEvent.setup();
      render(<FieldSelector {...defaultProps} />);
      
      await user.click(screen.getByRole("button", { name: /select field/i }));
      
      const basicGroup = screen.getByText("Basic Info");
      await user.hover(basicGroup);
      
      expect(screen.getByText(/basic product info/i)).toBeInTheDocument();
    });
  });

  describe("field selection", () => {
    it("should call onSelect when field is clicked", async () => {
      const user = userEvent.setup();
      const onSelect = vi.fn();
      
      render(<FieldSelector {...defaultProps} onSelect={onSelect} />);
      
      await user.click(screen.getByRole("button", { name: /select field/i }));
      await user.click(screen.getByText("Name"));
      
      expect(onSelect).toHaveBeenCalledWith(
        expect.objectContaining({ fieldName: "name" }),
        ["name"]
      );
    });

    it("should close selector after selection", async () => {
      const user = userEvent.setup();
      render(<FieldSelector {...defaultProps} />);
      
      await user.click(screen.getByRole("button", { name: /select field/i }));
      await user.click(screen.getByText("Name"));
      
      // Field list should be hidden
      expect(screen.queryByText("Price")).not.toBeInTheDocument();
    });
  });

  describe("search functionality", () => {
    it("should show search input", async () => {
      const user = userEvent.setup();
      render(<FieldSelector {...defaultProps} />);
      
      await user.click(screen.getByRole("button", { name: /select field/i }));
      
      expect(screen.getByRole("textbox", { name: /search/i })).toBeInTheDocument();
    });

    it("should filter fields by search term", async () => {
      const user = userEvent.setup();
      render(<FieldSelector {...defaultProps} />);
      
      await user.click(screen.getByRole("button", { name: /select field/i }));
      
      const searchInput = screen.getByRole("textbox", { name: /search/i });
      await user.type(searchInput, "name");
      
      expect(screen.getByText("Name")).toBeInTheDocument();
      expect(screen.queryByText("Price")).not.toBeInTheDocument();
      expect(screen.queryByText("Status")).not.toBeInTheDocument();
    });

    it("should search across field names and labels", async () => {
      const user = userEvent.setup();
      render(<FieldSelector {...defaultProps} />);
      
      await user.click(screen.getByRole("button", { name: /select field/i }));
      
      const searchInput = screen.getByRole("textbox", { name: /search/i });
      await user.type(searchInput, "pric");
      
      expect(screen.getByText("Price")).toBeInTheDocument();
    });

    it("should show no results message for no matches", async () => {
      const user = userEvent.setup();
      render(<FieldSelector {...defaultProps} />);
      
      await user.click(screen.getByRole("button", { name: /select field/i }));
      
      const searchInput = screen.getByRole("textbox", { name: /search/i });
      await user.type(searchInput, "xyz123");
      
      expect(screen.getByText(/no fields found/i)).toBeInTheDocument();
    });
  });

  describe("nested field navigation", () => {
    it("should show expand icon for relation fields", async () => {
      const user = userEvent.setup();
      render(<FieldSelector {...defaultProps} />);
      
      await user.click(screen.getByRole("button", { name: /select field/i }));
      
      const categoryField = screen.getByText("Category");
      const expandIcon = categoryField.parentElement?.querySelector('[data-icon="chevron-right"]');
      
      expect(expandIcon).toBeInTheDocument();
    });

    it("should navigate into nested fields when clicked", async () => {
      const user = userEvent.setup();
      render(<FieldSelector {...defaultProps} />);
      
      await user.click(screen.getByRole("button", { name: /select field/i }));
      
      const categoryField = screen.getByText("Category");
      await user.click(categoryField);
      
      // Should show nested schema fields (mocked)
      expect(screen.getByText(/nested fields/i)).toBeInTheDocument();
    });

    it("should show breadcrumb for current nesting level", async () => {
      const user = userEvent.setup();
      render(<FieldSelector {...defaultProps} currentFieldPath={["category"]} />);
      
      await user.click(screen.getByRole("button", { name: /select field/i }));
      
      expect(screen.getByText(/category/i)).toBeInTheDocument();
    });

    it("should allow navigation back to parent level", async () => {
      const user = userEvent.setup();
      const onSelect = vi.fn();
      
      render(<FieldSelector {...defaultProps} currentFieldPath={["category"]} onSelect={onSelect} />);
      
      await user.click(screen.getByRole("button", { name: /select field/i }));
      
      const backButton = screen.getByRole("button", { name: /back/i });
      await user.click(backButton);
      
      // Should be back at root level
      expect(screen.getByText("Name")).toBeInTheDocument();
    });

    it("should respect max depth limit", async () => {
      const user = userEvent.setup();
      render(
        <FieldSelector
          {...defaultProps}
          currentFieldPath={["level1", "level2", "level3"]}
          maxDepth={3}
        />
      );
      
      await user.click(screen.getByRole("button", { name: /select field/i }));
      
      // Relation fields should not be expandable
      const relationField = screen.queryByRole("button", { name: /expand/i });
      expect(relationField).not.toBeInTheDocument();
    });
  });

  describe("field metadata", () => {
    it("should show field type badge", async () => {
      const user = userEvent.setup();
      render(<FieldSelector {...defaultProps} />);
      
      await user.click(screen.getByRole("button", { name: /select field/i }));
      
      expect(screen.getByText(/string/i)).toBeInTheDocument();
      expect(screen.getByText(/number/i)).toBeInTheDocument();
    });

    it("should show help text when available", async () => {
      const user = userEvent.setup();
      
      const schemaWithHelp = {
        ...mockSchema,
        fields: [
          {
            ...mockSchema.fields[0],
            helpText: "Product name for filtering",
          },
        ],
      };
      
      render(<FieldSelector {...defaultProps} schema={schemaWithHelp} />);
      
      await user.click(screen.getByRole("button", { name: /select field/i }));
      
      const nameField = screen.getByText("Name");
      await user.hover(nameField);
      
      expect(screen.getByText(/product name for filtering/i)).toBeInTheDocument();
    });
  });

  describe("recently used fields", () => {
    it("should show recently used fields at the top", async () => {
      const user = userEvent.setup();
      
      render(<FieldSelector {...defaultProps} recentFields={["price", "status"]} />);
      
      await user.click(screen.getByRole("button", { name: /select field/i }));
      
      const recentSection = screen.getByText(/recently used/i);
      expect(recentSection).toBeInTheDocument();
    });

    it("should prioritize recent fields in list", async () => {
      const user = userEvent.setup();
      
      render(<FieldSelector {...defaultProps} recentFields={["price"]} />);
      
      await user.click(screen.getByRole("button", { name: /select field/i }));
      
      const allFields = screen.getAllByRole("option");
      expect(allFields[0]).toHaveTextContent("Price");
    });
  });

  describe("keyboard navigation", () => {
    it("should support arrow key navigation", async () => {
      const user = userEvent.setup();
      render(<FieldSelector {...defaultProps} />);
      
      await user.click(screen.getByRole("button", { name: /select field/i }));
      
      await user.keyboard("{ArrowDown}");
      expect(screen.getAllByRole("option")[0]).toHaveClass(/focused|selected/);
      
      await user.keyboard("{ArrowDown}");
      expect(screen.getAllByRole("option")[1]).toHaveClass(/focused|selected/);
    });

    it("should select field on Enter key", async () => {
      const user = userEvent.setup();
      const onSelect = vi.fn();
      
      render(<FieldSelector {...defaultProps} onSelect={onSelect} />);
      
      await user.click(screen.getByRole("button", { name: /select field/i }));
      await user.keyboard("{ArrowDown}");
      await user.keyboard("{Enter}");
      
      expect(onSelect).toHaveBeenCalled();
    });

    it("should close on Escape key", async () => {
      const user = userEvent.setup();
      render(<FieldSelector {...defaultProps} />);
      
      await user.click(screen.getByRole("button", { name: /select field/i }));
      await user.keyboard("{Escape}");
      
      expect(screen.queryByText("Name")).not.toBeInTheDocument();
    });
  });

  describe("accessibility", () => {
    it("should have accessible button label", () => {
      render(<FieldSelector {...defaultProps} />);
      
      const button = screen.getByRole("button", { name: /select field/i });
      expect(button).toHaveAccessibleName();
    });

    it("should announce field groups to screen readers", async () => {
      const user = userEvent.setup();
      render(<FieldSelector {...defaultProps} />);
      
      await user.click(screen.getByRole("button", { name: /select field/i }));
      
      const basicGroup = screen.getByText("Basic Info");
      expect(basicGroup).toHaveAttribute("role", "group");
    });

    it("should support screen reader navigation", async () => {
      const user = userEvent.setup();
      render(<FieldSelector {...defaultProps} />);
      
      await user.click(screen.getByRole("button", { name: /select field/i }));
      
      const options = screen.getAllByRole("option");
      options.forEach(option => {
        expect(option).toHaveAccessibleName();
      });
    });
  });

  describe("empty state", () => {
    it("should show message when no fields available", () => {
      const emptySchema = { ...mockSchema, fields: [] };
      
      render(<FieldSelector {...defaultProps} schema={emptySchema} />);
      
      expect(screen.getByText(/no fields available/i)).toBeInTheDocument();
    });
  });
});
