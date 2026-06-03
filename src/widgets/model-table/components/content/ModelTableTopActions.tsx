/**
 * @file ModelTableTopActions.tsx
 * @description Composant affichant les actions principales en haut de la table de modèle,
 * telles que l'ajout d'élément, l'importation et l'exportation de données.
 */

import React, { useMemo } from "react";
import { Loader2, Download } from "lucide-react";
import { Button } from "@/shared/ui/kit/button";
import { cn } from "@/shared/utils";
import type { ModelTableTopActionsSlotProps } from "./types";
import { ModelTableExportDialog } from "../ExportDialog";
import { useTable } from "../../context/TableContext";
import { mergeModelTableQueryVariables, resolveNavFilterVariables } from "../../utils";

/**
 * Propriétés du composant de bouton d'action principale.
 */
type TopActionButtonProps = {
  action: ModelTableTopActionsSlotProps["controller"]["resolvedTopActions"][number];
  controller: ModelTableTopActionsSlotProps["controller"];
};

/**
 * Rendu d'un bouton d'action principale individuelle.
 * 
 * @param props Propriétés du bouton
 * @returns Élément React
 */
function TopActionButton({ action, controller }: TopActionButtonProps) {
  const is_action_loading = Boolean(action.loading);
  return (
    <Button
      key={action.key}
      variant={action.variant ?? "outline"}
      size={action.size === "icon" ? "icon" : "sm"}
      title={action.disabled ? action.disabledReason : undefined}
      className={cn(
        "h-9 font-bold uppercase tracking-wider text-[10px]",
        action.key === "add" && "bg-primary text-primary-foreground hover:bg-primary/90 border-transparent",
        action.key === "import" && "bg-secondary text-secondary-foreground hover:bg-secondary/80 border-transparent",
        action.size === "icon" ? "w-9" : "px-4",
      )}
      disabled={action.disabled || controller.loading || is_action_loading}
      aria-busy={is_action_loading ? true : undefined}
      onClick={() => controller.handleTopActionClick(action)}
    >
      <span
        aria-hidden
        className={cn(
          "inline-flex h-4 w-4 shrink-0 items-center justify-center",
          action.size === "icon" ? "" : "mr-2",
        )}
      >
        {is_action_loading ? <Loader2 className="h-4 w-4" /> : action.icon ?? null}
      </span>
      {action.size !== "icon" && <span>{action.label}</span>}
    </Button>
  );
}

/**
 * Affiche le groupe d'actions principales pour les tables de modèle.
 * Intègre le bouton d'exportation de données à côté du bouton d'ajout (Ajouter).
 * 
 * @param props Propriétés du slot d'actions principales
 * @returns Élément React
 */
export function ModelTableTopActions({
  controller,
}: ModelTableTopActionsSlotProps) {
  const { filterVariables, navFilterSelections } = useTable();

  const merged_filter_variables = useMemo(
    () =>
      mergeModelTableQueryVariables(
        filterVariables,
        resolveNavFilterVariables(controller.navFilters, navFilterSelections),
      ),
    [filterVariables, navFilterSelections, controller.navFilters],
  );

  const has_add_action = useMemo(
    () => controller.resolvedTopActions.some((action) => action.key === "add"),
    [controller.resolvedTopActions]
  );

  const export_button = (
    <ModelTableExportDialog
      key="export"
      filterVariablesOverride={merged_filter_variables}
      labels={(controller.tableConfig as any)?.exportLabels}
      trigger={
        <Button
          variant="outline"
          size="sm"
          className="h-9 font-bold uppercase tracking-wider text-[10px] px-4"
        >
          <Download className="mr-2 h-4 w-4" />
          <span>Exporter</span>
        </Button>
      }
    />
  );

  return (
    <div className="flex items-center justify-end gap-2">
      {!has_add_action && export_button}
      {controller.resolvedTopActions.map((action) => {
        const btn = (
          <TopActionButton
            key={action.key}
            action={action}
            controller={controller}
          />
        );
        if (action.key === "add") {
          return (
            <React.Fragment key={action.key}>
              {btn}
              {export_button}
            </React.Fragment>
          );
        }
        return btn;
      })}
    </div>
  );
}
