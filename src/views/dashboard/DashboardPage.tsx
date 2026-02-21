import React from "react";
import type { PaginationState, RowSelectionState } from "@tanstack/react-table";
import {
  DynamicTable,
  type DynamicTableColumnInput,
} from "@/lib/dynamic-table";

/**
 * Demo row type used by the DynamicTable dashboard example.
 */

interface DashboardInvoiceRow {
  /** Unique row identifier. */
  id: string;
  /** Invoice number displayed as a business key. */
  invoiceNumber: string;
  /** ISO datetime string used for sorting and display. */
  issuedAt: string;
  /** Monetary amount in the invoice currency. */
  amount: number;
  /** Invoice currency code. */
  currency: string;
  /** Lifecycle status displayed as badge-like text. */
  status: "draft" | "sent" | "paid" | "overdue";
  /** Synthetic risk score used for prioritization. */
  riskScore: number;
  /** Related customer data shown via accessorFn columns. */
  customer: {
    /** Customer display name. */
    name: string;
    /** Business segment of the customer. */
    segment: "SMB" | "Mid-market" | "Enterprise";
  };
}

/**
 * Static rows used to demonstrate DynamicTable behavior in dashboard.
 */
const DASHBOARD_INVOICE_ROWS: DashboardInvoiceRow[] = [
  {
    id: "101",
    invoiceNumber: "INV-2026-0001",
    issuedAt: "2026-02-08T09:24:00Z",
    amount: 4200,
    currency: "USD",
    status: "sent",
    riskScore: 22,
    customer: { name: "Northwind Retail", segment: "SMB" },
  },
  {
    id: "102",
    invoiceNumber: "INV-2026-0002",
    issuedAt: "2026-02-10T13:05:00Z",
    amount: 15890,
    currency: "USD",
    status: "paid",
    riskScore: 8,
    customer: { name: "Atlas Manufacturing", segment: "Enterprise" },
  },
  {
    id: "103",
    invoiceNumber: "INV-2026-0003",
    issuedAt: "2026-02-11T17:40:00Z",
    amount: 6650,
    currency: "EUR",
    status: "overdue",
    riskScore: 74,
    customer: { name: "Blue Harbor Logistics", segment: "Mid-market" },
  },
  {
    id: "104",
    invoiceNumber: "INV-2026-0004",
    issuedAt: "2026-02-14T11:18:00Z",
    amount: 987,
    currency: "USD",
    status: "draft",
    riskScore: 12,
    customer: { name: "Summit Design Studio", segment: "SMB" },
  },
  {
    id: "105",
    invoiceNumber: "INV-2026-0005",
    issuedAt: "2026-02-15T15:56:00Z",
    amount: 23340,
    currency: "USD",
    status: "sent",
    riskScore: 49,
    customer: { name: "Quantum Supplies", segment: "Enterprise" },
  },
  {
    id: "106",
    invoiceNumber: "INV-2026-0006",
    issuedAt: "2026-02-17T08:02:00Z",
    amount: 3720,
    currency: "EUR",
    status: "overdue",
    riskScore: 61,
    customer: { name: "Cobalt Commerce", segment: "Mid-market" },
  },
  {
    id: "107",
    invoiceNumber: "INV-2026-0007",
    issuedAt: "2026-02-18T10:10:00Z",
    amount: 12600,
    currency: "USD",
    status: "paid",
    riskScore: 14,
    customer: { name: "Drift Medical", segment: "Enterprise" },
  },
];

/**
 * Formats an ISO datetime string to a concise local date representation.
 */
function formatDateLabel(value: string): string {
  return new Date(value).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}

/**
 * Formats a numeric amount with the provided currency code.
 */
