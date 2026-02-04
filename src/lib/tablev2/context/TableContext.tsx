import { createContext, useContext, useReducer, ReactNode, useCallback } from "react";
import {
  TableContextState,
  SortingState,
  ColumnVisibilityState
} from "../types";
import { FilterFormState } from "../../form/filters/types";

// ============================================================================
// Actions & Reducer
// ============================================================================

type TableAction =
  | { type: "SET_PAGE"; page: number }
  | { type: "SET_PER_PAGE"; perPage: number }
  | {
      type: "SET_PAGE_INFO";
      totalCount?: number | null;
      pageCount?: number | null;
      hasNextPage?: boolean | null;
      hasPreviousPage?: boolean | null;
    }
  | { type: "SET_SORTING"; sorting: SortingState[] }
  | { type: "SET_COLUMN_VISIBILITY"; visibility: ColumnVisibilityState }
  | { type: "SET_COLUMN_ORDER"; order: string[] }
  | { type: "SET_ROW_SELECTION"; selection: Record<string, boolean> }
  | { type: "SET_QUICK_SEARCH"; term: string }
  | { type: "SET_ADVANCED_FILTERS"; filters: FilterFormState; variables?: Record<string, unknown> }
  | { type: "SET_DATA"; data: Record<string, unknown>[]; loading: boolean; error?: Error | null }
  | { type: "SET_LOADING"; loading: boolean }
  | { type: "REFRESH" };

const initialState: TableContextState = {
  data: [],
  loading: false,
  error: null,
  metadataLoading: true,
  pagination: {
    page: 1,
    perPage: 20,
    total: 0,
    numPages: 0,
    totalKnown: true,
    hasNextPage: false,
    hasPreviousPage: false,
  },
  sorting: [],
  columnVisibility: {},
  columnOrder: [],
  rowSelection: {},
  refreshKey: 0,
  quickSearch: "",
  advancedFilters: {
    root: { id: "root", type: "group", logic: "AND", conditions: [], negated: false },
    selectedPresets: [],
    distinctOn: [],
    orderBy: [],
  },
  filterVariables: {},
  // Placeholders, will be overwritten by Provider
  setPage: () => {},
  setPerPage: () => {},
  setSorting: () => {},
  setColumnVisibility: () => {},
  setColumnOrder: () => {},
  setRowSelection: () => {},
  setQuickSearch: () => {},
  setAdvancedFilters: () => {},
  refresh: () => {},
  _setPageInfo: () => {},
  _setData: () => {},
};

function tableReducer(state: TableContextState, action: TableAction): TableContextState {
  switch (action.type) {
    case "SET_PAGE":
      return {
        ...state,
        pagination: {
          ...state.pagination,
          page: action.page,
          hasPreviousPage: state.pagination.totalKnown
            ? state.pagination.hasPreviousPage
            : action.page > 1,
        },
      };
    case "SET_PER_PAGE":
      return {
        ...state,
        pagination: {
          ...state.pagination,
          perPage: action.perPage,
          page: 1,
          hasPreviousPage: state.pagination.totalKnown
            ? state.pagination.hasPreviousPage
            : false,
        },
      }; // Reset to page 1
    case "SET_PAGE_INFO": {
      const hasTotal = typeof action.totalCount === "number";
      const totalCount = hasTotal ? action.totalCount ?? 0 : 0;
      const pageCount = typeof action.pageCount === "number"
        ? action.pageCount
        : hasTotal
          ? Math.ceil(totalCount / state.pagination.perPage)
          : 0;
      return {
        ...state,
        pagination: {
          ...state.pagination,
          total: totalCount,
          numPages: pageCount ?? 0,
          totalKnown: hasTotal,
          hasNextPage: action.hasNextPage ?? state.pagination.hasNextPage,
          hasPreviousPage:
            action.hasPreviousPage ?? state.pagination.hasPreviousPage,
        },
      };
    }
    case "SET_SORTING":
      return { ...state, sorting: action.sorting };
    case "SET_COLUMN_VISIBILITY":
      return { ...state, columnVisibility: action.visibility };
    case "SET_COLUMN_ORDER":
      return { ...state, columnOrder: action.order };
    case "SET_ROW_SELECTION":
      return { ...state, rowSelection: action.selection };
    case "SET_QUICK_SEARCH":
      return { ...state, quickSearch: action.term, pagination: { ...state.pagination, page: 1 } };
    case "SET_ADVANCED_FILTERS":
      return {
        ...state,
        advancedFilters: action.filters,
        filterVariables: action.variables,
        pagination: { ...state.pagination, page: 1 }
      };
    case "SET_DATA":
      return {
        ...state,
        data: action.data,
        loading: action.loading,
        error: action.error || null
      };
    case "SET_LOADING":
      return { ...state, loading: action.loading };
    case "REFRESH":
      return { ...state, refreshKey: state.refreshKey + 1 };
    default:
      return state;
  }
}

