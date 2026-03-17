import { describe, expect, it } from "vitest";
import {
  resolveModelTableFilterField,
} from "../filterFieldResolver";
import type { ModelSchema } from "../../types";

const metadata = {
  app: "auth",
  model: "User",
  verboseName: "User",
  verboseNamePlural: "Users",
  primaryKey: "id",
  ordering: ["username"],
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
  filterConfig: {
    style: "nested",
    argumentName: "where",
    inputTypeName: "UserWhereInput",
    supportsAnd: true,
    supportsOr: true,
    supportsNot: true,
    supportsQuick: true,
    dualModeEnabled: false,
    supportsFts: false,
    supportsAggregation: false,
  },
  filters: [
    {
      name: "username",
      fieldName: "username",
      fieldLabel: "Username",
      baseType: "String",
      isNested: false,
      options: [
        {
          name: "username__icontains",
          lookup: "icontains",
          label: "Contains",
          isList: false,
        },
        {
          name: "username__exact",
          lookup: "exact",
          label: "Exact",
          isList: false,
        },
      ],
      filterInputType: "StringFilter",
      availableOperators: ["icontains", "exact"],
      defaultOperator: "exact",
    },
    {
      name: "profile.email",
      fieldName: "profile__email",
      fieldLabel: "Profile email",
      baseType: "String",
      isNested: false,
      relatedModel: "Profile",
      options: [
        {
          name: "profile__email__icontains",
          lookup: "icontains",
          label: "Contains",
          isList: false,
        },
      ],
      filterInputType: "StringFilter",
      availableOperators: ["icontains"],
    },
  ],
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
      readable: true,
      writable: false,
      visibility: "list",
    },
    {
      name: "username",
      fieldName: "username",
      verboseName: "Username",
      fieldType: "CharField",
      graphqlType: "String",
      required: true,
      nullable: false,
      blank: false,
      editable: true,
      unique: true,
      hasDefault: false,
      autoNow: false,
      autoNowAdd: false,
      isPrimaryKey: false,
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
      isText: true,
      isRichText: false,
      isFsmField: false,
      readable: true,
      writable: true,
      visibility: "list",
    },
    {
      name: "profile",
      fieldName: "profile",
      verboseName: "Profile",
      fieldType: "ForeignKey",
      graphqlType: "ProfileType",
      required: false,
      nullable: true,
      blank: true,
      editable: true,
      unique: false,
      hasDefault: false,
      autoNow: false,
      autoNowAdd: false,
      isPrimaryKey: false,
      isIndexed: false,
      isRelation: true,
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
      readable: true,
      writable: true,
      visibility: "list",
      relationLookupField: "id",
    },
  ],
  relationships: [
    {
      name: "profile",
      fieldName: "profile",
      verboseName: "Profile",
      relatedApp: "auth",
      relatedModel: "Profile",
      relatedModelVerbose: "Profile",
      relationType: "FOREIGN_KEY",
      isReverse: false,
      isToOne: true,
      isToMany: false,
      required: false,
      nullable: true,
      editable: true,
      lookupField: "id",
      searchFields: ["email"],
      readable: true,
      writable: true,
      canCreateInline: false,
    },
  ],
  relationFilters: [],
  mutations: [],
  metadataVersion: "1",
} as unknown as ModelSchema;

describe("resolveModelTableFilterField", () => {
  it("uses metadata defaults for direct fields", () => {
    const resolved = resolveModelTableFilterField(metadata, "username");

    expect(resolved).not.toBeNull();
    expect(resolved?.fieldPath).toEqual(["username"]);
    expect(resolved?.filterableField.defaultOperator).toBe("exact");
    expect(resolved?.filterableField.fieldLabel).toBe("Username");
  });

  it("resolves dotted relation paths from filter metadata", () => {
    const resolved = resolveModelTableFilterField(metadata, "profile.email");

    expect(resolved).not.toBeNull();
    expect(resolved?.fieldPath).toEqual(["profile", "email"]);
    expect(resolved?.fieldName).toBe("email");
    expect(resolved?.filterableField.baseType).toBe("String");
  });

  it("returns null for unknown filters", () => {
    expect(resolveModelTableFilterField(metadata, "missingField")).toBeNull();
  });
});
