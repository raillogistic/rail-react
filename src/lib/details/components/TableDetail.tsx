import * as React from "react";
import { BaseTable } from "../../tables/BaseTable";
import { useReactTable, getCoreRowModel, getPaginationRowModel, getSortedRowModel, type ColumnDef, type Table as RTTable } from "@tanstack/react-table";

type Props = {
  columns: ColumnDef<unknown>[];
  rows?: unknown[];
  enable_quick_search?: boolean;
  enable_sorting?: boolean;
  available_filters?: never;
  selection?: never;
  row_actions?: never;
  top_actions?: never;
  initial_page_size?: number;
};

export default function TableDetail({ columns, rows = [], enable_quick_search, enable_sorting = true, available_filters = [], selection, row_actions, top_actions, initial_page_size = 10 }: Props) {
  const [search, setSearch] = React.useState<string>("");
  const filtered = React.useMemo(() => {
    if (!enable_quick_search || !search.trim()) return rows;
    const term = search.trim().toLowerCase();
    return (rows || []).filter((row) => {
      const r = row as Record<string, unknown>;
      return columns.some((c) => {
        const key = (c.id as string) || (c.accessorKey as string) || "";
        const val = r?.[key];
        return String(val ?? "").toLowerCase().includes(term);
      });
    });
  }, [enable_quick_search, search, rows, columns]);

  const table = useReactTable({
    data: filtered,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: enable_sorting ? getSortedRowModel() : undefined,
    state: { pagination: { pageIndex: 0, pageSize: initial_page_size } },
  }) as RTTable<unknown>;

  return (
    <BaseTable
      table={table}
      available_filters={available_filters}
      remote_total_count={(rows || []).length}
      onQuickSearch={enable_quick_search ? (q) => setSearch(q) : undefined}
      selection={selection}
      row_actions={row_actions}
      top_actions={top_actions}
      options={{ compact: true, enable_column_drag: false, enable_multi_sort: enable_sorting, pagination: true }}
    />
  );
}
