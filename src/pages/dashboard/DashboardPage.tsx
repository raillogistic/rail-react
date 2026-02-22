import React, { useRef } from "react";
import { DynamicModelTable, DynamicModelTableHandle } from "@/lib/table";

/**
 * Dashboard page showing a DynamicModelTable example for billing invoices.
 */
export default function DashboardPage() {
  const tableRef = useRef<DynamicModelTableHandle>(null);

  return (
    <div className="flex h-full w-full min-h-0 flex-col gap-4 p-4">
      <button onClick={() => console.log(tableRef)}>Refetch</button>
      <div className="min-h-0 flex-1">
        <DynamicModelTable
          ref={tableRef}
          app="store"
          model="Product"
          baseTable={{
            expand: {
              enabled: true, // optional, defaults to Boolean(renderRow)
              renderRow: ({ row }) => (
                <div className="p-3">Detxxail: {String(row["sku"])}</div>
              ),
            },
            topActions: () => [],
            quickSearch: true,
            enableSelection: true,
            tableConfig: {
              title: "Invoices",
              loadingText: "Loading invoices...",
              emptyState: "No invoices found.",
            },
            // fields: ["id", "createdAt", "updatedAt", "status"],
            performance: {
              dataMode: "pagination",
              enableVirtualization: true,
            },
          }}
        />
      </div>
    </div>
  );
}
