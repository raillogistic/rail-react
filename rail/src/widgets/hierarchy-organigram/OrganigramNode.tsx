/**
 * OrganigramNode — Composant récursif d'un nœud d'organigramme.
 *
 * Chaque nœud affiche :
 * - Un badge de niveau/type (couleur par profondeur)
 * - Le libellé et le code
 * - Un indicateur d'état actif/inactif
 * - Un compteur de descendants
 * - Un menu contextuel (modifier, ajouter enfant, supprimer)
 * - Un bouton déplier/replier animé
 * - Des connecteurs SVG vers les enfants
 */
import React, { useState, useCallback } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  MoreHorizontal,
  ChevronDown,
  ChevronRight,
  Circle,
} from "lucide-react";
import { Button } from "@/shared/ui/kit/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/ui/kit/dropdown-menu";
import type { TreeNode } from "./types";
import { countDescendants } from "./treeUtils";

/** Palettes visuelles par profondeur. */
const DEPTH_STYLES = [
  {
    border: "border-blue-400/50 dark:border-blue-500/40",
    accent: "from-blue-500/8 to-blue-600/3 dark:from-blue-500/12 dark:to-blue-600/5",
    badge: "bg-blue-500/12 text-blue-700 dark:bg-blue-400/15 dark:text-blue-300 ring-blue-500/20",
    connector: "#3b82f6",
    glow: "shadow-blue-500/5",
  },
  {
    border: "border-emerald-400/50 dark:border-emerald-500/40",
    accent: "from-emerald-500/8 to-emerald-600/3 dark:from-emerald-500/12 dark:to-emerald-600/5",
    badge: "bg-emerald-500/12 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-300 ring-emerald-500/20",
    connector: "#10b981",
    glow: "shadow-emerald-500/5",
  },
  {
    border: "border-amber-400/50 dark:border-amber-500/40",
    accent: "from-amber-500/8 to-amber-600/3 dark:from-amber-500/12 dark:to-amber-600/5",
    badge: "bg-amber-500/12 text-amber-700 dark:bg-amber-400/15 dark:text-amber-300 ring-amber-500/20",
    connector: "#f59e0b",
    glow: "shadow-amber-500/5",
  },
  {
    border: "border-violet-400/50 dark:border-violet-500/40",
    accent: "from-violet-500/8 to-violet-600/3 dark:from-violet-500/12 dark:to-violet-600/5",
    badge: "bg-violet-500/12 text-violet-700 dark:bg-violet-400/15 dark:text-violet-300 ring-violet-500/20",
    connector: "#8b5cf6",
    glow: "shadow-violet-500/5",
  },
  {
    border: "border-rose-400/50 dark:border-rose-500/40",
    accent: "from-rose-500/8 to-rose-600/3 dark:from-rose-500/12 dark:to-rose-600/5",
    badge: "bg-rose-500/12 text-rose-700 dark:bg-rose-400/15 dark:text-rose-300 ring-rose-500/20",
    connector: "#f43f5e",
    glow: "shadow-rose-500/5",
  },
  {
    border: "border-cyan-400/50 dark:border-cyan-500/40",
    accent: "from-cyan-500/8 to-cyan-600/3 dark:from-cyan-500/12 dark:to-cyan-600/5",
    badge: "bg-cyan-500/12 text-cyan-700 dark:bg-cyan-400/15 dark:text-cyan-300 ring-cyan-500/20",
    connector: "#06b6d4",
    glow: "shadow-cyan-500/5",
  },
];

/** Constantes de layout pour les connecteurs SVG. */
const NODE_WIDTH = 240;
const VERTICAL_GAP = 60;
const HORIZONTAL_GAP = 32;

interface OrganigramNodeProps {
  node: TreeNode;
  depth: number;
  onEdit: (node: TreeNode) => void;
  onAddChild: (node: TreeNode) => void;
  onDelete: (node: TreeNode) => void;
  childAddLabel: string;
  renderContent?: (node: TreeNode) => React.ReactNode;
}

/**
 * Composant récursif pour afficher un nœud de l'organigramme.
 * Gère le repliement, le menu contextuel et les connecteurs visuels.
 */
