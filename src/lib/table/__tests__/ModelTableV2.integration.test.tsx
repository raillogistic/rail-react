import { render, screen, waitFor } from '@testing-library/react';
import { MockedProvider } from '@apollo/client/testing';
import { ModelTableV2 } from '../index';
import { GET_MODEL_SCHEMA } from '../queries';
import { gql } from '@apollo/client';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';

vi.stubEnv('VITE_METADATA_GATEWAY_TABLE', '0');

// Mock FilterPanel to avoid extra Apollo queries in tests
vi.mock('../../filters/FilterPanel', () => ({
  FilterPanel: () => <div data-testid="dynamic-filter-form-mock">Filter Form</div>
}));

// Mock TableToolbar to avoid Radix UI sideOffset warnings in tests
vi.mock('../components/TableToolbar', () => ({
  TableToolbar: () => <div data-testid="table-toolbar-mock">Toolbar</div>
}));

vi.mock('@/auth/context', () => ({
  useAuthContext: () => ({
    user: null,
  }),
}));

// Mock UI components that cause sideOffset warnings or other issues in JSDOM
vi.mock('@/lib/components/ui/dropdown-menu', () => ({
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

// Mocks
const MOCK_METADATA_QUERY = {
  request: {
    query: GET_MODEL_SCHEMA,
    variables: { app: 'auth', model: 'User' },
  },
  result: {
    data: {
      modelSchema: {
        __typename: 'ModelSchema',
        app: 'auth',
        model: 'User',
        verboseName: 'User',
        verboseNamePlural: 'Users',
        primaryKey: 'id',
        ordering: ['username'],
        permissions: {
          __typename: 'ModelPermissions',
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
          __typename: 'FilterConfig',
          style: 'nested',
          argumentName: 'where',
          inputTypeName: 'UserWhereInput',
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
            __typename: 'FilterSchema',
            name: 'username',
            fieldName: 'username',
            fieldLabel: 'Username',
            baseType: 'String',
            isNested: false,
            relatedModel: null,
            options: [
              {
                __typename: 'FilterOption',
                name: 'username__icontains',
                lookup: 'icontains',
                label: 'Contient',
                helpText: 'Filtrer par username',
                choices: [],
                graphqlType: 'String',
                isList: false,
              },
            ],
            filterInputType: 'StringFilter',
            availableOperators: ['icontains'],
          },
        ],
        fields: [
          {
            __typename: 'FieldSchema',
            name: 'id',
            fieldName: 'id',
            verboseName: 'ID',
            helpText: '',
            fieldType: 'AutoField',
            graphqlType: 'ID',
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
            visibility: 'list',
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
            __typename: 'FieldSchema',
            name: 'username',
            fieldName: 'username',
            verboseName: 'Username',
            helpText: 'Required',
            fieldType: 'CharField',
            graphqlType: 'String',
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
            visibility: 'list',
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
        metadataVersion: '2.0',
        customMetadata: null,
      },
    },
  },
};

// Data Query Mock (dynamic based on visible table fields).
const MOCK_DATA_QUERY = {
  request: {
    query: gql`
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
    `,
    variables: {
      page: 1,
      perPage: 20,
      orderBy: undefined,
      quick: undefined,
      where: undefined,
      presets: undefined,
      distinctOn: undefined,
      skipCount: true,
    },
  },
  result: {
    data: {
      userPage: {
        __typename: 'PaginatedUser',
        pageInfo: {
          __typename: 'PaginationInfo',
          totalCount: 2,
          pageCount: 1,
          hasNextPage: false,
          hasPreviousPage: false,
        },
        items: [
          {
            __typename: 'User',
            id: '1',
            username: 'alice',
            rowPermissions: {
              __typename: 'RowMutationPermissionsType',
              canUpdate: true,
              canDelete: true,
              updateReason: null,
              deleteReason: null,
            },
          },
          {
            __typename: 'User',
            id: '2',
            username: 'bob',
            rowPermissions: {
              __typename: 'RowMutationPermissionsType',
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

const MOCK_METADATA_QUERY_WITH_TEMPLATE = {
  request: {
    query: GET_MODEL_SCHEMA,
    variables: { app: 'auth', model: 'User' },
  },
  result: {
    data: {
      modelSchema: {
        __typename: 'ModelSchema',
        app: 'auth',
        model: 'User',
        verboseName: 'User',
        verboseNamePlural: 'Users',
        primaryKey: 'id',
        ordering: ['username'],
        permissions: {
          __typename: 'ModelPermissions',
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
          __typename: 'FilterConfig',
          style: 'nested',
          argumentName: 'where',
          inputTypeName: 'UserWhereInput',
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
            __typename: 'FilterSchema',
            name: 'username',
            fieldName: 'username',
            fieldLabel: 'Username',
            baseType: 'String',
            isNested: false,
            relatedModel: null,
            options: [
              {
                __typename: 'FilterOption',
                name: 'username__icontains',
                lookup: 'icontains',
                label: 'Contient',
                helpText: 'Filtrer par username',
                choices: [],
                graphqlType: 'String',
                isList: false,
              },
            ],
            filterInputType: 'StringFilter',
            availableOperators: ['icontains'],
          },
        ],
        fields: [
          {
            __typename: 'FieldSchema',
            name: 'id',
            fieldName: 'id',
            verboseName: 'ID',
            helpText: '',
            fieldType: 'AutoField',
            graphqlType: 'ID',
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
            visibility: 'list',
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
            __typename: 'FieldSchema',
            name: 'username',
            fieldName: 'username',
            verboseName: 'Username',
            helpText: 'Required',
            fieldType: 'CharField',
            graphqlType: 'String',
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
            visibility: 'list',
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
        templates: [
          {
            __typename: 'TemplateInfo',
            key: 'auth/user/export_excel',
            templateType: 'excel',
            title: 'User export',
            description: null,
            endpoint: '/api/excel/auth/user/export_excel/',
            urlPath: 'auth/user/export_excel',
            guard: null,
            requireAuthentication: true,
            roles: [],
            permissions: [],
            allowed: true,
            denialReason: null,
            allowClientData: false,
            clientDataFields: [],
            clientDataSchema: null,
          },
        ],
        metadataVersion: '2.0',
        customMetadata: null,
      },
    },
  },
};

describe('ModelTableV2 Integration', () => {
  it('should render table with headers based on metadata', async () => {
    render(
      <MockedProvider mocks={[MOCK_METADATA_QUERY, MOCK_DATA_QUERY]}>
        <MemoryRouter>
          <ModelTableV2 app="auth" model="User" />
        </MemoryRouter>
      </MockedProvider>
    );

    // Should show loading initially
    expect(screen.getByRole('status')).toBeInTheDocument();

    // Wait for metadata to load and headers to appear
    await waitFor(() => {
        expect(screen.getAllByText('Username').length).toBeGreaterThan(0);
    });

    // Check for headers/state
    expect(screen.queryByText('ID')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Tout selectionner')).not.toBeInTheDocument();

    // Check for data rows (loaded from MOCK_DATA_QUERY)
    await waitFor(() => {
        // We might have multiple instances due to Desktop Table + Mobile Card
        // So we use getAllByText
        expect(screen.getAllByText('alice').length).toBeGreaterThan(0);
        expect(screen.getAllByText('bob').length).toBeGreaterThan(0);
    });

    expect(screen.getAllByText('Filtrer').length).toBeGreaterThan(0);
  });

  it('should enable row selection automatically when templates are present', async () => {
    render(
      <MockedProvider mocks={[MOCK_METADATA_QUERY_WITH_TEMPLATE, MOCK_DATA_QUERY]}>
        <MemoryRouter>
          <ModelTableV2 app="auth" model="User" />
        </MemoryRouter>
      </MockedProvider>
    );

    await waitFor(() => {
      expect(screen.getAllByText('Username').length).toBeGreaterThan(0);
    });

    expect(screen.getByRole('checkbox', { name: /Tout/i })).toBeInTheDocument();
  });
});
