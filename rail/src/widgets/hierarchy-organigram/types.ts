/**
 * Types pour le composant HierarchyOrganigram.
 *
 * Définit l'interface de configuration du widget, incluant :
 * - Le modèle source (app/model)
 * - Les champs à afficher dans les nœuds
 * - La configuration du formulaire de création/édition
 * - L'état du viewport (pan & zoom)
 */
import type { ModelFormGeneratedSection, ModelFormFieldOverrides } from "@/widgets/model-form";
import type { ReactNode } from "react";

/**
 * Représentation interne d'un nœud de l'arbre hiérarchique.
 * Construit à partir de données plates contenant un champ `parent`.
 */
export interface TreeNode {
  /** Identifiant unique du nœud. */
  id: string | number;
  /** Libellé principal affiché dans le nœud. */
  label: string;
  /** Code secondaire affiché sous le libellé. */
  code: string;
  /** Badge optionnel (ex: niveau pour les localisations). */
  badge?: string;
  /** Indicateur d'activité. */
  isActive?: boolean;
  /** Enfants directs du nœud dans la hiérarchie. */
  children: TreeNode[];
  /** Données brutes du modèle. */
  raw: Record<string, unknown>;
}

/**
 * Configuration du formulaire ModelForm intégré dans la modale.
 */
export interface HierarchyOrganigramFormConfig<
  TValues extends Record<string, unknown> = Record<string, unknown>,
> {
  /** Sections générées pour le formulaire. */
  generatedSections?: ModelFormGeneratedSection<TValues>[];
  /** Overrides de champs pour le formulaire. */
  fieldOverrides?: ModelFormFieldOverrides<TValues>;
  /** Nom du champ parent pour pré-remplir lors d'un ajout enfant. */
  parentFieldName?: string;
}

/**
 * État de la modale de formulaire (création ou édition).
 */
export interface DialogState {
  open: boolean;
  mode: "CREATE" | "UPDATE";
  objectId?: string | number;
  parentId?: string | number;
  parentLabel?: string;
}

/**
 * État du viewport (pan & zoom) pour le canevas interactif.
 */
export interface ViewportState {
  /** Décalage horizontal en pixels. */
  x: number;
  /** Décalage vertical en pixels. */
  y: number;
  /** Facteur de zoom (1 = 100%). */
  scale: number;
}

/**
 * Statistiques calculées sur l'arbre pour affichage dans la barre de statut.
 */
export interface TreeStats {
  /** Nombre total de nœuds. */
  totalNodes: number;
  /** Nombre de nœuds racine. */
  rootNodes: number;
  /** Profondeur maximale de l'arbre. */
  maxDepth: number;
  /** Nombre de nœuds feuille (sans enfants). */
  leafNodes: number;
}

/**
 * Props du composant HierarchyOrganigram.
 */
export interface HierarchyOrganigramProps<
  TValues extends Record<string, unknown> = Record<string, unknown>,
> {
  /** Nom de l'application Django (ex: "referentials", "locations"). */
  app: string;
  /** Nom du modèle Django (ex: "Service", "Location"). */
  model: string;

  /** Champ du libellé principal. Par défaut : "name". */
  labelField?: string;
  /** Champ du code. Par défaut : "code". */
  codeField?: string;
  /** Champ du badge. Optionnel (ex: "level"). */
  badgeField?: string;
  /** Champ du parent. Par défaut : "parent". */
  parentField?: string;
  /** Champ d'activation. Par défaut : "isActive". */
  activeField?: string;

  /** Libellé du bouton « Ajouter à la racine ». */
  rootAddLabel?: string;
  /** Libellé du bouton « Ajouter un enfant ». */
  childAddLabel?: string;
  /** Message quand l'arbre est vide. */
  emptyMessage?: string;

  /** Configuration du formulaire intégré. */
  formConfig?: HierarchyOrganigramFormConfig<TValues>;

  /** Rendu personnalisé du contenu du nœud. */
  renderNodeContent?: (node: TreeNode) => ReactNode;
}
