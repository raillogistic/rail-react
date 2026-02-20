import { describe, expect, it } from "vitest";
import {
  buildModelListQueryVariables,
  buildModelPageQueryVariables,
  buildModelSingleQueryVariables,
} from "../variables";
import type { ModelMetadata } from "@/lib/metadata/types";

/**
 * Creates metadata fixture used for variable normalization tests.
 */
function createVariablesMetadataFixture(): ModelMetadata {
  return {
    app: "auth",
    model: "User",
    verboseName: "User",
    verboseNamePlural: "Users",
    primaryKey: "id",
    fields: [
      {
        name: "username",
        fieldName: "username",
        verboseName: "Username",
        fieldType: "String",
        graphqlType: "String",
        required: false,
        nullable: true,
        blank: true,
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
        isText: true,
        isRichText: false,
      },
      {
        name: "createdAt",
        fieldName: "created_at",
        verboseName: "Created",
        fieldType: "DateTime",
        graphqlType: "DateTime",
        required: false,
        nullable: true,
        blank: true,
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
        isDatetime: true,
        isNumeric: false,
        isBoolean: false,
        isText: false,
        isRichText: false,
      },
    ] as ModelMetadata["fields"],
    relationships: [],
    filters: [],
    filterConfig: {
      style: "nested",
      argumentName: "where",
      inputTypeName: "UserWhereInput",
      supportsAnd: true,
      supportsOr: true,
      supportsNot: true,
      dualModeEnabled: false,
      supportsQuick: true,
      supportsFts: false,
      supportsAggregation: false,
    },
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

describe("graphql variable builders", () => {
  it("builds page variables with normalized orderBy", () => {
    const metadata = createVariablesMetadataFixture();
    const variables = buildModelPageQueryVariables(
      {
        page: 2,
        perPage: 40,
        orderBy: ["-created_at", "username"],
        quick: "alice",
        where: { username: { icontains: "a" } },
        skipCount: true,
      },
      { metadata },
    );
    expect(variables).toEqual({
      page: 2,
      perPage: 40,
      orderBy: ["-createdAt", "username"],
      quick: "alice",
      where: { username: { icontains: "a" } },
      skipCount: true,
    });
  });

  it("builds list variables without pagination keys", () => {
    const metadata = createVariablesMetadataFixture();
    const variables = buildModelListQueryVariables(
      {
        orderBy: ["created_at"],
        presets: ["active"],
      },
      { metadata },
    );
    expect(variables).toEqual({
      orderBy: ["createdAt"],
      presets: ["active"],
    });
  });

  it("builds single variables", () => {
    const variables = buildModelSingleQueryVariables({
      id: "1",
      where: { archived: false },
    });
    expect(variables).toEqual({
      id: "1",
      where: { archived: false },
    });
  });
});