export const OrganigramNode = React.memo(function OrganigramNode({
  node,
  depth,
  onEdit,
  onAddChild,
  onDelete,
  childAddLabel,
  renderContent,
}: OrganigramNodeProps) {
  const [collapsed, setCollapsed] = useState(depth >= 3);
  const hasChildren = node.children.length > 0;
  const style = DEPTH_STYLES[depth % DEPTH_STYLES.length];
  const descendantCount = countDescendants(node);

  const toggleCollapse = useCallback(() => setCollapsed((c) => !c), []);

  // ── Dimensions pour le SVG des connecteurs ──
  const childCount = node.children.length;
  const totalChildrenWidth =
    childCount * NODE_WIDTH + (childCount - 1) * HORIZONTAL_GAP;

  return (
    <div className="flex flex-col items-center" data-interactive>
      {/* ── Card du nœud ── */}
      <div
        className={`
          relative w-[${NODE_WIDTH}px] min-w-[${NODE_WIDTH}px]
          rounded-xl border bg-gradient-to-b backdrop-blur-sm
          transition-all duration-200 group
          hover:shadow-lg ${style.glow}
          ${style.border} ${style.accent}
        `}
        style={{ width: NODE_WIDTH }}
        data-interactive
      >
        {/* Header : badge + menu */}
        <div className="flex items-center justify-between px-3.5 pt-3 pb-1">
          <div className="flex items-center gap-1.5">
            {node.badge && (
              <span
                className={`
                  text-[10px] font-bold uppercase tracking-wider px-2 py-0.5
                  rounded-md ring-1 ${style.badge}
                `}
              >
                {node.badge}
              </span>
            )}
            {node.isActive !== undefined && (
              <Circle
                className={`h-2.5 w-2.5 ${
                  node.isActive
                    ? "text-emerald-500 fill-emerald-500"
                    : "text-zinc-400 fill-zinc-300 dark:text-zinc-500 dark:fill-zinc-600"
                }`}
              />
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity focus-visible:opacity-100"
                aria-label={`Actions pour ${node.label}`}
                data-interactive
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[200px]" data-interactive>
              <DropdownMenuItem onClick={() => onEdit(node)} data-interactive>
                <Pencil className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                Modifier
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onAddChild(node)} data-interactive>
                <Plus className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                {childAddLabel}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onDelete(node)}
                className="text-destructive focus:text-destructive"
                data-interactive
              >
                <Trash2 className="h-3.5 w-3.5 mr-2" />
                Supprimer
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Contenu */}
        <div className="px-3.5 pb-2">
          {renderContent ? (
            renderContent(node)
          ) : (
            <>
              <div className="font-semibold text-sm leading-tight truncate" title={node.label}>
                {node.label}
              </div>
              {node.code && (
                <div className="text-[11px] font-mono text-muted-foreground mt-0.5">
                  {node.code}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer : stats + toggle */}
        {hasChildren && (
          <div className="flex items-center justify-between px-3.5 pb-2.5">
            <span className="text-[10px] text-muted-foreground">
              {node.children.length} direct
              {descendantCount > node.children.length && (
                <> · {descendantCount} total</>
              )}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 rounded-md hover:bg-background/80"
              onClick={toggleCollapse}
              aria-label={collapsed ? "Déplier" : "Replier"}
              data-interactive
            >
              {collapsed ? (
                <ChevronRight className="h-3.5 w-3.5" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5" />
              )}
            </Button>
          </div>
        )}
      </div>

      {/* ── Connecteurs SVG + enfants ── */}
      {!collapsed && hasChildren && (
        <>
          {/* SVG connecteurs */}
          <svg
            width={Math.max(totalChildrenWidth, NODE_WIDTH)}
            height={VERTICAL_GAP}
            className="overflow-visible"
            style={{ minWidth: totalChildrenWidth }}
          >
            {/* Ligne verticale descendante depuis le parent */}
            <line
              x1={Math.max(totalChildrenWidth, NODE_WIDTH) / 2}
              y1={0}
              x2={Math.max(totalChildrenWidth, NODE_WIDTH) / 2}
              y2={VERTICAL_GAP / 2}
              stroke={style.connector}
              strokeWidth={2}
              strokeOpacity={0.4}
            />

            {childCount === 1 ? (
              /* Connecteur unique : ligne droite */
              <line
                x1={Math.max(totalChildrenWidth, NODE_WIDTH) / 2}
                y1={VERTICAL_GAP / 2}
                x2={totalChildrenWidth / 2}
                y2={VERTICAL_GAP}
                stroke={style.connector}
                strokeWidth={2}
                strokeOpacity={0.4}
              />
            ) : (
              /* Plusieurs enfants : T-junction */
              <>
                {/* Ligne horizontale */}
                <line
                  x1={NODE_WIDTH / 2}
                  y1={VERTICAL_GAP / 2}
                  x2={totalChildrenWidth - NODE_WIDTH / 2}
                  y2={VERTICAL_GAP / 2}
                  stroke={style.connector}
                  strokeWidth={2}
                  strokeOpacity={0.3}
                  strokeLinecap="round"
                />
                {/* Lignes verticales vers chaque enfant */}
                {node.children.map((_, i) => {
                  const childCenterX =
                    i * (NODE_WIDTH + HORIZONTAL_GAP) + NODE_WIDTH / 2;
                  return (
                    <line
                      key={i}
                      x1={childCenterX}
                      y1={VERTICAL_GAP / 2}
                      x2={childCenterX}
                      y2={VERTICAL_GAP}
                      stroke={
                        DEPTH_STYLES[(depth + 1) % DEPTH_STYLES.length].connector
                      }
                      strokeWidth={2}
                      strokeOpacity={0.4}
                    />
                  );
                })}
              </>
            )}
          </svg>

          {/* Enfants */}
          <div
            className="flex items-start"
            style={{ gap: HORIZONTAL_GAP }}
          >
            {node.children.map((child) => (
              <OrganigramNode
                key={child.id}
                node={child}
                depth={depth + 1}
                onEdit={onEdit}
                onAddChild={onAddChild}
                onDelete={onDelete}
                childAddLabel={childAddLabel}
                renderContent={renderContent}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
});
