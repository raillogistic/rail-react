import React from "react";
import { describe, expect, it, vi } from "vitest";
import { MockedProvider } from "@apollo/client/testing";
import { renderHook, waitFor } from "@testing-library/react";
import { print } from "graphql";
import { useModelPageQuery } from "../hooks/useModelPageQuery";
import { buildModelQueryDocument } from "../queryBuilder";
import { buildModelPageQueryVariables } from "../variables";
import type { ModelMetadata } from "@/shared/api/graphql/graphql/metadata/types";

const useMetadataMock = vi.fn();

vi.mock("@/shared/api/graphql/graphql/metadata/gateway", () => ({
  useMetadata: (args: unknown) => useMetadataMock(args),
}));

/**
 * Creates metadata fixture used by hook tests.
 */
function createHooksMetadataFixture(): ModelMetadata {
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

describe("generated graphql hooks", () => {
  it("builds single query without default where argument", () => {
    const built = buildModelQueryDocument({
      mode: "single",
      model: "User",
      fields: ["id", "username"],
    });

    const queryText = print(built.queryDocument);
    expect(queryText).toContain("$id: ID!");
    expect(queryText).toContain("id: $id");
    expect(queryText).not.toContain("$where:");
    expect(queryText).not.toContain("where: $where");
  });

  it("executes page query with predefined fields without metadata fetch", async () => {
    useMetadataMock.mockReturnValue({
      metadata: null,
      loading: false,
      error: undefined,
      refetch: vi.fn(),
    });

    const built = buildModelQueryDocument({
      mode: "page",
      model: "User",
      fields: ["username"],
    });
    const variables = buildModelPageQueryVariables({
      page: 1,
      perPage: 20,
      skipCount: false,
    });

    const mocks = [
      {
        request: {
          query: built.queryDocument,
          variables,
        },
        result: {
          data: {
            [built.queryName]: {
              pageInfo: {
                totalCount: 1,
                pageCount: 1,
                hasNextPage: false,
                hasPreviousPage: false,
              },
              items: [
                {
                  id: "1",
                  username: "alice",
                  rowPermissions: {
                    canUpdate: true,
                    canDelete: true,
                    updateReason: null,
                    deleteReason: null,
                  },
                },
              ],
            },
          },
        },
      },
    ];

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <MockedProvider mocks={mocks}>{children}</MockedProvider>
    );

    const { result } = renderHook(
      () =>
        useModelPageQuery({
          app: "auth",
          model: "User",
          fields: ["username"],
          skipMetadata: true,
          variables: { page: 1, perPage: 20, skipCount: false },
        }),
      { wrapper },
    );

    await waitFor(() => expect(result.current.loading).toBe(false));
    const data = result.current.data as {
      items: Array<{ username: string }>;
    };
    expect(data.items[0]?.username).toBe("alice");
    expect(result.current.dev.metadataFetchMs).toBeGreaterThanOrEqual(0);
    expect(result.current.dev.dataFetchMs).toBeGreaterThanOrEqual(0);
  });

  it("builds metadata-driven page query with quick and where input", () => {
    const metadata = createHooksMetadataFixture();
    useMetadataMock.mockReturnValue({
      metadata,
      loading: false,
      error: undefined,
      refetch: vi.fn(),
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <MockedProvider mocks={[]}>{children}</MockedProvider>
    );

    const { result } = renderHook(
      () =>
        useModelPageQuery({
          app: "auth",
          model: "User",
          apollo: { skip: true },
        }),
      { wrapper },
    );

    expect(result.current.queryName).toBe("userPage");
    expect(result.current.metadataLoading).toBe(false);
    const queryText = print(result.current.queryDocument);
    expect(queryText).toContain("$where: UserWhereInput");
    expect(queryText).toContain("$quick: String");
    expect(queryText).toContain("quick: $quick");
  });

  it("supports grouped query options", () => {
    useMetadataMock.mockReturnValue({
      metadata: null,
      loading: false,
      error: undefined,
      refetch: vi.fn(),
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <MockedProvider mocks={[]}>{children}</MockedProvider>
    );

    const { result } = renderHook(
      () =>
        useModelPageQuery({
          identity: {
            app: "auth",
            model: "User",
          },
          metadataOptions: {
            skipMetadata: true,
          },
          selectionOptions: {
            fields: ["username"],
            includeFields: ["id"],
            excludeFields: ["username"],
            includeRowPermissions: false,
          },
          executionOptions: {
            queryName: "userPage",
            supportsQuick: false,
          },
          apollo: { skip: true },
        }),
      { wrapper },
    );

    const queryText = print(result.current.queryDocument);
    expect(result.current.queryName).toBe("userPage");
    expect(queryText).toContain("id");
    expect(queryText).not.toContain("username");
    expect(queryText).not.toContain("rowPermissions");
  });
});

