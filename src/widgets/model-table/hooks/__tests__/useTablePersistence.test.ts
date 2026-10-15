import { afterEach, describe, expect, it } from "vitest";

import {
  clearPendingTablePersistenceReset,
  getNormalizedTablePersistenceKeys,
  loadPersistedTableState,
  markPendingTablePersistenceReset,
} from "../useTablePersistence";

describe("useTablePersistence helpers", () => {
  afterEach(() => {
    window.localStorage.clear();
  });

  it("normalizes persistence keys with and without trailing slash", () => {
    expect(getNormalizedTablePersistenceKeys("catalog-users")).toEqual([
      "catalog-users",
      "catalog-users/",
    ]);
    expect(getNormalizedTablePersistenceKeys("catalog-users/")).toEqual([
      "catalog-users/",
      "catalog-users",
    ]);
  });

  it("ignores persisted user config while a hard-reset marker is active", () => {
    markPendingTablePersistenceReset("catalog-users");

    const state = loadPersistedTableState("catalog-users", {
      "catalog-users": {
        columnOrder: ["name"],
        columnVisibility: { name: true },
        perPage: 25,
        density: "compact",
        wrapCells: false,
      },
    });

    expect(state).toBeNull();

    clearPendingTablePersistenceReset("catalog-users");

    const restoredState = loadPersistedTableState("catalog-users", {
      "catalog-users": {
        columnOrder: ["name"],
        columnVisibility: { name: true },
        perPage: 25,
        density: "compact",
        wrapCells: false,
      },
    });

    expect(restoredState).toMatchObject({
      columnOrder: ["name"],
      perPage: 25,
      density: "compact",
      wrapCells: false,
    });
  });

  it("restores local fallback state across trailing-slash key variants", () => {
    window.localStorage.setItem(
      "rail-table-v2:catalog-Benificiaire-/catalog/beneficiaire",
      JSON.stringify({
        columnOrder: ["name"],
        columnVisibility: { name: true },
        perPage: 50,
        density: "compact",
        wrapCells: false,
      }),
    );

    const restoredState = loadPersistedTableState(
      "catalog-Benificiaire-/catalog/beneficiaire/",
      null,
      { allowLocalFallback: true },
    );

    expect(restoredState).toMatchObject({
      columnOrder: ["name"],
      perPage: 50,
      density: "compact",
      wrapCells: false,
    });
  });
});
