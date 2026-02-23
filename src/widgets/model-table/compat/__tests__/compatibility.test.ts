import { describe, expect, it } from "vitest";

import {
  mapV2MetadataToTableMetadata,
  normalizeLegacyFiltersToWhere,
} from "../hooks";

describe("table compat contract adapters", () => {
  it("maps metadata safely when optional mutation fields are missing", () => {
    const schema = {
      app: "users",
      model: "User",
      verboseName: "User",
      verboseNamePlural: "Users",
      primaryKey: "id",
      ordering: ["-id"],
      fields: [
        {
          name: "id",
          fieldName: "id",
          verboseName: "ID",
          helpText: "",
          fieldType: "AutoField",
          editable: false,
          isRelation: false,
          visibility: "list",
        },
      ],
      relationships: [
        {
          name: "group",
          verboseName: "Group",
          relatedApp: "users",
          relatedModel: "Group",
          relationType: "ForeignKey",
          isToMany: false,
          lookupField: "id",
          searchFields: ["name"],
        },
      ],
      filters: [
        {
          fieldName: "username",
          fieldLabel: "Username",
          baseType: "String",
          isNested: false,
          relatedModel: null,
          filterInputType: "StringFilterInput",
          availableOperators: ["eq", "icontains"],
          options: [
            {
              name: "eq",
              lookup: "eq",
              label: "Equals",
              helpText: "",
              graphqlType: "String",
              isList: false,
              choices: [],
            },
          ],
        },
      ],
      filterConfig: {
        style: "NESTED",
        argumentName: "where",
        inputTypeName: "UserWhereInput",
        supportsAnd: true,
        supportsOr: true,
        supportsNot: true,
        supportsFts: true,
        supportsAggregation: true,
      },
      relationFilters: [],
      fieldGroups: [],
      templates: [],
      mutations: [
        {
          name: "updateUser",
          operation: "update",
          methodName: "update_user",
          description: "Update user",
          // table metadata profile may omit inputFields entirely.
          inputFields: undefined,
          requiresAuthentication: true,
          requiredPermissions: ["users.change_user"],
          mutationType: "update",
          modelName: "User",
          allowed: true,
        },
      ],
      permissions: {
        canCreate: true,
        canUpdate: true,
        canDelete: true,
        canRetrieve: true,
        canList: true,
        canBulkCreate: false,
        canBulkUpdate: false,
        canBulkDelete: false,
        canExport: true,
        denialReasons: "not-json",
      },
      metadataVersion: "v-test",
    } as any;

    const mapped = mapV2MetadataToTableMetadata(schema);
    expect(mapped.mutations[0]?.input_fields).toEqual([]);
    expect(mapped.permissions.can_read).toBe(true);
    expect(mapped.permissions.reasons).toBeNull();
  });

  it("normalizes legacy flat filters into nested where payload", () => {
    const where = normalizeLegacyFiltersToWhere({
      status: "active",
      order__id: 42,
      customer__name__icontains: "acme",
      created_at__gte: "2025-01-01",
    });

    expect(where).toEqual({
      AND: [
        { status: { eq: "active" } },
        { order: { eq: 42 } },
        { customerRel: { name: { icontains: "acme" } } },
        { createdAt: { gte: "2025-01-01" } },
      ],
    });
  });

  it("returns nested filters as-is when already in where format", () => {
    const payload = { AND: [{ status: { eq: "active" } }] };
    expect(normalizeLegacyFiltersToWhere(payload)).toEqual(payload);
  });
});
