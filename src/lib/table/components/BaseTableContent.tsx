import React, { useMemo, useRef, useEffect } from "react";
import { DndContext, closestCenter } from "@dnd-kit/core";
import { SortableContext, horizontalListSortingStrategy } from "@dnd-kit/sortable";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthContext } from "@/auth/context";
import { useMetadata } from "../context/MetadataContext";
import { useTable } from "../context/TableContext";
import {
  useTablePersistence,
  loadPersistedTableState,
  decodeTableConfigs,
} from "../hooks/useTablePersistence";
import { useTableData } from "../hooks/useTableData";
import { useTableColumns } from "../hooks/useTableColumns";
import { useTableLayout } from "../hooks/useTableLayout";
import { useTableQueryConfig } from "../hooks/useTableQueryConfig";
import { TableHeader } from "./TableHeader";
import { TableRows } from "./TableRow";
import { TablePagination } from "./TablePagination";
import { TableMobileCard } from "./TableMobileCard";
import { TableFrame, TableBody } from "./TableFrame";
import type {
  BaseModelTableColumnActionsInput,
  BaseModelTableFieldsInput,
  BaseModelTableColumnOrderingConfig,
  BaseModelTableRelationConfig,
  BaseModelTableRelationStatsConfig,
} from "../types";
import { getDefaultHiddenColumnIds } from "../utils";
import type {
  ModelTableV2PerformanceOptions,
  ModelTableV2TableConfig,
  ModelTableV2ViewOptions,
} from "../config/types";

type BaseTableContentProps = {
  persistenceKey?: string;
  children?: React.ReactNode;
  tableConfig?: ModelTableV2TableConfig;
  view?: ModelTableV2ViewOptions;
  performance?: ModelTableV2PerformanceOptions;
  hideTableOnMobile?: boolean;
  fields?: BaseModelTableFieldsInput;
  relations?: Record<string, BaseModelTableRelationConfig>;
  relationStats?: BaseModelTableRelationStatsConfig;
  queryManager?: string;
  columnOrdering?: BaseModelTableColumnOrderingConfig;
  skipCount?: boolean;
  disableSorting?: boolean;
  enableSelection?: boolean;
  columnActions?: BaseModelTableColumnActionsInput;
};

/**
 * Extracts the backend permission codename from a GraphQL error message.
 */
function extractPermissionCodeFromMessage(message: string): string | null {
  const match = message.match(/Permission required:\s*([a-z0-9_.-]+)/i);
  return match?.[1] ?? null;
}

/**
 * Converts technical GraphQL errors into user-facing French messages.
 */
function localizeTableErrorMessage(error: Error): string {
  const rawMessage = error.message || "Une erreur est survenue.";
  const permissionCode = extractPermissionCodeFromMessage(rawMessage);
  if (permissionCode) {
    return `Acces refuse : permission requise (${permissionCode}).`;
  }
  return rawMessage;
}

