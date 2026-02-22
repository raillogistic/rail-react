import React from "react";
import { DynamicModelTable } from "@/lib/table";

/**
 * Dashboard page showing a DynamicModelTable example for billing invoices.
 */
export default function DashboardPage() {
  return (
    <div className="flex h-full w-full min-h-0 flex-col gap-4 p-4">
      <div className="min-h-0 flex-1">
        <DynamicModelTable
          app="store"
          model="Product"
          baseTable={{
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
