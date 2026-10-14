/**
 * @file DynamicModelTable.tsx
 * @description Composant de table de modèle dynamique fournissant des fonctionnalités d'affichage,
 * de filtrage, de pagination et d'actions pour les différents modèles de l'application.
 * Modifié pour définir la densité par défaut à "comfortable" (confortable).
 */

import React, { forwardRef, useCallback, useImperativeHandle, useMemo, useRef } from "react";
import { MetadataProvider } from "../context/MetadataContext";
import { TableProvider } from "../context/TableContext";
import type { BaseModelTableColumnOrderingConfig, BaseModelTableRefetch, ModelTableAccessorPath } from "../types";
import type { DynamicModelTableHandle, DynamicModelTableProps, DynamicModelTableSnapshot, ModelTableFilterPanelProps, ModelTableV2Props } from "../config/types";
import { collectIncludedFieldAccessors, resolveDevtoolsEnabled, resolveInitialTableState } from "./DynamicModelTable.shared";
import { normalizeBaseModelTableFieldsInput, resolveInitialNavFilterSelections } from "../utils";
import { DynamicBaseTableContent } from "./DynamicBaseTableContent";
import { ControlledModelTable } from "./ControlledModelTable";

const ModelQueryTableInner = <
  TSource extends object = Record<string, unknown>,
>(
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
          : "h-full w-full  "
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
            density: baseTable?.view?.defaultDensity ?? "comfortable",
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
              effectiveColumnOrdering as BaseModelTableColumnOrderingConfig<
                ModelTableAccessorPath<TSource>
              >
            }
            hydratePersistedColumnOrder={shouldHydratePersistedColumnOrder}
            skipCount={baseTable?.skipCount ?? false}
            disableSorting={baseTable?.disableSorting}
            enableSelection={baseTable?.enableSelection}
            expand={baseTable?.expand}
            columnActions={baseTable?.columnActions}
            customMutations={baseTable?.customMutations}
            devtoolsEnabled={devtoolsEnabled}
            onRefetchResolved={handleRefetchResolved}
            onSnapshotResolved={handleSnapshotResolved}
          />
        </TableProvider>
      </MetadataProvider>
    </div>
  );
};

const ModelQueryTable = forwardRef(ModelQueryTableInner) as <TSource extends object>(
  props: ModelTableV2Props<TSource> & React.RefAttributes<DynamicModelTableHandle<TSource>>,
) => React.ReactElement | null;

/** Controlled projections never mount metadata, generated-query or mutation providers. */
const DynamicModelTableInner = <TSource extends object = Record<string, unknown>>(
  props: DynamicModelTableProps<TSource>, ref: React.ForwardedRef<DynamicModelTableHandle<TSource>>,
) => props.dataSource
  ? <ControlledModelTable {...props} dataSource={props.dataSource} tableRef={ref} />
  : <ModelQueryTable {...props} ref={ref} />;

export const DynamicModelTable = forwardRef(DynamicModelTableInner) as <
  TSource extends object = Record<string, unknown>,
>(
  props: DynamicModelTableProps<TSource> &
    React.RefAttributes<DynamicModelTableHandle<TSource>>,
) => React.ReactElement | null;

(DynamicModelTable as { displayName?: string }).displayName =
  "DynamicModelTable";
