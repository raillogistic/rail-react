/**
 * @file DynamicTableTopShell.tsx
 * @description Coquille supérieure de la table dynamique : gère la disposition
 * du header, des actions principales, de la barre d'outils et de la barre
 * d'actions groupées.
 *
 * Lorsque la barre d'outils est visible, les actions principales (Ajouter,
 * Export, Import) sont rendues à l'intérieur de cette barre afin qu'elles
 * soient alignées avec la recherche rapide et le bouton de filtres.
 * Lorsque la barre d'outils n'est PAS visible, les actions restent dans la
 * rangée du header (comportement précédent).
 */

import React from "react";

/** Props du composant DynamicTableTopShell. */
export interface DynamicTableTopShellProps<TSource extends object> {
  /** Visibilité des différentes sections de la table. */
  sectionVisibility: {
    header: boolean;
    topActions: boolean;
    toolbar: boolean;
    bulkActionsBar: boolean;
  };
  /** Contrôleur de la section courante. */
  sectionController: any;
  /** Lignes sélectionnées (pour la barre d'actions groupées). */
  selectedRows: any[];
  /** Slot du header (titre, sous-titre). */
  HeaderSlot: React.ComponentType<any>;
  /** Slot des actions principales (Ajouter, Export, Import). */
  TopActionsSlot: React.ComponentType<any>;
  /** Slot de la barre d'outils (recherche, filtres). */
  ToolbarSlot: React.ComponentType<any>;
  /** Slot de la barre d'actions groupées. */
  BulkActionsBarSlot: React.ComponentType<any>;
  /**
   * Slot transmis au header pour y afficher les actions principales.
   * Utilisé uniquement quand la barre d'outils n'est pas visible.
   */
  headerTopActionsSlot: React.ComponentType<any>;
}

/**
 * Coquille supérieure de la table dynamique.
 *
 * Stratégie de placement des actions principales :
 * - Si la barre d'outils est visible → les actions (Ajouter, Export, Import)
 *   sont injectées comme `topActionsNode` dans le `ToolbarSlot`, alignées
 *   avec la recherche rapide.
 * - Sinon → les actions restent dans la rangée du header (ancien comportement).
 */
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

  /**
   * Quand la barre d'outils est visible, les actions migrent dans celle-ci.
   * On pré-rend le nœud ici pour l'injecter via `topActionsNode`.
   */
  const topActionsNode =
    sectionVisibility.topActions && sectionVisibility.toolbar ? (
      <TopActionsSlot controller={sectionController} />
    ) : null;

  /**
   * Composant transmis au header : masqué quand les actions sont dans la
   * barre d'outils, visible sinon.
   */
  const HiddenActions: React.ComponentType<any> = () => null;
  const headerActionsSlot = sectionVisibility.toolbar
    ? HiddenActions
    : headerTopActionsSlot;

  // La rangée header est utile si le header est visible, OU si les actions
  // sont visibles mais PAS dans la barre d'outils.
  const showHeaderRow =
    sectionVisibility.header ||
    (sectionVisibility.topActions && !sectionVisibility.toolbar);

  return (
    <div className="flex w-full flex-col bg-background relative z-10 transition-colors">
      {showHeaderRow && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between px-2 py-4 gap-4">
          {sectionVisibility.header ? (
            <div className="flex-1 min-w-0">
              <HeaderSlot
                controller={sectionController}
                TopActionsComponent={headerActionsSlot}
              />
            </div>
          ) : (
            <div className="flex-1" />
          )}

          {/* Actions standalone — uniquement quand la toolbar n'est pas visible */}
          {!sectionVisibility.header &&
            sectionVisibility.topActions &&
            !sectionVisibility.toolbar && (
              <div className="flex items-center gap-2">
                <TopActionsSlot controller={sectionController} />
              </div>
            )}
        </div>
      )}

      {sectionVisibility.toolbar && (
        <div className="px-2 pb-3">
          <ToolbarSlot
            controller={sectionController}
            topActionsNode={topActionsNode}
          />
        </div>
      )}

      {sectionVisibility.bulkActionsBar && selectedRows.length > 0 && (
        <BulkActionsBarSlot controller={sectionController} />
      )}
    </div>
  );
}
