/**
 * Unit tests for filter serializer
 */

import { describe, it, expect } from "vitest";
import { serializeFilterToGraphQL } from "../serializer";
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
    {
      fieldName: "category",
      fieldLabel: "Category",
      baseType: "Relationship",
      graphqlType: "Category",
      filterInputType: "CategoryWhereInput",
      operators: [],
      defaultOperator: "eq",
      isRelation: true,
      relationConfig: {
        relatedApp: "store",
        relatedModel: "Category",
        lookupField: "id",
        searchFields: ["name"],
      },
      uiHints: { widget: "combobox" },
    },
  ],
  relationFilters: [
    {
      fieldName: "category",
      fieldLabel: "Category",
      relationType: "FOREIGN_KEY",
      relatedApp: "store",
      relatedModel: "Category",
      nestedFilterType: "CategoryWhereInput",
      supportsDirectFilter: true,
      supportsSome: false,
      supportsEvery: false,
      supportsNone: false,
      supportsCount: false,
      supportsIsNull: true,
    },
    {
      fieldName: "tags",
      fieldLabel: "Tags",
      relationType: "MANY_TO_MANY",
      relatedApp: "store",
      relatedModel: "Tag",
      nestedFilterType: "TagWhereInput",
      supportsDirectFilter: false,
      supportsSome: true,
      supportsEvery: true,
      supportsNone: true,
      supportsCount: true,
      supportsIsNull: false,
    },
  ],
  presets: [],
  distinctFields: [],
  fieldGroups: [],
};

