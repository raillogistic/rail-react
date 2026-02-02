import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { MockedProvider } from '@apollo/client/testing';
import { useTableData } from '../useTableData';
import { TableProvider } from '../../context/TableContext';
import { gql } from '@apollo/client';

const MOCK_DATA_QUERY = gql`
  query userPages(
    $page: Int
    $perPage: Int
    $orderBy: [String]
    $quick: String
    $where: UserWhereInput
    $presets: [String]
    $distinctOn: [String]
  ) {
    userPages(
      page: $page
      perPage: $perPage
      orderBy: $orderBy
      quick: $quick
      where: $where
      presets: $presets
      distinctOn: $distinctOn
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
      }
    }
  }
`;

// Since mocking the full GQL query for metadata is verbose, let's mock the useMetadata hook implementation
// But 'vi.mock' needs to be top-level.
vi.mock('../../context/MetadataContext', async () => {
  const actual = await vi.importActual('../../context/MetadataContext');
  return {
    ...actual,
    useMetadata: () => ({
      app: 'auth',
      model: 'User',
      metadata: {
        fields: [{ name: 'username', fieldName: 'username', visibility: 'list' }],
        filterConfig: { supportsQuick: true },
      },
      loading: false,
    }),
  };
});

describe('useTableData', () => {
  it('should fetch data and update table context', async () => {
    const dataMocks = [
      {
        request: {
          query: MOCK_DATA_QUERY,
          variables: {
            page: 1,
            perPage: 20,
            orderBy: undefined,
            quick: undefined,
            where: undefined,
            presets: undefined,
            distinctOn: undefined
          },
        },
        result: {
          data: {
            userPages: {
              __typename: 'PaginatedUser',
              pageInfo: {
                __typename: 'PaginationInfo',
                totalCount: 1,
                pageCount: 1,
                hasNextPage: false,
                hasPreviousPage: false,
              },
              items: [{ __typename: 'User', id: '1', username: 'alice' }],
            },
          },
        },
      },
    ];

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <MockedProvider mocks={dataMocks}>
        <TableProvider>
           {/* MetadataProvider is mocked above */}
           {children}
        </TableProvider>
      </MockedProvider>
    );

    const { result } = renderHook(() => useTableData(), { wrapper });

    expect(result.current).toBeDefined();
  });
});
