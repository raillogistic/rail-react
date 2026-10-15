const fs = require('fs');
const path = require('path');

const basePath = 'e:/Projects/PRIVATE/transtev/rail-react/src/widgets/model-table/components';
const contentPath = path.join(basePath, 'DynamicBaseTableContent.tsx');

let code = fs.readFileSync(contentPath, 'utf8');

// 1. Extract Top Shell
// We'll create DynamicTableTopShell.tsx
const topShellContent = `import React from "react";
import type { UseModelTableContentControllerReturn } from "./content/useModelTableContentController";

export interface DynamicTableTopShellProps<TSource extends object> {
  sectionVisibility: {
    header: boolean;
    topActions: boolean;
    toolbar: boolean;
    bulkActionsBar: boolean;
  };
  sectionController: UseModelTableContentControllerReturn<TSource>;
  selectedRows: any[];
  HeaderSlot: React.ComponentType<any>;
  TopActionsSlot: React.ComponentType<any>;
  ToolbarSlot: React.ComponentType<any>;
  BulkActionsBarSlot: React.ComponentType<any>;
  headerTopActionsSlot: React.ComponentType<any>;
}

export function DynamicTableTopShell<TSource extends object>({
  sectionVisibility,
  sectionController,
  selectedRows,
  HeaderSlot,
  TopActionsSlot,
  ToolbarSlot,
  BulkActionsBarSlot,
  headerTopActionsSlot,
}: DynamicTableTopShellProps<TSource>) {
  if (!sectionController.metadata) return null;

  return (
    <div className="flex w-full flex-col bg-background relative z-10 transition-colors">
      {(sectionVisibility.header || sectionVisibility.topActions) && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between px-2 py-4 gap-4">
          {sectionVisibility.header ? (
            <div className="flex-1 min-w-0">
              <HeaderSlot
                controller={sectionController}
                TopActionsComponent={headerTopActionsSlot}
              />
            </div>
          ) : (
            <div className="flex-1" />
          )}

          {!sectionVisibility.header && sectionVisibility.topActions && (
            <div className="flex items-center gap-2">
              <TopActionsSlot controller={sectionController} />
            </div>
          )}
        </div>
      )}

      {sectionVisibility.toolbar && (
        <div className="px-2 pb-3">
          <ToolbarSlot controller={sectionController} />
        </div>
      )}

      {sectionVisibility.bulkActionsBar && selectedRows.length > 0 && (
        <BulkActionsBarSlot controller={sectionController} />
      )}
    </div>
  );
}
`;

fs.writeFileSync(path.join(basePath, 'DynamicTableTopShell.tsx'), topShellContent);

// 2. Extract Desktop Grid
const desktopGridContent = `import React from "react";
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
`;

fs.writeFileSync(path.join(basePath, 'DynamicTableDesktopGrid.tsx'), desktopGridContent);

// 3. Update DynamicBaseTableContent.tsx
// Find where renderTopShell is or was. Wait, earlier script replaced it with `const renderTopShell = ...`.
// We will replace the whole component's return statement to use the new files.

// First inject imports at the top
const importsToAdd = \`
import { DynamicTableTopShell } from "./DynamicTableTopShell";
import { DynamicTableDesktopGrid } from "./DynamicTableDesktopGrid";
\`;

if (!code.includes('DynamicTableTopShell')) {
  code = importsToAdd + '\\n' + code;
}

// Remove the inline topContent
const topContentRegex = /const renderTopShell = \(\) => {[\s\S]*?};\n/g;
code = code.replace(topContentRegex, '');
const fallbackRegex = /const topContent = sectionController\.metadata \? \([\s\S]*?\) : null;\n/g;
code = code.replace(fallbackRegex, '');

// Replace the {topContent} or {renderTopShell()} tags in the JSX
code = code.replace(/\{\/\* Top Shell \*\/\}\\n.*\\n/, '{/* Top Shell */}\\n      <DynamicTableTopShell\\n        sectionVisibility={sectionVisibility}\\n        sectionController={sectionController}\\n        selectedRows={selectedRows}\\n        HeaderSlot={HeaderSlot}\\n        TopActionsSlot={TopActionsSlot}\\n        ToolbarSlot={ToolbarSlot}\\n        BulkActionsBarSlot={BulkActionsBarSlot}\\n        headerTopActionsSlot={headerTopActionsSlot}\\n      />');

// Replace Desktop Grid
const gridRegex = /\{\/\* Desktop Grid \*\/\}\n\s*<div\n\s*className=\{cn\(\n\s*"relative z-0 flex-1[\s\S]*?<\/div>\n\s*<\/div>/;
code = code.replace(gridRegex, \`{/* Desktop Grid */}
      <DynamicTableDesktopGrid
        hideTableOnMobile={hideTableOnMobile}
        tableScrollRef={tableScrollRef}
        data={data}
        dynamicColumns={dynamicColumns}
        resolveRowId={resolveRowId}
        primaryKey={primaryKey}
        tableLoading={tableLoading}
        tableConfig={tableConfig}
        dynamicState={dynamicState}
        handleStateChange={handleStateChange}
        handleOrderByChange={handleOrderByChange}
        handleRowSelectionChange={handleRowSelectionChange}
        handlePaginationChange={handlePaginationChange}
        expand={expand}
        features={features}
        refetch={refetch}
        update={update}
        detail={detail}
        pdfPreviewEnabled={pdfPreviewEnabled}
        handleTemplatePdfPreview={handleTemplatePdfPreview}
        columnActions={columnActions}
        pagination={pagination}
        isInfiniteMode={isInfiniteMode}
        setPage={setPage}
      />\`);

fs.writeFileSync(contentPath, code);
console.log('Successfully extracted components and refactored JSX return block.');