describe("serializeFilterToGraphQL", () => {
  describe("empty and simple cases", () => {
    it("should return empty object for empty group", () => {
      const group: FilterGroup = {
        id: "g1",
        type: "group",
        logic: "AND",
        conditions: [],
        negated: false,
      };

      const result = serializeFilterToGraphQL(group, mockSchema, 3);
      expect(result).toEqual({});
    });

    it("should serialize single condition without wrapping in logic array", () => {
      const group: FilterGroup = {
        id: "g1",
        type: "group",
        logic: "AND",
        conditions: [
          { id: "c1", type: "condition", fieldPath: ["name"], fieldName: "name", operator: "eq", value: "Test" },
        ],
        negated: false,
      };

      const result = serializeFilterToGraphQL(group, mockSchema, 3);
      expect(result).toEqual({ name: { eq: "Test" } });
    });

    it("should skip conditions with empty values", () => {
      const group: FilterGroup = {
        id: "g1",
        type: "group",
        logic: "AND",
        conditions: [
          { id: "c1", type: "condition", fieldPath: ["name"], fieldName: "name", operator: "eq", value: "" },
          { id: "c2", type: "condition", fieldPath: ["price"], fieldName: "price", operator: "gte", value: undefined },
          { id: "c3", type: "condition", fieldPath: ["status"], fieldName: "status", operator: "in", value: [] },
        ],
        negated: false,
      };

      const result = serializeFilterToGraphQL(group, mockSchema, 3);
      expect(result).toEqual({});
    });
  });

  describe("multiple conditions", () => {
    it("should wrap multiple conditions in AND", () => {
      const group: FilterGroup = {
        id: "g1",
        type: "group",
        logic: "AND",
        conditions: [
          { id: "c1", type: "condition", fieldPath: ["name"], fieldName: "name", operator: "eq", value: "Test" },
          { id: "c2", type: "condition", fieldPath: ["price"], fieldName: "price", operator: "gte", value: 100 },
        ],
        negated: false,
      };

      const result = serializeFilterToGraphQL(group, mockSchema, 3);
      expect(result).toEqual({
        AND: [
          { name: { eq: "Test" } },
          { price: { gte: 100 } },
        ],
      });
    });

    it("should wrap multiple conditions in OR", () => {
      const group: FilterGroup = {
        id: "g1",
        type: "group",
        logic: "OR",
        conditions: [
          { id: "c1", type: "condition", fieldPath: ["name"], fieldName: "name", operator: "eq", value: "Test1" },
          { id: "c2", type: "condition", fieldPath: ["name"], fieldName: "name", operator: "eq", value: "Test2" },
        ],
        negated: false,
      };

      const result = serializeFilterToGraphQL(group, mockSchema, 3);
      expect(result).toEqual({
        OR: [
          { name: { eq: "Test1" } },
          { name: { eq: "Test2" } },
        ],
      });
    });
  });

  describe("NOT negation", () => {
    it("should wrap single condition in NOT", () => {
      const group: FilterGroup = {
        id: "g1",
        type: "group",
        logic: "AND",
        conditions: [
          { id: "c1", type: "condition", fieldPath: ["name"], fieldName: "name", operator: "eq", value: "Test" },
        ],
        negated: true,
      };

      const result = serializeFilterToGraphQL(group, mockSchema, 3);
      expect(result).toEqual({
        NOT: { name: { eq: "Test" } },
      });
    });

    it("should wrap multiple conditions in NOT with AND", () => {
      const group: FilterGroup = {
        id: "g1",
        type: "group",
        logic: "AND",
        conditions: [
          { id: "c1", type: "condition", fieldPath: ["name"], fieldName: "name", operator: "eq", value: "Test" },
          { id: "c2", type: "condition", fieldPath: ["price"], fieldName: "price", operator: "gte", value: 100 },
        ],
        negated: true,
      };

      const result = serializeFilterToGraphQL(group, mockSchema, 3);
      expect(result).toEqual({
        NOT: {
          AND: [
            { name: { eq: "Test" } },
            { price: { gte: 100 } },
          ],
        },
      });
    });
  });

  describe("nested groups", () => {
    it("should handle nested OR inside AND", () => {
      const group: FilterGroup = {
        id: "g1",
        type: "group",
        logic: "AND",
        conditions: [
          { id: "c1", type: "condition", fieldPath: ["price"], fieldName: "price", operator: "gte", value: 100 },
          {
            id: "g2",
            type: "group",
            logic: "OR",
            conditions: [
              { id: "c2", type: "condition", fieldPath: ["name"], fieldName: "name", operator: "eq", value: "A" },
              { id: "c3", type: "condition", fieldPath: ["name"], fieldName: "name", operator: "eq", value: "B" },
            ],
            negated: false,
          },
        ],
        negated: false,
      };

      const result = serializeFilterToGraphQL(group, mockSchema, 3);
      expect(result).toEqual({
        AND: [
          { price: { gte: 100 } },
          {
            OR: [
              { name: { eq: "A" } },
              { name: { eq: "B" } },
            ],
          },
        ],
      });
    });

    it("should handle nested NOT group", () => {
      const group: FilterGroup = {
        id: "g1",
        type: "group",
        logic: "AND",
        conditions: [
          { id: "c1", type: "condition", fieldPath: ["price"], fieldName: "price", operator: "gte", value: 100 },
          {
            id: "g2",
            type: "group",
            logic: "AND",
            conditions: [
              { id: "c2", type: "condition", fieldPath: ["name"], fieldName: "name", operator: "eq", value: "Excluded" },
            ],
            negated: true,
          },
        ],
        negated: false,
      };

      const result = serializeFilterToGraphQL(group, mockSchema, 3);
      expect(result).toEqual({
        AND: [
          { price: { gte: 100 } },
          { NOT: { name: { eq: "Excluded" } } },
        ],
      });
    });
  });

  describe("nested field paths", () => {
    it("should build nested filter for FK relation", () => {
      const group: FilterGroup = {
        id: "g1",
        type: "group",
        logic: "AND",
        conditions: [
          { 
            id: "c1", 
            type: "condition", 
            fieldPath: ["category", "name"], 
            fieldName: "name", 
            operator: "eq", 
            value: "Electronics" 
          },
        ],
        negated: false,
      };

      const result = serializeFilterToGraphQL(group, mockSchema, 3);
      expect(result).toEqual({
        category: { name: { eq: "Electronics" } },
      });
    });

    it("should use relation operator for M2M fields", () => {
      const group: FilterGroup = {
        id: "g1",
        type: "group",
        logic: "AND",
        conditions: [
          { 
            id: "c1", 
            type: "condition", 
            fieldPath: ["tags", "name"], 
            fieldName: "name", 
            operator: "eq", 
            value: "Sale",
            relationOperator: "_some",
          },
        ],
        negated: false,
      };

      const result = serializeFilterToGraphQL(group, mockSchema, 3);
      expect(result).toEqual({
        tags_some: { name: { eq: "Sale" } },
      });
    });
  });

  describe("edge cases", () => {
    it("should handle null value as empty", () => {
      const group: FilterGroup = {
        id: "g1",
        type: "group",
        logic: "AND",
        conditions: [
          { id: "c1", type: "condition", fieldPath: ["name"], fieldName: "name", operator: "eq", value: null },
        ],
        negated: false,
      };

      const result = serializeFilterToGraphQL(group, mockSchema, 3);
      expect(result).toEqual({});
    });

    it("should handle boolean false as valid value", () => {
      const group: FilterGroup = {
        id: "g1",
        type: "group",
        logic: "AND",
        conditions: [
          { id: "c1", type: "condition", fieldPath: ["isActive"], fieldName: "isActive", operator: "eq", value: false },
        ],
        negated: false,
      };

      const result = serializeFilterToGraphQL(group, mockSchema, 3);
      expect(result).toEqual({ isActive: { eq: false } });
    });

    it("should handle number zero as valid value", () => {
      const group: FilterGroup = {
        id: "g1",
        type: "group",
        logic: "AND",
        conditions: [
          { id: "c1", type: "condition", fieldPath: ["price"], fieldName: "price", operator: "gte", value: 0 },
        ],
        negated: false,
      };

      const result = serializeFilterToGraphQL(group, mockSchema, 3);
      expect(result).toEqual({ price: { gte: 0 } });
    });

    it("should handle array values for 'in' operator", () => {
      const group: FilterGroup = {
        id: "g1",
        type: "group",
        logic: "AND",
        conditions: [
          { id: "c1", type: "condition", fieldPath: ["status"], fieldName: "status", operator: "in", value: ["active", "pending"] },
        ],
        negated: false,
      };

      const result = serializeFilterToGraphQL(group, mockSchema, 3);
      expect(result).toEqual({ status: { in: ["active", "pending"] } });
    });
  });
});
