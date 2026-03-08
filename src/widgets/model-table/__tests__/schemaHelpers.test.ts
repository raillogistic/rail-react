import { describe, expect, it } from "vitest";
import type { ModelSchema } from "../types";
import {
  getDefaultHiddenColumnIds,
  getImplicitModelTableFieldExclusions,
  mergeModelSchemaWithRelationships,
} from "../utils";

function createMetadata(): ModelSchema {
  return {
    app: "catalog",
    model: "Product",
    verboseName: "Product",
    verboseNamePlural: "Products",
    primaryKey: "id",
    ordering: ["name"],
    fields: [
      {
        name: "id",
        fieldName: "id",
        verboseName: "ID",
        fieldType: "AutoField",
        graphqlType: "ID",
        required: true,
        nullable: false,
        blank: false,
        editable: false,
        unique: true,
        hasDefault: false,
        autoNow: false,
        autoNowAdd: false,
        readable: true,
        writable: false,
        visibility: "list",
        isPrimaryKey: true,
        isIndexed: true,
        isRelation: false,
        isComputed: false,
        isFile: false,
        isImage: false,
        isJson: false,
        isDate: false,
        isDatetime: false,
        isNumeric: false,
        isBoolean: false,
        isText: false,
        isRichText: false,
        isFsmField: false,
      },
      {
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
        visibility: "list",
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
        isText: false,
        isRichText: false,
        isFsmField: false,
      },
      {
        name: "createdAt",
        fieldName: "created_at",
        verboseName: "Created at",
        fieldType: "DateTimeField",
        graphqlType: "DateTime",
        required: false,
        nullable: true,
        blank: true,
        editable: false,
        unique: false,
        hasDefault: false,
        autoNow: false,
        autoNowAdd: true,
        readable: true,
        writable: false,
        visibility: "list",
        isPrimaryKey: false,
        isIndexed: false,
        isRelation: false,
        isComputed: false,
        isFile: false,
        isImage: false,
        isJson: false,
        isDate: false,
        isDatetime: true,
        isNumeric: false,
        isBoolean: false,
        isText: false,
        isRichText: false,
        isFsmField: false,
      },
      {
        name: "updatedAt",
        fieldName: "updated_at",
        verboseName: "Updated at",
        fieldType: "DateTimeField",
        graphqlType: "DateTime",
        required: false,
        nullable: true,
        blank: true,
        editable: false,
        unique: false,
        hasDefault: false,
        autoNow: true,
        autoNowAdd: false,
        readable: true,
        writable: false,
        visibility: "list",
        isPrimaryKey: false,
        isIndexed: false,
        isRelation: false,
        isComputed: false,
        isFile: false,
        isImage: false,
        isJson: false,
        isDate: false,
        isDatetime: true,
        isNumeric: false,
        isBoolean: false,
        isText: false,
        isRichText: false,
        isFsmField: false,
      },
    ],
    relationships: [
      {
        name: "orders",
        fieldName: "orders",
        verboseName: "Orders",
        relatedApp: "sales",
        relatedModel: "Order",
        relatedModelVerbose: "Order",
        relationType: "REVERSE_FK",
        isReverse: true,
        isToOne: false,
        isToMany: true,
        required: false,
        nullable: true,
        editable: false,
        lookupField: "id",
        readable: true,
        writable: false,
        canCreateInline: false,
      },
      {
        name: "tags",
        fieldName: "tags",
        verboseName: "Tags",
        relatedApp: "catalog",
        relatedModel: "Tag",
        relatedModelVerbose: "Tag",
        relationType: "MANY_TO_MANY",
        isReverse: false,
        isToOne: false,
        isToMany: true,
        required: false,
        nullable: true,
        editable: true,
        lookupField: "name",
        readable: true,
        writable: true,
        canCreateInline: false,
      },
    ],
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
      canExport: true,
    },
    metadataVersion: "1",
  };
}

describe("schema helper exposure controls", () => {
  const metadata = mergeModelSchemaWithRelationships(createMetadata())!;

  it("implicitly excludes reverse relation and count fields unless requested", () => {
    const exclusions = getImplicitModelTableFieldExclusions(metadata);
    expect(exclusions).toContain("createdAt");
    expect(exclusions).toContain("updatedAt");
    expect(exclusions).toContain("orders");
    expect(exclusions).toContain("ordersCount");
    expect(exclusions).toContain("tagsCount");
    expect(exclusions).not.toContain("tags");

    const explicit = getImplicitModelTableFieldExclusions(metadata, {
      explicitAccessors: ["orders", "tagsCount", "createdAt"],
    });
    expect(explicit).not.toContain("createdAt");
    expect(explicit).toContain("updatedAt");
    expect(explicit).not.toContain("orders");
    expect(explicit).toContain("ordersCount");
    expect(explicit).not.toContain("tagsCount");
  });

  it("respects showReversed and showCount when resolving default hidden columns", () => {
    const hiddenByDefault = getDefaultHiddenColumnIds(metadata);
    expect(hiddenByDefault).toContain("createdAt");
    expect(hiddenByDefault).toContain("updatedAt");
    expect(hiddenByDefault).toContain("orders");
    expect(hiddenByDefault).toContain("ordersCount");
    expect(hiddenByDefault).toContain("tags");
    expect(hiddenByDefault).toContain("tagsCount");

    const hiddenWithReversed = getDefaultHiddenColumnIds(metadata, {
      showReversed: true,
    });
    expect(hiddenWithReversed).not.toContain("orders");
    expect(hiddenWithReversed).toContain("ordersCount");
    expect(hiddenWithReversed).toContain("tags");

    const hiddenWithCounts = getDefaultHiddenColumnIds(metadata, {
      showCount: true,
    });
    expect(hiddenWithCounts).toContain("orders");
    expect(hiddenWithCounts).not.toContain("ordersCount");
    expect(hiddenWithCounts).not.toContain("tagsCount");
  });
});