export function BaseTableContent({
  persistenceKey,
  children,
  tableConfig,
  performance,
  hideTableOnMobile,
  fields,
  relations,
  relationStats,
  queryManager,
  columnOrdering,
  skipCount,
  disableSorting,
  enableSelection,
  columnActions,
}: BaseTableContentProps) {
  const { user } = useAuthContext();
  const {
    metadata,
    loading: metadataLoading,
    error: metadataError,
    app,
    model,
  } = useMetadata();
  const {
    columnVisibility,
    loading: tableLoading,
    data,
    setPage,
    pagination,
    error: dataError,
  } = useTable();
  const tableScrollRef = useRef<HTMLDivElement>(null);
  const isInfiniteMode = performance?.dataMode === "infinite";

  const locationPath = typeof window !== "undefined" ? window.location.pathname : "";
  const effectiveKey = persistenceKey || `${app}-${model}-${locationPath}`;
  useTablePersistence(effectiveKey);

  // Persistence Seed & Hydration
  const userTableConfigs = useMemo(() => {
    const settings = user?.settings as { table_configs?: unknown; tableConfigs?: unknown } | undefined;
    return decodeTableConfigs(settings?.table_configs ?? settings?.tableConfigs ?? null);
  }, [user?.settings]);

  const persistedStateRef = useRef<ReturnType<typeof loadPersistedTableState> | null>(null);
  const currentUserId = user?.id ? String(user.id) : null;

  // Sync load persisted state
  const persistedState = useMemo(() => {
    const state = loadPersistedTableState(effectiveKey, userTableConfigs, { allowLocalFallback: true });
    persistedStateRef.current = state;
    return state;
  }, [effectiveKey, userTableConfigs, currentUserId]);

  // Column Definitions
  const { columnDefs, normalizedFieldsConfig, excludedAccessors } = useTableColumns({
    metadata,
    fields,
    relations,
    columnVisibility,
    persistedVisibility: persistedState?.columnVisibility,
  });

  // Default Hidden Columns
  const defaultHiddenColumnIds = useMemo(() => {
    if (normalizedFieldsConfig.include !== undefined) return new Set<string>();
    const hidden = getDefaultHiddenColumnIds(metadata);
    // Remove explicitly added accessors from hidden set
    normalizedFieldsConfig.add.forEach((entry: any) => {
      const root = entry.accessor.split(".")[0].split("__")[0];
      hidden.delete(root);
      hidden.delete(entry.accessor);
    });
    return hidden;
  }, [normalizedFieldsConfig, metadata]);

  // Query Configuration
  const { queryConfig, queryVisibleAccessors } = useTableQueryConfig({
    fields,
    relations,
    queryManager,
    skipCount,
    performance,
    normalizedFieldsConfig,
    excludedAccessors,
    defaultHiddenColumnIds,
    persistedVisibility: persistedState?.columnVisibility,
  });

  const { refetch } = useTableData(queryConfig);

  // Layout & Order
  const { sortableColumnIds, handleDragEnd } = useTableLayout({
    columnDefs,
    columnOrdering,
    defaultHiddenColumnIds,
    persistedState,
  });

  const resolvedEnableSelection = useMemo(() => {
    if (enableSelection) return true;
    return (metadata?.templates ?? []).length > 0;
  }, [enableSelection, metadata?.templates]);

  // Infinite Scroll Logic
  useEffect(() => {
    if (!isInfiniteMode) return;
    const container = tableScrollRef.current;
    if (!container) return;

    const threshold = performance?.infiniteScrollThresholdPx ?? 200;
    let ticking = false;

    const maybeLoadMore = () => {
      if (tableLoading || !pagination.hasNextPage) return;
      const distanceToBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
      if (distanceToBottom <= threshold) {
        setPage(pagination.page + 1);
      }
    };

    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        window.requestAnimationFrame(() => {
          ticking = false;
          maybeLoadMore();
        });
      }
    };

    container.addEventListener("scroll", onScroll, { passive: true });
    return () => container.removeEventListener("scroll", onScroll);
  }, [isInfiniteMode, pagination.hasNextPage, pagination.page, performance, setPage, tableLoading]);

  if (metadataLoading) return <LoadingSkeleton />;
  if (metadataError) return <ErrorState error={metadataError} />;

  return (
    <div className="flex h-full w-full max-w-full min-w-0 flex-col overflow-hidden animate-in fade-in duration-700 p-1 sm:p-2">
      <div className="flex-none">{children}</div>

      {hideTableOnMobile && (
        <div className="flex-1 min-h-0 min-w-0 my-2 md:hidden">
          <TableMobileCard emptyState={tableConfig?.emptyState} refetch={refetch} columnActions={columnActions} />
        </div>
      )}

      <div className={cn("flex-1 min-h-0 min-w-0 transition-all duration-300 my-2", hideTableOnMobile ? "hidden md:block" : "block")}>
        <div className="group/frame relative flex h-full flex-col overflow-hidden rounded-[1.25rem] border border-border/40 bg-card/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-xl transition-all duration-500 hover:shadow-[0_8px_40px_rgb(0,0,0,0.08)] hover:border-border/60">
          <div className="flex-1 min-h-0 overflow-auto scroll-smooth custom-scrollbar" ref={tableScrollRef}>
            <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <TableFrame className="w-full relative border-separate border-spacing-0">
                <SortableContext items={sortableColumnIds} strategy={horizontalListSortingStrategy}>
                  <TableHeader
                    actionsLabel={tableConfig?.actionsLabel}
                    columns={columnDefs ?? undefined}
                    columnOrdering={columnOrdering}
                    disableSorting={disableSorting}
                    enableSelection={resolvedEnableSelection}
                  />
                </SortableContext>
                <TableBody>
                  <TableRows
                    emptyState={tableConfig?.emptyState}
                    loadingText={tableConfig?.loadingText}
                    columns={columnDefs ?? undefined}
                    enableSelection={resolvedEnableSelection}
                    refetch={refetch}
                    columnActions={columnActions}
                    relationStats={relationStats}
                    queryManager={queryManager}
                    performance={performance}
                    scrollContainerRef={tableScrollRef}
                    infiniteMode={isInfiniteMode}
                  />
                </TableBody>
              </TableFrame>
            </DndContext>
          </div>

          {isInfiniteMode && <InfiniteScrollFooter loading={tableLoading} pagination={pagination} dataLength={data.length} />}
        </div>
      </div>

      {!isInfiniteMode && <TablePagination labels={tableConfig?.paginationLabels} enableSelection={resolvedEnableSelection} />}
      
      {dataError && <DataErrorDisplay error={dataError} />}
    </div>
  );
}

