import React from "react";
import { MockedProvider } from "@apollo/client/testing";
import { gql } from "@apollo/client";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DynamicModelTable } from "../components/DynamicModelTable";
import {
  TABLE_ACTION_DETAILS_METADATA_QUERY,
  TABLE_ACTIONS_BOOTSTRAP_METADATA_QUERY,
  TABLE_BOOTSTRAP_METADATA_QUERY,
  TABLE_CAPABILITIES_METADATA_QUERY,
} from "@/shared/api/graphql/graphql/metadata/queries";

vi.stubEnv("VITE_METADATA_GATEWAY_TABLE", "0");

vi.mock("@/widgets/model-table/filtering/FilterPanel", () => ({
  FilterPanel: () => <div data-testid="dynamic-filter-form-mock">Filter Form</div>,
}));

vi.mock("../components/ExportDialog", () => ({
  ModelTableExportDialog: ({ trigger }: { trigger: React.ReactNode }) => <>{trigger}</>,
}));

vi.mock("@/shared/ui/kit/dropdown-menu", () => ({
  DropdownMenu: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuPortal: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuItem: ({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) => (
    <button type="button" onClick={onClick}>
      {children}
    </button>
  ),
  DropdownMenuCheckboxItem: ({
    children,
    onCheckedChange,
  }: {
    children: React.ReactNode;
    onCheckedChange?: (checked: boolean) => void;
  }) => (
    <button type="button" onClick={() => onCheckedChange?.(true)}>
      {children}
    </button>
  ),
  DropdownMenuSub: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuSubTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuSubContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuLabel: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuSeparator: () => null,
}));

vi.mock("@/shared/ui/kit/dialog", () => ({
  Dialog: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogTitle: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogDescription: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/shared/ui/kit/sheet", () => ({
  Sheet: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SheetTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SheetContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SheetHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/shared/ui/kit/tooltip", () => ({
  TooltipProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  Tooltip: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  TooltipTrigger: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  TooltipContent: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

let mockAuthUser: unknown = null;

vi.mock("@/features/auth/context", () => ({
  useAuthContext: () => ({
    user: mockAuthUser,
  }),
}));

const metadataBase = {
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
      defaultOperator: "icontains",
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

const dataResult = {
  userPage: {
    __typename: "UserPageType",
    pageInfo: {
      __typename: "PageInfo",
      totalCount: 2,
      pageCount: 1,
      hasNextPage: false,
      hasPreviousPage: false,
    },
    items: [
      {
        __typename: "UserType",
        id: "1",
        username: "alice",
        rowPermissions: {
          __typename: "RowMutationPermissions",
          canUpdate: true,
          canDelete: true,
          updateReason: null,
          deleteReason: null,
        },
      },
      {
        __typename: "UserType",
        id: "2",
        username: "bob",
        rowPermissions: {
          __typename: "RowMutationPermissions",
          canUpdate: true,
          canDelete: true,
          updateReason: null,
          deleteReason: null,
        },
      },
    ],
  },
};

const dataQuery = gql`
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

const dataQueryMinimal = gql`
  query userPage(
    $page: Int
    $perPage: Int
    $orderBy: [String]
    $where: UserWhereInput
    $presets: [String]
    $distinctOn: [String]
    $skipCount: Boolean
  ) {
    userPage(
      page: $page
      perPage: $perPage
      orderBy: $orderBy
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
      }
    }
  }
`;

function buildMetadataMock() {
  return {
    request: {
      query: TABLE_BOOTSTRAP_METADATA_QUERY,
      variables: {
        app: "auth",
        model: "User",
        persistenceKey: "auth-User-/",
      },
    },
    result: {
      data: {
        modelSchema: metadataBase,
        tableBootstrapMinimal: null,
      },
    },
  };
}

function buildActionBootstrapMock() {
  return {
    request: {
      query: TABLE_ACTIONS_BOOTSTRAP_METADATA_QUERY,
      variables: {
        app: "auth",
        model: "User",
      },
    },
    result: {
      data: {
        modelSchema: {
          ...metadataBase,
          mutations: [],
          templates: [],
        },
      },
    },
  };
}

function buildCapabilitiesMock() {
  return {
    request: {
      query: TABLE_CAPABILITIES_METADATA_QUERY,
      variables: {
        app: "auth",
        model: "User",
      },
    },
    result: {
      data: {
        modelSchema: {
          ...metadataBase,
          filterConfig: metadataBase.filterConfig,
          filters: metadataBase.filters,
          permissions: metadataBase.permissions,
          templates: [],
        },
      },
    },
  };
}

function buildActionDetailsMock() {
  return {
    request: {
      query: TABLE_ACTION_DETAILS_METADATA_QUERY,
      variables: {
        app: "auth",
        model: "User",
      },
    },
    result: {
      data: {
        modelSchema: {
          ...metadataBase,
          mutations: [],
          templates: [],
        },
      },
    },
  };
}

describe("DynamicModelTable quickFilters", () => {
  beforeEach(() => {
    mockAuthUser = null;
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  it("renders metadata-driven toolbar quick filters and updates the query on change and clear", async () => {
    const user = userEvent.setup();
    const filteredSpy = vi.fn();
    const clearedSpy = vi.fn();

    render(
      <MockedProvider
        showWarnings={false}
        mocks={[
          buildMetadataMock(),
          buildMetadataMock(),
          buildActionBootstrapMock(),
          {
            request: {
              query: dataQuery,
              variables: {
                page: 2,
                perPage: 10,
                orderBy: ["-id"],
                quick: undefined,
                where: undefined,
                presets: undefined,
                distinctOn: undefined,
                skipCount: false,
              },
            },
            result: { data: dataResult },
          },
          {
            request: {
              query: dataQuery,
              variables: {
                page: 2,
                perPage: 10,
                orderBy: ["-id"],
                quick: undefined,
                where: undefined,
                presets: undefined,
                distinctOn: undefined,
                skipCount: false,
              },
            },
            result: { data: dataResult },
          },
          {
            request: {
              query: dataQueryMinimal,
              variables: {
                page: 2,
                perPage: 10,
                skipCount: false,
              },
            },
            result: { data: dataResult },
          },
          {
            request: {
              query: dataQueryMinimal,
              variables: {
                page: 2,
                perPage: 10,
                skipCount: false,
              },
            },
            result: { data: dataResult },
          },
          {
            request: {
              query: dataQueryMinimal,
              variables: {
                page: 2,
                perPage: 10,
                skipCount: false,
              },
            },
            result: { data: dataResult },
          },
          {
            request: {
              query: dataQueryMinimal,
              variables: {
                page: 2,
                perPage: 10,
                skipCount: false,
              },
            },
            result: { data: dataResult },
          },
          {
            request: {
              query: dataQuery,
              variables: {
                page: 1,
                perPage: 10,
                orderBy: ["-id"],
                quick: undefined,
                where: {
                  username: {
                    icontains: "alice",
                  },
                },
                presets: undefined,
                distinctOn: undefined,
                skipCount: false,
              },
            },
            result: () => {
              filteredSpy();
              return { data: dataResult };
            },
          },
          {
            request: {
              query: dataQuery,
              variables: {
                page: 1,
                perPage: 10,
                orderBy: ["-id"],
                quick: undefined,
                where: {
                  username: {
                    icontains: "alice",
                  },
                },
                presets: undefined,
                distinctOn: undefined,
                skipCount: false,
              },
            },
            result: { data: dataResult },
          },
          {
            request: {
              query: dataQueryMinimal,
              variables: {
                page: 1,
                perPage: 10,
                where: {
                  username: {
                    icontains: "alice",
                  },
                },
                skipCount: false,
              },
            },
            result: { data: dataResult },
          },
          {
            request: {
              query: dataQuery,
              variables: {
                page: 1,
                perPage: 10,
                orderBy: ["-id"],
                quick: undefined,
                where: undefined,
                presets: undefined,
                distinctOn: undefined,
                skipCount: false,
              },
            },
            result: () => {
              clearedSpy();
              return { data: dataResult };
            },
          },
          {
            request: {
              query: dataQueryMinimal,
              variables: {
                page: 1,
                perPage: 10,
                skipCount: false,
              },
            },
            result: { data: dataResult },
          },
          buildCapabilitiesMock(),
          buildActionDetailsMock(),
        ]}
      >
        <MemoryRouter>
          <DynamicModelTable
            app="auth"
            model="User"
            initVariables={{ page: 2 }}
            baseTable={{
              quickFilters: ["username"],
            }}
          />
        </MemoryRouter>
      </MockedProvider>,
    );

    await waitFor(() => {
      expect(screen.getAllByText("Username").length).toBeGreaterThan(0);
    });

    const quickFilterInput = screen.getByRole("textbox", {
      name: /username quick filter/i,
    });
    await user.type(quickFilterInput, "alice");

    await waitFor(() => {
      expect(filteredSpy).toHaveBeenCalled();
    });

    await user.click(
      screen.getByRole("button", { name: /clear username quick filter/i }),
    );

    await waitFor(() => {
      expect(clearedSpy).toHaveBeenCalled();
    });
  });
});
