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

type FilterPanelMode = "drawer" | "modal";

export interface FilterPanelOptions {
  mode?: FilterPanelMode;
  defaultOpen?: boolean;
  title?: string;
  widthClassName?: string;
  side?: "top" | "right" | "bottom" | "left";
}

export type ModelTableFilterPanelProps = FilterPanelOptions &
  Partial<import("../form/filters/FilterPanel").FilterPanelProps>;

export type ModelTableV2TableConfig = {
  showTitle?: boolean;
  title?: string;
  actionsLabel?: string;
  emptyState?: string;
  loadingText?: string;
  searchPlaceholder?: string;
  resetLabel?: string;
  addLabel?: string;
  columnsLabel?: string;
  toggleColumnsLabel?: string;
  paginationLabels?: {
    rowsPerPage?: string;
    pageStatus?: (page: number, totalPages: number) => string;
    selectionStatus?: (selected: number, total: number) => string;
    firstPageAria?: string;
    previousPageAria?: string;
    nextPageAria?: string;
    lastPageAria?: string;
  };
  exportLabels?: {
    buttonAria?: string;
    title?: string;
    description?: string;
    fieldsTitle?: string;
    selectedCount?: (count: number) => string;
    selectAll?: string;
    clear?: string;
    filenameLabel?: string;
    filenamePlaceholder?: string;
    formatLabel?: string;
    quickSearchLabel?: string;
    quickSearchActive?: string;
    quickSearchNone?: string;
    advancedFiltersLabel?: string;
    advancedFiltersNone?: string;
    orderingLabel?: string;
    orderingNone?: string;
    footerSelectedCount?: (count: number) => string;
    cancel?: string;
    download?: string;
  };
};

function TableContent({
  persistenceKey,
  filterPanel,
  tableConfig,
}: {
  persistenceKey?: string;
  filterPanel?: ModelTableFilterPanelProps;
  tableConfig?: ModelTableV2TableConfig;
}) {
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
    columnVisibility,
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
    if (!metadata?.fields) return;

    const visibleFields = metadata.fields.filter(
      (f) => f.visibility !== "hidden",
    );
    const visibleNames = visibleFields.map((field) => field.name);
    const orderedNames = columnOrder.length ? columnOrder : [];
    const missingNames = visibleNames.filter(
      (name) => !orderedNames.includes(name),
    );

    if (columnOrder.length === 0) {
      setColumnOrder(visibleNames);
    } else if (missingNames.length > 0) {
      setColumnOrder([...orderedNames, ...missingNames]);
    }

    const nextVisibility: Record<string, boolean> = { ...columnVisibility };
    let visibilityChanged = false;
    visibleFields.forEach((field) => {
      if (nextVisibility[field.name] === undefined) {
        nextVisibility[field.name] = true;
        visibilityChanged = true;
      }
    });
    if (visibilityChanged) {
      setColumnVisibility(nextVisibility);
    }
  }, [
    metadata,
    columnOrder,
    columnVisibility,
    setColumnOrder,
    setColumnVisibility,
  ]);

  if (metadataLoading) {
    return (
      <div
        className="flex h-64 items-center justify-center border rounded-md"
        role="status"
        aria-label="Chargement des metadonnees du tableau"
      >
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (metadataError) {
    return (
      <div className="flex h-64 items-center justify-center border rounded-md text-red-500">
        Erreur de chargement des metadonnees : {metadataError.message}
      </div>
    );
  }

  const showTitle = tableConfig?.showTitle !== false;
  const resolvedTitle =
    tableConfig?.title || metadata?.verboseNamePlural || metadata?.model;

  return (
    <div className="space-y-4">
      {showTitle && resolvedTitle ? (
        <div className="px-2">
          <h2 className="text-lg font-semibold">{resolvedTitle}</h2>
        </div>
      ) : null}
      <TableToolbar filterPanel={filterPanel} tableConfig={tableConfig} />

      {/* Mobile View */}
      <TableMobileCard
        emptyState={tableConfig?.emptyState}
      />

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
              <TableHeader actionsLabel={tableConfig?.actionsLabel} />
            </SortableContext>
            <TableBody>
              <TableRows
                emptyState={tableConfig?.emptyState}
                loadingText={tableConfig?.loadingText}
              />
            </TableBody>
          </TableFrame>
        </DndContext>
      </div>

      <TablePagination labels={tableConfig?.paginationLabels} />

      {dataError && (
        <div className="text-sm text-red-500 px-2">
          Erreur de chargement des donnees : {dataError.message}
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
  filterPanel?: ModelTableFilterPanelProps;
  tableConfig?: ModelTableV2TableConfig;
  // Future: options prop for overrides
}

export function ModelTableV2({
  app,
  model,
  className,
  persistenceKey,
  filterPanel,
  tableConfig,
}: ModelTableV2Props) {
  return (
    <div className={className}>
      <MetadataProvider app={app} model={model}>
        <TableProvider>
          <TableContent
            persistenceKey={persistenceKey}
            filterPanel={filterPanel}
            tableConfig={tableConfig}
          />
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
export * from "./components/ExportDialog";

// Utils
export * from "./utils";
