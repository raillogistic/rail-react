import * as React from "react";
import {
  type Table as RTTable,
  SortingState,
  type ColumnDef,
  type RowSelectionState,
  type Row as RTRow,
  type Header,
} from "@tanstack/react-table";
import { MoreHorizontal, Pencil, Trash } from "lucide-react";
import { Button } from "@/lib/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/lib/components/ui/dropdown-menu";
import { Checkbox } from "@/lib/components/ui/checkbox";
import { Card, CardContent } from "@/lib/components/ui/card";
import { Table, TableHead } from "@/lib/components/ui/table";
import { cn } from "@/lib/utils";
import type { ComplexFilterInput, FilterFieldType } from "./types";
import { TableTitleBar } from "./components/TableTitleBar";
import { TableToolbar } from "./components/TableToolbar";
import { ColumnVisibilityMenu } from "./components/ColumnVisibilityMenu";
import { TablePagination } from "./components/TablePagination";
import { TableHeaders } from "./components/TableHeaders";
import { TableRows } from "./components/TableRows";
import type {
  BaseTableOptions,
  ColumnFiltersConfig,
  ExpandableConfig,
  GroupingConfig,
  PaginationApi,
  RowActionsConfig,
  SelectionConfig,
  TopAction,
} from "./components/baseTableTypes";

const combineFilterPayloads = (
  advanced: ComplexFilterInput<string> | null,
  column: ComplexFilterInput<string> | null,
): ComplexFilterInput<string> | null => {
  if (advanced && column) {
    return { AND: [advanced, column] } as ComplexFilterInput<string>;
  }
  return advanced ?? column ?? null;
};

/**
 * Props accepted by {@link BaseTable}.
 */
/**
 * Props accepted by {@link BaseTable}.
 */
export type BaseTableProps<TData> = {
  table: RTTable<TData>;
  title?: string;
  className?: string;
  loading?: boolean;
  empty_message?: string;
  on_row_click?: (row: TData) => void;
  onSortingChange?: (sorting: SortingState) => void;
  on_ordering_change?: (ordering: string[]) => void;
  expandable?: ExpandableConfig<TData>;
  grouping?: GroupingConfig<TData>;
  column_overrides?: Record<string, Partial<ColumnDef<TData>>>;
  actions?: React.ReactNode;
  toolbar_actions?: React.ReactNode;
  top_actions?: Array<TopAction<TData>>;
  options?: BaseTableOptions;
  row_actions?: RowActionsConfig<TData>;
  pagination_api?: PaginationApi;
  selection?: SelectionConfig<TData>;
  onQuickSearch?: (search: string) => void;
  columns_visibility_storage_key?: string;
  available_filters?: FilterFieldType[];
  remote_total_count?: number;
  onColumnOrderChange?: (order: string[]) => void;
  onColumnVisibilityChange?: (visibility: string[]) => void;
};

/**
 * Base table component that wraps TanStack Table with rich UI: sorting, filters,
 * column visibility persistence, grouping, selection, and pagination.
 */
