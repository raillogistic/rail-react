/**
 * Component tests for DistinctOnSelector
 */

import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DistinctOnSelector } from "../..";
import type { DistinctField } from "../..";

// Mock distinct fields
const mockDistinctFields: DistinctField[] = [
  {
    name: "category",
    fieldName: "category",
    fieldLabel: "Category",
    fieldType: "String",
    requiresOrderBy: true,
  },
  {
    name: "status",
    fieldName: "status",
    fieldLabel: "Status",
    fieldType: "String",
    requiresOrderBy: true,
  },
  {
    name: "createdAt",
    fieldName: "created_at",
    fieldLabel: "Created At",
    fieldType: "DateTime",
    requiresOrderBy: true,
  },
];

describe("DistinctOnSelector", () => {
  const defaultProps = {
    distinctFields: mockDistinctFields,
    selectedFields: [] as string[],
    orderBy: [] as string[],
    onChange: vi.fn(),
    onOrderByRequired: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("rendering", () => {
    it("should render selector button", () => {
      render(<DistinctOnSelector {...defaultProps} />);

      // Use name to distinguish from the input inside the popover (which is mocked to be always present)
      expect(screen.getByRole("combobox", { name: /distinct/i })).toBeInTheDocument();
    });

    it("should show selected count when fields are selected", () => {
      render(
        <DistinctOnSelector
          {...defaultProps}
          selectedFields={["category", "status"]}
        />
      );

      const button = screen.getByRole("combobox", { name: /distinct/i });
      // The button should contain the badge with count "2"
      expect(button).toHaveTextContent("2");
    });

    it("should show dropdown with available fields when clicked", async () => {
      const user = userEvent.setup();
      render(<DistinctOnSelector {...defaultProps} />);

      await user.click(screen.getByRole("combobox", { name: /distinct/i }));

      expect(screen.getByText("Category")).toBeInTheDocument();
      expect(screen.getByText("Status")).toBeInTheDocument();
      expect(screen.getByText("Created At")).toBeInTheDocument();
    });
  });

  describe("field selection", () => {
    it("should call onDistinctChange when field is selected", async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();

      render(
        <DistinctOnSelector
          {...defaultProps}
          onChange={onChange}
        />
      );

      await user.click(screen.getByRole("combobox", { name: /distinct/i }));

      // Use role option to be specific to the dropdown item
      await user.click(screen.getByRole("option", { name: /Category/i }));

      expect(onChange).toHaveBeenCalledWith(["category"]);
    });

    it("should toggle field when clicked again", async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();

      render(
        <DistinctOnSelector
          {...defaultProps}
          selectedFields={["category"]}
          onChange={onChange}
        />
      );

      await user.click(screen.getByRole("combobox", { name: /distinct/i }));
      await user.click(screen.getByRole("option", { name: /Category/i }));

      expect(onChange).toHaveBeenCalledWith([]);
    });

    it("should allow multiple field selection", async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();

      render(
        <DistinctOnSelector
          {...defaultProps}
          selectedFields={["category"]}
          onChange={onChange}
        />
      );

      await user.click(screen.getByRole("combobox", { name: /distinct/i }));
      await user.click(screen.getByRole("option", { name: /Status/i }));

      expect(onChange).toHaveBeenCalledWith(["category", "status"]);
    });
  });

  describe("orderBy integration", () => {
    it("should auto-add field to orderBy when selected", async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      const onOrderByRequired = vi.fn();

      render(
        <DistinctOnSelector
          {...defaultProps}
          onChange={onChange}
          onOrderByRequired={onOrderByRequired}
        />
      );

      await user.click(screen.getByRole("combobox", { name: /distinct/i }));
      await user.click(screen.getByRole("option", { name: /Category/i }));

      expect(onChange).toHaveBeenCalled();
      expect(onOrderByRequired).toHaveBeenCalledWith(["category"]);
    });

    it("should show warning when distinctOn doesn't match orderBy prefix", () => {
      render(
        <DistinctOnSelector
          {...defaultProps}
          selectedFields={["category"]}
          orderBy={["status", "name"]}
        />
      );
      
      // Should show a warning indicator
      expect(screen.getByRole("alert") || screen.getByText(/order/i)).toBeInTheDocument();
    });

    it("should not show warning when orderBy starts with distinctOn fields", () => {
      render(
        <DistinctOnSelector
          {...defaultProps}
          selectedFields={["category"]}
          orderBy={["category", "name"]}
        />
      );
      
      // Should not have warning
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });

    it("should handle descending orderBy for distinctOn", () => {
      render(
        <DistinctOnSelector
          {...defaultProps}
          selectedFields={["category"]}
          orderBy={["-category", "name"]}
        />
      );
      
      // Should not show warning for descending order
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });
  });

  describe("clear functionality", () => {
    it("should provide option to clear all distinct fields", async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();

      render(
        <DistinctOnSelector
          {...defaultProps}
          selectedFields={["category", "status"]}
          onChange={onChange}
        />
      );

      // The distinct selector itself is a combobox
      await user.click(screen.getByRole("combobox", { name: /distinct/i }));

      // The clear button is a button
      const clearButton = screen.getByRole("button", { name: /clear/i });
      await user.click(clearButton);

      expect(onChange).toHaveBeenCalledWith([]);
    });
  });

  describe("empty state", () => {
    it("should disable button when no distinct fields available", () => {
      render(
        <DistinctOnSelector
          {...defaultProps}
          distinctFields={[]}
        />
      );

      expect(screen.getByRole("combobox")).toBeDisabled();
    });
  });

  describe("accessibility", () => {
    it("should have accessible name", () => {
      render(<DistinctOnSelector {...defaultProps} />);

      const button = screen.getByRole("combobox");
      expect(button).toHaveAccessibleName();
    });

    it("should support keyboard navigation", async () => {
      const user = userEvent.setup();
      render(<DistinctOnSelector {...defaultProps} />);

      const button = screen.getByRole("combobox");
      await user.tab();
      expect(button).toHaveFocus();

      await user.keyboard("{Enter}");
      expect(screen.getByText("Category")).toBeInTheDocument();
    });
  });
});
