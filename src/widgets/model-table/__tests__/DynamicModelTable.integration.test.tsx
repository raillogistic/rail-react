/**
 * @file DynamicModelTable.integration.test.tsx
 * @description Tests d'intégration pour le composant DynamicModelTable (sélection, pagination, suppression en masse).
 */

import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { createRef } from "react";
import userEvent from "@testing-library/user-event";
import { MockedProvider } from "@apollo/client/testing";
import { gql } from "@apollo/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { DynamicModelTable } from "../components/DynamicModelTable";
import { buildModelMutationDocument } from "@/shared/api/graphql/graphql/mutations";
import {
 TABLE_ACTION_DETAILS_METADATA_QUERY,
 TABLE_ACTIONS_BOOTSTRAP_METADATA_QUERY,
 TABLE_BOOTSTRAP_METADATA_QUERY as GET_MODEL_SCHEMA,
 TABLE_CAPABILITIES_METADATA_QUERY,
} from "@/shared/api/graphql/graphql/metadata/queries";

vi.stubEnv("VITE_METADATA_GATEWAY_TABLE", "0");

vi.mock("@/widgets/model-table/filtering/FilterPanel", () => ({
 FilterPanel: () => <div data-testid="dynamic-filter-form-mock">Filter Form</div>,
}));

vi.mock("../components/TableToolbar", () => ({
 TableToolbar: () => <div data-testid="table-toolbar-mock">Toolbar</div>,
}));

let mockAuthUser: unknown = null;

vi.mock("@/features/auth/context", () => ({
 useAuthContext: () => ({
 user: mockAuthUser,
 }),
}));

vi.mock("@/shared/ui/kit/dropdown-menu", () => ({
 DropdownMenu: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
 DropdownMenuTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
 DropdownMenuContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
 DropdownMenuPortal: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
 DropdownMenuItem: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
 DropdownMenuCheckboxItem: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
 DropdownMenuSub: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
 DropdownMenuSubTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
 DropdownMenuSubContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
 DropdownMenuLabel: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
 DropdownMenuSeparator: () => null,
}));

