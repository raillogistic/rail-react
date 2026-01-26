/**
 * Unit tests for preset applicator
 */

import { describe, it, expect } from "vitest";
import { applyPresetToFilterState, graphqlWhereToFilterGroup } from "../presetApplicator";
import type { FilterGroup, FilterPreset, UnifiedFilterSchema } from "../types";

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
      operators: [
        { name: "eq", label: "Equals", graphqlType: "String", isList: false },
        { name: "contains", label: "Contains", graphqlType: "String", isList: false },
      ],
      defaultOperator: "contains",
      isRelation: false,
      uiHints: { widget: "text" },
    },
    {
      fieldName: "price",
      fieldLabel: "Price",
      baseType: "Number",
      graphqlType: "Float",
      filterInputType: "FloatFilterInput",
      operators: [
        { name: "eq", label: "Equals", graphqlType: "Float", isList: false },
        { name: "gte", label: ">=", graphqlType: "Float", isList: false },
        { name: "lte", label: "<=", graphqlType: "Float", isList: false },
      ],
      defaultOperator: "eq",
      isRelation: false,
      uiHints: { widget: "number" },
    },
    {
      fieldName: "status",
      fieldLabel: "Status",
      baseType: "String",
      graphqlType: "String",
      filterInputType: "StringFilterInput",
      operators: [
        { name: "eq", label: "Equals", graphqlType: "String", isList: false },
        { name: "in", label: "In", graphqlType: "[String]", isList: true },
      ],
      defaultOperator: "eq",
      isRelation: false,
      uiHints: { widget: "select" },
    },
  ],
  relationFilters: [],
  presets: [],
  distinctFields: [],
  fieldGroups: [],
};

describe("graphqlWhereToFilterGroup", () => {
  describe("simple conditions", () => {
    it("should convert single field condition", () => {
      const where = { name: { eq: "Test" } };
      const result = graphqlWhereToFilterGroup(where, mockSchema);

      expect(result.type).toBe("group");
      expect(result.logic).toBe("AND");
      expect(result.negated).toBe(false);
      expect(result.conditions).toHaveLength(1);

      const condition = result.conditions[0];
      expect(condition.type).toBe("condition");
      if (condition.type === "condition") {
        expect(condition.fieldPath).toEqual(["name"]);
        expect(condition.fieldName).toBe("name");
        expect(condition.operator).toBe("eq");
        expect(condition.value).toBe("Test");
      }
    });

    it("should convert multiple field conditions", () => {
      const where = {
        name: { eq: "Test" },
        price: { gte: 100 },
      };
      const result = graphqlWhereToFilterGroup(where, mockSchema);

      expect(result.conditions).toHaveLength(2);
    });
  });

  describe("logical operators", () => {
    it("should convert AND array", () => {
      const where = {
        AND: [
          { name: { eq: "Test" } },
          { price: { gte: 100 } },
        ],
      };
      const result = graphqlWhereToFilterGroup(where, mockSchema);

      expect(result.logic).toBe("AND");
      expect(result.conditions).toHaveLength(2);
    });

    it("should convert OR array", () => {
      const where = {
        OR: [
          { name: { eq: "A" } },
          { name: { eq: "B" } },
        ],
      };
      const result = graphqlWhereToFilterGroup(where, mockSchema);

      expect(result.logic).toBe("OR");
      expect(result.conditions).toHaveLength(2);
    });

    it("should convert NOT wrapper", () => {
      const where = {
        NOT: { name: { eq: "Excluded" } },
      };
      const result = graphqlWhereToFilterGroup(where, mockSchema);

      expect(result.negated).toBe(true);
      expect(result.conditions).toHaveLength(1);
    });

    it("should handle nested NOT with AND", () => {
      const where = {
        NOT: {
          AND: [
            { name: { eq: "A" } },
            { price: { lte: 50 } },
          ],
        },
      };
      const result = graphqlWhereToFilterGroup(where, mockSchema);

      expect(result.negated).toBe(true);
      expect(result.logic).toBe("AND");
      expect(result.conditions).toHaveLength(2);
    });
  });

  describe("nested structures", () => {
    it("should handle nested AND in OR", () => {
      const where = {
        OR: [
          {
            AND: [
              { name: { eq: "A" } },
              { price: { gte: 100 } },
            ],
          },
          { status: { eq: "sale" } },
        ],
      };
      const result = graphqlWhereToFilterGroup(where, mockSchema);

      expect(result.logic).toBe("OR");
      expect(result.conditions).toHaveLength(2);
      
      const nestedGroup = result.conditions[0];
      expect(nestedGroup.type).toBe("group");
      if (nestedGroup.type === "group") {
        expect(nestedGroup.logic).toBe("AND");
        expect(nestedGroup.conditions).toHaveLength(2);
      }
    });
  });

  describe("relation operators", () => {
    it("should detect _some relation operator", () => {
      const where = { tags_some: { name: { eq: "Sale" } } };
      const result = graphqlWhereToFilterGroup(where, mockSchema);

      expect(result.conditions).toHaveLength(1);
      const condition = result.conditions[0];
      if (condition.type === "condition") {
        expect(condition.fieldName).toBe("tags");
        expect(condition.relationOperator).toBe("_some");
      }
    });

    it("should detect _every relation operator", () => {
      const where = { items_every: { price: { gt: 0 } } };
      const result = graphqlWhereToFilterGroup(where, mockSchema);

      expect(result.conditions).toHaveLength(1);
      const condition = result.conditions[0];
      if (condition.type === "condition") {
        expect(condition.fieldName).toBe("items");
        expect(condition.relationOperator).toBe("_every");
      }
    });

    it("should detect _none relation operator", () => {
      const where = { categories_none: { isActive: { eq: false } } };
      const result = graphqlWhereToFilterGroup(where, mockSchema);

      expect(result.conditions).toHaveLength(1);
      const condition = result.conditions[0];
      if (condition.type === "condition") {
        expect(condition.fieldName).toBe("categories");
        expect(condition.relationOperator).toBe("_none");
      }
    });
  });

  describe("edge cases", () => {
    it("should handle empty where object", () => {
      const where = {};
      const result = graphqlWhereToFilterGroup(where, mockSchema);

      expect(result.type).toBe("group");
      expect(result.conditions).toHaveLength(0);
    });

    it("should handle unknown fields gracefully", () => {
      const where = { unknownField: { eq: "value" } };
      const result = graphqlWhereToFilterGroup(where, mockSchema);

      // Should still create a condition for unknown fields
      expect(result.conditions).toHaveLength(1);
    });
  });
});

