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
import { Loader2, PlusCircle } from "lucide-react";
import { Card, CardContent } from "@/lib/components/ui/card";
import { Button } from "@/lib/components/ui/button";
import type {
  BaseModelTableColumnDef,
  BaseModelTableFieldsInput,
  BaseModelTableColumnOrderingConfig,
  BaseModelTableRelationConfig,
  FieldSchema,
  ModelSchema,
  RelationshipSchema,
  TableDensity,
} from "./types";
import {
  findMutation,
  isAccessorExcluded,
  normalizeBaseModelTableFieldsInput,
} from "./utils";

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

export type ModelTableV2TopAction = {
  key: string;
  label: string;
  icon?: React.ReactNode;
  variant?: "default" | "outline" | "destructive";
  size?: "sm" | "md" | "lg" | "icon";
  order?: number;
  show_when?: "always" | "has_selection";
  dataAttributes?: Record<string, string | number | boolean | undefined>;
  on_click: (ctx: {
    selected_rows: Record<string, unknown>[];
    selection_state: Record<string, boolean>;
  }) => void;
};

export type ModelTableV2TopActionsInput =
  | ModelTableV2TopAction[]
  | ((ctx: {
      app: string;
      model: string;
      metadata?: ModelSchema;
      items: Record<string, unknown>[];
      selected_rows: Record<string, unknown>[];
      selection_state: Record<string, boolean>;
    }) => ModelTableV2TopAction[] | undefined);

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
  viewLabel?: string;
  wrapCellsLabel?: string;
  densityLabel?: string;
  densityOptions?: {
    compact?: string;
    comfortable?: string;
    spacious?: string;
  };
  refreshLabel?: string;
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

export type ModelTableV2PerformanceOptions = {
  enableVirtualization?: boolean;
  virtualizeThreshold?: number;
  overscan?: number;
  dataMode?: "pagination" | "infinite";
  infiniteScrollThresholdPx?: number;
};

export type ModelTableV2ViewOptions = {
  defaultDensity?: TableDensity;
  defaultWrapCells?: boolean;
  maxBodyHeightClassName?: string;
};

