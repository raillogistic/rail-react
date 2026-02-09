import { describe, it, expect } from "vitest";
import type { FieldSchema, ModelSchema } from "@/lib/table/types";
import { buildSchemaFromMetadata } from "../hooks";

const baseField = (overrides: Partial<FieldSchema> = {}): FieldSchema => ({
  name: "name",
  fieldName: "name",
  verboseName: "Name",
  fieldType: "CharField",
  graphqlType: "String",
  required: true,
  nullable: false,
  blank: false,
  editable: true,
  unique: false,
  hasDefault: false,
  autoNow: false,
  autoNowAdd: false,
  readable: true,
  writable: true,
  visibility: "visible",
  isPrimaryKey: false,
  isIndexed: false,
  isRelation: false,
  isComputed: false,
  isFile: false,
  isImage: false,
  isJson: false,
  isDate: false,
  isDatetime: false,
  isNumeric: false,
  isBoolean: false,
  isText: true,
  isRichText: false,
  isFsmField: false,
  ...overrides,
});

const baseMetadata = (overrides: Partial<ModelSchema> = {}): ModelSchema => ({
  app: "inventory",
  model: "Product",
  verboseName: "Product",
  verboseNamePlural: "Products",
  primaryKey: "id",
  ordering: ["status", "name"],
  fields: [],
  relationships: [],
  filters: [],
  mutations: [],
  permissions: {
    canList: true,
    canRetrieve: true,
    canCreate: true,
    canUpdate: true,
    canDelete: true,
    canBulkCreate: false,
    canBulkUpdate: false,
    canBulkDelete: false,
    canExport: false,
    denialReasons: "",
  },
  metadataVersion: "v1",
  ...overrides,
});

describe("buildSchemaFromMetadata", () => {
  it("uses custom metadata for title, description, ordering, and exclusions", () => {
    const metadata = baseMetadata({
      fields: [
        baseField({ name: "name", fieldName: "name", verboseName: "Name" }),
        baseField({
          name: "status",
          fieldName: "status",
          verboseName: "Status",
        }),
        baseField({
          name: "secret",
          fieldName: "secret",
          verboseName: "Secret",
        }),
      ],
      customMetadata: JSON.stringify({
        form: {
          title: "Custom Title",
          description: "Custom Description",
          fieldOrder: ["name", "status"],
          excludeFields: ["secret"],
          readonlyFields: ["status"],
        },
      }),
    });

    const schema = buildSchemaFromMetadata(metadata, {}, {}, "create");

    expect(schema.sections?.[0].title).toBe("Custom Title");
    expect(schema.sections?.[0].description).toBe("Custom Description");
    expect(schema.sections?.[0].fields.map((field) => field.name)).toEqual([
      "name",
      "status",
    ]);

    const statusField = schema.sections?.[0].fields.find(
      (field) => field.name === "status"
    );
    expect(statusField?.readOnly).toBe(true);

    const secretField = schema.sections?.[0].fields.find(
      (field) => field.name === "secret"
    );
    expect(secretField).toBeUndefined();
  });
});
