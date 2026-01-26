"use client";

import * as React from "react";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  PaginationState,
  OnChangeFn,
  RowSelectionState,
} from "@tanstack/react-table";
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronDown,
  MoreHorizontal,
  X,
} from "lucide-react";

import { Button } from "@/lib/components/ui/button";
import { Checkbox } from "@/lib/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/lib/components/ui/dropdown-menu";
import { Input } from "@/lib/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/lib/components/ui/table";

// Types
export interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];

  // Controlled props (optional - if provided, component is controlled)
  sorting?: SortingState;
  onSortingChange?: OnChangeFn<SortingState>;

  columnFilters?: ColumnFiltersState;
  onColumnFiltersChange?: OnChangeFn<ColumnFiltersState>;

  columnVisibility?: VisibilityState;
  onColumnVisibilityChange?: OnChangeFn<VisibilityState>;

  rowSelection?: RowSelectionState;
  onRowSelectionChange?: OnChangeFn<RowSelectionState>;

  pagination?: PaginationState;
  onPaginationChange?: OnChangeFn<PaginationState>;

  // Features
  enableSorting?: boolean;
  enableMultiSort?: boolean;
  enableFiltering?: boolean;
  enableColumnVisibility?: boolean;
  enableRowSelection?: boolean;
  enablePagination?: boolean;

  // Pagination config
  pageSize?: number;
  pageSizeOptions?: number[];
  manualPagination?: boolean;
  pageCount?: number;

  // Filter config
  filterPlaceholder?: string;
  filterColumn?: string;

  // Actions
  onRowClick?: (row: TData) => void;
  toolbarActions?: React.ReactNode;
  bulkActions?: React.ReactNode;

  // Styling
  className?: string;
}

// Utility function to create sortable header
export function createSortableHeader(title: string) {
  return ({ column }: any) => {
    const isSorted = column.getIsSorted();

    return (
      <Button
        variant="ghost"
        onClick={() => {
          if (isSorted === "asc") {
            column.toggleSorting(true);
          } else if (isSorted === "desc") {
            column.clearSorting();
          } else {
            column.toggleSorting(false);
          }
        }}
        className="h-8 px-2 lg:px-3"
      >
        {title}
        {isSorted === "asc" ? (
          <ArrowUp className="ml-2 h-4 w-4" />
        ) : isSorted === "desc" ? (
          <ArrowDown className="ml-2 h-4 w-4" />
        ) : (
          <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />
        )}
      </Button>
    );
  };
}

