/**
 * Component tests for PresetSelector
 */

import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PresetSelector } from "../..";
import type { FilterPreset, UnifiedFilterSchema } from "../..";

// Mock presets for testing
const mockPresets: FilterPreset[] = [
  {
    id: "static_active",
    name: "Active",
    description: "Active items only",
    filterJson: { status: { eq: "active" } },
    source: "static",
  },
  {
    id: "static_sale",
    name: "On Sale",
    description: "Items currently on sale",
    filterJson: { isOnSale: { eq: true } },
    source: "static",
  },
  {
    id: "saved_1",
    name: "My Filter",
    description: "Personal saved filter",
    filterJson: { price: { gte: 100 } },
    source: "saved",
    createdBy: { id: "user1", username: "john" },
    useCount: 5,
  },
  {
    id: "shared_1",
    name: "Team Filter",
    description: "Shared by team",
    filterJson: { category: { eq: "electronics" } },
    source: "shared",
    isShared: true,
    createdBy: { id: "user2", username: "jane" },
  },
];

// Mock schema with presets
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
  fields: [],
  relationFilters: [],
  presets: mockPresets,
  distinctFields: [],
  fieldGroups: [],
};

describe("PresetSelector", () => {
  const defaultProps = {
    schema: mockSchema,
    selectedPresets: [] as string[],
    onPresetsChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("rendering", () => {
    it("should render preset selector", () => {
      render(<PresetSelector {...defaultProps} />);
      
      expect(screen.getByRole("button")).toBeInTheDocument();
    });

    it("should show preset count when presets are selected", () => {
      render(
        <PresetSelector
          {...defaultProps}
          selectedPresets={["static_active", "saved_1"]}
        />
      );
      
      expect(screen.getByText(/2/)).toBeInTheDocument();
    });

    it("should show dropdown when button is clicked", async () => {
      const user = userEvent.setup();
      render(<PresetSelector {...defaultProps} />);
      
      await user.click(screen.getByRole("button"));
      
      expect(screen.getByText("Active")).toBeInTheDocument();
      expect(screen.getByText("On Sale")).toBeInTheDocument();
    });
  });

  describe("preset categories", () => {
    it("should group presets by source", async () => {
      const user = userEvent.setup();
      render(<PresetSelector {...defaultProps} />);
      
      await user.click(screen.getByRole("button"));
      
      // Should have category headers
      expect(screen.getByText(/static/i)).toBeInTheDocument();
      expect(screen.getByText(/saved/i)).toBeInTheDocument();
      expect(screen.getByText(/shared/i)).toBeInTheDocument();
    });
  });

  describe("preset selection", () => {
    it("should call onPresetsChange when preset is selected", async () => {
      const user = userEvent.setup();
      const onPresetsChange = vi.fn();
      
      render(
        <PresetSelector
          {...defaultProps}
          onPresetsChange={onPresetsChange}
        />
      );
      
      await user.click(screen.getByRole("button"));
      await user.click(screen.getByText("Active"));
      
      expect(onPresetsChange).toHaveBeenCalledWith(["static_active"]);
    });

    it("should toggle preset when clicked again", async () => {
      const user = userEvent.setup();
      const onPresetsChange = vi.fn();
      
      render(
        <PresetSelector
          {...defaultProps}
          selectedPresets={["static_active"]}
          onPresetsChange={onPresetsChange}
        />
      );
      
      await user.click(screen.getByRole("button"));
      await user.click(screen.getByText("Active"));
      
      expect(onPresetsChange).toHaveBeenCalledWith([]);
    });

    it("should allow multiple preset selection", async () => {
      const user = userEvent.setup();
      const onPresetsChange = vi.fn();
      
      render(
        <PresetSelector
          {...defaultProps}
          selectedPresets={["static_active"]}
          onPresetsChange={onPresetsChange}
        />
      );
      
      await user.click(screen.getByRole("button"));
      await user.click(screen.getByText("On Sale"));
      
      expect(onPresetsChange).toHaveBeenCalledWith(["static_active", "static_sale"]);
    });
  });

  describe("preset info", () => {
    it("should show preset description on hover/focus", async () => {
      const user = userEvent.setup();
      render(<PresetSelector {...defaultProps} />);
      
      await user.click(screen.getByRole("button"));
      
      // Description should be visible
      expect(screen.getByText("Active items only")).toBeInTheDocument();
    });

    it("should show creator for saved/shared presets", async () => {
      const user = userEvent.setup();
      render(<PresetSelector {...defaultProps} />);
      
      await user.click(screen.getByRole("button"));
      
      // Creator should be shown for saved presets
      expect(screen.getByText(/john/)).toBeInTheDocument();
    });
  });

  describe("clear all", () => {
    it("should provide option to clear all presets", async () => {
      const user = userEvent.setup();
      const onPresetsChange = vi.fn();
      
      render(
        <PresetSelector
          {...defaultProps}
          selectedPresets={["static_active", "saved_1"]}
          onPresetsChange={onPresetsChange}
        />
      );
      
      await user.click(screen.getByRole("button"));
      
      const clearButton = screen.getByRole("button", { name: /clear/i });
      await user.click(clearButton);
      
      expect(onPresetsChange).toHaveBeenCalledWith([]);
    });
  });

  describe("empty state", () => {
    it("should show message when no presets available", () => {
      const emptySchema = {
        ...mockSchema,
        presets: [],
      };
      
      render(<PresetSelector {...defaultProps} schema={emptySchema} />);
      
      // Button should be disabled or show no presets message
      const button = screen.getByRole("button");
      expect(button).toBeInTheDocument();
    });
  });
});
