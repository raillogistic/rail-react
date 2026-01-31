import { describe, it, expect, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useFilterKeyboard } from "../..";

describe("useFilterKeyboard", () => {
  it("fires apply on ctrl+enter", () => {
    const onApply = vi.fn();
    renderHook(() => useFilterKeyboard({ onApply }));
    const event = new KeyboardEvent("keydown", { key: "Enter", ctrlKey: true });
    window.dispatchEvent(event);
    expect(onApply).toHaveBeenCalled();
  });
});
