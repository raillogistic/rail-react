/**
 * Widget d'organigramme hiérarchique réutilisable.
 *
 * Affiche n'importe quel modèle hiérarchique (parent/children) sous forme
 * d'arbre interactif avec canevas pannable/zoomable et CRUD intégré.
 */
export { HierarchyOrganigram } from "./HierarchyOrganigram";
export { OrganigramNode } from "./OrganigramNode";
export { useCanvasViewport } from "./useCanvasViewport";
export { buildTree, computeTreeStats, countDescendants } from "./treeUtils";
export type {
  HierarchyOrganigramProps,
  HierarchyOrganigramFormConfig,
  TreeNode,
  TreeStats,
  ViewportState,
} from "./types";