export function BaseTable<TData>({
  table,
  columnFilters = {},
  advancedFiltering,
  title,
  className,
  loading,
  empty_message = "No data available",
  on_row_click,
  onSortingChange,
  on_ordering_change,
  onQuickSearch,
  column_overrides,
  actions,
  toolbar_actions,
  top_actions,
  options = {
    compact: true,
    enable_multi_sort: true,
    show_sort_index: true,
    sort_hint_text: "Click to sort - Shift/Ctrl/Cmd+Click to multi-sort",
  },
  row_actions,
  selection,
  expandable,
  grouping,
  pagination_api,
  columns_visibility_storage_key,
  available_filters = [],
  on_advanced_filters_apply,
  remote_total_count,
  onColumnOrderChange,
  onColumnVisibilityChange,
  quick_filter_components,
}: BaseTableProps<TData>) {
  const minimalView = options.minimal ?? false;
  const cellPadding = options.compact ? "py-0 px-3" : "py-1 px-3";
  const multi_sort_enabled = options.enable_multi_sort ?? true;
  const multi_sort_on_plain_click = options.multi_sort_on_plain_click ?? true;
  const show_sort_idx = options.show_sort_index ?? true;
  const sort_hint =
    options.sort_hint_text ??
    "Click to sort - Shift/Ctrl/Cmd+Click to multi-sort";
  const selection_enabled = selection?.enabled ?? false;
  const selection_position = selection?.position ?? "start";
  const show_pagination = options.pagination ?? true;
  const columnVisibility = table.getState().columnVisibility;
  const expandable_enabled = expandable?.render !== undefined;
  const expandable_position = expandable?.position ?? "start";
  const column_drag_enabled = options?.enable_column_drag ?? true;

  const render_actions_cell = React.useCallback(
    (row: TData) => {
      if (!row_actions) return null;
      if (row_actions.render_cell) return row_actions.render_cell(row);

      const handle_edit = row_actions.on_edit
        ? () => row_actions.on_edit!(row)
        : undefined;
      const handle_delete = row_actions.on_delete
        ? () => row_actions.on_delete!(row)
        : undefined;
      const has_menu =
        !!row_actions.menu_items && row_actions.menu_items.length > 0;

      return (
        <div className="flex items-center justify-end gap-1 ">
          {row_actions.on_edit && (
            <Button
              variant="ghost"
              size="icon"
              aria-label="Edit"
              onClick={handle_edit}
            >
              <Pencil className="h-4 w-4" />
            </Button>
          )}
          {row_actions.on_delete && (
            <Button
              variant="ghost"
              size="icon"
              aria-label="Delete"
              onClick={handle_delete}
            >
              <Trash className="h-4 w-4 text-destructive" />
            </Button>
          )}
          {has_menu && (
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="More actions">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {row_actions.menu_items!.map((mi) => (
                  <DropdownMenuItem
                    key={mi.key}
                    onClick={() => mi.on_click(row)}
                    variant={mi.variant}
                  >
                    {mi.icon}
                    <span>{mi.label}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      );
    },
    [row_actions],
  );

  const build_ordering_payload = React.useCallback((): string[] => {
    const sorting = table.getState().sorting as SortingState;
    const allColumns = table.getAllColumns();
    return sorting.map((s) => {
      const col = allColumns.find((c) => c.id === s.id);
      const display =
        (col?.columnDef?.meta as { display?: string } | undefined)?.display ??
        s.id;
      return s.desc ? `-${display}` : display;
    });
  }, [table]);

  React.useEffect(() => {
    const sorting = table.getState().sorting as SortingState;
    onSortingChange?.(sorting);
    if (on_ordering_change) {
      on_ordering_change(build_ordering_payload());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table.getState().sorting]);

  React.useEffect(() => {
    if (!selection?.on_selection_change) return;
    const selected_rows = table
      .getSelectedRowModel()
      .rows.map((r) => r.original as TData);
    const selection_state = table.getState().rowSelection as RowSelectionState;
    selection?.on_selection_change(selected_rows, selection_state);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table.getState().rowSelection]);

  const [search, setSearch] = React.useState<string>("");
  const [columnSearch, setColumnSearch] = React.useState<string>("");

  const storage_key = React.useMemo(() => {
    if (
      columns_visibility_storage_key &&
      columns_visibility_storage_key.trim().length > 0
    ) {
      return `table_columns:${columns_visibility_storage_key}`;
    }
    const normalized_title = (title || "table")
      .toLowerCase()
      .replace(/\s+/g, "_");
    return `table_columns:${normalized_title}`;
  }, [columns_visibility_storage_key, title]);

  const { handleDragEnd } = useColumnPersistence({
    table,
    storageKey: storage_key,
    columnVisibility,
    columnDragEnabled: column_drag_enabled,
    onColumnOrderChange,
    onColumnVisibilityChange,
  });

  const combinedFilterMeta = React.useMemo(
    () => advancedFiltering?.filters ?? available_filters ?? [],
    [advancedFiltering?.filters, available_filters],
  );
  const chipMeta = React.useMemo(() => {
    const base = available_filters ?? [];
    const extra = advancedFiltering?.filters ?? [];
    if (extra.length === 0) return base;
    return [...base, ...extra];
  }, [advancedFiltering?.filters, available_filters]);

  const columnFilterMetaMap = React.useMemo(() => {
    const map = new Map<string, FilterFieldType>();
    (available_filters ?? []).forEach((meta) => {
      map.set(meta.field_name, meta);
    });
    return map;
  }, [available_filters]);

  const columnFiltersMode = columnFilters?.mode ?? "devextreme";
  const columnFilterDebounceMs = columnFilters?.debounce_ms ?? 400;

  const {
    columnFiltersState,
    setColumnFilterValue,
    columnFiltersPayload,
    columnFiltersEnabled,
  } = useColumnFilters({
    metaMap: columnFilterMetaMap,
    mode: columnFiltersMode,
    debounceMs: columnFilterDebounceMs,
  });

  const [advancedFiltersPayload, setAdvancedFiltersPayload] =
    React.useState<ComplexFilterInput<string> | null>(null);

  const handleAdvancedApply = React.useCallback(
    (filters: ComplexFilterInput<string>) => {
      const hasEntries = filters && Object.keys(filters).length > 0;
      setAdvancedFiltersPayload(hasEntries ? filters : null);
    },
    [],
  );

  const advancedFiltersController = useAdvancedFiltering({
    filtersMeta: combinedFilterMeta,
    chipFiltersMeta: chipMeta,
    onApply: handleAdvancedApply,
    title: advancedFiltering?.title,
    displayMode: advancedFiltering?.display,
  });

  const advancedFiltersEnabled =
    combinedFilterMeta.length > 0 &&
    (advancedFiltering?.onApplyAdvancedFilters || on_advanced_filters_apply);

  const advancedTriggerVariant = advancedFiltering?.triggerVariant ?? "icon";
  const advancedTriggerLabel =
    advancedFiltering?.triggerLabel ?? "Filtres avancés";

  const combinedFiltersPayload = React.useMemo(
    () => combineFilterPayloads(advancedFiltersPayload, columnFiltersPayload),
    [advancedFiltersPayload, columnFiltersPayload],
  );

  const rowSummary = React.useMemo(() => {
    const filteredRowCount = table.getFilteredRowModel().rows.length;
    const totalRowCount =
      table.getPreFilteredRowModel?.().rows.length ??
      table.getRowModel().rows.length;
    if (typeof remote_total_count === "number") {
      return `${remote_total_count} élément${
        remote_total_count > 1 ? "s" : ""
      } au total`;
    }
    if (filteredRowCount === totalRowCount) {
      return `${totalRowCount} ligne${totalRowCount > 1 ? "s" : ""}`;
    }
    return `${filteredRowCount} / ${totalRowCount} lignes filtrées`;
  }, [table, remote_total_count]);
  const visibleColumnCount = table.getVisibleLeafColumns().length;

  const notifyFiltersChange = React.useCallback(
    (payload: ComplexFilterInput<string> | null) => {
      const normalized = payload ?? ({} as ComplexFilterInput<string>);
      advancedFiltering?.onApplyAdvancedFilters?.(normalized);
      on_advanced_filters_apply?.(normalized);
    },
    [advancedFiltering?.onApplyAdvancedFilters, on_advanced_filters_apply],
  );

  const hasNotifiedOnce = React.useRef(false);
  React.useEffect(() => {
    if (!hasNotifiedOnce.current) {
      hasNotifiedOnce.current = true;
      if (!combinedFiltersPayload) return;
    }
    notifyFiltersChange(combinedFiltersPayload);
  }, [combinedFiltersPayload, notifyFiltersChange]);

  const triggerQuickSearch = React.useCallback(() => {
    if (!onQuickSearch) return;
    onQuickSearch(search.trim());
  }, [onQuickSearch, search]);

  const renderColumnFilterCellDev = React.useCallback(
    (header: Header<TData, unknown>) => {
      const filterMeta = columnFilterMetaMap.get(header.column.id);
      if (!filterMeta || header.isPlaceholder) return null;
      const filterState = columnFiltersState[header.column.id];
      const isActive = filterState && !isFilterValueEmpty(filterState.value);

      return (
        <TableHead
          key={`${header.id}-filter`}
          className={cn(
            "align-top px-2 py-1",
            isActive && "bg-primary/5 border-b border-primary/30 rounded-sm",
          )}
        >
          <ColumnFilterInput
            columnId={header.column.id}
            meta={filterMeta}
            value={filterState}
            onChange={(next, immediate) =>
              setColumnFilterValue(header.column.id, next, immediate)
            }
          />
        </TableHead>
      );
    },
    [columnFilterMetaMap, columnFiltersState, setColumnFilterValue],
  );

  const renderHeaderFilterTrigger = React.useCallback(
    (header: Header<TData, unknown>) => {
      if (!columnFiltersEnabled || columnFiltersMode !== "ag-grid") return null;
      const filterMeta = columnFilterMetaMap.get(header.column.id);
      if (!filterMeta || header.isPlaceholder) return null;
      return (
        <ColumnFilterAgTrigger
          columnId={header.column.id}
          meta={filterMeta}
          value={columnFiltersState[header.column.id]}
          onChange={(next, immediate) =>
            setColumnFilterValue(header.column.id, next, immediate)
          }
        />
      );
    },
    [
      columnFiltersEnabled,
      columnFiltersMode,
      columnFilterMetaMap,
      columnFiltersState,
      setColumnFilterValue,
    ],
  );

  const renderColumnFilterCell =
    columnFiltersMode === "ag-grid" ? () => null : renderColumnFilterCellDev;

  const renderTopActionButtons = React.useCallback(() => {
    if (!top_actions || top_actions.length === 0) return null;
    const selected_rows = table
      .getSelectedRowModel()
      .rows.map((r) => r.original as TData);
    const selection_state = table.getState().rowSelection as RowSelectionState;
    const has_selection = selected_rows.length > 0;
    return top_actions
      .filter((a) => a.show_when !== "has_selection" || has_selection)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      .map((a) => (
        <Button
          key={a.key}
          variant={a.variant ?? "outline"}
          size={a.size === "icon" ? "icon" : "sm"}
          className="whitespace-nowrap"
          onClick={() => a.on_click({ selected_rows, selection_state })}
          {...(a.dataAttributes ?? {})}
        >
          {a.icon}
          {a.size === "icon" ? null : <span className="ml-1">{a.label}</span>}
        </Button>
      ));
  }, [top_actions, table]);

  const columnVisibilityMenu = (
    <ColumnVisibilityMenu
      table={table}
      columnSearch={columnSearch}
      onColumnSearchChange={setColumnSearch}
    />
  );

  const toolbar = (
    <TableToolbar
      showQuickSearch={Boolean(onQuickSearch)}
      searchValue={search}
      onSearchChange={setSearch}
      onSubmitSearch={triggerQuickSearch}
      quickFilterComponents={quick_filter_components}
      toolbarActions={toolbar_actions}
      advancedFiltersEnabled={advancedFiltersEnabled}
      advancedFiltersController={advancedFiltersController}
      advancedTriggerVariant={advancedTriggerVariant}
      advancedTriggerLabel={advancedTriggerLabel}
      columnVisibilityMenu={columnVisibilityMenu}
    />
  );

  const paginationSection = (() => {
    if (!show_pagination) return null;
    const page_index =
      pagination_api?.page_index ?? table.getState().pagination.pageIndex;
    const page_count = pagination_api?.page_count ?? table.getPageCount();
    const can_prev =
      page_index > 0 && (pagination_api ? true : table.getCanPreviousPage());
    const can_next =
      page_index < Math.max(page_count - 1, 0) &&
      (pagination_api ? true : table.getCanNextPage());
    const current_size =
      pagination_api?.page_size ?? table.getState().pagination.pageSize;
    const size_options = pagination_api?.page_size_options ?? [10, 20, 50, 100];

    return (
      <TablePagination
        pageSize={current_size}
        pageSizeOptions={size_options}
        pageIndex={page_index}
        pageCount={page_count}
        canPrevious={can_prev}
        canNext={can_next}
        onPageSizeChange={(size) => {
          if (pagination_api?.set_page_size) {
            pagination_api.set_page_size(size);
          } else {
            table.setPageSize(size);
          }
        }}
        onFirst={() => {
          if (pagination_api?.first_page) pagination_api.first_page();
          else table.setPageIndex(0);
        }}
        onPrevious={() => {
          if (pagination_api?.previous_page) pagination_api.previous_page();
          else table.previousPage();
        }}
        onNext={() => {
          if (pagination_api?.next_page) pagination_api.next_page();
          else table.nextPage();
        }}
        onLast={() => {
          if (pagination_api?.last_page) pagination_api.last_page();
          else table.setPageIndex(Math.max(page_count - 1, 0));
        }}
      />
    );
  })();

  const dataRowModel = table.getRowModel().rows as RTRow<TData>[];

  return (
    <div className={cn("w-full h-full flex flex-col min-h-0", className)}>
      {!minimalView && (
        <TableTitleBar
          title={title}
          rowSummary={rowSummary}
          visibleColumnCount={visibleColumnCount}
          topActions={renderTopActionButtons()}
          actions={actions}
        />
      )}
      {!minimalView && toolbar}

      <Card className="flex flex-col shadow-sm h-full min-h-0">
        <CardContent className="flex-1 min-h-0 overflow-auto ">
          <Table className="h-full bg-primary/20">
            <TableHeaders
              table={table}
              column_overrides={column_overrides}
              selection={selection}
              row_actions={row_actions}
              expandableEnabled={expandable_enabled}
              expandablePosition={expandable_position}
              multiSortEnabled={multi_sort_enabled}
              multiSortOnPlainClick={multi_sort_on_plain_click}
              showSortIndex={show_sort_idx}
              sortHint={sort_hint}
              columnFiltersEnabled={columnFiltersEnabled}
              columnFiltersMode={columnFiltersMode}
              renderHeaderFilterTrigger={renderHeaderFilterTrigger}
              renderColumnFilterCell={renderColumnFilterCell}
              onHeaderSorted={() => {
                const sorting = table.getState().sorting as SortingState;
                onSortingChange?.(sorting);
                if (on_ordering_change) {
                  on_ordering_change(build_ordering_payload());
                }
              }}
              columnDragEnabled={column_drag_enabled}
              onColumnDragEnd={handleDragEnd}
            />
            <TableRows
              table={table}
              rows={dataRowModel}
              grouping={grouping}
              row_actions={row_actions}
              selection={selection}
              expandable={expandable}
              column_overrides={column_overrides}
              cellPadding={cellPadding}
              onRowClick={on_row_click}
              renderActionsCell={render_actions_cell}
              loading={loading}
              emptyMessage={empty_message}
            />
          </Table>
        </CardContent>
      </Card>
      {paginationSection}
    </div>
  );
}