// ============================================================================
// Context & Provider
// ============================================================================

const TableContext = createContext<TableContextState | undefined>(undefined);

interface TableProviderProps {
  children: ReactNode;
  initialState?: Partial<TableContextState>;
}

export function TableProvider({ children, initialState: initialProps }: TableProviderProps) {
  const [state, dispatch] = useReducer(tableReducer, { ...initialState, ...initialProps });

  const actions = {
    setPage: useCallback((page: number) => dispatch({ type: "SET_PAGE", page }), []),
    setPerPage: useCallback((perPage: number) => dispatch({ type: "SET_PER_PAGE", perPage }), []),
    setSorting: useCallback((sorting: SortingState[]) => dispatch({ type: "SET_SORTING", sorting }), []),
    setColumnVisibility: useCallback((visibility: ColumnVisibilityState) => dispatch({ type: "SET_COLUMN_VISIBILITY", visibility }), []),
    setColumnOrder: useCallback((order: string[]) => dispatch({ type: "SET_COLUMN_ORDER", order }), []),
    setRowSelection: useCallback((selection: Record<string, boolean>) => dispatch({ type: "SET_ROW_SELECTION", selection }), []),
    setQuickSearch: useCallback((term: string) => dispatch({ type: "SET_QUICK_SEARCH", term }), []),
    setAdvancedFilters: useCallback((filters: FilterFormState, variables?: Record<string, unknown>) => dispatch({ type: "SET_ADVANCED_FILTERS", filters, variables }), []),
    refresh: useCallback(() => dispatch({ type: "REFRESH" }), []),
    // Internal use for data hooks
    _setPageInfo: useCallback(
      (info: {
        totalCount?: number | null;
        pageCount?: number | null;
        hasNextPage?: boolean | null;
        hasPreviousPage?: boolean | null;
      }) => dispatch({ type: "SET_PAGE_INFO", ...info }),
      [],
    ),
    _setData: useCallback((data: Record<string, unknown>[], loading: boolean, error?: Error) => dispatch({ type: "SET_DATA", data, loading, error }), []),
  };

  // Combine state and actions
  const value = { ...state, ...actions };

  return <TableContext.Provider value={value}>{children}</TableContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTable() {
  const context = useContext(TableContext);
  if (!context) {
    throw new Error("useTable must be used within a TableProvider");
  }
  return context;
}

// Hook for internal data fetching to update context
// eslint-disable-next-line react-refresh/only-export-components
export function useTableDispatch() {
    const context = useContext(TableContext);
    if (!context) {
      throw new Error("useTableDispatch must be used within a TableProvider");
    }
    // Return explicit internal setters if needed, or just use the main context
    // This is a pattern to separate read vs write if context gets large, but for now reuse.
    return {
        setPageInfo: context._setPageInfo,
        setData: context._setData,
    };
}
