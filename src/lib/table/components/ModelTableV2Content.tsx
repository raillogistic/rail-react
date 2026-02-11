import React from "react";
import { PlusCircle, Upload } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/lib/components/ui/button";
import { useMetadata } from "../context/MetadataContext";
import { useTable } from "../context/TableContext";
import { findMutation } from "../utils";
import { TableToolbar } from "./TableToolbar";
import type {
  ModelTableFilterPanelProps,
  ModelTableV2TableConfig,
  ModelTableV2TopAction,
  ModelTableV2TopActionsInput,
} from "../config/types";

type ModelTableV2ContentProps = {
  filterPanel?: ModelTableFilterPanelProps;
  tableConfig?: ModelTableV2TableConfig;
  quickSearch?: boolean;
  topActions?: ModelTableV2TopActionsInput;
};

export function ModelTableV2Content({
  filterPanel,
  tableConfig,
  quickSearch,
  topActions,
}: ModelTableV2ContentProps) {
  const { metadata, app, model } = useMetadata();
  const { data, rowSelection } = useTable();
  const navigate = useNavigate();
  const showTitle = tableConfig?.showTitle !== false;
  const resolvedTitle = tableConfig?.title || metadata?.verboseNamePlural || metadata?.model;

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
      label: tableConfig?.addLabel ?? "Ajouter",
      icon: <PlusCircle className="mr-2 h-4 w-4" />,
      variant: "default",
      size: "sm",
      order: -1,
      show_when: "always",
      on_click: () => {
        console.info("add item");
      },
    };
  }, [canCreate, tableConfig?.addLabel]);

  const importAction = React.useMemo<ModelTableV2TopAction>(() => {
    return {
      key: "import",
      label: "Importer",
      icon: <Upload className="mr-2 h-4 w-4" />,
      variant: "outline",
      size: "sm",
      order: 0,
      show_when: "always",
      on_click: () => {
        const params = new URLSearchParams({ app, model });
        navigate(`/model-import?${params.toString()}`);
      },
    };
  }, [app, model, navigate]);

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
    combined.unshift(importAction);
    if (addAction) {
      combined.unshift(addAction);
    }

    const hasSelection = selectedRows.length > 0;
    return combined
      .filter((action) => action.show_when !== "has_selection" || hasSelection)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }, [addAction, app, data, importAction, metadata, model, rowSelection, selectedRows, topActions]);

  return (
    <div className="flex flex-col gap-2 w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
        {showTitle && resolvedTitle && (
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-foreground">{resolvedTitle}</h1>
          </div>
        )}

        <div className="flex items-center gap-2 ml-auto">
          {resolvedTopActions.map((action) => (
            <Button
              key={action.key}
              variant={action.variant ?? "outline"}
              size={action.size === "icon" ? "icon" : "sm"}
              className={action.size === "icon" ? "h-8 w-8" : "h-8"}
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
      </div>

      <TableToolbar filterPanel={filterPanel} tableConfig={tableConfig} quickSearch={quickSearch} />
    </div>
  );
}
