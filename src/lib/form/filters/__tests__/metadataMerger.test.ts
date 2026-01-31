/**
 * Unit tests for metadata merger
 */

import { describe, it, expect } from "vitest";
import { mergeFilterMetadata } from "../metadataMerger";

describe("mergeFilterMetadata", () => {
  const mockModelSchema = {
    modelSchema: {
      app: "store",
      model: "Product",
      verboseName: "Product",
      verboseNamePlural: "Products",
      fields: [
        {
          name: "name",
          fieldName: "name",
          verboseName: "Name",
          helpText: "Product name",
          fieldType: "CharField",
          graphqlType: "String",
          required: true,
          nullable: false,
          choices: null,
          isRelation: false,
          isNumeric: false,
          isDate: false,
          isDatetime: false,
          isBoolean: false,
          isText: true,
          isIndexed: true,
        },
        {
          name: "price",
          fieldName: "price",
          verboseName: "Price",
          helpText: "Product price",
          fieldType: "DecimalField",
          graphqlType: "Float",
          required: true,
          nullable: false,
          choices: null,
          isRelation: false,
          isNumeric: true,
          isDate: false,
          isDatetime: false,
          isBoolean: false,
          isText: false,
          isIndexed: true,
          minValue: 0,
          maxValue: 10000,
        },
        {
          name: "status",
          fieldName: "status",
          verboseName: "Status",
          helpText: null,
          fieldType: "CharField",
          graphqlType: "String",
          required: true,
          nullable: false,
          choices: [
            { value: "active", label: "Active" },
            { value: "inactive", label: "Inactive" },
          ],
          isRelation: false,
          isNumeric: false,
          isDate: false,
          isDatetime: false,
          isBoolean: false,
          isText: true,
        },
        {
          name: "isActive",
          fieldName: "is_active",
          verboseName: "Is Active",
          fieldType: "BooleanField",
          graphqlType: "Boolean",
          isBoolean: true,
        },
        {
          name: "createdAt",
          fieldName: "created_at",
          verboseName: "Created At",
          fieldType: "DateTimeField",
          graphqlType: "DateTime",
          isDatetime: true,
        },
        {
          name: "id",
          fieldName: "id",
          verboseName: "ID",
          graphqlType: "ID",
          isIndexed: true,
        },
      ],
      relationships: [
        {
          name: "category",
          fieldName: "category",
          verboseName: "Category",
          relatedApp: "store",
          relatedModel: "Category",
          relationType: "FOREIGN_KEY",
          isToMany: false,
          lookupField: "id",
          searchFields: ["name"],
        },
        {
          name: "tags",
          fieldName: "tags",
          verboseName: "Tags",
          relatedApp: "store",
          relatedModel: "Tag",
          relationType: "MANY_TO_MANY",
          isToMany: true,
          lookupField: "id",
          searchFields: ["name"],
        },
      ],
      filterConfig: {
        style: "NESTED",
        argumentName: "where",
        inputTypeName: "ProductWhereInput",
        supportsAnd: true,
        supportsOr: true,
        supportsNot: true,
        supportsFts: false,
        supportsAggregation: false,
        presets: [
          {
            name: "active",
            description: "Active products only",
            filterJson: '{"status":{"eq":"active"}}',
          },
        ],
        computedFilters: [],
      },
      relationFilters: [
        {
          name: "category",
          fieldName: "category",
          relationType: "FOREIGN_KEY",
          supportsSome: false,
          supportsEvery: false,
          supportsNone: false,
          supportsCount: false,
          nestedFilterType: "CategoryWhereInput",
        },
        {
          name: "tags",
          fieldName: "tags",
          relationType: "MANY_TO_MANY",
          supportsSome: true,
          supportsEvery: true,
          supportsNone: true,
          supportsCount: true,
          nestedFilterType: "TagWhereInput",
        },
      ],
      fieldGroups: [
        {
          key: "basic",
          label: "Basic Info",
          description: "Basic product information",
          fields: ["name", "price", "status"],
        },
      ],
    },
  };

  const mockFilterSchema = {
    filterSchema: [
      {
        name: "name",
        fieldName: "name",
        fieldLabel: "Name",
        baseType: "String",
        isNested: false,
        filterInputType: "StringFilterInput",
        availableOperators: ["eq", "neq", "contains", "icontains"],
        options: [
          { name: "eq", label: "Equals", graphqlType: "String", isList: false },
          { name: "neq", label: "Not Equals", graphqlType: "String", isList: false },
          { name: "contains", label: "Contains", graphqlType: "String", isList: false },
          { name: "icontains", label: "Contains (case-insensitive)", graphqlType: "String", isList: false },
        ],
      },
      {
        name: "price",
        fieldName: "price",
        fieldLabel: "Price",
        baseType: "Number",
        isNested: false,
        filterInputType: "FloatFilterInput",
        availableOperators: ["eq", "gte", "lte", "between"],
        options: [
          { name: "eq", label: "Equals", graphqlType: "Float", isList: false },
          { name: "gte", label: ">=", graphqlType: "Float", isList: false },
          { name: "lte", label: "<=", graphqlType: "Float", isList: false },
          { name: "between", label: "Between", graphqlType: "[Float]", isList: true },
        ],
      },
      {
        name: "category",
        fieldName: "category",
        fieldLabel: "Category",
        baseType: "Relationship",
        isNested: true,
        relatedModel: "Category",
        filterInputType: "CategoryWhereInput",
        availableOperators: [],
        options: [],
      },
    ],
  };

  const mockSavedFilters = {
    savedFilters: [
      {
        id: "sf_1",
        name: "High Price",
        description: "Products over $100",
        filterJson: '{"price":{"gte":100}}',
        isShared: false,
        createdBy: { id: "user_1", username: "john" },
        useCount: 5,
        lastUsedAt: "2026-01-25T10:00:00Z",
      },
      {
        id: "sf_2",
        name: "Team Filter",
        description: "Shared team filter",
        filterJson: '{"status":{"eq":"active"}}',
        isShared: true,
        createdBy: { id: "user_2", username: "jane" },
        useCount: 10,
        lastUsedAt: "2026-01-26T08:00:00Z",
      },
    ],
  };

  describe("basic merging", () => {
    it("should merge model and filter schema", () => {
      const result = mergeFilterMetadata(mockModelSchema, mockFilterSchema, null);

      expect(result.app).toBe("store");
      expect(result.model).toBe("Product");
      expect(result.verboseName).toBe("Product");
      expect(result.verboseNamePlural).toBe("Products");
    });

    it("should include all filter fields", () => {
      const result = mergeFilterMetadata(mockModelSchema, mockFilterSchema, null);

      expect(result.fields).toHaveLength(3);
      expect(result.fields.map(f => f.fieldName)).toEqual(["name", "price", "category"]);
    });

    it("should enrich fields with model metadata", () => {
      const result = mergeFilterMetadata(mockModelSchema, mockFilterSchema, null);

      const nameField = result.fields.find(f => f.fieldName === "name");
      expect(nameField?.helpText).toBe("Product name");
      expect(nameField?.graphqlType).toBe("String");
    });

    it("should include operators from filterSchema", () => {
      const result = mergeFilterMetadata(mockModelSchema, mockFilterSchema, null);

      const nameField = result.fields.find(f => f.fieldName === "name");
      expect(nameField?.operators).toHaveLength(4);
      expect(nameField?.operators.map(o => o.name)).toEqual(["eq", "neq", "contains", "icontains"]);
    });
  });

  describe("config handling", () => {
    it("should extract filter config", () => {
      const result = mergeFilterMetadata(mockModelSchema, mockFilterSchema, null);

      expect(result.config.inputTypeName).toBe("ProductWhereInput");
      expect(result.config.supportsAnd).toBe(true);
      expect(result.config.supportsOr).toBe(true);
      expect(result.config.supportsNot).toBe(true);
    });

    it("should use defaults when config is missing", () => {
      const schemaWithoutConfig = {
        modelSchema: {
          ...mockModelSchema.modelSchema,
          filterConfig: null,
        },
      };

      const result = mergeFilterMetadata(schemaWithoutConfig, mockFilterSchema, null);

      expect(result.config.supportsAnd).toBe(true);
      expect(result.config.supportsOr).toBe(true);
      expect(result.config.supportsNot).toBe(true);
    });
  });

  describe("preset handling", () => {
    it("should include static presets", () => {
      const result = mergeFilterMetadata(mockModelSchema, mockFilterSchema, null);

      const staticPresets = result.presets.filter(p => p.source === "static");
      expect(staticPresets).toHaveLength(1);
      expect(staticPresets[0].name).toBe("active");
      expect(staticPresets[0].filterJson).toEqual({ status: { eq: "active" } });
    });

    it("should include saved filters as presets", () => {
      const result = mergeFilterMetadata(mockModelSchema, mockFilterSchema, mockSavedFilters);

      const savedPresets = result.presets.filter(p => p.source === "saved");
      expect(savedPresets).toHaveLength(1);
      expect(savedPresets[0].name).toBe("High Price");
      expect(savedPresets[0].createdBy?.username).toBe("john");
    });

    it("should include shared filters as presets", () => {
      const result = mergeFilterMetadata(mockModelSchema, mockFilterSchema, mockSavedFilters);

      const sharedPresets = result.presets.filter(p => p.source === "shared");
      expect(sharedPresets).toHaveLength(1);
      expect(sharedPresets[0].name).toBe("Team Filter");
      expect(sharedPresets[0].isShared).toBe(true);
    });

    it("should parse filterJson strings", () => {
      const result = mergeFilterMetadata(mockModelSchema, mockFilterSchema, mockSavedFilters);

      const savedPreset = result.presets.find(p => p.id === "sf_1");
      expect(savedPreset?.filterJson).toEqual({ price: { gte: 100 } });
    });
  });

  describe("relation filters", () => {
    it("should include relation filters", () => {
      const result = mergeFilterMetadata(mockModelSchema, mockFilterSchema, null);

      expect(result.relationFilters).toHaveLength(2);
    });

    it("should set FK relation properties correctly", () => {
      const result = mergeFilterMetadata(mockModelSchema, mockFilterSchema, null);

      const categoryFilter = result.relationFilters.find(r => r.fieldName === "category");
      expect(categoryFilter?.relationType).toBe("FOREIGN_KEY");
      expect(categoryFilter?.supportsDirectFilter).toBe(true);
      expect(categoryFilter?.supportsIsNull).toBe(true);
      expect(categoryFilter?.supportsSome).toBe(false);
    });

    it("should set M2M relation properties correctly", () => {
      const result = mergeFilterMetadata(mockModelSchema, mockFilterSchema, null);

      const tagsFilter = result.relationFilters.find(r => r.fieldName === "tags");
      expect(tagsFilter?.relationType).toBe("MANY_TO_MANY");
      expect(tagsFilter?.supportsDirectFilter).toBe(false);
      expect(tagsFilter?.supportsSome).toBe(true);
      expect(tagsFilter?.supportsEvery).toBe(true);
      expect(tagsFilter?.supportsNone).toBe(true);
    });

    it("should include relation config for nested fields", () => {
      const result = mergeFilterMetadata(mockModelSchema, mockFilterSchema, null);

      const categoryField = result.fields.find(f => f.fieldName === "category");
      expect(categoryField?.isRelation).toBe(true);
      expect(categoryField?.relationConfig?.relatedModel).toBe("Category");
      expect(categoryField?.relationConfig?.searchFields).toEqual(["name"]);
    });
  });

  describe("distinct fields", () => {
    it("should extract distinct fields from indexed fields", () => {
      const result = mergeFilterMetadata(mockModelSchema, mockFilterSchema, null);

      expect(result.distinctFields.length).toBeGreaterThan(0);
      const distinctFieldNames = result.distinctFields.map(f => f.fieldName);
      expect(distinctFieldNames).toContain("id");
      expect(distinctFieldNames).toContain("name");
    });

    it("should set requiresOrderBy for distinct fields", () => {
      const result = mergeFilterMetadata(mockModelSchema, mockFilterSchema, null);

      result.distinctFields.forEach(field => {
        expect(field.requiresOrderBy).toBe(true);
      });
    });
  });

  describe("field groups", () => {
    it("should include field groups", () => {
      const result = mergeFilterMetadata(mockModelSchema, mockFilterSchema, null);

      expect(result.fieldGroups).toHaveLength(1);
      expect(result.fieldGroups[0].key).toBe("basic");
      expect(result.fieldGroups[0].fields).toEqual(["name", "price", "status"]);
    });

    it("should assign group to fields", () => {
      const result = mergeFilterMetadata(mockModelSchema, mockFilterSchema, null);

      const nameField = result.fields.find(f => f.fieldName === "name");
      expect(nameField?.group).toBe("basic");
    });
  });

  describe("UI hints", () => {
    it("should set select widget for choice fields", () => {
      // Add status to filterSchema for this test
      const filterSchemaWithStatus = {
        filterSchema: [
          ...mockFilterSchema.filterSchema,
          {
            fieldName: "status",
            name: "status",
            fieldLabel: "Status",
            baseType: "String",
            isNested: false,
            filterInputType: "StringFilterInput",
            availableOperators: ["eq"],
            options: [{ name: "eq", label: "Equals", graphqlType: "String", isList: false }],
          },
        ],
      };

      const result = mergeFilterMetadata(mockModelSchema, filterSchemaWithStatus, null);

      const statusField = result.fields.find(f => f.fieldName === "status");
      expect(statusField?.uiHints.widget).toBe("select");
    });

    it("should set number widget with min/max for numeric fields", () => {
      const result = mergeFilterMetadata(mockModelSchema, mockFilterSchema, null);

      const priceField = result.fields.find(f => f.fieldName === "price");
      expect(priceField?.uiHints.widget).toBe("number");
      expect(priceField?.uiHints.minValue).toBe(0);
      expect(priceField?.uiHints.maxValue).toBe(10000);
    });

    it("should set combobox widget for relationship fields", () => {
      const result = mergeFilterMetadata(mockModelSchema, mockFilterSchema, null);

      const categoryField = result.fields.find(f => f.fieldName === "category");
      expect(categoryField?.uiHints.widget).toBe("combobox");
    });
  });

  describe("default operator selection", () => {
    it("should select icontains as default for strings", () => {
      const result = mergeFilterMetadata(mockModelSchema, mockFilterSchema, null);

      const nameField = result.fields.find(f => f.fieldName === "name");
      expect(nameField?.defaultOperator).toBe("icontains");
    });

    it("should select eq as default for numbers", () => {
      const result = mergeFilterMetadata(mockModelSchema, mockFilterSchema, null);

      const priceField = result.fields.find(f => f.fieldName === "price");
      expect(priceField?.defaultOperator).toBe("eq");
    });
  });

  describe("edge cases", () => {
    it("should handle null savedFilters", () => {
      const result = mergeFilterMetadata(mockModelSchema, mockFilterSchema, null);

      const savedPresets = result.presets.filter(p => p.source === "saved" || p.source === "shared");
      expect(savedPresets).toHaveLength(0);
    });

    it("should handle empty savedFilters array", () => {
      const result = mergeFilterMetadata(mockModelSchema, mockFilterSchema, { savedFilters: [] });

      const savedPresets = result.presets.filter(p => p.source === "saved" || p.source === "shared");
      expect(savedPresets).toHaveLength(0);
    });

    it("should handle empty field groups", () => {
      const schemaWithoutGroups = {
        modelSchema: {
          ...mockModelSchema.modelSchema,
          fieldGroups: [],
        },
      };

      const result = mergeFilterMetadata(schemaWithoutGroups, mockFilterSchema, null);

      expect(result.fieldGroups).toEqual([]);
      result.fields.forEach(field => {
        expect(field.group).toBeUndefined();
      });
    });
  });
});
