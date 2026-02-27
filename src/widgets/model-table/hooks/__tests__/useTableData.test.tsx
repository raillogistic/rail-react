import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { useTableData } from "../useTableData";
import { useTable, TableProvider } from "../../context/TableContext";

const mockUseModelPageQuery = vi.fn();
const mockRefetch = vi.fn();

vi.mock("@/shared/api/graphql/graphql", async () => {
  const actual = await vi.importActual<typeof import("@/shared/api/graphql/graphql")>(
    "@/shared/api/graphql/graphql",
  );
  return {
    ...actual,
    useModelPageQuery: (...args: unknown[]) => mockUseModelPageQuery(...args),
  };
});

vi.mock("../../context/MetadataContext", async () => {
  const actual = await vi.importActual<typeof import("../../context/MetadataContext")>(
    "../../context/MetadataContext",
  );
  return {
    ...actual,
    useMetadata: () => ({
      app: "auth",
      model: "User",
      metadata: {
        primaryKey: "id",
        fields: [{ name: "username", fieldName: "username", visibility: "list" }],
        relationships: [],
        filterConfig: { supportsQuick: true },
      },
      loading: false,
    }),
  };
});

/**
 * Harness hook to run table data fetch logic and expose table context state.
 */
function useTableDataHarness() {
  useTableData();
  return useTable();
}

describe("useTableData", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseModelPageQuery.mockReturnValue({
      data: {
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
      loading: false,
      error: undefined,
      refetch: mockRefetch,
    });
  });

  it("maps table state to generated page query and updates context", async () => {
    const wrapper = ({ children }: { children: ReactNode }) => (
      <TableProvider>{children}</TableProvider>
    );

    const { result } = renderHook(() => useTableDataHarness(), { wrapper });

    await waitFor(() => {
      expect(result.current.data).toHaveLength(1);
    });

    expect(result.current.pagination.total).toBe(1);
    expect(result.current.pagination.numPages).toBe(1);
    expect(mockUseModelPageQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        identity: {
          app: "auth",
          model: "User",
          managerName: undefined,
        },
        metadataOptions: expect.objectContaining({
          metadataProfile: "table",
          skipMetadata: true,
        }),
        variables: expect.objectContaining({
          page: 1,
          perPage: 20,
          orderBy: ["-id"],
          skipCount: false,
        }),
      }),
    );
  });
});
