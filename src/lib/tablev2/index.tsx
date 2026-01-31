/* eslint-disable react-refresh/only-export-components */
import React from "react";
import { DndContext, closestCenter, DragEndEvent } from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable";
import { MetadataProvider, useMetadata } from "./context/MetadataContext";
import { TableProvider, useTable } from "./context/TableContext";
import { useTablePersistence } from "./hooks/useTablePersistence";
import { useTableData } from "./hooks/useTableData";
import { TableHeader } from "./components/TableHeader";
import { TableRows } from "./components/TableRow";
import { TablePagination } from "./components/TablePagination";
import { TableToolbar } from "./components/TableToolbar";
import { TableMobileCard } from "./components/TableMobileCard";
import { TableFrame, TableBody } from "./components/TableFrame";
import { Loader2 } from "lucide-react";

// ============================================================================
// Inner Component (Inside Contexts)
// ============================================================================

function TableContent({ persistenceKey }: { persistenceKey?: string }) {
  const {
    metadata,
    loading: metadataLoading,
    error: metadataError,
    app,
    model,
  } = useMetadata();
  const {
    columnOrder,
    setColumnOrder,
    setColumnVisibility,
    error: dataError,
  } = useTable();

  // 1. Persistence
  // Load/Save state from localStorage.
  // We use app-model as default key, but allow overrides.
  const effectiveKey = persistenceKey || `${app}-${model}`;
  useTablePersistence(effectiveKey);

  // 2. Data Fetching
  // Trigger data fetching (depends on filters, sorting, etc.)
  useTableData();

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      const oldIndex = columnOrder.indexOf(String(active.id));
      const newIndex = columnOrder.indexOf(String(over?.id));
      setColumnOrder(arrayMove(columnOrder, oldIndex, newIndex));
    }
  };

  // Initial column order setup when metadata loads
  // (Ideally this should be in an effect in TableContext or useTableMetadata,
  // but we need access to setColumnOrder from TableContext)
  React.useEffect(() => {
    if (metadata?.fields && columnOrder.length === 0) {
      // Default order: all visible fields
      const visibleFields = metadata.fields.filter(
        (f) => f.visibility !== "hidden",
      );
      const defaultOrder = visibleFields.map((f) => f.name);
      setColumnOrder(defaultOrder);

      // Initialize visibility
      const initialVisibility: Record<string, boolean> = {};
      visibleFields.forEach((f) => {
        initialVisibility[f.name] = true;
      });
      setColumnVisibility(initialVisibility);
    }
  }, [metadata, columnOrder.length, setColumnOrder, setColumnVisibility]);

  if (metadataLoading) {
    return (
      <div
        className="flex h-64 items-center justify-center border rounded-md"
        role="status"
        aria-label="Loading table metadata"
      >
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (metadataError) {
    return (
      <div className="flex h-64 items-center justify-center border rounded-md text-red-500">
        Error loading metadata: {metadataError.message}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <TableToolbar />

      {/* Mobile View */}
      <TableMobileCard />

      {/* Desktop View */}
      <div className="hidden md:block">
        <DndContext
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <TableFrame>
            <SortableContext
              items={columnOrder}
              strategy={horizontalListSortingStrategy}
            >
              <TableHeader />
            </SortableContext>
            <TableBody>
              <TableRows />
            </TableBody>
          </TableFrame>
        </DndContext>
      </div>

      <TablePagination />

      {dataError && (
        <div className="text-sm text-red-500 px-2">
          Error loading data: {dataError.message}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Public Component
// ============================================================================

export interface ModelTableV2Props {
  app: string;
  model: string;
  className?: string;
  persistenceKey?: string;
  // Future: options prop for overrides
}

export function ModelTableV2({
  app,
  model,
  className,
  persistenceKey,
}: ModelTableV2Props) {
  return (
    <div className={className}>
      <MetadataProvider app={app} model={model}>
        <TableProvider>
          <TableContent persistenceKey={persistenceKey} />
        </TableProvider>
      </MetadataProvider>
    </div>
  );
}

// ============================================================================
// Exports
// ============================================================================

// Types
export * from "./types";

// Contexts
export * from "./context/MetadataContext";
export * from "./context/TableContext";

// Hooks
export * from "./hooks/useTableData";
export * from "./hooks/useTableFilters";
export * from "./hooks/useTableMetadata";
export * from "./hooks/useTablePersistence";

// Components
export * from "./components/TableFrame";
export * from "./components/TableHeader";
export * from "./components/TablePagination";
export * from "./components/TableRow";
export * from "./components/TableToolbar";
export * from "./components/TableMobileCard";

// Utils
export * from "./utils";
