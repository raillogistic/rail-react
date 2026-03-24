import React from "react";
import { DynamicTable } from "../dynamic-table";
import { RowActions } from "./row/RowActions";
import { cn } from "@/shared/utils";

export interface DynamicTableDesktopGridProps {
  hideTableOnMobile?: boolean;
  tableScrollRef: React.RefObject<HTMLDivElement>;
  data: any[];
  dynamicColumns: any[];
  resolveRowId: (row: any, index: number, pk: string) => string;
  primaryKey: string;
  tableLoading: boolean;
  tableConfig: any;
  dynamicState: any;
  handleStateChange: any;
  handleOrderByChange: any;
  handleRowSelectionChange: any;
  handlePaginationChange: any;
  expand: any;
  features: any;
  refetch: any;
  update: any;
  detail: any;
  pdfPreviewEnabled: boolean;
  handleTemplatePdfPreview: any;
  columnActions: any;
  pagination: any;
  isInfiniteMode: boolean;
  setPage: (page: number) => void;
}

export function DynamicTableDesktopGrid({
  hideTableOnMobile,
  tableScrollRef,
  data,
  dynamicColumns,
  resolveRowId,
  primaryKey,
  tableLoading,
  tableConfig,
  dynamicState,
  handleStateChange,
  handleOrderByChange,
  handleRowSelectionChange,
  handlePaginationChange,
  expand,
  features,
  refetch,
  update,
  detail,
  pdfPreviewEnabled,
  handleTemplatePdfPreview,
  columnActions,
  pagination,
  isInfiniteMode,
  setPage,
}: DynamicTableDesktopGridProps) {
  return (
    <div
      className={cn(
        "relative z-0 flex-1 min-h-0 w-full overflow-hidden bg-background border-t border-border/40",
        hideTableOnMobile ? "hidden md:flex" : "flex flex-col",
      )}
    >
      <div
        ref={tableScrollRef}
        className="h-full w-full bg-background [&_.table-header]:bg-transparent [&_.table-header]:border-b-border/20 [&_.table-row]:border-b-border/10"
      >
        <DynamicTable
          className="h-full border-none"
          rows={data}
          columns={dynamicColumns}
          getRowId={(row, index) => resolveRowId(row, index, primaryKey)}
          loading={tableLoading}
          loadingText={tableConfig?.loadingText}
          emptyState={tableConfig?.emptyState ?? "Aucun resultat."}
          state={dynamicState}
          onStateChange={handleStateChange}
          onOrderByChange={handleOrderByChange}
          onRowSelectionChange={handleRowSelectionChange}
          onPaginationChange={handlePaginationChange}
          expand={expand}
          sortMode="server"
          paginationMode="server"
          features={features}
          layout={{
            containerClassName:
              "group/frame relative flex h-full flex-col overflow-hidden bg-transparent",
            stickySelectionColumn: false,
            actions: {
              headerLabel: tableConfig?.actionsLabel ?? "",
              sticky: true,
              headerClassName: "w-[1%] whitespace-nowrap pr-6 bg-transparent",
              cellClassName: "w-[1%] whitespace-nowrap pr-6 bg-background/50",
              renderCell: ({ row }) => (
                <RowActions
                  row={row}
                  data={data}
                  refetch={refetch}
                  permissions={row.rowPermissions}
                  columnActions={columnActions}
                  update={update}
                  detail={detail}
                  onTemplatePdfPreview={
                    pdfPreviewEnabled ? handleTemplatePdfPreview : undefined
                  }
                />
              ),
            },
          }}
          totalRows={pagination.totalKnown ? pagination.total : undefined}
          pageCount={pagination.totalKnown ? pagination.numPages : undefined}
          hasNextPage={pagination.hasNextPage}
          hasPreviousPage={pagination.hasPreviousPage}
          onLoadMore={() => {
            if (!isInfiniteMode || tableLoading || !pagination.hasNextPage) {
              return;
            }
            setPage(pagination.page + 1);
          }}
        />
      </div>
    </div>
  );
}
