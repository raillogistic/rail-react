/**
 * @file TableContext.tsx
 * @description Contexte et réducteur de table pour la gestion d'état locale (pagination, filtres, colonnes, sélection).
 */
import {
  createContext,
  useContext,
  useReducer,
  ReactNode,
  useCallback,
} from "react";
import {
  TableContextState,
  ColumnVisibilityState,
  ColumnWidthState,
  NavFilterSelectionState,
  TableDensity,
  QueryPageData,
} from "../types";
import { FilterFormState } from "@/widgets/model-table/filtering/types";
import { normalizeFilterFormState } from "@/widgets/model-table/filtering/engine";

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
  | { type: "SET_COLUMN_VISIBILITY"; visibility: ColumnVisibilityState }
  | { type: "SET_COLUMN_WIDTHS"; widths: ColumnWidthState }
  | { type: "SET_COLUMN_ORDER"; order: string[] }
  | { type: "SET_ROW_SELECTION"; selection: Record<string, boolean> }
  | { type: "SET_GROUPING_FIELD"; field: string | null }
  | { type: "SET_GROUP_COLLAPSED"; collapsed: Record<string, boolean> }
  | { type: "SET_ACTIVE_COLUMN_FILTER"; columnId: string | null }
  | { type: "SET_DRAG_MODE_ENABLED"; enabled: boolean }
  | { type: "SET_DENSITY"; density: TableDensity }
  | { type: "SET_WRAP_CELLS"; wrapCells: boolean }
  | { type: "SET_QUICK_SEARCH"; term: string }
  | {
      type: "SET_ADVANCED_FILTERS";
      filters: FilterFormState;
      variables?: Record<string, unknown>;
    }
  | { type: "SET_NAV_FILTER_SELECTION"; groupKey: string; itemKey: string | null }
  | { type: "RESET_NAV_FILTERS"; selections: NavFilterSelectionState }
  | {
      type: "SET_DATA";
      data: Record<string, unknown>[];
      loading: boolean;
      error?: Error | null;
    }
  | { type: "SET_QUERY_PAGE"; queryPage: QueryPageData | null }
  | { type: "SET_LOADING"; loading: boolean }
  | { type: "REFRESH" };

function areRowsShallowEqual(
  left: Record<string, unknown>[],
  right: Record<string, unknown>[],
): boolean {
  if (left === right) return true;
  if (left.length !== right.length) return false;
  for (let index = 0; index < left.length; index += 1) {
    if (left[index] !== right[index]) return false;
  }
  return true;
}

function getErrorSignature(error?: Error | null): string {
  if (!error) return "";
  return `${error.name}:${error.message}`;
}

const initialState: TableContextState = {
  data: [],
  queryPage: null,
  loading: false,
  error: null,
  metadataLoading: true,
  pagination: {
    page: 1,
    perPage: 10,
    total: 0,
    numPages: 0,
    totalKnown: true,
    hasNextPage: false,
    hasPreviousPage: false,
  },
  columnVisibility: {},
  columnWidths: {},
  columnOrder: [],
  rowSelection: {},
  groupingField: null,
  groupCollapsed: {},
  activeColumnFilter: null,
  dragModeEnabled: false,
  density: "comfortable",
  wrapCells: false,
  refreshKey: 0,
  quickSearch: "",
  advancedFilters: {
    root: {
      id: "root",
      type: "group",
      logic: "AND",
      conditions: [],
      negated: false,
    },
    selectedPresets: [],
    distinctOn: [],
    orderBy: [],
    relationFunctions: [],
  },
  filterVariables: {},
  navFilterSelections: {},
  // Placeholders, will be overwritten by Provider
  setPage: () => {},
  setPerPage: () => {},
  setColumnVisibility: () => {},
  setColumnWidths: () => {},
  setColumnOrder: () => {},
  setRowSelection: () => {},
  setGroupingField: () => {},
  setGroupCollapsed: () => {},
  setActiveColumnFilter: () => {},
  setDragModeEnabled: () => {},
  setDensity: () => {},
  setWrapCells: () => {},
  setQuickSearch: () => {},
  setAdvancedFilters: () => {},
  setNavFilterSelection: () => {},
  resetNavFilters: () => {},
  refresh: () => {},
  _setPageInfo: () => {},
  _setQueryPage: () => {},
  _setData: () => {},
};

