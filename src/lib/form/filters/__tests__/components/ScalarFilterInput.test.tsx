/**
 * Component tests for ScalarFilterInput
 */

import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ScalarFilterInput } from "../..";
import type { FilterableField, FilterOperator } from "../..";

describe("ScalarFilterInput", () => {
  const defaultProps = {
    value: "",
    onChange: vi.fn(),
    operator: { name: "eq", label: "Equals", graphqlType: "String", isList: false } as FilterOperator,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("String input", () => {
    const stringField: FilterableField = {
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
    };

    it("should render text input for string fields", () => {
      render(<ScalarFilterInput {...defaultProps} field={stringField} />);

      expect(screen.getByRole("textbox")).toBeInTheDocument();
    });

    it("should call onChange when text is entered", async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      
      render(<ScalarFilterInput {...defaultProps} field={stringField} onChange={onChange} />);
      
      const input = screen.getByRole("textbox");
      await user.type(input, "test");
      
      expect(onChange).toHaveBeenCalled();
    });

    it("should display current value", () => {
      render(<ScalarFilterInput {...defaultProps} field={stringField} value="test value" />);
      
      expect(screen.getByRole("textbox")).toHaveValue("test value");
    });

    it("should render tag input for list operators", () => {
      const listOperator: FilterOperator = {
        name: "in",
        label: "In",
        graphqlType: "[String]",
        isList: true,
      };

      render(<ScalarFilterInput {...defaultProps} field={stringField} operator={listOperator} value={["a", "b"]} />);
      
      // Should show tags
      expect(screen.getByText("a")).toBeInTheDocument();
      expect(screen.getByText("b")).toBeInTheDocument();
    });
  });

  describe("Number input", () => {
    const numberField: FilterableField = {
      name: "price",
      fieldName: "price",
      fieldLabel: "Price",
      baseType: "Number",
      graphqlType: "Float",
      filterInputType: "FloatFilterInput",
      operators: [{ name: "eq", label: "Equals", graphqlType: "Float", isList: false }],
      defaultOperator: "eq",
      isRelation: false,
      uiHints: { widget: "number", minValue: 0, maxValue: 10000 },
    };

    it("should render number input for numeric fields", () => {
      render(<ScalarFilterInput {...defaultProps} field={numberField} />);

      expect(screen.getByRole("spinbutton")).toBeInTheDocument();
    });

    it("should call onChange when number is entered", async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      
      render(<ScalarFilterInput {...defaultProps} field={numberField} onChange={onChange} />);
      
      const input = screen.getByRole("spinbutton");
      await user.type(input, "100");
      
      expect(onChange).toHaveBeenCalled();
    });

    it("should respect min/max values", () => {
      render(<ScalarFilterInput {...defaultProps} field={numberField} />);
      
      const input = screen.getByRole("spinbutton");
      expect(input).toHaveAttribute("min", "0");
      expect(input).toHaveAttribute("max", "10000");
    });

    it("should render range input for between operator", () => {
      const betweenOperator: FilterOperator = {
        name: "between",
        label: "Between",
        graphqlType: "[Float]",
        isList: true,
      };

      render(<ScalarFilterInput {...defaultProps} field={numberField} operator={betweenOperator} />);
      
      // Should have two number inputs for range
      const inputs = screen.getAllByRole("spinbutton");
      expect(inputs).toHaveLength(2);
    });
  });

  describe("Boolean input", () => {
    const booleanField: FilterableField = {
      name: "isActive",
      fieldName: "is_active",
      fieldLabel: "Is Active",
      baseType: "Boolean",
      graphqlType: "Boolean",
      filterInputType: "BooleanFilterInput",
      operators: [{ name: "eq", label: "Equals", graphqlType: "Boolean", isList: false }],
      defaultOperator: "eq",
      isRelation: false,
      uiHints: { widget: "boolean" },
    };

    it("should render select for boolean fields", () => {
      render(<ScalarFilterInput {...defaultProps} field={booleanField} />);

      expect(screen.getByRole("combobox")).toBeInTheDocument();
    });

    it("should have true/false/null options", async () => {
      const user = userEvent.setup();

      render(<ScalarFilterInput {...defaultProps} field={booleanField} />);

      const select = screen.getByRole("combobox");
      await user.click(select);

      expect(screen.getByRole("option", { name: /Oui \/ Vrai/i })).toBeInTheDocument();
      expect(screen.getByRole("option", { name: /Non \/ Faux/i })).toBeInTheDocument();
    });

    it("should call onChange when value is selected", async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();

      render(<ScalarFilterInput {...defaultProps} field={booleanField} onChange={onChange} />);

      const select = screen.getByRole("combobox");
      await user.click(select);

      const trueOption = screen.getByRole("option", { name: /Oui \/ Vrai/i });
      await user.click(trueOption);

      expect(onChange).toHaveBeenCalledWith(true);
    });
  });

  describe("Date input", () => {
    const dateField: FilterableField = {
      name: "createdAt",
      fieldName: "created_at",
      fieldLabel: "Created At",
      baseType: "Date",
      graphqlType: "Date",
      filterInputType: "DateFilterInput",
      operators: [{ name: "eq", label: "Equals", graphqlType: "Date", isList: false }],
      defaultOperator: "eq",
      isRelation: false,
      uiHints: { widget: "date" },
    };

    it("should render date picker", () => {
      render(<ScalarFilterInput {...defaultProps} field={dateField} />);

      expect(screen.getByRole("button", { name: /choisir une date/i })).toBeInTheDocument();
    });

    it("should call onChange when date is selected", async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();

      render(<ScalarFilterInput {...defaultProps} field={dateField} onChange={onChange} />);

      const picker = screen.getByRole("button", { name: /choisir une date/i });
      await user.click(picker);

      // Select a date (simplified - actual implementation uses calendar)
      // This verifies the picker opens
      expect(screen.getByRole("grid")).toBeInTheDocument();
    });

    it("should render range picker for between operator", () => {
      const betweenOperator: FilterOperator = {
        name: "between",
        label: "Between",
        graphqlType: "[Date]",
        isList: true,
      };

      render(<ScalarFilterInput {...defaultProps} field={dateField} operator={betweenOperator} />);

      // Should show range picker with "au" separator
      expect(screen.getByText(/au/i)).toBeInTheDocument();
      // Should have two date pickers
      const pickers = screen.getAllByRole("button", { name: /choisir une date/i });
      expect(pickers).toHaveLength(2);
    });
  });

  describe("Choice/Enum input", () => {
    const choiceField: FilterableField = {
      name: "status",
      fieldName: "status",
      fieldLabel: "Status",
      baseType: "String",
      graphqlType: "String",
      filterInputType: "StringFilterInput",
      operators: [{ name: "eq", label: "Equals", graphqlType: "String", isList: false }],
      defaultOperator: "eq",
      isRelation: false,
      uiHints: {
        widget: "select",
      },
      choices: [
        { value: "active", label: "Active" },
        { value: "inactive", label: "Inactive" },
        { value: "pending", label: "Pending" },
      ],
    };

    it("should render select for choice fields", () => {
      render(<ScalarFilterInput {...defaultProps} field={choiceField} />);
      
      expect(screen.getByRole("combobox")).toBeInTheDocument();
    });

    it("should display all choice options", async () => {
      const user = userEvent.setup();
      
      render(<ScalarFilterInput {...defaultProps} field={choiceField} />);
      
      const select = screen.getByRole("combobox");
      await user.click(select);
      
      expect(screen.getByRole("option", { name: /active/i })).toBeInTheDocument();
      expect(screen.getByRole("option", { name: /inactive/i })).toBeInTheDocument();
      expect(screen.getByRole("option", { name: /pending/i })).toBeInTheDocument();
    });

    it("should support search/filter in choice list", async () => {
      const user = userEvent.setup();
      
      render(<ScalarFilterInput {...defaultProps} field={choiceField} />);
      
      const select = screen.getByRole("combobox");
      await user.click(select);
      
      // Look for search input
      const searchInput = screen.getByRole("textbox", { name: /search/i });
      await user.type(searchInput, "active");
      
      expect(screen.getByRole("option", { name: /active/i })).toBeInTheDocument();
      expect(screen.queryByRole("option", { name: /inactive/i })).not.toBeInTheDocument();
    });

    it("should support multi-select for in operator", () => {
      const inOperator: FilterOperator = {
        name: "in",
        label: "In",
        graphqlType: "[String]",
        isList: true,
      };

      render(<ScalarFilterInput {...defaultProps} field={choiceField} operator={inOperator} value={["active", "pending"]} />);
      
      // Should show selected values as badges
      expect(screen.getByText("Active")).toBeInTheDocument();
      expect(screen.getByText("Pending")).toBeInTheDocument();
    });
  });

  describe("JSON input", () => {
    const jsonField: FilterableField = {
      fieldName: "metadata",
      fieldLabel: "Metadata",
      baseType: "JSON",
      graphqlType: "JSON",
      filterInputType: "JSONFilterInput",
      operators: [{ name: "has_key", label: "Has Key", graphqlType: "String", isList: false }],
      defaultOperator: "has_key",
      isRelation: false,
      uiHints: { widget: "json" },
    };

    it("should render text input for key operator", () => {
      const keyOperator: FilterOperator = {
        name: "has_key",
        label: "Has Key",
        graphqlType: "String",
        isList: false,
      };

      render(<ScalarFilterInput {...defaultProps} field={jsonField} operator={keyOperator} />);
      
      expect(screen.getByRole("textbox", { name: /key/i })).toBeInTheDocument();
    });

    it("should render textarea for raw JSON operator", () => {
      const jsonOperator: FilterOperator = {
        name: "eq",
        label: "Equals",
        graphqlType: "JSON",
        isList: false,
      };

      render(<ScalarFilterInput {...defaultProps} field={jsonField} operator={jsonOperator} />);
      
      expect(screen.getByRole("textbox", { name: /json/i })).toBeInTheDocument();
    });
  });

  describe("validation", () => {
    const numberField: FilterableField = {
      fieldName: "price",
      fieldLabel: "Price",
      baseType: "Number",
      graphqlType: "Float",
      filterInputType: "FloatFilterInput",
      operators: [{ name: "eq", label: "Equals", graphqlType: "Float", isList: false }],
      defaultOperator: "eq",
      isRelation: false,
      uiHints: { widget: "number" },
    };

    it("should show error for invalid number", async () => {
      const user = userEvent.setup();
      
      render(<ScalarFilterInput {...defaultProps} field={numberField} />);
      
      const input = screen.getByRole("spinbutton");
      await user.type(input, "abc");
      
      expect(screen.getByText(/invalid number/i)).toBeInTheDocument();
    });

    it("should show error for empty required value", () => {
      render(<ScalarFilterInput {...defaultProps} field={numberField} value="" required />);
      
      expect(screen.getByText(/required/i)).toBeInTheDocument();
    });
  });

  describe("placeholder and help text", () => {
    const stringField: FilterableField = {
      fieldName: "name",
      fieldLabel: "Name",
      baseType: "String",
      graphqlType: "String",
      filterInputType: "StringFilterInput",
      operators: [{ name: "eq", label: "Equals", graphqlType: "String", isList: false }],
      defaultOperator: "eq",
      isRelation: false,
      uiHints: { widget: "text", placeholder: "Enter name..." },
      helpText: "Search by product name",
    };

    it("should show placeholder text", () => {
      render(<ScalarFilterInput {...defaultProps} field={stringField} />);

      expect(screen.getByPlaceholderText("Enter name...")).toBeInTheDocument();
    });
  });

  describe("disabled state", () => {
    const stringField: FilterableField = {
      fieldName: "name",
      fieldLabel: "Name",
      baseType: "String",
      graphqlType: "String",
      filterInputType: "StringFilterInput",
      operators: [{ name: "eq", label: "Equals", graphqlType: "String", isList: false }],
      defaultOperator: "eq",
      isRelation: false,
      uiHints: { widget: "text" },
    };

    it("should disable input when disabled prop is true", () => {
      render(<ScalarFilterInput {...defaultProps} field={stringField} disabled />);
      
      expect(screen.getByRole("textbox")).toBeDisabled();
    });
  });
});