function formatMoney(value: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Resolves a compact status style class for status text rendering.
 */
function getStatusClassName(status: DashboardInvoiceRow["status"]): string {
  if (status === "paid") return "text-emerald-700 bg-emerald-100";
  if (status === "overdue") return "text-red-700 bg-red-100";
  if (status === "sent") return "text-blue-700 bg-blue-100";
  return "text-amber-700 bg-amber-100";
}

/**
 * Resolves a compact risk style class for risk score rendering.
 */
function getRiskClassName(riskScore: number): string {
  if (riskScore >= 60) return "text-red-700 bg-red-100";
  if (riskScore >= 35) return "text-amber-700 bg-amber-100";
  return "text-emerald-700 bg-emerald-100";
}

/**
 * Dashboard page showing DynamicTable usage with controlled state and
 * spec-driven complex column layout.
 */
export default function DashboardPage() {
  const [orderBy, setOrderBy] = React.useState<string[]>(["-issued_at"]);
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 5,
  });

  const selectedCount = React.useMemo(
    () =>
      Object.values(rowSelection).reduce(
        (count, isSelected) => (isSelected ? count + 1 : count),
        0,
      ),
    [rowSelection],
  );

  const columns = React.useMemo<DynamicTableColumnInput<DashboardInvoiceRow>[]>(
    () => [
      {
        id: "invoice",
        title: "Invoice",
        columns: [
          {
            id: "invoiceNumber",
            accessorKey: "invoiceNumber",
            title: "Number",
            sortKey: "invoice_number",
            cell: ({ value }) => (
              <span className="font-semibold text-foreground">
                {String(value)}
              </span>
            ),
          },
          {
            id: "issuedAt",
            accessorKey: "issuedAt",
            title: "Issued",
            sortKey: "issued_at",
            cell: ({ value }) => formatDateLabel(String(value)),
          },
          {
            id: "amount",
            accessorFn: (row) => row.amount,
            title: "Amount",
            sortKey: "total_amount",
            cell: ({ row }) => formatMoney(row.amount, row.currency),
          },
        ],
      },
      {
        id: "customer",
        title: "Customer",
        columns: [
          {
            id: "customerName",
            accessorFn: (row) => row.customer.name,
            title: "Name",
            sortKey: "customer__name",
          },
          {
            id: "customerSegment",
            accessorFn: (row) => row.customer.segment,
            title: "Segment",
            sortKey: "customer__segment",
          },
        ],
      },
      {
        id: "status",
        accessorKey: "status",
        title: "Status",
        sortKey: "status",
        cell: ({ row }) => (
          <span
            className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${getStatusClassName(row.status)}`}
          >
            {row.status.toUpperCase()}
          </span>
        ),
      },
      {
        id: "riskScore",
        accessorKey: "riskScore",
        title: "Risk",
        sortKey: "risk_score",
        cell: ({ row }) => (
          <span
            className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${getRiskClassName(row.riskScore)}`}
          >
            {row.riskScore}
          </span>
        ),
      },
    ],
    [],
  );

  return (
    <div className="flex h-full w-full flex-col gap-4 p-4">
      <div className="min-h-0 flex-1">
        <DynamicTable
          rows={DASHBOARD_INVOICE_ROWS}
          columns={columns}
          getRowId={(row) => row.id}
          sortMode="client"
          paginationMode="client"
          state={{
            orderBy,
            rowSelection,
            pagination,
          }}
          onOrderByChange={setOrderBy}
          onRowSelectionChange={setRowSelection}
          onPaginationChange={setPagination}
          features={{
            enableSelection: true,
            enableColumnOrdering: true,
            enableColumnResizing: true,
            enableColumnHiding: true,
            enableGrouping: true,
            enableVirtualization: true,
            virtualizeThreshold: 20,
            enablePagination: true,
            dataMode: "pagination",
            lockedColumnIds: ["invoiceNumber"],
          }}
          layout={{
            density: "comfortable",
            stickySelectionColumn: true,
            actions: {
              headerLabel: "Actions",
              sticky: true,
              renderCell: ({ row }) => (
                <button
                  type="button"
                  className="rounded-md border border-border px-2 py-1 text-xs font-medium hover:bg-muted"
                  aria-label={`Open invoice ${row.invoiceNumber}`}
                >
                  Open
                </button>
              ),
            },
            rowClassName: ({ row }) =>
              row.status === "overdue" ? "bg-red-50/40 dark:bg-red-950/20" : "",
          }}
          totalRows={DASHBOARD_INVOICE_ROWS.length}
          emptyState="No invoices available."
        />
      </div>
    </div>
  );
}
