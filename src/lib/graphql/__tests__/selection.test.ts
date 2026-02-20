import { describe, expect, it } from "vitest";
import { buildModelQuerySelection } from "../selection";
import type { ModelMetadata } from "@/lib/metadata/types";

/**
 * Creates a lightweight metadata fixture for selection tests.
 */
function createSelectionMetadataFixture(): ModelMetadata {
  return {
    app: "auth",
    model: "User",
    verboseName: "User",
    verboseNamePlural: "Users",
    primaryKey: "id",
    fields: [
      {
        name: "id",
        fieldName: "id",
        verboseName: "Id",
        fieldType: "ID",
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
      },
      {
        name: "username",
        fieldName: "username",
        verboseName: "Username",
        fieldType: "String",
        graphqlType: "String",
        required: true,
        nullable: false,
        blank: false,
        editable: true,
        unique: true,
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
        isText: true,
        isRichText: false,
      },
    ] as ModelMetadata["fields"],
    relationships: [
      {
        name: "group",
        fieldName: "group",
        verboseName: "Group",
        relatedApp: "auth",
        relatedModel: "Group",
        relatedModelVerbose: "Group",
        relationType: "FOREIGN_KEY",
        isReverse: false,
        isToOne: true,
        isToMany: false,
        required: false,
        nullable: true,
        editable: true,
        lookupField: "name",
        readable: true,
        writable: true,
        canCreateInline: false,
      },
    ] as ModelMetadata["relationships"],
    filters: [],
    mutations: [],
    permissions: {
      canList: true,
      canRetrieve: true,
      canCreate: true,
      canUpdate: true,
      canDelete: true,
      canBulkCreate: true,
      canBulkUpdate: true,
      canBulkDelete: true,
      canExport: true,
    },
    metadataVersion: "1",
  };
}

describe("buildModelQuerySelection", () => {
  it("builds selection from predefined fields", () => {
    const selection = buildModelQuerySelection({
      fields: ["username"],
      includeRowPermissions: false,
    });
    expect(selection).toContain("username");
    expect(selection).toContain("id");
  });

  it("expands relation defaults when relation root is selected", () => {
    const metadata = createSelectionMetadataFixture();
    const selection = buildModelQuerySelection({
      metadata,
      fields: ["group"],
      includeRowPermissions: false,
    });
    expect(selection).toContain("group");
    expect(selection).toContain("id");
    expect(selection).toContain("desc");
    expect(selection).toContain("name");
  });

  it("uses manual tree selection override", () => {
    const selection = buildModelQuerySelection({
      selection: {
        username: true,
        group: {
          name: true,
        },
      },
      includeRowPermissions: false,
    });
    expect(selection).toContain("username");
    expect(selection).toContain("group");
    expect(selection).toContain("name");
  });
});
