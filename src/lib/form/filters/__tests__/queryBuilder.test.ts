/**
 * Unit tests for query builder
 */

import { describe, it, expect } from "vitest";
import { buildQueryVariables, generateQueryString } from "../queryBuilder";
import type { FilterGroup, UnifiedFilterSchema } from "../types";

// Minimal mock schema for tests
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
  fields: [
    {
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
    {
      fieldName: "price",
      fieldLabel: "Price",
      baseType: "Number",
      graphqlType: "Float",
      filterInputType: "FloatFilterInput",
      operators: [{ name: "gte", label: ">=", graphqlType: "Float", isList: false }],
      defaultOperator: "gte",
      isRelation: false,
      uiHints: { widget: "number" },
    },
  ],
  relationFilters: [],
  presets: [
    {
      id: "static_active",
      name: "active",
      description: "Active products",
      filterJson: { status: { eq: "active" } },
      source: "static",
    },
    {
      id: "static_sale",
      name: "on_sale",
      description: "On sale products",
      filterJson: { isOnSale: { eq: true } },
      source: "static",
    },
    {
      id: "saved_123",
      name: "My Custom Filter",
      filterJson: { price: { gte: 500 } },
      source: "saved",
    },
    {
      id: "shared_456",
      name: "Team Filter",
      filterJson: { category: { eq: "electronics" } },
      source: "shared",
    },
  ],
  distinctFields: [
    { fieldName: "category", fieldLabel: "Category", fieldType: "String", requiresOrderBy: true },
  ],
  fieldGroups: [],
};

