import React from "react";
import { MetadataProvider } from "../context/MetadataContext";
import { TableProvider } from "../context/TableContext";
import type { BaseModelTableProps } from "../config/types";
import { BaseTableContent } from "./BaseTableContent";

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
  relationStats,
  queryManager,
  columnOrdering,
  skipCount,
  disableSorting,
  enableSelection = false,
  columnActions,
}: BaseModelTableProps) {
  const tableInstanceKey = `${app}:${model}`;

  return (
    <div className={className ? `h-full w-full ${className}` : "h-full w-full"}>
      <MetadataProvider key={tableInstanceKey} app={app} model={model}>
        <TableProvider
          initialState={{
            density: view?.defaultDensity ?? "compact",
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
            relationStats={relationStats}
            queryManager={queryManager}
            columnOrdering={columnOrdering}
            skipCount={skipCount}
            disableSorting={disableSorting}
            enableSelection={enableSelection}
            columnActions={columnActions}
          >
            {children}
          </BaseTableContent>
        </TableProvider>
      </MetadataProvider>
    </div>
  );
}
