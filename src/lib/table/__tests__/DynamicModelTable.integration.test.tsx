import { render, screen, waitFor } from "@testing-library/react";
import { MockedProvider } from "@apollo/client/testing";
import { gql } from "@apollo/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { DynamicModelTable } from "../components/DynamicModelTable";
import { GET_MODEL_SCHEMA } from "../queries";

vi.stubEnv("VITE_METADATA_GATEWAY_TABLE", "0");

vi.mock("../../filters/FilterPanel", () => ({
  FilterPanel: () => <div data-testid="dynamic-filter-form-mock">Filter Form</div>,
}));

vi.mock("../components/TableToolbar", () => ({
  TableToolbar: () => <div data-testid="table-toolbar-mock">Toolbar</div>,
}));

vi.mock("@/auth/context", () => ({
  useAuthContext: () => ({
    user: null,
  }),
}));

vi.mock("@/lib/components/ui/dropdown-menu", () => ({
  DropdownMenu: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuItem: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuSub: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuSubTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuSubContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuLabel: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuSeparator: () => null,
}));

const METADATA_BASE = {
  __typename: "ModelSchema",
  app: "auth",
  model: "User",
  verboseName: "User",
  verboseNamePlural: "Users",
  primaryKey: "id",
  ordering: ["username"],
  permissions: {
    __typename: "ModelPermissions",
    canList: true,
    canRetrieve: true,
    canCreate: true,
    canUpdate: true,
    canDelete: true,
    canBulkCreate: false,
    canBulkUpdate: false,
    canBulkDelete: false,
    canExport: true,
    denialReasons: null,
  },
  filterConfig: {
    __typename: "FilterConfig",
    style: "nested",
    argumentName: "where",
    inputTypeName: "UserWhereInput",
    supportsAnd: true,
    supportsOr: true,
    supportsNot: true,
    supportsQuick: true,
    supportsFts: true,
    supportsAggregation: false,
    dualModeEnabled: false,
    presets: [],
    computedFilters: [],
  },
  filters: [
    {
      __typename: "FilterSchema",
      name: "username",
      fieldName: "username",
      fieldLabel: "Username",
      baseType: "String",
      isNested: false,
      relatedModel: null,
      options: [
        {
          __typename: "FilterOption",
          name: "username__icontains",
          lookup: "icontains",
          label: "Contains",
          helpText: "Filter by username",
          choices: [],
          graphqlType: "String",
          isList: false,
        },
      ],
      filterInputType: "StringFilter",
      availableOperators: ["icontains"],
    },
  ],
  fields: [
    {
      __typename: "FieldSchema",
      name: "id",
      fieldName: "id",
      verboseName: "ID",
      helpText: "",
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
      validators: [],
      regexPattern: null,
      choices: null,
      defaultValue: null,
      maxDigits: null,
      decimalPlaces: null,
      maxValue: null,
      minValue: null,
      minLength: null,
      maxLength: null,
    },
    {
      __typename: "FieldSchema",
      name: "username",
      fieldName: "username",
      verboseName: "Username",
      helpText: "Required",
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
      validators: [],
      regexPattern: null,
      choices: null,
      defaultValue: null,
      maxDigits: null,
      decimalPlaces: null,
      maxValue: null,
      minValue: null,
      minLength: null,
      maxLength: 150,
    },
  ],
  relationships: [],
  mutations: [],
  metadataVersion: "2.0",
  customMetadata: null,
};

const DATA_QUERY = gql`
  query userPage(
    $page: Int
    $perPage: Int
    $orderBy: [String]
    $quick: String
    $where: UserWhereInput
    $presets: [String]
    $distinctOn: [String]
    $skipCount: Boolean
  ) {
    userPage(
      page: $page
      perPage: $perPage
      orderBy: $orderBy
      quick: $quick
      where: $where
      presets: $presets
      distinctOn: $distinctOn
      skipCount: $skipCount
    ) {
      pageInfo {
        totalCount
        pageCount
        hasNextPage
        hasPreviousPage
      }
      items {
        id
        username
        rowPermissions {
          canUpdate
          canDelete
          updateReason
          deleteReason
        }
      }
    }
  }
`;

const DATA_MOCK = {
  request: {
    query: DATA_QUERY,
    variables: {
      page: 1,
      perPage: 20,
      orderBy: undefined,
      quick: undefined,
      where: undefined,
      presets: undefined,
      distinctOn: undefined,
      skipCount: false,
    },
  },
  result: {
    data: {
      userPage: {
        __typename: "PaginatedUser",
        pageInfo: {
          __typename: "PaginationInfo",
          totalCount: 2,
          pageCount: 1,
          hasNextPage: false,
          hasPreviousPage: false,
        },
        items: [
          {
            __typename: "User",
            id: "1",
            username: "alice",
            rowPermissions: {
              __typename: "RowMutationPermissionsType",
              canUpdate: true,
              canDelete: true,
              updateReason: null,
              deleteReason: null,
            },
          },
          {
            __typename: "User",
            id: "2",
            username: "bob",
            rowPermissions: {
              __typename: "RowMutationPermissionsType",
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
};

function buildMetadataMock(templates: unknown[] = []) {
  return {
    request: {
      query: GET_MODEL_SCHEMA,
      variables: { app: "auth", model: "User" },
    },
    result: {
      data: {
        modelSchema: {
          ...METADATA_BASE,
          templates,
        },
      },
    },
  };
}

describe("DynamicModelTable integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders headers and rows from metadata-driven query", async () => {
    render(
      <MockedProvider mocks={[buildMetadataMock(), DATA_MOCK]}>
        <MemoryRouter>
          <DynamicModelTable app="auth" model="User" />
        </MemoryRouter>
      </MockedProvider>,
    );

    expect(screen.getByRole("status")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getAllByText("Username").length).toBeGreaterThan(0);
    });

    await waitFor(() => {
      expect(screen.getAllByText("alice").length).toBeGreaterThan(0);
      expect(screen.getAllByText("bob").length).toBeGreaterThan(0);
    });
  });

  it("enables row selection when selection is configured", async () => {
    render(
      <MockedProvider
        mocks={[
          buildMetadataMock([
            {
              __typename: "TemplateInfo",
              key: "auth/user/export_excel",
              templateType: "excel",
              title: "User export",
              endpoint: "/api/excel/auth/user/export_excel/",
              allowed: true,
              clientDataFields: [],
            },
          ]),
          DATA_MOCK,
        ]}
      >
        <MemoryRouter>
          <DynamicModelTable
            app="auth"
            model="User"
            baseTable={{
              enableSelection: true,
            }}
          />
        </MemoryRouter>
      </MockedProvider>,
    );

    await waitFor(() => {
      expect(screen.getAllByText("Username").length).toBeGreaterThan(0);
    });

    expect(screen.getByRole("checkbox", { name: /select all rows/i })).toBeInTheDocument();
  });
});
