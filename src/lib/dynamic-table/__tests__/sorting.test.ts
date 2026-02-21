import { describe, expect, it } from "vitest";
import {
  orderByToSortingState,
  sortingStateToOrderBy,
} from "../utils/sorting";

describe("dynamic-table sorting mapping", () => {
  it("maps orderBy entries to sorting state using sortKey descriptors", () => {
    const sorting = orderByToSortingState(
      ["-createdAt", "displayName"],
      [
        { id: "created", sortKey: "createdAt" },
        { id: "name", sortKey: "displayName" },
      ],
    );

    expect(sorting).toEqual([
      { id: "created", desc: true },
      { id: "name", desc: false },
    ]);
  });

  it("maps sorting state back to orderBy entries", () => {
    const orderBy = sortingStateToOrderBy(
      [
        { id: "name", desc: false },
        { id: "created", desc: true },
      ],
      [
        { id: "created", sortKey: "createdAt" },
        { id: "name", sortKey: "displayName" },
      ],
    );

    expect(orderBy).toEqual(["displayName", "-createdAt"]);
  });

  it("ignores unknown orderBy entries and keeps deterministic sorting order", () => {
    const sorting = orderByToSortingState(
      ["-unknown", "firstName", "firstName"],
      [{ id: "first", sortKey: "firstName" }],
    );

    expect(sorting).toEqual([{ id: "first", desc: false }]);
  });
});

