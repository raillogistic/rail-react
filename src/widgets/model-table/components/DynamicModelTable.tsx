import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import type {
  ColumnSizingState,
  ExpandedState,
  PaginationState as DynamicPaginationState,
  RowSelectionState,
  VisibilityState,
} from "@tanstack/react-table";
import {
  DynamicTable,
  DYNAMIC_TABLE_SELECTION_COLUMN_ID,
  type DynamicTableColumnInput,
} from "../dynamic-table";
import type { DynamicTableFeatureFlags } from "../dynamic-table";
import { MetadataProvider, useMetadata } from "../context/MetadataContext";
import { TableProvider, useTable } from "../context/TableContext";
import type {
  BaseModelTableColumnActionsInput,
  BaseModelTableColumnDef,
  BaseModelTableColumnOrderingConfig,
  BaseModelTableFieldsInput,
  BaseModelTableRefetch,
  BaseModelTableRelationConfig,
  BaseModelTableRelationStatsConfig,
  DynamicModelTableRow,
  FieldSchema,
  ModelTableAccessorPath,
  ModelTableRelationKey,
  RowMutationPermissions,
} from "../types";
import type {
  DynamicModelTableHandle,
  DynamicModelTableProps,
  DynamicModelTableSnapshot,
  ModelTableCreateConfig,
  ModelTableDetailConfig,
  ModelTableFilterPanelProps,
  ModelTableNavFiltersConfig,
  ModelTableUpdateConfig,
  ModelTableV2ExpandConfig,
  ModelTableV2TopActionsInput,
  ModelTableV2PerformanceOptions,
  ModelTableV2TableConfig,
  ModelTableV2ViewOptions,
} from "../config/types";
import {
  getNormalizedTablePersistenceKeys,
  loadPersistedTableState,
  markPendingTablePersistenceReset,
  type PersistedTableState,
  useTablePersistence,
} from "../hooks/useTablePersistence";
import {
  clearPersistedMetadataStore,
  getActiveMetadataUserKey,
} from "@/shared/api/graphql/graphql/metadata/persisted-cache";
import { useModelTableDevtools } from "../hooks/useModelTableDevtools";
import { useModelTablePdfPreview } from "../hooks/useModelTablePdfPreview";
import { useTableColumns } from "../hooks/useTableColumns";
import { useTableData } from "../hooks/useTableData";
import { useTableLayout } from "../hooks/useTableLayout";
import { useTableQueryConfig } from "../hooks/useTableQueryConfig";
import { useTableFilters } from "../hooks/useTableFilters";
import { ColumnFilter } from "./ColumnFilter";
import { ProtectedFileCell } from "./ProtectedFileCell";
import { RowActions } from "./row/RowActions";
import {
  useModelTableContentController,
  type UseModelTableContentControllerInput,
} from "./content/useModelTableContentController";
import { ModelTableBulkActionsBar } from "./content/ModelTableBulkActionsBar";
import {
  ModelTableDataErrorDisplay,
  ModelTableLoadingSkeleton,
  ModelTableMetadataErrorState,
} from "./content/ModelTableFeedback";
import { ModelTableDialogs } from "./content/ModelTableDialogs";
import { ModelTableDevtoolsPanel } from "./content/ModelTableDevtoolsPanel";
import { ModelTableFooter } from "./content/ModelTableFooter";
import { ModelTableHeader } from "./content/ModelTableHeader";
import { ModelTablePdfPreviewDialog } from "./content/ModelTablePdfPreviewDialog";
import { ModelTableToolbarSection } from "./content/ModelTableToolbarSection";
import { ModelTableTopActions } from "./content/ModelTableTopActions";
import type {
  ModelTableBulkActionsBarSlotProps,
  ModelTableContentConfig,
  ModelTableDialogsSlotProps,
  ModelTableFooterSlotProps,
  ModelTableHeaderSlotProps,
  ModelTableTopActionsSlotProps,
  ModelTableToolbarSlotProps,
} from "./content/types";
import {
  RelationStatsHover,
  type StatsRelationMeta,
} from "./row/RelationStatsHover";
import { TableColumnMenu } from "./TableColumnMenu";
import { TableMobileCard } from "./TableMobileCard";
import { TablePagination } from "./TablePagination";
import {
  areBooleanMapsEqual,
  areNumberMapsEqual,
  areStringArraysEqual,
  buildPersistedStateFromBootstrap,
  collectExplicitFieldAccessors,
  collectIncludedFieldAccessors,
  extractMissingGraphqlField,
  formatFallbackCellValue,
  getSelectedRowIds,
  hasRecoverableTableBadRequest,
  isExpandedStateEqual,
  isPaginationStateEqual,
  isPersistedTableStateEqual,
  isRecord,
  mergeManagedFieldExclusions,
  normalizePdfUrl,
  resolveDevtoolsEnabled,
  resolveInitialTableState,
  resolveOrderByWithFallback,
  resolveRowId,
  resolveSectionVisibility,
  toOrderByEntries,
} from "./DynamicModelTable.shared";
import {
  formatCellValue,
  getDefaultHiddenColumnIds,
  getImplicitModelTableFieldExclusions,
  getSyntheticRelationCountSource,
  normalizeBaseModelTableFieldsInput,
  mergeModelTableQueryVariables,
  resolveInitialNavFilterSelections,
  resolveNavFilterVariables,
  toGraphqlFieldName,
} from "../utils";
import { cn } from "@/shared/utils";
import {
  buildAccessorPath,
  resolveValueOptimized,
} from "../utils/valueResolution";

