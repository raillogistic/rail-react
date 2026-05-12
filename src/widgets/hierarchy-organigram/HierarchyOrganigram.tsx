/**
 * HierarchyOrganigram — Vue arbre interactive premium.
 *
 * Canevas pannable et zoomable (drag + scroll) affichant n'importe quel
 * modèle hiérarchique Django avec CRUD intégré.
 *
 * Fonctionnalités :
 * - Pan par glisser-déplacer du canevas
 * - Zoom au scroll centré sur le curseur
 * - Connecteurs SVG entre nœuds (couleur par profondeur)
 * - Menu contextuel (modifier, ajouter enfant, supprimer)
 * - Formulaire ModelForm en modale
 * - Confirmation de suppression avec avertissement cascade
 * - Barre de statistiques en temps réel
 * - État vide avec CTA
 *
 * @example
 * ```tsx
 * <HierarchyOrganigram
 *   app="referentials"
 *   model="Service"
 *   rootAddLabel="Nouveau service"
 *   childAddLabel="Ajouter un sous-service"
 *   formConfig={{
 *     generatedSections: [
 *       { id: "info", title: "Informations", columns: 2, fields: ["name", "code", "parent", "isActive"] },
 *     ],
 *   }}
 * />
 * ```
 */
import React, { useMemo, useState, useCallback } from "react";
import { useModelListQuery } from "@/shared/api/graphql/graphql/hooks/useModelListQuery";
import { useModelDeleteMutation } from "@/shared/api/graphql/graphql/mutations/hooks/useModelDeleteMutation";
import { Button } from "@/shared/ui/kit/button";
import {
  ZoomIn,
  ZoomOut,
  Maximize,
  Loader2,
  Plus,
  Trash2,
  TreePine,
  RefreshCw,
  Move,
  Hash,
  GitFork,
  Layers,
  Leaf,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/shared/ui/kit/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/ui/kit/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/ui/kit/tooltip";
import { ModelForm } from "@/widgets/model-form";
import { toast } from "sonner";

import { OrganigramNode } from "./OrganigramNode";
import { useCanvasViewport } from "./useCanvasViewport";
import { buildTree, computeTreeStats, countDescendants } from "./treeUtils";
import type { HierarchyOrganigramProps, TreeNode, DialogState } from "./types";

// ────────────────────────────────────────────────────────────────────
// Composant principal
// ────────────────────────────────────────────────────────────────────

export function HierarchyOrganigram<
  TValues extends Record<string, unknown> = Record<string, unknown>,
>({
  app,
  model,
  labelField = "name",
  codeField = "code",
  badgeField,
  parentField = "parent",
  activeField = "isActive",
  rootAddLabel = "Ajouter à la racine",
  childAddLabel = "Ajouter un sous-élément",
  emptyMessage = "Aucun élément à afficher. Commencez par en créer un.",
  formConfig,
  renderNodeContent,
}: HierarchyOrganigramProps<TValues>) {
  // ── État CRUD ──
  const [dialogState, setDialogState] = useState<DialogState>({
    open: false,
    mode: "CREATE",
  });
  const [deleteTarget, setDeleteTarget] = useState<TreeNode | null>(null);

  // ── Viewport ──
  const {
    viewport,
    containerRef,
    handlers,
    zoomIn,
    zoomOut,
    resetView,
  } = useCanvasViewport();

  // ── Données ──
  const { data, loading, error, refetch } = useModelListQuery<
    Record<string, unknown>
  >({
    app,
    model,
    includeRelations: true,
  });

  const { execute: executeDelete } = useModelDeleteMutation({ app, model });

  // ── Arbre ──
  const tree = useMemo(() => {
    if (!data) return [];
    const records = Array.isArray(data) ? data : [];
    return buildTree(records, labelField, codeField, parentField, badgeField, activeField);
  }, [data, labelField, codeField, parentField, badgeField, activeField]);

  const stats = useMemo(() => computeTreeStats(tree), [tree]);

  // ── Callbacks CRUD ──
  const handleEdit = useCallback((node: TreeNode) => {
    setDialogState({ open: true, mode: "UPDATE", objectId: node.id });
  }, []);

  const handleAddChild = useCallback((parent: TreeNode) => {
    setDialogState({
      open: true,
      mode: "CREATE",
      parentId: parent.id,
      parentLabel: parent.label,
    });
  }, []);

  const handleAddRoot = useCallback(() => {
    setDialogState({ open: true, mode: "CREATE" });
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteTarget) return;
    try {
      await executeDelete({ id: deleteTarget.id });
      toast.success(`« ${deleteTarget.label} » supprimé avec succès`);
      refetch();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erreur inconnue";
      toast.error(`Erreur lors de la suppression : ${message}`);
    } finally {
      setDeleteTarget(null);
    }
  }, [deleteTarget, executeDelete, refetch]);

  const handleFormSuccess = useCallback(() => {
    const wasCreate = dialogState.mode === "CREATE";
    setDialogState({ open: false, mode: "CREATE" });
    toast.success(
      wasCreate ? "Élément créé avec succès" : "Élément mis à jour avec succès",
    );
    refetch();
  }, [dialogState.mode, refetch]);

  const closeDialog = useCallback(() => {
    setDialogState((prev) => ({ ...prev, open: false }));
  }, []);

  // ── Runtime overrides pour le formulaire ──
  const runtimeOverrides = useMemo(() => {
    if (!dialogState.parentId) return undefined;
    const fieldName = formConfig?.parentFieldName ?? parentField;
    return [{ path: fieldName, value: dialogState.parentId }];
  }, [dialogState.parentId, formConfig?.parentFieldName, parentField]);

  // ── Descendants du nœud ciblé pour suppression ──
  const deleteDescendantCount = deleteTarget
    ? countDescendants(deleteTarget)
    : 0;

  // ── Rendu : chargement ──
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[600px] gap-4">
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
          <Loader2 className="h-10 w-10 animate-spin text-primary relative z-10" />
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-foreground">Chargement de l'organigramme</p>
          <p className="text-xs text-muted-foreground mt-1">Récupération des données…</p>
        </div>
      </div>
    );
  }

  // ── Rendu : erreur ──
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[600px] gap-4 mx-4">
        <div className="p-4 rounded-full bg-destructive/10">
          <TreePine className="h-8 w-8 text-destructive" />
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold text-destructive">Erreur de chargement</p>
          <p className="text-xs text-muted-foreground mt-1 max-w-md">
            {error.message}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="h-3.5 w-3.5 mr-2" />
          Réessayer
        </Button>
      </div>
    );
  }

  return (
    <TooltipProvider delayDuration={300}>
      <div className="relative flex flex-col h-[calc(100vh-280px)] min-h-[560px] rounded-xl border bg-background overflow-hidden">
        {/* ══════════════════════════════════════════════════════
            Barre d'outils supérieure
           ══════════════════════════════════════════════════════ */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b bg-muted/30 backdrop-blur-sm z-20">
          {/* Gauche : actions */}
          <div className="flex items-center gap-2">
            <Button onClick={handleAddRoot} size="sm" className="shadow-sm">
              <Plus className="h-4 w-4 mr-1.5" />
              {rootAddLabel}
            </Button>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={() => refetch()}
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Actualiser les données</TooltipContent>
            </Tooltip>
          </div>

          {/* Centre : statistiques */}
          {stats.totalNodes > 0 && (
            <div className="hidden md:flex items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Hash className="h-3 w-3" />
                <span>{stats.totalNodes} éléments</span>
              </div>
              <div className="flex items-center gap-1.5">
                <GitFork className="h-3 w-3" />
                <span>{stats.rootNodes} racine{stats.rootNodes > 1 ? "s" : ""}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Layers className="h-3 w-3" />
                <span>{stats.maxDepth + 1} niveaux</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Leaf className="h-3 w-3" />
                <span>{stats.leafNodes} feuille{stats.leafNodes > 1 ? "s" : ""}</span>
              </div>
            </div>
          )}

          {/* Droite : contrôles de zoom */}
          <div className="flex items-center gap-1.5">
            <div className="flex items-center gap-1 mr-1">
              <Move className="h-3 w-3 text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground font-medium">
                {Math.round(viewport.scale * 100)}%
              </span>
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  variant="outline"
                  className="h-7 w-7"
                  onClick={zoomOut}
                >
                  <ZoomOut className="h-3 w-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Dézoomer</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  variant="outline"
                  className="h-7 w-7"
                  onClick={resetView}
                >
                  <Maximize className="h-3 w-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Réinitialiser la vue</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  variant="outline"
                  className="h-7 w-7"
                  onClick={zoomIn}
                >
                  <ZoomIn className="h-3 w-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Zoomer</TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════
            Canevas pannable + zoomable
           ══════════════════════════════════════════════════════ */}
        <div
          ref={containerRef}
          className="flex-1 overflow-hidden cursor-grab active:cursor-grabbing bg-[radial-gradient(circle_at_1px_1px,_var(--color-border)_1px,_transparent_0)] [background-size:24px_24px]"
          {...handlers}
        >
          <div
            className="origin-top-left transition-none will-change-transform"
            style={{
              transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.scale})`,
            }}
          >
            <div className="p-12 flex justify-center min-w-max">
              {tree.length > 0 ? (
                <div className="flex items-start gap-16">
                  {tree.map((root) => (
                    <OrganigramNode
                      key={root.id}
                      node={root}
                      depth={0}
                      onEdit={handleEdit}
                      onAddChild={handleAddChild}
                      onDelete={setDeleteTarget}
                      childAddLabel={childAddLabel}
                      renderContent={renderNodeContent}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-24 gap-5">
                  <div className="p-5 rounded-2xl bg-muted/50 border border-dashed border-muted-foreground/20">
                    <TreePine className="h-14 w-14 text-muted-foreground/30" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-muted-foreground">
                      {emptyMessage}
                    </p>
                    <p className="text-xs text-muted-foreground/60 mt-1">
                      Glissez pour naviguer, scrollez pour zoomer
                    </p>
                  </div>
                  <Button onClick={handleAddRoot} variant="outline" size="sm">
                    <Plus className="h-4 w-4 mr-1.5" />
                    {rootAddLabel}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════
            Indicateur d'aide (coin inférieur gauche)
           ══════════════════════════════════════════════════════ */}
        <div className="absolute bottom-3 left-3 z-20 flex items-center gap-2 text-[10px] text-muted-foreground/50 bg-background/60 backdrop-blur-sm px-2.5 py-1 rounded-md border border-border/50">
          <Move className="h-3 w-3" />
          <span>Glisser pour naviguer</span>
          <span className="text-border">·</span>
          <span>Scroll pour zoomer</span>
        </div>

        {/* ══════════════════════════════════════════════════════
            Modale : formulaire création/édition
           ══════════════════════════════════════════════════════ */}
        <Dialog open={dialogState.open} onOpenChange={(open) => !open && closeDialog()}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {dialogState.mode === "CREATE"
                  ? dialogState.parentLabel
                    ? `Nouveau sous-élément — ${dialogState.parentLabel}`
                    : rootAddLabel
                  : "Modifier l'élément"}
              </DialogTitle>
              <DialogDescription>
                {dialogState.mode === "CREATE"
                  ? dialogState.parentLabel
                    ? `Ajout d'un élément enfant dans « ${dialogState.parentLabel} ».`
                    : "Créer un nouvel élément racine."
                  : "Modifier les informations de l'élément sélectionné."}
              </DialogDescription>
            </DialogHeader>
            <div className="py-2">
              <ModelForm
                app={app}
                model={model}
                mode={dialogState.mode}
                objectId={
                  dialogState.mode === "UPDATE"
                    ? dialogState.objectId
                    : undefined
                }
                runtimeOverrides={runtimeOverrides}
                generatedSections={formConfig?.generatedSections}
                fieldOverrides={
                  formConfig?.fieldOverrides as Record<string, unknown>
                }
                showHeading={false}
                onSubmitResult={(result) => {
                  if (result.success) handleFormSuccess();
                }}
              />
            </div>
          </DialogContent>
        </Dialog>

        {/* ══════════════════════════════════════════════════════
            Modale : confirmation de suppression
           ══════════════════════════════════════════════════════ */}
        <AlertDialog
          open={!!deleteTarget}
          onOpenChange={(open) => !open && setDeleteTarget(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
              <AlertDialogDescription className="space-y-2">
                <span>
                  Êtes-vous sûr de vouloir supprimer{" "}
                  <strong className="text-foreground">
                    « {deleteTarget?.label} »
                  </strong>{" "}
                  ?
                </span>
                {deleteDescendantCount > 0 && (
                  <span className="block text-destructive font-medium">
                    ⚠ Cet élément possède {deleteDescendantCount} sous-élément
                    {deleteDescendantCount > 1 ? "s" : ""} qui seront également
                    supprimés.
                  </span>
                )}
                <span className="block text-xs text-muted-foreground">
                  Cette action est irréversible.
                </span>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteConfirm}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Supprimer
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </TooltipProvider>
  );
}
