/**
 * ModelTable V2 Migration Tests
 * 
 * Tests for metadata V2 mapping functions
 */

import { describe, it, expect } from "vitest";
import {
  mapV2MetadataToTableMetadata,
  mapTableMetadataToFilterSchema,
} from "../hooks";
import type { ModelTableMetadataV2 } from "../types";

describe("ModelTable V2 Migration", () => {
  describe("mapV2MetadataToTableMetadata", () => {
    it("should convert V2 schema to table metadata", () => {
      const mockV2Response = {
        modelSchema: {
          app: "inventory",
          model: "Product",
          verboseName: "Produit",
          verboseNamePlural: "Produits",
          metadataVersion: "v2",
          fields: [
            {
              name: "name",
              verboseName: "Nom",
              helpText: "Product name",
              fieldType: "CharField",
              graphqlType: "String",
              required: true,
              nullable: false,
              isRelation: false,
              isNumeric: false,
              isDate: false,
              isDatetime: false,
              isBoolean: false,
              isText: true,
              isJson: false,
              isIndexed: true,
            },
          ],
          relationships: [],
          mutations: [],
          templates: [],
          permissions: {
            canCreate: true,
            canUpdate: true,
            canDelete: true,
            canRead: true,
            canList: true,
            canHistory: true,
          },
          filterConfig: {
            style: "graphql",
            argumentName: "filters",
            inputTypeName: "ProductFilterInput",
            supportsAnd: true,
            supportsOr: true,
            supportsNot: true,
            supportsFts: true,
            supportsAggregation: true,
            presets: [],
            computedFilters: [],
          },
          relationFilters: [],
          fieldGroups: [],
          filters: [
            {
              fieldName: "name",
              fieldLabel: "Nom",
              baseType: "String",
              isNested: false,
              filterInputType: "StringFilterInput",
              availableOperators: ["eq", "contains", "icontains"],
              options: [
                {
                  name: "eq",
                  lookup: "eq",
                  label: "Equals",
                  graphqlType: "String",
                  isList: false,
                },
              ],
            },
          ],
        },
      };

      const result = mapV2MetadataToTableMetadata(mockV2Response.modelSchema as any);

      expect(result).toBeDefined();
      expect(result.app).toBe("inventory");
      expect(result.model).toBe("Product");
      expect(result.verboseName).toBe("Produit");
      expect(result.verboseNamePlural).toBe("Produits");
      expect(result.metadataVersion).toBe("v2");
      expect(result.fields).toHaveLength(1);
      expect(result.fields[0].name).toBe("name");
      expect(result.fields[0].title).toBe("Nom");
      expect(result.filterSchema).toBeDefined();
      expect(result.filterConfig).toBeDefined();
    });

    it("should convert mutations to legacy format", () => {
      const mockV2Response = {
        modelSchema: {
          app: "inventory",
          model: "Product",
          verboseName: "Product",
          verboseNamePlural: "Products",
          metadataVersion: "v2",
          fields: [],
          relationships: [],
          mutations: [
            {
              name: "createProduct",
              methodName: "create",
              description: "Create a product",
              inputType: "CreateProductInput",
              inputFields: [
                {
                  name: "name",
                  fieldType: "String!",
                  required: true,
                  defaultValue: undefined,
                  description: null,
                  choices: null,
                  validationRules: null,
                  widgetType: null,
                  placeholder: null,
                  helpText: null,
                  minLength: null,
                  maxLength: null,
                  minValue: null,
                  maxValue: null,
                  pattern: null,
                  relatedModel: null,
                  multiple: undefined,
                },
              ],
              requiresAuthentication: true,
              requiredPermissions: ["inventory.add_product"],
              mutationType: "create",
              modelName: "Product",
              formConfig: null,
              successMessage: "Product created successfully",
            },
          ],
          templates: [],
          permissions: {
            canCreate: true,
            canUpdate: true,
            canDelete: true,
            canRead: true,
            canList: true,
            canHistory: false,
          },
          filterConfig: {
            style: "graphql",
            argumentName: "filters",
            inputTypeName: "ProductFilterInput",
            supportsAnd: true,
            supportsOr: true,
            supportsNot: true,
            supportsFts: false,
            supportsAggregation: false,
            presets: [],
            computedFilters: [],
          },
          relationFilters: [],
          fieldGroups: [],
          filters: [],
        },
      };

      const result = mapV2MetadataToTableMetadata(mockV2Response.modelSchema as any);

      expect(result.mutations).toBeDefined();
      expect(result.mutations).toHaveLength(1);
      expect(result.mutations![0].name).toBe("createProduct");
      expect(result.mutations![0].method_name).toBe("create");
      expect(result.mutations![0].success_message).toBe("Product created successfully");
    });

    it("should convert templates to legacy format", () => {
      const mockV2Response = {
        modelSchema: {
          app: "inventory",
          model: "Product",
          verboseName: "Product",
          verboseNamePlural: "Products",
          metadataVersion: "v2",
          fields: [],
          relationships: [],
          mutations: [],
          templates: [
            {
              key: "inventory:Product:print",
              title: "Print Product",
              endpoint: "/api/inventory/product/print",
              urlPath: "product/print.html",
              guard: "product.print",
              requireAuthentication: true,
              roles: ["admin"],
              permissions: ["inventory.view_product"],
              allowed: true,
              denialReason: null,
              allowClientData: true,
              clientDataFields: ["date", "printed_by"],
              clientDataSchema: null,
            },
          ],
          permissions: {
            canCreate: true,
            canUpdate: true,
            canDelete: true,
            canRead: true,
            canList: true,
            canHistory: false,
          },
          filterConfig: {
            style: "graphql",
            argumentName: "filters",
            inputTypeName: "ProductFilterInput",
            supportsAnd: true,
            supportsOr: true,
            supportsNot: true,
            supportsFts: false,
            supportsAggregation: false,
            presets: [],
            computedFilters: [],
          },
          relationFilters: [],
          fieldGroups: [],
          filters: [],
        },
      };

      const result = mapV2MetadataToTableMetadata(mockV2Response.modelSchema as any);

      expect(result.pdfTemplates).toBeDefined();
      expect(result.pdfTemplates).toHaveLength(1);
      expect(result.pdfTemplates![0].key).toBe("inventory:Product:print");
      expect(result.pdfTemplates![0].title).toBe("Print Product");
      expect(result.pdfTemplates![0].methodName).toBe("print");
      expect(result.pdfTemplates![0].allowClientData).toBe(true);
    });
  });

  describe("mapTableMetadataToFilterSchema", () => {
    it("should convert table metadata to UnifiedFilterSchema", () => {
      const mockMetadata: ModelTableMetadataV2 = {
        app: "inventory",
        model: "Product",
        metadataVersion: "v2",
        verboseName: "Product",
        verboseNamePlural: "Products",
        tableName: "inventory_product",
        primaryKey: "id",
        ordering: [],
        defaultOrdering: [],
        get_latest_by: null,
        managers: [],
        managed: true,
        fields: [
          {
            name: "name",
            accessor: "name",
            display: "name",
            editable: true,
            field_type: "CharField",
            filterable: true,
            sortable: true,
            title: "Name",
            helpText: "Product name",
            is_property: false,
            is_related: false,
            permissions: {
              can_read: true,
              can_write: true,
              visibility: "visible",
              access_level: "full",
            },
          },
          {
            name: "category",
            accessor: "category",
            display: "category",
            editable: true,
            field_type: "RelationField",
            filterable: true,
            sortable: false,
            title: "Category",
            helpText: "Product category",
            is_property: false,
            is_related: true,
            permissions: {
              can_read: true,
              can_write: true,
              visibility: "visible",
              access_level: "full",
            },
          },
        ],
        filters: [], // Empty - filters in filterSchema
        permissions: {
          can_create: true,
          can_update: true,
          can_delete: true,
          can_read: true,
          can_list: true,
          can_history: false,
        },
        filterSchema: [
          {
            fieldName: "name",
            fieldLabel: "Name",
            baseType: "String",
            isNested: false,
            filterInputType: "StringFilterInput",
            availableOperators: ["eq", "contains", "icontains"],
            options: [
              {
                name: "eq",
                lookup: "eq",
                label: "Equals",
                helpText: "Exact match",
                graphqlType: "String",
                isList: false,
              },
            ],
          },
          {
            fieldName: "category",
            fieldLabel: "Category",
            baseType: "Relationship",
            isNested: true,
            relatedModel: "inventory.Category",
            filterInputType: "CategoryFilterInput",
            availableOperators: ["eq", "in"],
            options: [],
          },
        ],
        filterConfig: {
          style: "graphql",
          argumentName: "filters",
          inputTypeName: "ProductFilterInput",
          supportsAnd: true,
          supportsOr: true,
          supportsNot: true,
          supportsFts: false,
          supportsAggregation: false,
          presets: [
            {
              name: "active_products",
              description: "Show only active products",
              filterJson: { status: { eq: "active" } },
            },
          ],
          computedFilters: [],
        },
        fieldGroups: [
          {
            key: "basic",
            label: "Basic Info",
            description: "Basic product information",
            fields: ["name", "category"],
            collapsed: false,
          },
        ],
        relationFilters: [],
      };

      const filterSchema = mapTableMetadataToFilterSchema(mockMetadata);

      expect(filterSchema).not.toBeNull();
      expect(filterSchema?.app).toBe("inventory");
      expect(filterSchema?.model).toBe("Product");
      expect(filterSchema?.verboseName).toBe("Product");
      expect(filterSchema?.fields).toBeDefined();
      expect(filterSchema?.fields).toHaveLength(2);
      expect(filterSchema?.fields[0].fieldName).toBe("name");
      expect(filterSchema?.fields[0].baseType).toBe("String");
      expect(filterSchema?.fields[1].fieldName).toBe("category");
      expect(filterSchema?.fields[1].baseType).toBe("Relationship");
      expect(filterSchema?.presets).toBeDefined();
      expect(filterSchema?.presets).toHaveLength(1);
      expect(filterSchema?.presets[0].name).toBe("active_products");
      expect(filterSchema?.presets[0].source).toBe("static");
      expect(filterSchema?.fieldGroups).toBeDefined();
      expect(filterSchema?.fieldGroups).toHaveLength(1);
      expect(filterSchema?.fieldGroups[0].key).toBe("basic");
      expect(filterSchema?.distinctFields).toBeDefined();
      expect(filterSchema?.distinctFields).toHaveLength(2);
    });

    it("should return null when metadata is null", () => {
      const filterSchema = mapTableMetadataToFilterSchema(null);
      expect(filterSchema).toBeNull();
    });

    it("should handle empty filter schema", () => {
      const mockMetadata: ModelTableMetadataV2 = {
        app: "inventory",
        model: "Product",
        metadataVersion: "v2",
        verboseName: "Product",
        verboseNamePlural: "Products",
        tableName: "inventory_product",
        primaryKey: "id",
        ordering: [],
        defaultOrdering: [],
        get_latest_by: null,
        managers: [],
        managed: true,
        fields: [],
        filters: [],
        permissions: {
          can_create: false,
          can_update: false,
          can_delete: false,
          can_read: false,
          can_list: false,
          can_history: false,
        },
        filterSchema: [],
        filterConfig: {
          style: "graphql",
          argumentName: "filters",
          inputTypeName: "ProductFilterInput",
          supportsAnd: true,
          supportsOr: true,
          supportsNot: true,
          supportsFts: false,
          supportsAggregation: false,
          presets: [],
          computedFilters: [],
        },
        fieldGroups: [],
        relationFilters: [],
      };

      const filterSchema = mapTableMetadataToFilterSchema(mockMetadata);

      expect(filterSchema).not.toBeNull();
      expect(filterSchema?.fields).toHaveLength(0);
      expect(filterSchema?.presets).toHaveLength(0);
    });
  });
});