describe("applyPresetToFilterState", () => {
  const currentState: FilterGroup = {
    id: "current",
    type: "group",
    logic: "AND",
    conditions: [
      { id: "existing", type: "condition", fieldPath: ["status"], fieldName: "status", operator: "eq", value: "active" },
    ],
    negated: false,
  };

  describe("replace mode", () => {
    it("should replace current state with preset", () => {
      const preset: FilterPreset = {
        id: "preset1",
        name: "High Price",
        filterJson: { price: { gte: 1000 } },
        source: "saved",
      };

      const result = applyPresetToFilterState(preset, currentState, mockSchema, "replace");

      expect(result.conditions).toHaveLength(1);
      const condition = result.conditions[0];
      if (condition.type === "condition") {
        expect(condition.fieldName).toBe("price");
        expect(condition.operator).toBe("gte");
        expect(condition.value).toBe(1000);
      }
    });

    it("should use replace mode by default", () => {
      const preset: FilterPreset = {
        id: "preset1",
        name: "Test",
        filterJson: { name: { eq: "New" } },
        source: "static",
      };

      const result = applyPresetToFilterState(preset, currentState, mockSchema);

      expect(result.conditions).toHaveLength(1);
      const condition = result.conditions[0];
      if (condition.type === "condition") {
        expect(condition.fieldName).toBe("name");
      }
    });
  });

  describe("merge mode", () => {
    it("should merge preset conditions with current state", () => {
      const preset: FilterPreset = {
        id: "preset1",
        name: "High Price",
        filterJson: { price: { gte: 1000 } },
        source: "saved",
      };

      const result = applyPresetToFilterState(preset, currentState, mockSchema, "merge");

      expect(result.conditions).toHaveLength(2);
      
      // Should have original condition
      const statusCondition = result.conditions.find(
        (c) => c.type === "condition" && c.fieldName === "status"
      );
      expect(statusCondition).toBeDefined();

      // Should have preset condition
      const priceCondition = result.conditions.find(
        (c) => c.type === "condition" && c.fieldName === "price"
      );
      expect(priceCondition).toBeDefined();
    });

    it("should preserve current state ID when merging", () => {
      const preset: FilterPreset = {
        id: "preset1",
        name: "Test",
        filterJson: { name: { eq: "New" } },
        source: "static",
      };

      const result = applyPresetToFilterState(preset, currentState, mockSchema, "merge");

      expect(result.id).toBe(currentState.id);
    });
  });

  describe("complex presets", () => {
    it("should handle preset with OR logic", () => {
      const preset: FilterPreset = {
        id: "preset1",
        name: "Active or Sale",
        filterJson: {
          OR: [
            { status: { eq: "active" } },
            { status: { eq: "sale" } },
          ],
        },
        source: "shared",
      };

      const result = applyPresetToFilterState(preset, currentState, mockSchema, "replace");

      expect(result.logic).toBe("OR");
      expect(result.conditions).toHaveLength(2);
    });

    it("should handle preset with NOT", () => {
      const preset: FilterPreset = {
        id: "preset1",
        name: "Not Archived",
        filterJson: {
          NOT: { status: { eq: "archived" } },
        },
        source: "static",
      };

      const result = applyPresetToFilterState(preset, currentState, mockSchema, "replace");

      expect(result.negated).toBe(true);
    });
  });
});
