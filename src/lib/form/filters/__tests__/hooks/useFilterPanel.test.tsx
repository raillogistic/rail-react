import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useFilterPanel } from "../..";
import type { UnifiedFilterSchema } from "../..";

const schema: UnifiedFilterSchema = {
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
  fields: [
    {
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
    },
  ],
  relationFilters: [],
  presets: [],
  distinctFields: [],
  fieldGroups: [],
};

describe("useFilterPanel", () => {
  it("adds a condition", () => {
    const { result } = renderHook(() => useFilterPanel({ schema }));
    act(() => {
      result.current.addCondition(["name"], "name", "eq");
    });
    expect(result.current.state.root.conditions.length).toBe(1);
  });
});