function tableReducer(
  state: TableContextState,
  action: TableAction,
): TableContextState {
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
      const totalCount = hasTotal ? (action.totalCount ?? 0) : 0;
      const pageCount =
        typeof action.pageCount === "number"
          ? action.pageCount
          : hasTotal
            ? Math.ceil(totalCount / state.pagination.perPage)
            : 0;
      const nextHasNextPage =
        action.hasNextPage ?? state.pagination.hasNextPage;
      const nextHasPreviousPage =
        action.hasPreviousPage ?? state.pagination.hasPreviousPage;
      if (
        state.pagination.total === totalCount &&
        state.pagination.numPages === (pageCount ?? 0) &&
        state.pagination.totalKnown === hasTotal &&
        state.pagination.hasNextPage === nextHasNextPage &&
        state.pagination.hasPreviousPage === nextHasPreviousPage
      ) {
        return state;
      }
      return {
        ...state,
        pagination: {
          ...state.pagination,
          total: totalCount,
          numPages: pageCount ?? 0,
          totalKnown: hasTotal,
          hasNextPage: nextHasNextPage,
          hasPreviousPage: nextHasPreviousPage,
        },
      };
    }
    case "SET_COLUMN_VISIBILITY":
      return { ...state, columnVisibility: action.visibility };
    case "SET_COLUMN_WIDTHS":
      return { ...state, columnWidths: action.widths };
    case "SET_COLUMN_ORDER":
      return { ...state, columnOrder: action.order };
    case "SET_ROW_SELECTION":
      return { ...state, rowSelection: action.selection };
    case "SET_GROUPING_FIELD":
      return {
        ...state,
        groupingField: action.field,
        groupCollapsed: {},
      };
    case "SET_GROUP_COLLAPSED":
      return { ...state, groupCollapsed: action.collapsed };
    case "SET_ACTIVE_COLUMN_FILTER":
      return { ...state, activeColumnFilter: action.columnId };
    case "SET_DRAG_MODE_ENABLED":
      return { ...state, dragModeEnabled: action.enabled };
    case "SET_DENSITY":
      return { ...state, density: action.density };
    case "SET_WRAP_CELLS":
      return { ...state, wrapCells: action.wrapCells };
    case "SET_QUICK_SEARCH":
      return {
        ...state,
        quickSearch: action.term,
        pagination: { ...state.pagination, page: 1 },
      };
    case "SET_ADVANCED_FILTERS":
      return {
        ...state,
        advancedFilters: normalizeFilterFormState(action.filters),
        filterVariables: action.variables,
        pagination: { ...state.pagination, page: 1 },
      };
    case "SET_NAV_FILTER_SELECTION": {
      const nextSelections = {
        ...state.navFilterSelections,
        [action.groupKey]: action.itemKey,
      };
      if (
        state.navFilterSelections[action.groupKey] === action.itemKey
      ) {
        return state;
      }
      return {
        ...state,
        navFilterSelections: nextSelections,
        pagination: { ...state.pagination, page: 1 },
      };
    }
    case "RESET_NAV_FILTERS":
      return {
        ...state,
        navFilterSelections: action.selections,
        pagination: { ...state.pagination, page: 1 },
      };
    case "SET_DATA":
      {
        const nextError = action.error || null;
        const sameData = areRowsShallowEqual(state.data, action.data);
        const sameLoading = state.loading === action.loading;
        const sameError =
          getErrorSignature(state.error) === getErrorSignature(nextError);
        if (sameData && sameLoading && sameError) {
          return state;
        }
      }
      return {
        ...state,
        data: action.data,
        loading: action.loading,
        error: action.error || null,
      };
    case "SET_QUERY_PAGE":
      if (state.queryPage === action.queryPage) {
        return state;
      }
      return {
        ...state,
        queryPage: action.queryPage,
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

export function TableProvider({
  children,
  initialState: initialProps,
}: TableProviderProps) {
  const mergedInitialState = {
    ...initialState,
    ...initialProps,
    advancedFilters: normalizeFilterFormState(
      initialProps?.advancedFilters ?? initialState.advancedFilters,
    ),
  };
  const [state, dispatch] = useReducer(tableReducer, mergedInitialState);

  const actions = {
    setPage: useCallback(
      (page: number) => dispatch({ type: "SET_PAGE", page }),
      [],
    ),
    setPerPage: useCallback(
      (perPage: number) => dispatch({ type: "SET_PER_PAGE", perPage }),
      [],
    ),
    setColumnVisibility: useCallback(
      (visibility: ColumnVisibilityState) =>
        dispatch({ type: "SET_COLUMN_VISIBILITY", visibility }),
      [],
    ),
    setColumnWidths: useCallback(
      (widths: ColumnWidthState) =>
        dispatch({ type: "SET_COLUMN_WIDTHS", widths }),
      [],
    ),
    setColumnOrder: useCallback(
      (order: string[]) => dispatch({ type: "SET_COLUMN_ORDER", order }),
      [],
    ),
    setRowSelection: useCallback(
      (selection: Record<string, boolean>) =>
        dispatch({ type: "SET_ROW_SELECTION", selection }),
      [],
    ),
    setGroupingField: useCallback(
      (field: string | null) => dispatch({ type: "SET_GROUPING_FIELD", field }),
      [],
    ),
    setGroupCollapsed: useCallback(
      (collapsed: Record<string, boolean>) =>
        dispatch({ type: "SET_GROUP_COLLAPSED", collapsed }),
      [],
    ),
    setActiveColumnFilter: useCallback(
      (columnId: string | null) =>
        dispatch({ type: "SET_ACTIVE_COLUMN_FILTER", columnId }),
      [],
    ),
    setDragModeEnabled: useCallback(
      (enabled: boolean) =>
        dispatch({ type: "SET_DRAG_MODE_ENABLED", enabled }),
      [],
    ),
    setDensity: useCallback(
      (density: TableDensity) => dispatch({ type: "SET_DENSITY", density }),
      [],
    ),
    setWrapCells: useCallback(
      (wrapCells: boolean) => dispatch({ type: "SET_WRAP_CELLS", wrapCells }),
      [],
    ),
    setQuickSearch: useCallback(
      (term: string) => dispatch({ type: "SET_QUICK_SEARCH", term }),
      [],
    ),
    setAdvancedFilters: useCallback(
      (filters: FilterFormState, variables?: Record<string, unknown>) =>
        dispatch({ type: "SET_ADVANCED_FILTERS", filters, variables }),
      [],
    ),
    setNavFilterSelection: useCallback(
      (groupKey: string, itemKey: string | null) =>
        dispatch({ type: "SET_NAV_FILTER_SELECTION", groupKey, itemKey }),
      [],
    ),
    resetNavFilters: useCallback(
      () =>
        dispatch({
          type: "RESET_NAV_FILTERS",
          selections: mergedInitialState.navFilterSelections ?? {},
        }),
      [mergedInitialState.navFilterSelections],
    ),
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
    _setQueryPage: useCallback(
      (queryPage: QueryPageData | null) =>
        dispatch({ type: "SET_QUERY_PAGE", queryPage }),
      [],
    ),
    _setData: useCallback(
      (data: Record<string, unknown>[], loading: boolean, error?: Error) =>
        dispatch({ type: "SET_DATA", data, loading, error }),
      [],
    ),
  };

  // Combine state and actions
  const value = { ...state, ...actions };

  return (
    <TableContext.Provider value={value}>{children}</TableContext.Provider>
  );
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
    setQueryPage: context._setQueryPage,
    setData: context._setData,
  };
}
