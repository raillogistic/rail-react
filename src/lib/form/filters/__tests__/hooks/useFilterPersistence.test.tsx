import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useFilterPersistence } from "../..";
import type { FilterFormState } from "../..";

describe("useFilterPersistence", () => {
  it("saves and loads state from localStorage", () => {
    const { result } = renderHook(() => useFilterPersistence({ key: "filters_test" }));
    const state: FilterFormState = {
      root: { id: "root", type: "group", logic: "AND", conditions: [], negated: false },
      selectedPresets: [],
      distinctOn: [],
      orderBy: [],
    };
    act(() => {
      result.current.save(state);
    });
    const loaded = result.current.load();
    expect(loaded?.root.id).toBe("root");
  });
});