// Sub-components for cleaner main component
function LoadingSkeleton() {
  return (
    <div className="flex h-[400px] w-full flex-col gap-4 p-4 animate-in fade-in duration-500" role="status">
      <div className="flex items-center justify-between">
        <div className="h-10 w-64 animate-pulse rounded-lg bg-muted/40" />
        <div className="flex gap-2">
          <div className="h-10 w-24 animate-pulse rounded-lg bg-muted/40" />
          <div className="h-10 w-24 animate-pulse rounded-lg bg-muted/40" />
        </div>
      </div>
      <div className="flex-1 rounded-xl border border-border/40 bg-card/30 backdrop-blur-sm p-1">
        <div className="h-12 w-full animate-pulse rounded-t-lg bg-muted/60" />
        {[...Array(6)].map((_, i) => (
          <div key={i} className="flex gap-4 p-4 border-b border-border/10">
            <div className="h-4 w-4 animate-pulse rounded bg-muted/40" />
            <div className="h-4 flex-1 animate-pulse rounded bg-muted/30" />
            <div className="h-4 w-24 animate-pulse rounded bg-muted/30" />
          </div>
        ))}
      </div>
    </div>
  );
}

function ErrorState({ error }: { error: Error }) {
  return (
    <div className="flex h-[400px] items-center justify-center p-8">
      <div className="max-w-md w-full rounded-2xl border border-red-200 bg-red-50/30 p-8 text-center backdrop-blur-sm animate-in zoom-in-95 duration-300">
        <h3 className="mb-2 text-lg font-bold text-red-900">Erreur de métadonnées</h3>
        <p className="text-sm text-red-700/80 mb-6">{localizeTableErrorMessage(error)}</p>
        <button onClick={() => window.location.reload()} className="rounded-full bg-red-600 px-6 py-2 text-sm font-semibold text-white shadow-lg">Réessayer</button>
      </div>
    </div>
  );
}

function InfiniteScrollFooter({ loading, pagination, dataLength }: { loading: boolean, pagination: any, dataLength: number }) {
  return (
    <div className="mt-auto flex items-center justify-between border-t border-border/30 bg-muted/10 px-6 py-3 text-xs font-medium text-muted-foreground/80 backdrop-blur-md">
      <div className="flex items-center gap-2">
        <div className="h-1.5 w-1.5 rounded-full bg-primary/40 animate-pulse" />
        <span>{pagination.totalKnown ? `${dataLength} sur ${pagination.total} éléments` : `${dataLength} éléments chargés`}</span>
      </div>
      {loading ? (
        <span className="inline-flex items-center gap-2 text-primary font-bold"><Loader2 className="h-3.5 w-3.5 animate-spin" />Chargement...</span>
      ) : pagination.hasNextPage ? (
        <span className="opacity-60 flex items-center gap-1.5">Défilez pour plus</span>
      ) : (
        <span className="opacity-40 uppercase tracking-widest text-[10px]">Fin de liste</span>
      )}
    </div>
  );
}

function DataErrorDisplay({ error }: { error: Error }) {
  return (
    <div className="flex-none flex items-center gap-2 rounded-lg bg-red-50/50 border border-red-100 px-4 py-2 text-xs font-semibold text-red-600 mt-2">
      Erreur de données : {localizeTableErrorMessage(error)}
    </div>
  );
}
