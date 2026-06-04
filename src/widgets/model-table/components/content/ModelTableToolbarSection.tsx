/**
 * @file ModelTableToolbarSection.tsx
 * @description Slot par défaut de la barre d'outils de la table de modèle.
 * Rend la `TableToolbar` avec la recherche rapide, les filtres avancés et,
 * le cas échéant, les actions principales (Ajouter, Export, Import) alignées
 * dans la même rangée via la prop `extraActions`.
 */

import React from "react";
import { TableToolbar } from "../TableToolbar";
import type {
  ModelTableFilterPanelProps,
  ModelTableV2TableConfig,
} from "../../config/types";
import type { ModelTableToolbarSlotProps } from "./types";

/**
 * Props du slot barre d'outils par défaut.
 */
type ModelTableToolbarSectionProps = ModelTableToolbarSlotProps;

/**
 * Rend la barre d'outils par défaut avec recherche rapide, filtres et actions
 * principales alignées.
 *
 * @param controller - Contrôleur de la section.
 * @param topActionsNode - Nœud React contenant les actions principales
 *   (Ajouter, Export, Import) à afficher à droite de la barre de recherche.
 */
export function ModelTableToolbarSection({
  controller,
  topActionsNode,
}: ModelTableToolbarSectionProps) {
  return (
    <TableToolbar
      filterPanel={controller.filterPanel as ModelTableFilterPanelProps | undefined}
      navFilters={controller.navFilters}
      queryManager={controller.queryManager}
      tableConfig={controller.tableConfig as ModelTableV2TableConfig | undefined}
      quickSearch={controller.quickSearch}
      quickFilters={controller.quickFilters}
      fields={controller.fields}
      showReversed={controller.showReversed}
      showCount={controller.showCount}
      extraActions={topActionsNode}
    />
  );
}