/**
 * Internal props used by the dynamic-table powered content implementation.
 */
import { DynamicBaseTableContent } from "./DynamicBaseTableContent";
import type { DynamicBaseTableContentProps } from "./DynamicBaseTableContent";

const DynamicModelTableInner = <TSource extends object = Record<string, unknown>>(
  {
    app,
    model,
    filterPanel,
    create,
    update,
    detail,
    baseTable,
    navFilters,
    devtools,
    initVariables,
  }: DynamicModelTableProps<TSource>,
  ref: React.ForwardedRef<DynamicModelTableHandle<TSource>>,
) => {
  const tableInstanceKey = `${app}:${model}`;
  const locationPath =
    typeof window !== "undefined" ? window.location.pathname : "";
  const effectivePersistenceKey =
    baseTable?.persistenceKey || `${app}-${model}-${locationPath}`;
  const initialTableState = useMemo(
    () => resolveInitialTableState(initVariables),
    [initVariables],
  );
  const initialNavFilterSelections = useMemo(
    () => resolveInitialNavFilterSelections(navFilters),
    [navFilters],
  );
  const resolvedFilterPanel: ModelTableFilterPanelProps = {
    ...(filterPanel ?? {}),
    widthClassName: "!w-full lg:!w-1/2 sm:!max-w-none",
  };
  const normalizedBaseTableFields = useMemo(
    () => normalizeBaseModelTableFieldsInput(baseTable?.fields),
    [baseTable?.fields],
  );
  const baseTableIncludedFieldOrder = useMemo(
    () => collectIncludedFieldAccessors(normalizedBaseTableFields),
    [normalizedBaseTableFields],
  );
  const effectiveColumnOrdering = useMemo(() => {
    const explicitOrder = baseTable?.columnOrdering?.order;
    if (explicitOrder && explicitOrder.length > 0) {
      return baseTable.columnOrdering;
    }
    if (baseTableIncludedFieldOrder.length === 0) {
      return baseTable?.columnOrdering;
    }
    return {
      ...baseTable?.columnOrdering,
      order: baseTableIncludedFieldOrder,
    };
  }, [baseTable?.columnOrdering, baseTableIncludedFieldOrder]);
  const shouldHydratePersistedColumnOrder = useMemo(() => {
    const explicitOrder = baseTable?.columnOrdering?.order;
    if (explicitOrder && explicitOrder.length > 0) {
      return true;
    }
    return baseTableIncludedFieldOrder.length === 0;
  }, [baseTable?.columnOrdering?.order, baseTableIncludedFieldOrder.length]);
  const devtoolsEnabled = resolveDevtoolsEnabled(devtools);
  const refetchRef = useRef<BaseModelTableRefetch | undefined>(undefined);
  const snapshotRef = useRef<DynamicModelTableSnapshot<TSource>>({
    data: [],
    selectedRows: [],
    rowSelection: {},
    loading: false,
    metadataLoading: false,
    dataError: null,
    metadataError: null,
    metadata: null,
    pagination: null,
  });

  /**
   * Stores the latest refetch function provided by the table content.
   */
  const handleRefetchResolved = useCallback(
    (nextRefetch?: BaseModelTableRefetch) => {
      refetchRef.current = nextRefetch;
    },
    [],
  );
  /**
   * Stores the latest runtime snapshot provided by the table content.
   */
  const handleSnapshotResolved = useCallback(
    (nextSnapshot: DynamicModelTableSnapshot<TSource>) => {
      snapshotRef.current = nextSnapshot;
    },
    [],
  );

  useImperativeHandle(
    ref,
    () => ({
      refetch: (variables?: Record<string, unknown>) => {
        if (!refetchRef.current) {
          return Promise.resolve(undefined);
        }
        return refetchRef.current(variables);
      },
      getSnapshot: () => snapshotRef.current,
      get data() {
        return snapshotRef.current.data;
      },
      get selectedRows() {
        return snapshotRef.current.selectedRows;
      },
      get rowSelection() {
        return snapshotRef.current.rowSelection;
      },
      get loading() {
        return snapshotRef.current.loading;
      },
      get metadataLoading() {
        return snapshotRef.current.metadataLoading;
      },
      get dataError() {
        return snapshotRef.current.dataError;
      },
      get metadataError() {
        return snapshotRef.current.metadataError;
      },
      get metadata() {
        return snapshotRef.current.metadata;
      },
      get pagination() {
        return snapshotRef.current.pagination;
      },
    }),
    [],
  );

  return (
    <div
      data-slot="model-table"
      className={
        baseTable?.className
          ? `h-full w-full ${baseTable.className}`
          : "h-full w-full"
      }
      >
      <MetadataProvider
        key={tableInstanceKey}
        app={app}
        model={model}
        persistenceKey={effectivePersistenceKey}
      >
        <TableProvider
          initialState={{
            density: baseTable?.view?.defaultDensity ?? "compact",
            wrapCells: baseTable?.view?.defaultWrapCells ?? false,
            pagination: {
              page: initialTableState.page,
              perPage: initialTableState.perPage,
              total: 0,
              numPages: 0,
              totalKnown: true,
              hasNextPage: false,
              hasPreviousPage: false,
            },
            advancedFilters: initialTableState.advancedFilters,
            filterVariables: initialTableState.filterVariables,
            navFilterSelections: initialNavFilterSelections,
          }}
        >
          <DynamicBaseTableContent<TSource>
            persistenceKey={effectivePersistenceKey}
            navFilters={navFilters}
            filterPanel={resolvedFilterPanel}
            create={create}
            update={update}
            detail={detail}
            tableConfig={baseTable?.tableConfig}
            view={baseTable?.view}
            performance={baseTable?.performance}
            quickSearch={baseTable?.quickSearch ?? true}
            quickFilters={baseTable?.quickFilters}
            topActions={baseTable?.topActions}
            content={baseTable?.content}
            hideTableOnMobile={baseTable?.hideTableOnMobile ?? true}
            fields={baseTable?.fields}
            showReversed={baseTable?.showReversed}
            showCount={baseTable?.showCount}
            relations={baseTable?.relations}
            relationStats={baseTable?.relationStats}
            queryManager={baseTable?.queryManager}
            columnOrdering={
              effectiveColumnOrdering as BaseModelTableColumnOrderingConfig<ModelTableAccessorPath<TSource>>
            }
            hydratePersistedColumnOrder={shouldHydratePersistedColumnOrder}
            skipCount={baseTable?.skipCount ?? false}
            disableSorting={baseTable?.disableSorting}
            enableSelection={baseTable?.enableSelection}
            expand={baseTable?.expand}
            columnActions={baseTable?.columnActions}
            devtoolsEnabled={devtoolsEnabled}
            onRefetchResolved={handleRefetchResolved}
            onSnapshotResolved={handleSnapshotResolved}
          />
        </TableProvider>
      </MetadataProvider>
    </div>
  );
};

export const DynamicModelTable = forwardRef(DynamicModelTableInner) as <
  TSource extends object = Record<string, unknown>,
>(
  props: DynamicModelTableProps<TSource> &
    React.RefAttributes<DynamicModelTableHandle<TSource>>,
) => React.ReactElement | null;

(DynamicModelTable as { displayName?: string }).displayName = "DynamicModelTable";
