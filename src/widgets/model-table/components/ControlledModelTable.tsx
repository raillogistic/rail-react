/** Read-only DynamicModelTable presentation over an explicitly authorized data source. */
import { useImperativeHandle, type ForwardedRef, type ReactNode } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/shared/ui/kit/button";
import { DynamicTable, DynamicTablePagination } from "../dynamic-table";
import { useDynamicTableState } from "../dynamic-table/state/useDynamicTableState";
import { normalizeBaseModelTableFieldsInput } from "../utils";
import { resolveValueOptimized } from "../utils/valueResolution";
import { ModelTableMobileRecord } from "./TableMobileCard";
import { ModelTableDataErrorDisplay, ModelTableLoadingSkeleton } from "./content/ModelTableFeedback";
import type { ModelTableV2Props, DynamicModelTableHandle, DynamicModelTableSnapshot, ModelTableDataSource } from "../config/types";
import type { DynamicModelTableRow } from "../types";

/** Never infer fields, capabilities, exports or mutations from projection records. */
export function ControlledModelTable<TSource extends object>({ dataSource, baseTable, toolbar, tableRef }: ModelTableV2Props<TSource> & {
  dataSource: ModelTableDataSource<TSource>; toolbar?: ReactNode; tableRef: ForwardedRef<DynamicModelTableHandle<TSource>>;
}) {
  const config = normalizeBaseModelTableFieldsInput(baseTable?.fields);
  const fields = [...(config.include ?? []), ...(config.add ?? [])].filter(field => !config.exclude.includes(typeof field === "string" ? field : field.accessor));
  if (!fields.length) throw new Error("Controlled DynamicModelTable requires explicit fields.");
  const rows = dataSource.rows as DynamicModelTableRow<TSource>[];
  const paging = dataSource.pagination;
  const pageSize = paging?.pageSize ?? Math.max(1, rows.length);
  const pageCount = Math.max(1, Math.ceil((paging?.total ?? rows.length) / pageSize));
  const pagination = useDynamicTableState({
    state: { pagination: { pageIndex: (paging?.page ?? 1) - 1, pageSize } },
    onPaginationChange: next => paging?.onPageChange(next.pageIndex + 1),
  });
  const snapshot: DynamicModelTableSnapshot<TSource> = {
    data: rows, selectedRows: [], rowSelection: {}, loading: !!dataSource.loading,
    metadataLoading: false, dataError: dataSource.error ?? null, metadataError: null, metadata: null,
    pagination: paging ? { page: paging.page, perPage: pageSize, total: paging.total, numPages: pageCount,
      totalKnown: true, hasNextPage: paging.hasNext, hasPreviousPage: paging.page > 1 } : null,
  };
  useImperativeHandle(tableRef, () => ({ ...snapshot, getSnapshot: () => snapshot, refetch: () => Promise.resolve(dataSource.refetch?.()) }));
  const columns = fields.map(field => {
    const accessor = typeof field === "string" ? field : field.accessor;
    const title = typeof field === "string" ? field : field.title ?? accessor;
    return { id: accessor, title, accessorFn: (row: DynamicModelTableRow<TSource>) => resolveValueOptimized(row, accessor.split(".")),
      headerMode: "custom" as const, enableSorting: false, enableGrouping: false,
      cell: ({ row }: { row: DynamicModelTableRow<TSource> }): ReactNode => {
        const value = resolveValueOptimized(row, accessor.split("."));
        const render = typeof field === "string" || !("render" in field) ? undefined : field.render;
        return render ? render(value, row, { accessor, columnId: accessor, data: rows, refetch: () => Promise.resolve(dataSource.refetch?.()) })
          : config.render[accessor] ? config.render[accessor](value, row, rows, () => Promise.resolve(dataSource.refetch?.()))
          : value == null || value === "" ? "—" : String(value);
      } };
  });
  const renderActions = (row: DynamicModelTableRow<TSource>) => {
    const context = { row, data: rows, refetch: () => Promise.resolve(dataSource.refetch?.()) };
    const actions = typeof baseTable?.columnActions === "function" ? baseTable.columnActions(context) : baseTable?.columnActions;
    return actions?.map((action, index) => "render" in action
      ? <span key={action.key ?? index}>{action.render(context)}</span>
      : <Button type="button" variant="outline" key={action.key ?? index} disabled={action.disabled} onClick={() => void action.onClick(context)}>{action.icon}{action.label}</Button>);
  };
  const hasActions = !!baseTable?.columnActions;
  const desktopColumns = hasActions ? [...columns, { id: "__actions", title: "Actions", headerMode: "custom" as const,
    enableSorting: false, cell: ({ row }: { row: DynamicModelTableRow<TSource> }) => <div className="flex flex-wrap gap-2">{renderActions(row)}</div> }] : columns;
  const emptyText = baseTable?.tableConfig?.emptyState ?? "Aucun résultat.";
  return <div data-slot="model-table" className={`min-w-0 space-y-4 ${baseTable?.className ?? ""}`}>
    {(toolbar || dataSource.refetch) && <div className="space-y-3" aria-label="Outils du tableau">{toolbar}
      {dataSource.refetch && <Button type="button" variant="outline" disabled={dataSource.loading} onClick={() => void dataSource.refetch?.()}><RefreshCw className="size-4" />Actualiser le tableau</Button>}
    </div>}
    {dataSource.error ? <div role="alert"><ModelTableDataErrorDisplay error={dataSource.error} />{dataSource.refetch && <Button type="button" onClick={() => void dataSource.refetch?.()}>Réessayer</Button>}</div>
      : dataSource.loading ? <ModelTableLoadingSkeleton text={baseTable?.tableConfig?.loadingText} /> : rows.length === 0 ? <p role="status" className="rounded-lg border p-8 text-center text-sm text-muted-foreground">{emptyText}</p> : <>
        <div className="hidden md:block"><DynamicTable rows={rows} columns={desktopColumns} getRowId={row => String(row.id)}
          paginationMode="server" sortMode="server" defaultState={{ density: "comfortable", wrapCells: true }}
          features={{ enablePagination: false, enableSelection: false, enableGrouping: false }} /></div>
        <div className="grid gap-3 md:hidden">{rows.map(row => <ModelTableMobileRecord key={String(row.id)} title={columns[0].cell({ row })}
          actions={hasActions ? <div className="flex flex-wrap gap-2">{renderActions(row)}</div> : undefined}
          fields={columns.slice(1).map(column => ({ key: column.id, label: column.title, value: column.cell({ row }) }))} />)}</div>
      </>}
    {paging && <DynamicTablePagination state={pagination} totalRows={paging.total} pageCount={pageCount}
      hasNextPage={paging.hasNext} hasPreviousPage={paging.page > 1} mode="server" pageSizeOptions={[pageSize]} disabled={dataSource.loading || !!dataSource.error} />}
  </div>;
}
