/**
 * @file ModelTableTopActions.tsx
 * @description Composant affichant les actions principales en haut de la table de modèle,
 * telles que l'ajout d'élément, l'importation et l'exportation de données.
 */

import React, { useMemo } from "react";
import { Loader2, Download } from "lucide-react";
import { Button } from "@/shared/ui/kit/button";
import { cn } from "@/shared/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/ui/kit/tooltip";
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
  const is_icon_only = action.size === "icon" || action.key === "import";
  
  const has_mr2 = action.icon && React.isValidElement(action.icon) && ((action.icon.props as any)?.className as string | undefined)?.includes("mr-2");
  const action_icon = is_icon_only && has_mr2
    ? React.cloneElement(action.icon as React.ReactElement<any>, {
        className: ((action.icon as React.ReactElement<any>).props.className as string).replace("mr-2", "")
      })
    : action.icon;

  const button_element = (
    <Button
      key={action.key}
      variant={is_icon_only ? "secondary" : (action.variant ?? "outline")}
      size={is_icon_only ? "icon" : "sm"}
      className={cn(
        "h-9 font-bold uppercase tracking-wider text-[10px] shadow-none",
        action.key === "add" && "bg-primary text-primary-foreground hover:bg-primary/90 border-transparent",
        action.key === "import" && "bg-neutral-100 hover:bg-neutral-200/80 dark:bg-zinc-800 dark:hover:bg-zinc-700/80 text-muted-foreground hover:text-primary border-none rounded-lg",
        is_icon_only && action.key !== "import" && "bg-neutral-100 hover:bg-neutral-200/80 dark:bg-zinc-800 dark:hover:bg-zinc-700/80 text-muted-foreground hover:text-primary border-none rounded-lg",
        is_icon_only ? "w-9" : "px-4",
      )}
      disabled={action.disabled || controller.loading || is_action_loading}
      aria-busy={is_action_loading ? true : undefined}
      onClick={() => controller.handleTopActionClick(action)}
    >
      <span
        aria-hidden
        className={cn(
          "inline-flex h-4 w-4 shrink-0 items-center justify-center",
          is_icon_only ? "" : "mr-2",
        )}
      >
        {is_action_loading ? <Loader2 className="h-4 w-4" /> : action_icon ?? null}
      </span>
      {!is_icon_only && <span>{action.label}</span>}
    </Button>
  );

  if (is_icon_only) {
    const tooltip_text = action.disabled ? (action.disabledReason ?? action.label) : action.label;
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          {button_element}
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-xs">
          {tooltip_text}
        </TooltipContent>
      </Tooltip>
    );
  }

  return button_element;
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
    <Tooltip>
      <TooltipTrigger asChild>
        <span>
          <ModelTableExportDialog
            filterVariablesOverride={merged_filter_variables}
            labels={(controller.tableConfig as any)?.exportLabels}
            trigger={
              <Button
                variant="secondary"
                size="icon"
                className="h-9 w-9 bg-neutral-100 hover:bg-neutral-200/80 dark:bg-zinc-800 dark:hover:bg-zinc-700/80 text-muted-foreground hover:text-primary border-none rounded-lg transition-all active:scale-95 shadow-none"
              >
                <Download className="h-4 w-4" />
              </Button>
            }
          />
        </span>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="text-xs">
        Exporter les données
      </TooltipContent>
    </Tooltip>
  );

  return (
    <TooltipProvider delayDuration={200}>
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
    </TooltipProvider>
  );
}
