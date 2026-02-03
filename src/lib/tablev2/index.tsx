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
import { Loader2, Search } from "lucide-react";
import { Input } from "@/lib/components/ui/input";
import { useTableFilters } from "./hooks/useTableFilters";
import type {
  BaseModelTableColumnDef,
  BaseModelTableField,
  BaseModelTableRelationConfig,
  FieldSchema,
  RelationshipSchema,
} from "./types";

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

function ModelTableV2Content({
  filterPanel,
  tableConfig,
}: {
  filterPanel?: ModelTableFilterPanelProps;
  tableConfig?: ModelTableV2TableConfig;
}) {
  const { metadata } = useMetadata();
  const showTitle = tableConfig?.showTitle !== false;
  const resolvedTitle =
    tableConfig?.title || metadata?.verboseNamePlural || metadata?.model;

  return (
    <>
      {showTitle && resolvedTitle ? (
        <div className="px-2">
          <h2 className="text-lg font-semibold">{resolvedTitle}</h2>
        </div>
      ) : null}
      <TableToolbar filterPanel={filterPanel} tableConfig={tableConfig} />
      <TableMobileCard emptyState={tableConfig?.emptyState} />
    </>
  );
}

// ============================================================================
// Public Component
// ============================================================================

export interface ModelTableV2Props {
  app: string;
  model: string;
  filterPanel?: ModelTableFilterPanelProps;
  baseTable?: Omit<BaseModelTableProps, "app" | "model" | "children">;
  // Future: options prop for overrides
}

// ============================================================================
// Base Model Table (Minimal UI)
// ============================================================================

type BaseTableContentProps = {
  persistenceKey?: string;
  quickSearch?: boolean;
  children?: React.ReactNode;
  tableConfig?: ModelTableV2TableConfig;
  hideTableOnMobile?: boolean;
  fields?: BaseModelTableField[];
  relations?: Record<string, BaseModelTableRelationConfig>;
};

