import React from "react";
import type { ModelTableV2Props } from "../config/types";
import { BaseModelTable } from "./BaseModelTable";
import { ModelTableV2Content } from "./ModelTableV2Content";

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
      relationStats={baseTable?.relationStats}
      queryManager={baseTable?.queryManager}
      columnOrdering={baseTable?.columnOrdering}
      skipCount={baseTable?.skipCount}
      disableSorting={baseTable?.disableSorting}
      enableSelection={baseTable?.enableSelection}
      columnActions={baseTable?.columnActions}
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
