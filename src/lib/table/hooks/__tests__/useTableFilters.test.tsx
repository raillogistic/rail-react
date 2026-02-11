import React from "react";
import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TableProvider } from "../../context/TableContext";
import { useTableFilters } from "../useTableFilters";
import type { FilterFormState } from "../../../filters/types";

function makeState(overrides: Partial<FilterFormState> = {}): FilterFormState {
  return {
    root: {
      id: "root",
      type: "group",
      logic: "AND",
      negated: false,
      conditions: [],
    },
    selectedPresets: [],
    distinctOn: [],
    orderBy: [],
    relationFunctions: [],
    ...overrides,
  };
}

describe("useTableFilters", () => {
  it("updates existing nested conditions via canonical tree actions", () => {
    const initialFilters = makeState({
      root: {
        id: "root",
        type: "group",
        logic: "AND",
        negated: false,
        conditions: [
          {
            id: "group-1",
            type: "group",
            logic: "OR",
            negated: false,
            conditions: [
              {
                id: "cond-1",
                type: "condition",
                fieldPath: ["status"],
                fieldName: "status",
                operator: "eq",
                value: "DRAFT",
              },
            ],
          },
        ],
      },
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <TableProvider initialState={{ advancedFilters: initialFilters }}>
        {children}
      </TableProvider>
    );

    const { result } = renderHook(() => useTableFilters(), { wrapper });

    act(() => {
      result.current.addFilterCondition({
        fieldPath: ["status"],
        fieldName: "status",
        operator: "eq",
        value: "PAID",
      });
    });

    const root = result.current.advancedFilters.root;
    expect(root.conditions).toHaveLength(1);
    expect(root.conditions[0].type).toBe("group");
    const nested = root.conditions[0];
    if (nested.type !== "group") {
      throw new Error("Expected nested group");
    }
    expect(nested.conditions).toHaveLength(1);
    expect(nested.conditions[0]).toMatchObject({
      type: "condition",
      fieldPath: ["status"],
      operator: "eq",
      value: "PAID",
    });
  });

  it("migrates legacy header relation keys into canonical relationFunctions", async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <TableProvider
        initialState={{
          advancedFilters: makeState(),
          filterVariables: {
            __headerRelationFilters: {
              itemsCount: {
                itemsCount: { gte: 2 },
              },
            },
            __baseWhere: {},
            where: {
              itemsCount: { gte: 2 },
            },
          },
        }}
      >
        {children}
      </TableProvider>
    );

    const { result } = renderHook(() => useTableFilters(), { wrapper });

    await waitFor(() => {
      expect(result.current.advancedFilters.relationFunctions).toHaveLength(1);
    });

    expect(result.current.advancedFilters.relationFunctions[0]).toMatchObject({
      relationName: "items",
      mode: "count",
      operator: "gte",
      value: 2,
    });
    expect(result.current.filterVariables).toBeDefined();
    const variables = result.current.filterVariables as Record<string, unknown>;
    expect(variables.__headerRelationFilters).toBeUndefined();
    expect(variables.__baseWhere).toBeUndefined();
  });

  it("clears root, presets and relation functions with one reset action", () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <TableProvider
        initialState={{
          quickSearch: "paid",
          advancedFilters: makeState({
            root: {
              id: "root",
              type: "group",
              logic: "AND",
              negated: false,
              conditions: [
                {
                  id: "cond-1",
                  type: "condition",
                  fieldPath: ["status"],
                  fieldName: "status",
                  operator: "eq",
                  value: "PAID",
                },
              ],
            },
            selectedPresets: ["recent"],
            relationFunctions: [
              {
                id: "items:count",
                relationName: "items",
                relationPath: ["items"],
                mode: "count",
                operator: "gte",
                value: 1,
              },
            ],
          }),
        }}
      >
        {children}
      </TableProvider>
    );

    const { result } = renderHook(() => useTableFilters(), { wrapper });

    act(() => {
      result.current.clearAllFilters();
    });

    expect(result.current.quickSearch).toBe("");
    expect(result.current.advancedFilters.root.conditions).toHaveLength(0);
    expect(result.current.advancedFilters.selectedPresets).toHaveLength(0);
    expect(result.current.advancedFilters.relationFunctions).toHaveLength(0);
    expect(result.current.hasActiveFilters).toBe(false);
  });
});