function BaseTableContent({
  persistenceKey,
  quickSearch,
  children,
  tableConfig,
  hideTableOnMobile,
  fields,
  relations,
}: BaseTableContentProps) {
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
  const { quickSearch: term, setQuickSearch } = useTableFilters();
  const supportsQuick = !!metadata?.filterConfig?.supportsQuick;

  const effectiveKey = persistenceKey || `${app}-${model}`;
  useTablePersistence(effectiveKey);
  const queryConfig = React.useMemo(
    () => ({ fields, relations }),
    [fields, relations],
  );
  useTableData(queryConfig);

  const columnDefs = React.useMemo(() => {
    if (!metadata || !fields || fields.length === 0) return null;
    const fieldLookup = new Map<string, FieldSchema>();
    metadata.fields.forEach((field) => {
      fieldLookup.set(field.name, field);
      if (field.fieldName) fieldLookup.set(field.fieldName, field);
    });
    const relationLookup = new Map<string, RelationshipSchema>();
    metadata.relationships.forEach((relation) => {
      if (relation.name) relationLookup.set(relation.name, relation);
      if (relation.fieldName) relationLookup.set(relation.fieldName, relation);
    });

    const buildColumnDef = (
      accessor: string,
      titleOverride?: string,
      render?: BaseModelTableColumnDef["render"],
    ): BaseModelTableColumnDef => {
      const parts = accessor.split(".");
      const root = parts[0];
      const fieldMeta = fieldLookup.get(root);
      const relationMeta = relationLookup.get(root);
      const isRelation = !!fieldMeta?.isRelation || !!relationMeta;
      const displayField = relations?.[root]?.display ?? "desc";
      const displayAccessor =
        parts.length === 1 && isRelation ? `${accessor}.${displayField}` : accessor;
      const title =
        titleOverride ||
        fieldMeta?.verboseName ||
        relationMeta?.verboseName ||
        parts[parts.length - 1] ||
        accessor;
      const sortable = !displayAccessor.includes(".") && !!fieldMeta?.isIndexed;
      const sortKey = !displayAccessor.includes(".")
        ? fieldMeta?.name || displayAccessor
        : undefined;

      return {
        id: accessor,
        accessor: displayAccessor,
        title,
        render,
        sortable,
        sortKey,
      };
    };

    return fields.map((entry) => {
      if (typeof entry === "string") {
        return buildColumnDef(entry);
      }
      return buildColumnDef(entry.accessor, entry.title, entry.render);
    });
  }, [metadata, fields, relations]);

  const sortableColumnIds = React.useMemo(() => {
    if (!columnDefs || columnDefs.length === 0) return columnOrder;
    const ids = columnDefs.map((column) => column.id);
    if (columnOrder.length === 0) return ids;
    return columnOrder.filter((id) => ids.includes(id));
  }, [columnDefs, columnOrder]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      const oldIndex = columnOrder.indexOf(String(active.id));
      const newIndex = columnOrder.indexOf(String(over?.id));
      setColumnOrder(arrayMove(columnOrder, oldIndex, newIndex));
    }
  };

  React.useEffect(() => {
    if (!metadata?.fields) return;

    const targetColumns = columnDefs;
    if (targetColumns && targetColumns.length > 0) {
      const columnIds = targetColumns.map((column) => column.id);
      const orderedIds = columnOrder.length ? columnOrder : [];
      const missingIds = columnIds.filter((id) => !orderedIds.includes(id));

      if (columnOrder.length === 0) {
        setColumnOrder(columnIds);
      } else if (missingIds.length > 0) {
        setColumnOrder([...orderedIds, ...missingIds]);
      }

      const nextVisibility: Record<string, boolean> = { ...columnVisibility };
      let visibilityChanged = false;
      columnIds.forEach((id) => {
        if (nextVisibility[id] === undefined) {
          nextVisibility[id] = true;
          visibilityChanged = true;
        }
      });
      if (visibilityChanged) {
        setColumnVisibility(nextVisibility);
      }
      return;
    }

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
    columnDefs,
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

  return (
    <div className="space-y-4">
      {children}
      {children}
      {quickSearch && supportsQuick ? (
        <div className="relative max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={tableConfig?.searchPlaceholder ?? "Rechercher..."}
            value={term}
            onChange={(event) => setQuickSearch(event.target.value)}
            className="pl-8"
          />
        </div>
      ) : null}
      <div className={hideTableOnMobile ? "hidden md:block" : undefined}>
        <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <TableFrame>
            <SortableContext
              items={sortableColumnIds}
              strategy={horizontalListSortingStrategy}
            >
              <TableHeader
                actionsLabel={tableConfig?.actionsLabel}
                columns={columnDefs ?? undefined}
              />
            </SortableContext>
            <TableBody>
              <TableRows
                emptyState={tableConfig?.emptyState}
                loadingText={tableConfig?.loadingText}
                columns={columnDefs ?? undefined}
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

export interface BaseModelTableProps {
  app: string;
  model: string;
  className?: string;
  persistenceKey?: string;
  quickSearch?: boolean;
  children?: React.ReactNode;
  tableConfig?: ModelTableV2TableConfig;
  hideTableOnMobile?: boolean;
  fields?: BaseModelTableField[];
  relations?: Record<string, BaseModelTableRelationConfig>;
}

export function BaseModelTable({
  app,
  model,
  className,
  persistenceKey,
  quickSearch,
  children,
  tableConfig,
  hideTableOnMobile,
  fields,
  relations,
}: BaseModelTableProps) {
  return (
    <div className={className}>
      <MetadataProvider app={app} model={model}>
        <TableProvider>
          <BaseTableContent
            persistenceKey={persistenceKey}
            quickSearch={quickSearch}
            tableConfig={tableConfig}
            hideTableOnMobile={hideTableOnMobile}
            fields={fields}
            relations={relations}
          >
            {children}
          </BaseTableContent>
        </TableProvider>
      </MetadataProvider>
    </div>
  );
}

export function ModelTableV2({
  app,
  model,
  filterPanel,
  baseTable,
}: ModelTableV2Props) {
  return (
    <BaseModelTable
      app={app}
      model={model}
      className={baseTable?.className}
      persistenceKey={baseTable?.persistenceKey}
      quickSearch={baseTable?.quickSearch}
      tableConfig={baseTable?.tableConfig}
      hideTableOnMobile={baseTable?.hideTableOnMobile ?? true}
      fields={baseTable?.fields}
      relations={baseTable?.relations}
    >
      <ModelTableV2Content
        filterPanel={filterPanel}
        tableConfig={baseTable?.tableConfig}
      />
    </BaseModelTable>
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
