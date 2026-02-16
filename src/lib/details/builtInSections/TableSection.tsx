import type { ColumnDef } from "@tanstack/react-table";
import type { SectionDefinition, SectionRuntimeCtx } from "../sectionTypes";
import TableDetail from "../components/TableDetail";

export type TableSectionData<TRecord = Record<string, unknown>> =
  | TRecord[]
  | {
      rows: TRecord[];
    };

export type TableSectionConfig<TRecord = Record<string, unknown>> = {
  id: string;
  title?: string;
  description?: string;
  order?: number;
  columns: ColumnDef<TRecord>[];
  rowKey?: (row: TRecord, index: number) => string;
  onRowClick?: (row: TRecord) => void;
  renderVirtualizedTable?: (args: {
    rows: TRecord[];
    columns: ColumnDef<TRecord>[];
  }) => React.ReactNode;
  enableQuickSearch?: boolean;
  enableSorting?: boolean;
  initialPageSize?: number;
  loadingStrategy?: "eager" | "lazy";
  permissions?: string[];
  visibleIf?: (ctx: SectionRuntimeCtx) => boolean;
  disabledIf?: SectionDefinition<TableSectionData<TRecord>>["disabledIf"];
  select?: (ctx: SectionRuntimeCtx) => TableSectionData<TRecord> | undefined;
  load?: SectionDefinition<TableSectionData<TRecord>>["load"];
  skeleton?: SectionDefinition<TableSectionData<TRecord>>["skeleton"];
  empty?: SectionDefinition<TableSectionData<TRecord>>["empty"];
  error?: SectionDefinition<TableSectionData<TRecord>>["error"];
  testId?: string;
};

function resolveRows<TRecord>(data: TableSectionData<TRecord> | undefined): TRecord[] {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  return Array.isArray(data.rows) ? data.rows : [];
}

export function createTableSection<TRecord = Record<string, unknown>>(
  config: TableSectionConfig<TRecord>,
): SectionDefinition<TableSectionData<TRecord>> {
  return {
    ...config,
    kind: "table",
    dataSource: "related",
    loadingStrategy: config.loadingStrategy ?? "lazy",
    render: ({ data }) => {
      const rows = resolveRows(data);
      if (config.renderVirtualizedTable) {
        return config.renderVirtualizedTable({
          rows,
          columns: config.columns,
        });
      }

      return (
        <TableDetail
          columns={config.columns as ColumnDef<unknown>[]}
          rows={rows as unknown[]}
          enable_quick_search={config.enableQuickSearch}
          enable_sorting={config.enableSorting}
          initial_page_size={config.initialPageSize}
        />
      );
    },
  };
}

export default createTableSection;
