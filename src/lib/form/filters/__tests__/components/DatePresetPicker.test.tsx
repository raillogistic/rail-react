import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DatePresetPicker } from "../..";

describe("DatePresetPicker", () => {
  it("calls onSelect when preset clicked", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(
      <DatePresetPicker
        presets={[{ key: "today", label: "Today" }]}
        onSelect={onSelect}
      />
    );

    await user.click(screen.getByRole("button", { name: /presets/i }));
    await user.click(screen.getByRole("menuitem", { name: /today/i }));

    expect(onSelect).toHaveBeenCalled();
  });
});
