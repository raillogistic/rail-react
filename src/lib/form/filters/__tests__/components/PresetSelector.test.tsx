import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { PresetSelector } from "../..";
import type { FilterPreset } from "../..";

const presets: FilterPreset[] = [
  {
    id: "static_active",
    name: "Active",
    description: "Active items only",
    filterJson: { status: { eq: "active" } },
    source: "static",
  },
];

describe("PresetSelector", () => {
  it("renders preset selector button", () => {
    render(
      <PresetSelector
        presets={presets}
        selectedPresets={[]}
        onTogglePreset={vi.fn()}
        onApplyPreset={vi.fn()}
      />
    );
    expect(screen.getByRole("button")).toBeInTheDocument();
  });
});