vi.mock("@/shared/ui/kit/checkbox", () => ({
  Checkbox: ({ checked, onCheckedChange, "aria-label": ariaLabel }: any) => {
    console.log("Mock Checkbox rendered - aria-label:", ariaLabel, "checked:", checked, "has callback:", typeof onCheckedChange);
    return (
      <input
        type="checkbox"
        checked={checked ?? false}
        onChange={(e) => {
          console.log("Mock Checkbox onChange fired! checked value:", e.target.checked);
          onCheckedChange?.(e.target.checked);
        }}
        aria-label={ariaLabel}
        data-testid="mock-checkbox"
      />
    );
  },
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

const DATA_QUERY_MINIMAL = gql`
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

const DATA_RESULT = {
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
};

const DATA_MOCK = {
 request: {
 query: DATA_QUERY,
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
 result: {
 data: DATA_RESULT,
 },
};

const DATA_MOCK_MINIMAL = {
 request: {
 query: DATA_QUERY_MINIMAL,
 variables: {
 page: 1,
 perPage: 10,
 orderBy: undefined,
 where: undefined,
 presets: undefined,
 distinctOn: undefined,
 skipCount: false,
 },
 },
 result: {
 data: DATA_RESULT,
 },
};

const DATA_MOCK_WITH_INIT_VARIABLES = {
 request: {
 query: DATA_QUERY,
 variables: {
 page: 2,
 perPage: 10,
 orderBy: ["-username"],
 quick: undefined,
 where: { status: "PAID" },
 presets: ["yesterday"],
 distinctOn: undefined,
 skipCount: false,
 },
 },
 result: {
 data: DATA_RESULT,
 },
};

const DATA_MOCK_WITH_INIT_VARIABLES_MINIMAL = {
 request: {
 query: DATA_QUERY_MINIMAL,
 variables: {
 page: 2,
 perPage: 10,
 orderBy: undefined,
 where: { status: "PAID" },
 presets: ["yesterday"],
 distinctOn: undefined,
 skipCount: false,
 },
 },
 result: {
 data: DATA_RESULT,
 },
};

function buildBootstrapInitialState(
 overrides: Record<string, unknown> = {},
) {
 return {
 page: 1,
 pageSize: 10,
 ordering: ["-id"],
 ...overrides,
 };
}

function buildMetadataMock(
 templates: unknown[] = [],
 permissions = METADATA_BASE.permissions,
 mutations: unknown[] = [],
 options?: {
 persistenceKey?: string;
 initialState?: Record<string, unknown>;
 },
) {
 return {
 request: {
 query: GET_MODEL_SCHEMA,
 variables: {
 app: "auth",
 model: "User",
 persistenceKey: options?.persistenceKey ?? "auth-User-/",
 },
 },
 result: {
 data: {
 modelSchema: {
 ...METADATA_BASE,
 permissions,
 mutations,
 templates,
 },
 tableBootstrapMinimal: {
 __typename: "TableBootstrapMinimalType",
 initialState: buildBootstrapInitialState(options?.initialState),
 },
 },
 },
 };
}

function buildCapabilitiesMock(templates: unknown[] = []) {
 return {
 request: {
 query: TABLE_CAPABILITIES_METADATA_QUERY,
 variables: { app: "auth", model: "User" },
 },
 result: {
 data: {
 modelSchema: {
 __typename: "ModelSchema",
 app: "auth",
 model: "User",
 filterConfig: METADATA_BASE.filterConfig,
 filters: METADATA_BASE.filters,
 relationFilters: [],
 mutations: [],
 permissions: METADATA_BASE.permissions,
 fieldGroups: [],
 templates,
 },
 },
 },
 };
}

function buildActionsBootstrapMock(
 mutations: unknown[] = [],
 permissions = METADATA_BASE.permissions,
) {
 return {
 request: {
 query: TABLE_ACTIONS_BOOTSTRAP_METADATA_QUERY,
 variables: { app: "auth", model: "User" },
 },
 result: {
 data: {
 modelSchema: {
 __typename: "ModelSchema",
 app: "auth",
 model: "User",
 permissions,
 mutations,
 },
 },
 },
 };
}

function buildActionDetailsMock(templates: unknown[] = []) {
 return {
 request: {
 query: TABLE_ACTION_DETAILS_METADATA_QUERY,
 variables: { app: "auth", model: "User" },
 },
 result: {
 data: {
 modelSchema: {
 __typename: "ModelSchema",
 app: "auth",
 model: "User",
 mutations: [],
 templates,
 },
 },
 },
 };
}

describe("DynamicModelTable integration", () => {
 beforeEach(() => {
 vi.clearAllMocks();
 window.localStorage.clear();
 mockAuthUser = null;
 });

 it("renders headers and rows from metadata-driven query", async () => {
 render(
 <MockedProvider
 mocks={[
 buildMetadataMock(),
 buildMetadataMock(),
 buildActionsBootstrapMock(),
 DATA_MOCK,
 DATA_MOCK,
 DATA_MOCK_MINIMAL,
 DATA_MOCK_MINIMAL,
 buildCapabilitiesMock(),
 buildActionDetailsMock(),
 ]}
 >
 <MemoryRouter>
 <DynamicModelTable app="auth" model="User" />
 </MemoryRouter>
 </MockedProvider>,
 );

 expect(screen.getByRole("status")).toBeInTheDocument();

 await waitFor(() => {
 expect(screen.getAllByText("Username").length).toBeGreaterThan(0);
 }, { timeout: 4000 });

 await waitFor(() => {
  expect(
    screen.getByText((content) => content.includes("2") && (content.includes("results") || content.includes("éléments"))),
  ).toBeInTheDocument();
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
 DATA_MOCK,
 DATA_MOCK_MINIMAL,
 DATA_MOCK_MINIMAL,
 buildActionsBootstrapMock(),
 buildCapabilitiesMock([
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
 buildActionDetailsMock(),
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
 }, { timeout: 4000 });

 const selectAllHeaderCell = screen
 .getByRole("checkbox", {
 name: /(select all rows|tout s(?:e|\u00e9)lectionner)/i,
 })
 .closest("th");

 expect(selectAllHeaderCell).toBeInTheDocument();
 expect((selectAllHeaderCell as HTMLTableCellElement).cellIndex).toBe(0);
});

 it("renders detail expansion when baseTable.expand is configured", async () => {
 const user = userEvent.setup();

 render(
 <MockedProvider
 mocks={[
 buildMetadataMock(),
 buildMetadataMock(),
 buildActionsBootstrapMock(),
 DATA_MOCK,
 DATA_MOCK,
 DATA_MOCK_MINIMAL,
 DATA_MOCK_MINIMAL,
 buildCapabilitiesMock(),
 buildActionDetailsMock(),
 ]}
 >
 <MemoryRouter>
 <DynamicModelTable
 app="auth"
 model="User"
 baseTable={{
 hideTableOnMobile: false,
 expand: {
 renderRow: ({ row }) => (
 <div>
 Detail: {String(row["username"])}
 </div>
 ),
 },
 }}
 />
 </MemoryRouter>
 </MockedProvider>,
 );

 await waitFor(() => {
 expect(screen.getAllByText("Username").length).toBeGreaterThan(0);
 }, { timeout: 4000 });

 const expandButton = await screen.findByRole(
 "button",
 { name: /expand row 1/i },
 { timeout: 4000 },
 );
 expect(expandButton).toHaveAttribute("aria-expanded", "false");
 await user.click(expandButton);
 });

 it("applies initVariables to the initial query request", async () => {
 render(
 <MockedProvider
 mocks={[
 buildMetadataMock(),
 buildMetadataMock(),
 buildActionsBootstrapMock(),
 DATA_MOCK_WITH_INIT_VARIABLES,
 DATA_MOCK_WITH_INIT_VARIABLES,
 DATA_MOCK_WITH_INIT_VARIABLES_MINIMAL,
 DATA_MOCK_WITH_INIT_VARIABLES_MINIMAL,
 buildCapabilitiesMock(),
 buildActionDetailsMock(),
 ]}
 >
 <MemoryRouter>
 <DynamicModelTable
 app="auth"
 model="User"
 initVariables={{
 preset: "yesterday",
 where: { status: "PAID" },
 page: 2,
 perPage: 10,
 orderBy: "-username",
 }}
 />
 </MemoryRouter>
 </MockedProvider>,
 );

 await waitFor(() => {
 expect(screen.getAllByText("Username").length).toBeGreaterThan(0);
 });

 await waitFor(() => {
  expect(
    screen.getByText((content) => content.includes("2") && (content.includes("results") || content.includes("éléments"))),
  ).toBeInTheDocument();
 });
 });

 it("uses backend bootstrap page size on the initial query", async () => {
 render(
 <MockedProvider
 mocks={[
 buildMetadataMock([], METADATA_BASE.permissions, [], {
 persistenceKey: "users-list",
 initialState: {
 pageSize: 25,
 columnOrder: ["username"],
 columnVisibility: {
 username: true,
 },
 density: "compact",
 wrapCells: false,
 },
 }),
 buildMetadataMock([], METADATA_BASE.permissions, [], {
 persistenceKey: "users-list",
 initialState: {
 pageSize: 25,
 columnOrder: ["username"],
 columnVisibility: {
 username: true,
 },
 density: "compact",
 wrapCells: false,
 },
 }),
 buildActionsBootstrapMock(),
 {
 request: {
 query: DATA_QUERY,
 variables: {
 page: 1,
 perPage: 25,
 orderBy: ["-id"],
 quick: undefined,
 where: undefined,
 presets: undefined,
 distinctOn: undefined,
 skipCount: false,
 },
 },
 result: {
 data: DATA_RESULT,
 },
 },
 {
 request: {
 query: DATA_QUERY_MINIMAL,
 variables: {
 page: 1,
 perPage: 25,
 orderBy: undefined,
 where: undefined,
 presets: undefined,
 distinctOn: undefined,
 skipCount: false,
 },
 },
 result: {
 data: DATA_RESULT,
 },
 },
 buildCapabilitiesMock(),
 buildActionDetailsMock(),
 ]}
 >
 <MemoryRouter>
 <DynamicModelTable
 app="auth"
 model="User"
 baseTable={{
 persistenceKey: "users-list",
 }}
 />
 </MemoryRouter>
 </MockedProvider>,
 );

 await waitFor(() => {
 expect(screen.getAllByText("Username").length).toBeGreaterThan(0);
 }, { timeout: 4000 });
 });

 it("waits for backend bootstrap state before firing the first row query", async () => {
 const bootstrapInitialState = {
 pageSize: 25,
 columnOrder: ["username"],
 columnVisibility: {
 username: true,
 },
 density: "compact",
 wrapCells: false,
 };
 const delayedHydratedQuery = vi.fn(() => ({
 data: DATA_RESULT,
 }));
 const delayedHydratedMinimalQuery = vi.fn(() => ({
 data: DATA_RESULT,
 }));

 render(
 <MockedProvider
 mocks={[
 {
 request: {
 query: GET_MODEL_SCHEMA,
 variables: {
 app: "auth",
 model: "User",
 persistenceKey: "users-list",
 },
 },
 result: () => ({
 data: {
 modelSchema: {
 ...METADATA_BASE,
 permissions: METADATA_BASE.permissions,
 mutations: [],
 templates: [],
 },
 tableBootstrapMinimal: {
 __typename: "TableBootstrapMinimalType",
 initialState: buildBootstrapInitialState(bootstrapInitialState),
 },
 },
 }),
 },
 {
 request: {
 query: GET_MODEL_SCHEMA,
 variables: {
 app: "auth",
 model: "User",
 persistenceKey: "users-list",
 },
 },
 result: () => ({
 data: {
 modelSchema: {
 ...METADATA_BASE,
 permissions: METADATA_BASE.permissions,
 mutations: [],
 templates: [],
 },
 tableBootstrapMinimal: {
 __typename: "TableBootstrapMinimalType",
 initialState: buildBootstrapInitialState(bootstrapInitialState),
 },
 },
 }),
 },
 buildActionsBootstrapMock(),
 DATA_MOCK,
 DATA_MOCK,
 DATA_MOCK_MINIMAL,
 DATA_MOCK_MINIMAL,
 {
 request: {
 query: DATA_QUERY,
 variables: {
 page: 1,
 perPage: 25,
 orderBy: ["-id"],
 quick: undefined,
 where: undefined,
 presets: undefined,
 distinctOn: undefined,
 skipCount: false,
 },
 },
 result: delayedHydratedQuery,
 },
 {
 request: {
 query: DATA_QUERY_MINIMAL,
 variables: {
 page: 1,
 perPage: 25,
 orderBy: undefined,
 where: undefined,
 presets: undefined,
 distinctOn: undefined,
 skipCount: false,
 },
 },
 result: delayedHydratedMinimalQuery,
 },
 buildCapabilitiesMock(),
 buildActionDetailsMock(),
 ]}
 >
 <MemoryRouter>
 <DynamicModelTable
 app="auth"
 model="User"
 baseTable={{
 persistenceKey: "users-list",
 }}
 />
 </MemoryRouter>
 </MockedProvider>,
 );

 await waitFor(() => {
 expect(screen.getAllByText("Username").length).toBeGreaterThan(0);
 }, { timeout: 4000 });

 await waitFor(() => {
 expect(delayedHydratedQuery).toHaveBeenCalled();
 expect(delayedHydratedMinimalQuery).toHaveBeenCalled();
 }, { timeout: 4000 });
 });

 it("executes bulk delete for selected rows", async () => {
 const user = userEvent.setup();
 const bulkDeletePermissions = {
 ...METADATA_BASE.permissions,
 canBulkDelete: true,
 };
 const bulkDeleteMutation = {
 __typename: "MutationSchema",
 name: "bulkDeleteUser",
 operation: "bulkDelete",
 allowed: true,
 mutationType: "bulkDelete",
 };
 const bulkDeleteDocument = buildModelMutationDocument({
 mode: "bulkDelete",
 model: "User",
 mutationName: "bulkDeleteUser",
 selection: "id",
 });

  const ref = createRef<any>();
  render(
  <MockedProvider
  mocks={[
  buildMetadataMock([], bulkDeletePermissions, [bulkDeleteMutation]),
  buildMetadataMock([], bulkDeletePermissions, [bulkDeleteMutation]),
  buildActionsBootstrapMock([bulkDeleteMutation], bulkDeletePermissions),
  DATA_MOCK,
  DATA_MOCK,
  DATA_MOCK,
  DATA_MOCK_MINIMAL,
  DATA_MOCK_MINIMAL,
  buildCapabilitiesMock(),
  buildActionDetailsMock(),
  {
  request: {
  query: bulkDeleteDocument.mutationDocument,
  variables: {
  ids: ["1"],
  },
  },
  result: {
  data: {
  response: {
  ok: true,
  objects: [{ id: "1" }],
  errors: null,
  },
  },
  },
  },
  ]}
  >
  <MemoryRouter>
  <DynamicModelTable
  ref={ref}
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
 }, { timeout: 4000 });

  const selectCheckbox = await screen.findByLabelText("Select row 1", {}, { timeout: 4000 });
  fireEvent.click(selectCheckbox);

  // Wait a small bit for React state to flush
  await new Promise((resolve) => setTimeout(resolve, 100));

  const bulkDeleteBtn = await screen.findByTestId("bulk-delete-button", {}, { timeout: 4000 });
  fireEvent.click(bulkDeleteBtn);

  await waitFor(() => {
    expect(screen.getByText("Action critique")).toBeInTheDocument();
  });

  const confirmBtn = screen.getByRole("button", { name: /confirmer la suppression/i });
  fireEvent.click(confirmBtn);

 await waitFor(() => {
 expect(screen.queryByText("Action critique")).not.toBeInTheDocument();
 });
 });
});
