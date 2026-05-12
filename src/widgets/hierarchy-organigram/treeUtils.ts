/**
 * Utilitaire de construction d'arbre et de calcul de statistiques.
 *
 * Transforme une liste plate d'enregistrements en arbre hiérarchique
 * et calcule les métriques pour la barre de statut.
 */
import type { TreeNode, TreeStats } from "./types";

/**
 * Construit un arbre hiérarchique à partir d'une liste plate.
 *
 * @param records - Liste plate d'enregistrements avec champ parent.
 * @param labelField - Nom du champ pour le libellé.
 * @param codeField - Nom du champ pour le code.
 * @param badgeField - Nom du champ pour le badge (optionnel).
 * @param parentField - Nom du champ pour la relation parent.
 * @param activeField - Nom du champ d'activation (optionnel).
 * @returns Liste des nœuds racine.
 */
export function buildTree(
  records: Record<string, unknown>[],
  labelField: string,
  codeField: string,
  parentField: string,
  badgeField?: string,
  activeField?: string,
): TreeNode[] {
  const map = new Map<string, TreeNode>();

  // Passe 1 : créer tous les nœuds
  for (const record of records) {
    const id = record.id as string | number;
    if (id == null) continue;

    const isActive = activeField
      ? (record[activeField] as boolean | undefined)
      : undefined;

    map.set(String(id), {
      id,
      label: String(record[labelField] ?? ""),
      code: String(record[codeField] ?? ""),
      badge: badgeField ? String(record[badgeField] ?? "") : undefined,
      isActive,
      children: [],
      raw: record,
    });
  }

  // Passe 2 : lier parent → enfants, collecter les racines
  const roots: TreeNode[] = [];
  for (const record of records) {
    const id = record.id as string | number;
    if (id == null) continue;

    const node = map.get(String(id))!;
    const parentObj = record[parentField] as
      | { id?: string | number }
      | null
      | undefined;
    const parentId = parentObj?.id;

    if (parentId != null && map.has(String(parentId))) {
      map.get(String(parentId))!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  return roots;
}

/**
 * Calcule les statistiques de l'arbre pour la barre de statut.
 */
export function computeTreeStats(roots: TreeNode[]): TreeStats {
  let totalNodes = 0;
  let leafNodes = 0;
  let maxDepth = 0;

  function walk(node: TreeNode, depth: number) {
    totalNodes++;
    if (depth > maxDepth) maxDepth = depth;
    if (node.children.length === 0) leafNodes++;
    for (const child of node.children) {
      walk(child, depth + 1);
    }
  }

  for (const root of roots) {
    walk(root, 0);
  }

  return {
    totalNodes,
    rootNodes: roots.length,
    maxDepth,
    leafNodes,
  };
}

/**
 * Décompte total des descendants d'un nœud (récursif).
 */
export function countDescendants(node: TreeNode): number {
  let count = 0;
  for (const child of node.children) {
    count += 1 + countDescendants(child);
  }
  return count;
}