describe("buildQueryVariables", () => {
  const emptyGroup: FilterGroup = {
    id: "g1",
    type: "group",
    logic: "AND",
    conditions: [],
    negated: false,
  };

  describe("basic query building", () => {
    it("should return empty object for empty filter state", () => {
      const result = buildQueryVariables({
        filterState: emptyGroup,
        schema: mockSchema,
        selectedPresets: [],
        distinctOn: [],
        orderBy: [],
        maxDepth: 3,
      });

      expect(result).toEqual({});
    });

    it("should build where clause from filter state", () => {
      const filterState: FilterGroup = {
        id: "g1",
        type: "group",
        logic: "AND",
        conditions: [
          { id: "c1", type: "condition", fieldPath: ["name"], fieldName: "name", operator: "eq", value: "Test" },
        ],
        negated: false,
      };

      const result = buildQueryVariables({
        filterState,
        schema: mockSchema,
        selectedPresets: [],
        distinctOn: [],
        orderBy: [],
        maxDepth: 3,
      });

      expect(result.where).toEqual({ name: { eq: "Test" } });
    });
  });

  describe("preset handling", () => {
    it("should include static presets as names", () => {
      const result = buildQueryVariables({
        filterState: emptyGroup,
        schema: mockSchema,
        selectedPresets: ["static_active", "static_sale"],
        distinctOn: [],
        orderBy: [],
        maxDepth: 3,
      });

      expect(result.presets).toEqual(["active", "on_sale"]);
      expect(result.where).toBeUndefined();
    });

    it("should merge saved preset conditions into where", () => {
      const result = buildQueryVariables({
        filterState: emptyGroup,
        schema: mockSchema,
        selectedPresets: ["saved_123"],
        distinctOn: [],
        orderBy: [],
        maxDepth: 3,
      });

      expect(result.presets).toBeUndefined();
      expect(result.where).toEqual({ price: { gte: 500 } });
    });

    it("should merge shared preset conditions into where", () => {
      const result = buildQueryVariables({
        filterState: emptyGroup,
        schema: mockSchema,
        selectedPresets: ["shared_456"],
        distinctOn: [],
        orderBy: [],
        maxDepth: 3,
      });

      expect(result.presets).toBeUndefined();
      expect(result.where).toEqual({ category: { eq: "electronics" } });
    });

    it("should combine filter state with saved presets using AND", () => {
      const filterState: FilterGroup = {
        id: "g1",
        type: "group",
        logic: "AND",
        conditions: [
          { id: "c1", type: "condition", fieldPath: ["name"], fieldName: "name", operator: "eq", value: "Test" },
        ],
        negated: false,
      };

      const result = buildQueryVariables({
        filterState,
        schema: mockSchema,
        selectedPresets: ["saved_123"],
        distinctOn: [],
        orderBy: [],
        maxDepth: 3,
      });

      expect(result.where).toEqual({
        AND: [
          { name: { eq: "Test" } },
          { price: { gte: 500 } },
        ],
      });
    });

    it("should handle multiple saved presets", () => {
      const result = buildQueryVariables({
        filterState: emptyGroup,
        schema: mockSchema,
        selectedPresets: ["saved_123", "shared_456"],
        distinctOn: [],
        orderBy: [],
        maxDepth: 3,
      });

      expect(result.where).toEqual({
        AND: [
          { price: { gte: 500 } },
          { category: { eq: "electronics" } },
        ],
      });
    });

    it("should handle mixed static and saved presets", () => {
      const result = buildQueryVariables({
        filterState: emptyGroup,
        schema: mockSchema,
        selectedPresets: ["static_active", "saved_123"],
        distinctOn: [],
        orderBy: [],
        maxDepth: 3,
      });

      expect(result.presets).toEqual(["active"]);
      expect(result.where).toEqual({ price: { gte: 500 } });
    });
  });

  describe("distinctOn handling", () => {
    it("should include distinctOn fields", () => {
      const result = buildQueryVariables({
        filterState: emptyGroup,
        schema: mockSchema,
        selectedPresets: [],
        distinctOn: ["category"],
        orderBy: [],
        maxDepth: 3,
      });

      expect(result.distinctOn).toEqual(["category"]);
    });

    it("should auto-add distinctOn fields to orderBy", () => {
      const result = buildQueryVariables({
        filterState: emptyGroup,
        schema: mockSchema,
        selectedPresets: [],
        distinctOn: ["category"],
        orderBy: [],
        maxDepth: 3,
      });

      expect(result.distinctOn).toEqual(["category"]);
      expect(result.orderBy).toEqual(["category"]);
    });

    it("should preserve existing orderBy direction for distinctOn fields", () => {
      const result = buildQueryVariables({
        filterState: emptyGroup,
        schema: mockSchema,
        selectedPresets: [],
        distinctOn: ["category"],
        orderBy: ["-category", "name"],
        maxDepth: 3,
      });

      expect(result.orderBy).toEqual(["-category", "name"]);
    });

    it("should ensure distinctOn fields come first in orderBy", () => {
      const result = buildQueryVariables({
        filterState: emptyGroup,
        schema: mockSchema,
        selectedPresets: [],
        distinctOn: ["category"],
        orderBy: ["name", "price"],
        maxDepth: 3,
      });

      expect(result.orderBy?.[0]).toBe("category");
    });

    it("should handle multiple distinctOn fields", () => {
      const result = buildQueryVariables({
        filterState: emptyGroup,
        schema: mockSchema,
        selectedPresets: [],
        distinctOn: ["category", "status"],
        orderBy: ["name"],
        maxDepth: 3,
      });

      expect(result.distinctOn).toEqual(["category", "status"]);
      expect(result.orderBy?.[0]).toBe("category");
      expect(result.orderBy?.[1]).toBe("status");
    });
  });

  describe("orderBy without distinctOn", () => {
    it("should include orderBy when no distinctOn", () => {
      const result = buildQueryVariables({
        filterState: emptyGroup,
        schema: mockSchema,
        selectedPresets: [],
        distinctOn: [],
        orderBy: ["name", "-price"],
        maxDepth: 3,
      });

      expect(result.distinctOn).toBeUndefined();
      expect(result.orderBy).toEqual(["name", "-price"]);
    });
  });

  describe("pagination", () => {
    it("should include limit", () => {
      const result = buildQueryVariables({
        filterState: emptyGroup,
        schema: mockSchema,
        selectedPresets: [],
        distinctOn: [],
        orderBy: [],
        pagination: { limit: 50 },
        maxDepth: 3,
      });

      expect(result.limit).toBe(50);
    });

    it("should include offset", () => {
      const result = buildQueryVariables({
        filterState: emptyGroup,
        schema: mockSchema,
        selectedPresets: [],
        distinctOn: [],
        orderBy: [],
        pagination: { offset: 100 },
        maxDepth: 3,
      });

      expect(result.offset).toBe(100);
    });

    it("should include both limit and offset", () => {
      const result = buildQueryVariables({
        filterState: emptyGroup,
        schema: mockSchema,
        selectedPresets: [],
        distinctOn: [],
        orderBy: [],
        pagination: { limit: 25, offset: 50 },
        maxDepth: 3,
      });

      expect(result.limit).toBe(25);
      expect(result.offset).toBe(50);
    });
  });

  describe("complex scenarios", () => {
    it("should build complete query with all options", () => {
      const filterState: FilterGroup = {
        id: "g1",
        type: "group",
        logic: "AND",
        conditions: [
          { id: "c1", type: "condition", fieldPath: ["name"], fieldName: "name", operator: "eq", value: "Test" },
        ],
        negated: false,
      };

      const result = buildQueryVariables({
        filterState,
        schema: mockSchema,
        selectedPresets: ["static_active"],
        distinctOn: ["category"],
        orderBy: ["-category", "name"],
        pagination: { limit: 20, offset: 40 },
        maxDepth: 3,
      });

      expect(result.where).toEqual({ name: { eq: "Test" } });
      expect(result.presets).toEqual(["active"]);
      expect(result.distinctOn).toEqual(["category"]);
      expect(result.orderBy).toEqual(["-category", "name"]);
      expect(result.limit).toBe(20);
      expect(result.offset).toBe(40);
    });
  });
});

describe("generateQueryString", () => {
  it("should generate query string with all variables", () => {
    const variables = {
      where: { name: { eq: "Test" } },
      presets: ["active"],
      distinctOn: ["category"],
      orderBy: ["category", "name"],
      limit: 20,
      offset: 0,
    };

    const result = generateQueryString("Product", variables);

    expect(result).toContain("query ProductList");
    expect(result).toContain("$where: ProductWhereInput");
    expect(result).toContain("$presets: [String]");
    expect(result).toContain("$distinctOn: [String]");
    expect(result).toContain("$orderBy: [String]");
    expect(result).toContain("$limit: Int");
    expect(result).toContain("$offset: Int");
    expect(result).toContain("products(");
    expect(result).toContain("where: $where");
  });

  it("should generate minimal query with no variables", () => {
    const variables = {};

    const result = generateQueryString("Product", variables);

    expect(result).toContain("query ProductList");
    expect(result).toContain("products {");
    expect(result).not.toContain("where: $where");
  });

  it("should include JSON representation of variables", () => {
    const variables = {
      where: { name: { eq: "Test" } },
    };

    const result = generateQueryString("Product", variables);

    expect(result).toContain("# Variables:");
    expect(result).toContain('"name"');
    expect(result).toContain('"eq"');
    expect(result).toContain('"Test"');
  });
});
