/**
 * @file ActionsColumnHeaderButtons.tsx
 * @description Boutons d'Export et d'Import affichés dans l'en-tête de la colonne
 * Actions de la table. Ce composant lit les variables de filtre actives depuis le
 * contexte de table (useTable) et les infos du contrôleur pour pré-remplir les
 * dialogues d'export et déclencher l'import.
 */

import React, { useMemo } from "react";
import { Download, Upload } from "lucide-react";
import { Button } from "@/shared/ui/kit/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/ui/kit/tooltip";
import { cn } from "@/shared/utils";
import { ModelTableExportDialog } from "../ExportDialog";
import { useTable } from "../../context/TableContext";
import {
  mergeModelTableQueryVariables,
  resolveNavFilterVariables,
} from "../../utils";
import type { ModelTableContentControllerState } from "./types";

/**
 * Props du composant ActionsColumnHeaderButtons.
 */
type ActionsColumnHeaderButtonsProps<
  TSource extends object = Record<string, unknown>,
> = {
  /** Contrôleur de la section courante (accès aux actions, tableConfig…). */
  controller: ModelTableContentControllerState<TSource>;
  /**
   * Indique si l'en-tête de table a un fond primaire (couleur primaire du thème).
   * Utilisé pour adapter le style des boutons.
   */
  isPrimary?: boolean;
};

/**
 * Rendu des boutons d'Export et d'Import dans l'en-tête de la colonne Actions.
 *
 * - **Export** : ouvre le dialogue d'export avec les filtres actifs pré-remplis.
 * - **Import** : déclenche l'action d'import si elle est disponible dans les
 *   `resolvedTopActions` du contrôleur.
 *
 * @param controller - Contrôleur de la section.
 * @param isPrimary - Si vrai, les boutons utilisent le style pour fond primaire.
 */
export function ActionsColumnHeaderButtons<
  TSource extends object = Record<string, unknown>,
>({
  controller,
  isPrimary = true,
}: ActionsColumnHeaderButtonsProps<TSource>) {
  const { filterVariables, navFilterSelections } = useTable();

  const merged_filter_variables = useMemo(
    () =>
      mergeModelTableQueryVariables(
        filterVariables,
        resolveNavFilterVariables(controller.navFilters, navFilterSelections),
      ),
    [filterVariables, navFilterSelections, controller.navFilters],
  );

  const import_action = useMemo(
    () =>
      controller.resolvedTopActions.find((action) => action.key === "import"),
    [controller.resolvedTopActions],
  );

  /** Classes communes aux boutons icône de cet en-tête. */
  const btn_class = cn(
    "h-7 w-7 rounded-md border-none shadow-none transition-none focus-visible:ring-0",
    isPrimary
      ? "text-primary-foreground hover:bg-primary-foreground/10 hover:text-white"
      : "text-muted-foreground hover:bg-muted",
  );

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex items-center gap-0.5">
        {/* Bouton Export */}
        <Tooltip>
          <TooltipTrigger asChild>
            <span>
              <ModelTableExportDialog
                filterVariablesOverride={merged_filter_variables}
                labels={(controller.tableConfig as any)?.exportLabels}
                trigger={
                  <Button variant="ghost" size="icon" className={btn_class}>
                    <Download className="h-3.5 w-3.5" />
                  </Button>
                }
              />
            </span>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs">
            Exporter les données
          </TooltipContent>
        </Tooltip>

        {/* Bouton Import — uniquement si l'action est disponible */}
        {import_action && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={btn_class}
                disabled={import_action.disabled || controller.loading}
                onClick={() => controller.handleTopActionClick(import_action)}
              >
                <Upload className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              {import_action.disabled
                ? (import_action.disabledReason ?? import_action.label)
                : import_action.label}
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  );
}
