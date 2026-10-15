/**
 * @file PageHeader.tsx
 * @description En-tête de page standardisé fournissant un titre (24px),
 * une description optionnelle (14px) et des actions optionnelles alignées à droite.
 * Sur mobile, les éléments s'empilent verticalement.
 *
 * @module shared/ui/common/PageHeader
 */

import React from "react";
import { cn } from "@/shared/utils";

/**
 * Propriétés du composant PageHeader.
 */
export interface PageHeaderProps {
  /**
   * Titre principal affiché dans l'en-tête de page (24px).
   */
  title: React.ReactNode;
  /**
   * Description ou sous-titre optionnel affiché sous le titre (14px).
   */
  description?: string;
  /**
   * Boutons ou composants d'actions optionnels alignés à droite (empilés sur mobile).
   */
  actions?: React.ReactNode;
  /**
   * Classes CSS additionnelles pour le conteneur d'en-tête.
   */
  className?: string;
}

/**
 * Composant d'en-tête de page standardisé pour l'application.
 *
 * @param {PageHeaderProps} props Les propriétés de l'en-tête.
 * @returns {React.ReactElement}
 */
export function PageHeader({
  title,
  description,
  actions,
  className,
}: PageHeaderProps): React.ReactElement {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between",
        className,
      )}
    >
      <div className="space-y-1 min-w-0">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {title}
        </h1>
        {description ? (
          <p className="text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {actions}
        </div>
      ) : null}
    </div>
  );
}

export default PageHeader;