// Utility function to create row actions column
export function createActionsColumn<TData>(
  actions: (row: TData) => Array<{
    label: string;
    onClick: () => void;
    variant?: "default" | "destructive";
  }>
): ColumnDef<TData> {
  return {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => {
      const rowActions = actions(row.original);

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            {rowActions.map((action, index) => (
              <React.Fragment key={index}>
                {index > 0 && action.variant === "destructive" && (
                  <DropdownMenuSeparator />
                )}
                <DropdownMenuItem
                  onClick={action.onClick}
                  className={
                    action.variant === "destructive"
                      ? "text-red-600 focus:text-red-600"
                      : ""
                  }
                >
                  {action.label}
                </DropdownMenuItem>
              </React.Fragment>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  };
}

// Utility function to create selection column
export function createSelectionColumn<TData>(): ColumnDef<TData> {
  return {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  };
}

export function DataTable<TData, TValue>({
  columns,
  data,
  // Controlled state
  sorting: controlledSorting,
  onSortingChange: onControlledSortingChange,
  columnFilters: controlledColumnFilters,
  onColumnFiltersChange: onControlledColumnFiltersChange,
  columnVisibility: controlledColumnVisibility,
  onColumnVisibilityChange: onControlledColumnVisibilityChange,
  rowSelection: controlledRowSelection,
  onRowSelectionChange: onControlledRowSelectionChange,
  pagination: controlledPagination,
  onPaginationChange: onControlledPaginationChange,
  // Features
  enableSorting = true,
  enableMultiSort = true,
  enableFiltering = true,
  enableColumnVisibility = true,
  enableRowSelection = false,
  enablePagination = true,
  // Pagination config
  pageSize = 10,
  pageSizeOptions = [10, 20, 30, 40, 50],
  manualPagination = false,
  pageCount,
  // Filter config
  filterPlaceholder = "Filter...",
  filterColumn,
  // Actions
  onRowClick,
  toolbarActions,
  bulkActions,
  // Styling
  className,
}: DataTableProps<TData, TValue>) {
  // Local state (used when not controlled)
  const [localSorting, setLocalSorting] = React.useState<SortingState>([]);
  const [localColumnFilters, setLocalColumnFilters] =
    React.useState<ColumnFiltersState>([]);
  const [localColumnVisibility, setLocalColumnVisibility] =
    React.useState<VisibilityState>({});
  const [localRowSelection, setLocalRowSelection] =
    React.useState<RowSelectionState>({});
  const [localPagination, setLocalPagination] = React.useState<PaginationState>(
    {
      pageIndex: 0,
      pageSize: pageSize,
    }
  );

  // Determine if controlled or uncontrolled
  const sorting = controlledSorting ?? localSorting;
  const onSortingChange = onControlledSortingChange ?? setLocalSorting;

  const columnFilters = controlledColumnFilters ?? localColumnFilters;
  const onColumnFiltersChange =
    onControlledColumnFiltersChange ?? setLocalColumnFilters;

  const columnVisibility = controlledColumnVisibility ?? localColumnVisibility;
  const onColumnVisibilityChange =
    onControlledColumnVisibilityChange ?? setLocalColumnVisibility;

  const rowSelection = controlledRowSelection ?? localRowSelection;
  const onRowSelectionChange =
    onControlledRowSelectionChange ?? setLocalRowSelection;

  const pagination = controlledPagination ?? localPagination;
  const onPaginationChange = onControlledPaginationChange ?? setLocalPagination;

  const table = useReactTable({
    data,
    columns,
    // Sorting
    ...(enableSorting && {
      onSortingChange,
      getSortedRowModel: getSortedRowModel(),
      enableMultiSort,
    }),
    // Filtering
    ...(enableFiltering && {
      onColumnFiltersChange,
      getFilteredRowModel: getFilteredRowModel(),
    }),
    // Column visibility
    ...(enableColumnVisibility && {
      onColumnVisibilityChange,
    }),
    // Row selection
    ...(enableRowSelection && {
      onRowSelectionChange,
      enableRowSelection: true,
    }),
    // Pagination
    ...(enablePagination && {
      onPaginationChange,
      getPaginationRowModel: getPaginationRowModel(),
      manualPagination,
      pageCount,
    }),
    getCoreRowModel: getCoreRowModel(),
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      pagination,
    },
  });

  const selectedRows = table.getFilteredSelectedRowModel().rows;
  const hasSelection = selectedRows.length > 0;

  return (
    <div className={className}>
      {/* Toolbar */}
      <div className="flex items-center justify-between py-4">
        <div className="flex flex-1 items-center space-x-2">
          {/* Filter Input */}
          {enableFiltering && filterColumn && (
            <Input
              placeholder={filterPlaceholder}
              value={
                (table.getColumn(filterColumn)?.getFilterValue() as string) ??
                ""
              }
              onChange={(event) =>
                table
                  .getColumn(filterColumn)
                  ?.setFilterValue(event.target.value)
              }
              className="h-8 w-[150px] lg:w-[250px]"
            />
          )}

          {/* Clear Filters */}
          {enableFiltering && columnFilters.length > 0 && (
            <Button
              variant="ghost"
              onClick={() => table.resetColumnFilters()}
              className="h-8 px-2 lg:px-3"
            >
              Reset
              <X className="ml-2 h-4 w-4" />
            </Button>
          )}

          {/* Toolbar Actions */}
          {toolbarActions}
        </div>

        <div className="flex items-center space-x-2">
          {/* Bulk Actions */}
          {hasSelection && bulkActions && (
            <div className="flex items-center space-x-2">{bulkActions}</div>
          )}

          {/* Column Visibility */}
          {enableColumnVisibility && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="ml-auto h-8">
                  Columns
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[150px]">
                {table
                  .getAllColumns()
                  .filter(
                    (column) =>
                      typeof column.accessorFn !== "undefined" &&
                      column.getCanHide()
                  )
                  .map((column) => {
                    return (
                      <DropdownMenuCheckboxItem
                        key={column.id}
                        className="capitalize"
                        checked={column.getIsVisible()}
                        onCheckedChange={(value) =>
                          column.toggleVisibility(!!value)
                        }
                      >
                        {column.id}
                      </DropdownMenuCheckboxItem>
                    );
                  })}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Selection Info */}
      {enableRowSelection && hasSelection && (
        <div className="flex items-center justify-between rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-900 mb-4">
          <span>
            {selectedRows.length} of {table.getFilteredRowModel().rows.length}{" "}
            row(s) selected.
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => table.resetRowSelection()}
            className="h-7 text-blue-900 hover:text-blue-900"
          >
            Clear selection
          </Button>
        </div>
      )}

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  onClick={() => onRowClick?.(row.original)}
                  className={onRowClick ? "cursor-pointer" : ""}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {enablePagination && (
        <div className="flex items-center justify-between px-2 py-4">
          <div className="flex-1 text-sm text-muted-foreground">
            {enableRowSelection && (
              <>
                {table.getFilteredSelectedRowModel().rows.length} of{" "}
                {table.getFilteredRowModel().rows.length} row(s) selected.
              </>
            )}
          </div>
          <div className="flex items-center space-x-6 lg:space-x-8">
            {/* Page Size Selector */}
            <div className="flex items-center space-x-2">
              <p className="text-sm font-medium">Rows per page</p>
              <select
                value={table.getState().pagination.pageSize}
                onChange={(e) => {
                  table.setPageSize(Number(e.target.value));
                }}
                className="h-8 w-[70px] rounded-md border border-input bg-transparent px-2 py-1 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                {pageSizeOptions.map((pageSize) => (
                  <option key={pageSize} value={pageSize}>
                    {pageSize}
                  </option>
                ))}
              </select>
            </div>

            {/* Page Info */}
            <div className="flex w-[100px] items-center justify-center text-sm font-medium">
              Page {table.getState().pagination.pageIndex + 1} of{" "}
              {table.getPageCount()}
            </div>

            {/* Pagination Buttons */}
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
              >
                First
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                Next
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                disabled={!table.getCanNextPage()}
              >
                Last
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Example usage with typed data
export type Payment = {
  id: string;
  amount: number;
  status: "pending" | "processing" | "success" | "failed";
  email: string;
};

// Example columns definition
export const exampleColumns: ColumnDef<Payment>[] = [
  createSelectionColumn<Payment>(),
  {
    accessorKey: "status",
    header: createSortableHeader("Status"),
    cell: ({ row }) => (
      <div className="capitalize">{row.getValue("status")}</div>
    ),
  },
  {
    accessorKey: "email",
    header: createSortableHeader("Email"),
    cell: ({ row }) => <div className="lowercase">{row.getValue("email")}</div>,
  },
  {
    accessorKey: "amount",
    header: createSortableHeader("Amount"),
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("amount"));
      const formatted = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(amount);
      return <div className="text-right font-medium">{formatted}</div>;
    },
  },
  createActionsColumn<Payment>((payment) => [
    {
      label: "Copy ID",
      onClick: () => navigator.clipboard.writeText(payment.id),
    },
    {
      label: "View details",
      onClick: () => console.log("View", payment),
    },
    {
      label: "Delete",
      onClick: () => console.log("Delete", payment),
      variant: "destructive",
    },
  ]),
];

// Example data
export const exampleData: Payment[] = [
  {
    id: "m5gr84i9",
    amount: 316,
    status: "success",
    email: "ken99@example.com",
  },
  {
    id: "3u1reuv4",
    amount: 242,
    status: "success",
    email: "Abe45@example.com",
  },
  {
    id: "derv1ws0",
    amount: 837,
    status: "processing",
    email: "Monserrat44@example.com",
  },
  {
    id: "5kma53ae",
    amount: 874,
    status: "success",
    email: "Silas22@example.com",
  },
  {
    id: "bhqecj4p",
    amount: 721,
    status: "failed",
    email: "carmella@example.com",
  },
];

// Example component demonstrating usage
export function DataTableExample() {
  const [rowSelection, setRowSelection] = React.useState({});

  return (
    <DataTable
      columns={exampleColumns}
      data={exampleData}
      enableRowSelection
      enableMultiSort
      filterColumn="email"
      filterPlaceholder="Filter emails..."
      onRowClick={(row) => console.log("Row clicked:", row)}
      rowSelection={rowSelection}
      onRowSelectionChange={setRowSelection}
      toolbarActions={
        <Button variant="outline" size="sm">
          Export
        </Button>
      }
      bulkActions={
        <>
          <Button variant="outline" size="sm">
            Edit Selected
          </Button>
          <Button variant="destructive" size="sm">
            Delete Selected
          </Button>
        </>
      }
    />
  );
}