function ModelTableV2Content({
  filterPanel,
  tableConfig,
  quickSearch,
  topActions,
}: {
  filterPanel?: ModelTableFilterPanelProps;
  tableConfig?: ModelTableV2TableConfig;
  quickSearch?: boolean;
  topActions?: ModelTableV2TopActionsInput;
}) {
  const { metadata, app, model } = useMetadata();
  const { pagination, columnVisibility, data, rowSelection } = useTable();
  const showTitle = tableConfig?.showTitle !== false;
  const resolvedTitle =
    tableConfig?.title || metadata?.verboseNamePlural || metadata?.model;
  const selectedRows = React.useMemo(
    () =>
      data.filter((row) => {
        const rowId = String(row.id);
        return !!rowSelection[rowId];
      }),
    [data, rowSelection],
  );
  const createMutation = findMutation(metadata?.mutations, "create");
  const canCreate = !!createMutation?.allowed;
  const addAction = React.useMemo<ModelTableV2TopAction | undefined>(() => {
    if (!canCreate) return undefined;

    return {
      key: "add",
      label:
        tableConfig?.addLabel ??
        `Ajouter ${metadata?.verboseName || metadata?.model || ""}`.trim(),
      icon: <PlusCircle className="mr-1 h-4 w-4" />,
      variant: "outline",
      size: "sm",
      order: -1,
      show_when: "always",
      on_click: () => {
        console.info("add item");
      },
    };
  }, [canCreate, metadata?.model, metadata?.verboseName, tableConfig?.addLabel]);
  const resolvedTopActions = React.useMemo(() => {
    const userActions =
      typeof topActions === "function"
        ? topActions({
            app,
            model,
            metadata,
            items: data,
            selected_rows: selectedRows,
            selection_state: rowSelection,
          })
        : topActions;
    const combined = [...(userActions ?? [])];
    if (addAction) {
      combined.unshift(addAction);
    }

    const hasSelection = selectedRows.length > 0;
    return combined
      .filter((action) => action.show_when !== "has_selection" || hasSelection)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }, [
    addAction,
    app,
    data,
    metadata,
    model,
    rowSelection,
    selectedRows,
    topActions,
  ]);
  const visibleColumnCount = React.useMemo(() => {
    if (!metadata?.fields?.length) return 0;

    return metadata.fields.filter((field) => {
      if (field.visibility === "hidden") return false;
      const id = field.fieldName || field.name;
      return columnVisibility[id] ?? true;
    }).length;
  }, [columnVisibility, metadata?.fields]);
  const rowSummary = React.useMemo(() => {
    if (pagination.totalKnown) {
      const total = pagination.total;
      return `${total} ligne${total > 1 ? "s" : ""}`;
    }
    const loadedCount = data.length;
    return `${loadedCount} ligne${loadedCount > 1 ? "s" : ""} chargee${loadedCount > 1 ? "s" : ""}`;
  }, [data.length, pagination.total, pagination.totalKnown]);
  const selectedCount = selectedRows.length;

  return (
    <>
      {showTitle && resolvedTitle ? (
        <div className="mb-4 overflow-hidden rounded-xl border bg-card shadow-sm">
          <div className="pointer-events-none h-1 w-full bg-gradient-to-r from-primary/80 via-primary/30 to-transparent" />
          <div className="flex flex-wrap items-center justify-between gap-3 p-4">
            <div className="space-y-2">
              <h2 className="text-lg font-semibold tracking-tight text-foreground">
                {resolvedTitle}
              </h2>
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="rounded-full border bg-background/70 px-2 py-0.5 text-muted-foreground">
                  {rowSummary}
                </span>
                <span className="rounded-full border bg-background/70 px-2 py-0.5 text-muted-foreground">
                  {visibleColumnCount} colonne{visibleColumnCount > 1 ? "s" : ""} visible
                  {visibleColumnCount > 1 ? "s" : ""}
                </span>
                {selectedCount > 0 ? (
                  <span className="rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-primary">
                    {selectedCount} selectionne{selectedCount > 1 ? "s" : ""}
                  </span>
                ) : null}
              </div>
            </div>
            {resolvedTopActions.length > 0 ? (
              <div className="flex flex-wrap items-center gap-2">
                {resolvedTopActions.map((action) => (
                  <Button
                    key={action.key}
                    variant={action.variant ?? "outline"}
                    size={action.size === "icon" ? "icon" : "sm"}
                    className={
                      action.size === "icon"
                        ? "h-8 w-8"
                        : "h-8 whitespace-nowrap"
                    }
                    onClick={() =>
                      action.on_click({
                        selected_rows: selectedRows,
                        selection_state: rowSelection,
                      })
                    }
                    {...(action.dataAttributes ?? {})}
                  >
                    {action.icon}
                    {action.size === "icon" ? null : <span>{action.label}</span>}
                  </Button>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
      <TableToolbar
        filterPanel={filterPanel}
        tableConfig={tableConfig}
        quickSearch={quickSearch}
      />
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
  children?: React.ReactNode;
  tableConfig?: ModelTableV2TableConfig;
  view?: ModelTableV2ViewOptions;
  performance?: ModelTableV2PerformanceOptions;
  hideTableOnMobile?: boolean;
  fields?: BaseModelTableFieldsInput;
  relations?: Record<string, BaseModelTableRelationConfig>;
  columnOrdering?: BaseModelTableColumnOrderingConfig;
  skipCount?: boolean;
  disableSorting?: boolean;
  enableSelection?: boolean;
};

function BaseTableContent({
  persistenceKey,
  children,
  tableConfig,
  view,
  performance,
  hideTableOnMobile,
  fields,
  relations,
  columnOrdering,
  skipCount,
  disableSorting,
  enableSelection,
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
    pagination,
    loading: tableLoading,
    data,
    setPage,
    error: dataError,
  } = useTable();
  const tableScrollRef = React.useRef<HTMLDivElement>(null);
  const isInfiniteMode = performance?.dataMode === "infinite";

  const effectiveKey = persistenceKey || `${app}-${model}`;
  useTablePersistence(effectiveKey);

  const queryConfig = React.useMemo(
    () => ({
      fields,
      relations,
      skipCount: skipCount ?? true,
      dataMode: performance?.dataMode ?? "pagination",
    }),
    [fields, relations, skipCount, performance?.dataMode],
  );
  const { refetch } = useTableData(queryConfig);

  const normalizedFieldsConfig = React.useMemo(
    () => normalizeBaseModelTableFieldsInput(fields),
    [fields],
  );
  const excludedAccessors = React.useMemo(
    () => new Set(normalizedFieldsConfig.exclude),
    [normalizedFieldsConfig.exclude],
  );

  const columnDefs = React.useMemo(() => {
    if (!metadata) return null;

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
        parts.length === 1 && isRelation
          ? `${accessor}.${displayField}`
          : accessor;
      const title =
        titleOverride ||
        fieldMeta?.verboseName ||
        relationMeta?.verboseName ||
        parts[parts.length - 1] ||
        accessor;

      return {
        id: accessor,
        accessor: displayAccessor,
        title,
        render,
      };
    };

    const configuredDisplay = normalizedFieldsConfig.display?.filter(
      (entry) => {
        const accessor = typeof entry === "string" ? entry : entry.accessor;
        if (!accessor) return false;
        return !isAccessorExcluded(accessor, excludedAccessors);
      },
    );
    const hasConfiguredDisplay = normalizedFieldsConfig.display !== undefined;

    const defaultDisplay = metadata.fields
      .filter((field) => field.visibility !== "hidden")
      .map((field) => field.fieldName || field.name)
      .filter((accessor) => !isAccessorExcluded(accessor, excludedAccessors));

    const displayEntries = hasConfiguredDisplay
      ? (configuredDisplay ?? [])
      : defaultDisplay;

    return displayEntries.map((entry) => {
      if (typeof entry === "string") {
        const renderOverride =
          normalizedFieldsConfig.render[entry] ??
          normalizedFieldsConfig.render[entry.split(".")[0]];
        return buildColumnDef(
          entry,
          undefined,
          renderOverride
            ? (value, row, context) =>
                renderOverride(value, row, context.data, context.refetch)
            : undefined,
        );
      }
      const renderOverride =
        normalizedFieldsConfig.render[entry.accessor] ??
        normalizedFieldsConfig.render[entry.accessor.split(".")[0]];
      return buildColumnDef(
        entry.accessor,
        entry.title ?? entry.display,
        entry.render ??
          (renderOverride
            ? (value, row, context) =>
                renderOverride(value, row, context.data, context.refetch)
            : undefined),
      );
    });
  }, [excludedAccessors, metadata, normalizedFieldsConfig, relations]);

  const sortableColumnIds = React.useMemo(() => {
    if (!columnDefs || columnDefs.length === 0) return columnOrder;
    const ids = columnDefs.map((column) => column.id);
    if (columnOrder.length === 0) return ids;
    return columnOrder.filter((id) => ids.includes(id));
  }, [columnDefs, columnOrder]);

  const allowColumnDrag = columnOrdering?.draggable !== false;
  const lockedColumns = React.useMemo(
    () => new Set(columnOrdering?.locked ?? []),
    [columnOrdering?.locked],
  );

  const handleDragEnd = (event: DragEndEvent) => {
    if (!allowColumnDrag) return;
    const { active, over } = event;
    if (!over) return;
    if (lockedColumns.has(String(active.id))) return;
    if (active.id !== over?.id) {
      const oldIndex = columnOrder.indexOf(String(active.id));
      const newIndex = columnOrder.indexOf(String(over?.id));
      setColumnOrder(arrayMove(columnOrder, oldIndex, newIndex));
    }
  };

  const resolveColumnOrder = React.useCallback(
    (availableIds: string[]) => {
      const mode = columnOrdering?.mode ?? "persisted";
      const append = columnOrdering?.append ?? "end";
      const configOrder = columnOrdering?.order ?? [];
      const baseOrder =
        mode === "persisted" && columnOrder.length > 0
          ? columnOrder
          : configOrder.length > 0
            ? configOrder
            : availableIds;
      const availableSet = new Set(availableIds);
      const normalize = (entries: string[], valid: Set<string>) => {
        const next: string[] = [];
        const seen = new Set<string>();
        entries.forEach((id) => {
          if (!valid.has(id) || seen.has(id)) return;
          next.push(id);
          seen.add(id);
        });
        return next;
      };
      const baseNormalized = normalize(baseOrder, availableSet);
      const baseSet = new Set(baseNormalized);
      const missing = availableIds.filter((id) => !baseSet.has(id));
      const missingSet = new Set(missing);
      const preferredMissing = normalize(configOrder, missingSet);
      const preferredSet = new Set(preferredMissing);
      const remainingMissing = missing.filter((id) => !preferredSet.has(id));
      const combined =
        append === "start"
          ? [...preferredMissing, ...remainingMissing, ...baseNormalized]
          : [...baseNormalized, ...preferredMissing, ...remainingMissing];

      const same =
        combined.length === columnOrder.length &&
        combined.every((id, index) => columnOrder[index] === id);
      if (!same) {
        setColumnOrder(combined);
      }
    },
    [columnOrder, columnOrdering, setColumnOrder],
  );

  React.useEffect(() => {
    if (!metadata?.fields) return;

    const targetColumns = columnDefs;
    if (targetColumns && targetColumns.length > 0) {
      const columnIds = targetColumns.map((column) => column.id);
      resolveColumnOrder(columnIds);

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
    resolveColumnOrder(visibleNames);

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
    columnVisibility,
    setColumnVisibility,
    resolveColumnOrder,
  ]);

  React.useEffect(() => {
    if (!isInfiniteMode) return;
    const container = tableScrollRef.current;
    if (!container) return;

    const threshold = performance?.infiniteScrollThresholdPx ?? 200;
    let ticking = false;

    const maybeLoadMore = () => {
      if (tableLoading) return;
      if (!pagination.hasNextPage) return;
      const distanceToBottom =
        container.scrollHeight - container.scrollTop - container.clientHeight;
      if (distanceToBottom > threshold) return;
      setPage(pagination.page + 1);
    };

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(() => {
        ticking = false;
        maybeLoadMore();
      });
    };

    container.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      container.removeEventListener("scroll", onScroll);
    };
  }, [
    isInfiniteMode,
    pagination.hasNextPage,
    pagination.page,
    performance?.infiniteScrollThresholdPx,
    setPage,
    tableLoading,
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
    <div className="flex h-full w-full max-w-full min-w-0 flex-col overflow-hidden">
      <div className="flex-1 min-h-0 min-w-0 overflow-y-auto">
        <div className="flex min-h-full min-w-0 flex-col gap-4">
          {children}
          <div className={hideTableOnMobile ? "hidden md:block" : undefined}>
            <Card className="flex h-full min-h-0 flex-col overflow-hidden border shadow-sm">
              <CardContent
                ref={tableScrollRef}
                className={`flex-1 min-h-0 overflow-auto p-0 ${view?.maxBodyHeightClassName ?? "max-h-[70vh]"}`}
              >
                <DndContext
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <TableFrame className="w-full">
                    <SortableContext
                      items={sortableColumnIds}
                      strategy={horizontalListSortingStrategy}
                    >
                      <TableHeader
                        actionsLabel={tableConfig?.actionsLabel}
                        columns={columnDefs ?? undefined}
                        columnOrdering={columnOrdering}
                        disableSorting={disableSorting}
                        enableSelection={enableSelection}
                      />
                    </SortableContext>
                    <TableBody>
                      <TableRows
                        emptyState={tableConfig?.emptyState}
                        loadingText={tableConfig?.loadingText}
                        columns={columnDefs ?? undefined}
                        enableSelection={enableSelection}
                        refetch={refetch}
                        performance={performance}
                        scrollContainerRef={tableScrollRef}
                        infiniteMode={isInfiniteMode}
                      />
                    </TableBody>
                  </TableFrame>
                </DndContext>
              </CardContent>
            </Card>
          </div>
          {isInfiniteMode ? (
            <div className="mt-3 rounded-lg border bg-card/95 px-3 py-2 text-xs text-muted-foreground">
              <span>
                {pagination.totalKnown
                  ? `${data.length} sur ${pagination.total} ligne(s) chargee(s)`
                  : `${data.length} ligne(s) chargee(s)`}
              </span>
              {tableLoading ? (
                <span className="ml-2 inline-flex items-center gap-1">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Chargement...
                </span>
              ) : pagination.hasNextPage ? (
                <span className="ml-2">Defilez pour charger plus</span>
              ) : (
                <span className="ml-2">Fin des resultats</span>
              )}
            </div>
          ) : (
            <TablePagination
              labels={tableConfig?.paginationLabels}
              enableSelection={enableSelection}
            />
          )}
          {dataError && (
            <div className="text-sm text-red-500 px-2">
              Erreur de chargement des donnees : {dataError.message}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export interface BaseModelTableProps {
  app: string;
  model: string;
  className?: string;
  persistenceKey?: string;
  quickSearch?: boolean;
  topActions?: ModelTableV2TopActionsInput;
  children?: React.ReactNode;
  tableConfig?: ModelTableV2TableConfig;
  view?: ModelTableV2ViewOptions;
  performance?: ModelTableV2PerformanceOptions;
  hideTableOnMobile?: boolean;
  fields?: BaseModelTableFieldsInput;
  relations?: Record<string, BaseModelTableRelationConfig>;
  columnOrdering?: BaseModelTableColumnOrderingConfig;
  skipCount?: boolean;
  disableSorting?: boolean;
  enableSelection?: boolean;
}

export function BaseModelTable({
  app,
  model,
  className,
  persistenceKey,
  children,
  tableConfig,
  view,
  performance,
  hideTableOnMobile,
  fields,
  relations,
  columnOrdering,
  skipCount,
  disableSorting,
  enableSelection = false,
}: BaseModelTableProps) {
  const tableInstanceKey = `${app}:${model}`;

  return (
    <div className={className ? `h-full w-full ${className}` : "h-full w-full"}>
      <MetadataProvider key={tableInstanceKey} app={app} model={model}>
        <TableProvider
          initialState={{
            density: view?.defaultDensity ?? "comfortable",
            wrapCells: view?.defaultWrapCells ?? false,
          }}
        >
          <BaseTableContent
            persistenceKey={persistenceKey}
            tableConfig={tableConfig}
            view={view}
            performance={performance}
            hideTableOnMobile={hideTableOnMobile}
            fields={fields}
            relations={relations}
            columnOrdering={columnOrdering}
            skipCount={skipCount}
            disableSorting={disableSorting}
            enableSelection={enableSelection}
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
      tableConfig={baseTable?.tableConfig}
      view={baseTable?.view}
      performance={baseTable?.performance}
      hideTableOnMobile={baseTable?.hideTableOnMobile ?? true}
      fields={baseTable?.fields}
      relations={baseTable?.relations}
      columnOrdering={baseTable?.columnOrdering}
      skipCount={baseTable?.skipCount}
      disableSorting={baseTable?.disableSorting}
      enableSelection={baseTable?.enableSelection}
    >
      <ModelTableV2Content
        filterPanel={filterPanel}
        tableConfig={baseTable?.tableConfig}
        quickSearch={baseTable?.quickSearch ?? true}
        topActions={baseTable?.topActions}
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

