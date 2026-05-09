import React, { useMemo, useState } from "react";
import { useModelListQuery } from "@/shared/api/graphql/graphql/hooks/useModelListQuery";
import { useModelDeleteMutation } from "@/shared/api/graphql/graphql/mutations/hooks/useModelDeleteMutation";
import { LocationsLocation } from "@/models";
import { Card } from "@/shared/ui/kit/card";
import { ScrollArea } from "@/shared/ui/kit/scroll-area";
import { Button } from "@/shared/ui/kit/button";
import {
  ZoomIn,
  ZoomOut,
  Maximize,
  Loader2,
  Plus,
  Pencil,
  Trash2,
  MoreVertical,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/shared/ui/kit/dialog";
import { LocationForm } from "../../forms/LocationForm";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/ui/kit/dropdown-menu";
import { toast } from "sonner";

interface TreeNode extends LocationsLocation {
  children: TreeNode[];
}

interface LocationNodeProps {
  node: TreeNode;
  onEdit: (node: TreeNode) => void;
  onAddChild: (parent: TreeNode) => void;
  onDelete: (node: TreeNode) => void;
}

/**
 * Composant récursif pour afficher un nœud de localisation et ses enfants.
 */
const LocationNode = ({
  node,
  onEdit,
  onAddChild,
  onDelete,
}: LocationNodeProps) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="flex flex-col items-center">
      <div className="relative flex flex-col items-center">
        <Card className="p-3 min-w-[200px] text-center bg-card border-primary/20 shadow-sm hover:border-primary transition-all hover:shadow-md group relative overflow-visible">
          <div className="flex justify-between items-start mb-1">
            <span className="text-[9px] px-1.5 py-0.5 bg-primary/10 text-primary rounded-full font-semibold uppercase tracking-wider">
              {node.level}
            </span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 -mr-1 -mt-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <MoreVertical className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(node)}>
                  <Pencil className="h-3.5 w-3.5 mr-2" />
                  Modifier
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onAddChild(node)}>
                  <Plus className="h-3.5 w-3.5 mr-2" />
                  Ajouter un sous-élément
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onDelete(node)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5 mr-2" />
                  Supprimer
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="font-bold text-sm truncate px-2 mb-1">
            {node.name}
          </div>

          <div className="text-[10px] font-mono text-muted-foreground">
            {node.code}
          </div>

          {node.children.length > 0 && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute -bottom-3 left-1/2 -translate-x-1/2 h-6 w-6 rounded-full border bg-background shadow-sm hover:bg-accent z-10"
              onClick={() => setIsCollapsed(!isCollapsed)}
            >
              {isCollapsed ? (
                <ChevronRight className="h-3 w-3" />
              ) : (
                <ChevronDown className="h-3 w-3" />
              )}
            </Button>
          )}
        </Card>

        {!isCollapsed && node.children.length > 0 && (
          <div className="w-px h-8 bg-primary/20" />
        )}
      </div>

      {!isCollapsed && node.children.length > 0 && (
        <div className="relative pt-8">
          {/* Ligne horizontale connectant les enfants */}
          {node.children.length > 1 && (
            <div className="absolute top-0 left-0 right-0 h-px bg-primary/20 mx-auto w-[calc(100%-200px)]" />
          )}

          <div className="flex flex-row items-start justify-center gap-12">
            {node.children.map((child) => (
              <div
                key={child.id}
                className="relative flex flex-col items-center"
              >
                {/* Ligne verticale montant vers le connecteur horizontal */}
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-px h-8 bg-primary/20" />
                <LocationNode
                  node={child}
                  onEdit={onEdit}
                  onAddChild={onAddChild}
                  onDelete={onDelete}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Vue en organigramme des localisations.
 * Supporte le zoom et le défilement pour les grandes structures.
 */
export const LocationOrganigram = () => {
  const [zoom, setZoom] = useState(1);
  const [dialogConfig, setDialogConfig] = useState<{
    open: boolean;
    mode: "create" | "update";
    objectId?: number;
    parent?: TreeNode;
  }>({ open: false, mode: "create" });

  const { data, loading, error, refetch } =
    useModelListQuery<LocationsLocation>({
      app: "locations",
      model: "Location",
      includeRelations: true,
    });

  const { execute: deleteLocation } = useModelDeleteMutation({
    app: "locations",
    model: "Location",
  });

  const tree = useMemo(() => {
    if (!data) return [];
    const map = new Map<string, TreeNode>();
    data.forEach((loc) => {
      if (loc.id !== null && loc.id !== undefined) {
        map.set(String(loc.id), { ...loc, children: [] });
      }
    });
    const roots: TreeNode[] = [];
    data.forEach((loc) => {
      if (loc.id !== null && loc.id !== undefined) {
        const node = map.get(String(loc.id))!;
        if (loc.parent?.id && map.has(String(loc.parent.id))) {
          map.get(String(loc.parent.id))!.children.push(node);
        } else {
          roots.push(node);
        }
      }
    });
    return roots;
  }, [data]);

  const handleEdit = (node: TreeNode) => {
    setDialogConfig({
      open: true,
      mode: "update",
      objectId: node.id as number,
    });
  };

  const handleAddChild = (parent: TreeNode) => {
    setDialogConfig({
      open: true,
      mode: "create",
      parent,
    });
  };

  const handleDelete = async (node: TreeNode) => {
    if (
      confirm(
        `Êtes-vous sûr de vouloir supprimer la localisation "${node.name}" ?`,
      )
    ) {
      try {
        await deleteLocation({ id: node.id });
        toast.success("Localisation supprimée avec succès");
        refetch();
      } catch (e: any) {
        toast.error(`Erreur lors de la suppression : ${e.message}`);
      }
    }
  };

  const handleFormSuccess = () => {
    setDialogConfig({ ...dialogConfig, open: false });
    toast.success(
      dialogConfig.mode === "create"
        ? "Localisation créée avec succès"
        : "Localisation mise à jour avec succès",
    );
    refetch();
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[500px] gap-3 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p>Génération de l'organigramme...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-[500px] text-destructive bg-destructive/5 rounded-lg border border-destructive/20 mx-4">
        <p>Erreur lors du chargement des localisations : {error.message}</p>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col h-[calc(100vh-250px)] min-h-[500px]">
      <div className="absolute top-4 left-8 z-20">
        <Button
          onClick={() => setDialogConfig({ open: true, mode: "create" })}
          className="shadow-md"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nouveau site
        </Button>
      </div>

      <div className="absolute top-4 right-8 z-20 flex gap-2">
        <div className="flex items-center px-3 py-1 bg-background/80 backdrop-blur border rounded-md shadow-sm mr-2">
          <span className="text-xs font-medium text-muted-foreground">
            Zoom: {Math.round(zoom * 100)}%
          </span>
        </div>
        <Button
          size="icon"
          variant="outline"
          className="bg-background/80 backdrop-blur"
          onClick={() => setZoom((z) => Math.max(0.2, z - 0.1))}
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button
          size="icon"
          variant="outline"
          className="bg-background/80 backdrop-blur"
          onClick={() => setZoom(1)}
        >
          <Maximize className="h-4 w-4" />
        </Button>
        <Button
          size="icon"
          variant="outline"
          className="bg-background/80 backdrop-blur"
          onClick={() => setZoom((z) => Math.min(2, z + 0.1))}
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1 w-full bg-muted/20 rounded-xl border overflow-auto">
        <div
          className="p-20 flex justify-center origin-top transition-transform duration-200 ease-out min-w-max"
          style={{ transform: `scale(${zoom})` }}
        >
          <div className="flex flex-row gap-24 items-start">
            {tree.length > 0 ? (
              tree.map((root) => (
                <LocationNode
                  key={root.id}
                  node={root}
                  onEdit={handleEdit}
                  onAddChild={handleAddChild}
                  onDelete={handleDelete}
                />
              ))
            ) : (
              <div className="text-muted-foreground py-20 italic">
                Aucune localisation à afficher.
              </div>
            )}
          </div>
        </div>
      </ScrollArea>

      <Dialog
        open={dialogConfig.open}
        onOpenChange={(open) => setDialogConfig({ ...dialogConfig, open })}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {dialogConfig.mode === "create"
                ? "Nouvelle Localisation"
                : "Modifier Localisation"}
            </DialogTitle>
            <DialogDescription>
              {dialogConfig.parent
                ? `Ajout d'un sous-élément dans "${dialogConfig.parent.name}"`
                : "Veuillez remplir les informations de la localisation."}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <LocationForm
              mode={dialogConfig.mode === "create" ? "CREATE" : "UPDATE"}
              objectId={dialogConfig.objectId}
              runtimeOverrides={
                dialogConfig.parent
                  ? [{ path: "parent", value: dialogConfig.parent.id }]
                  : undefined
              }
              layout={{
                variant: "compact",
              }}
              onSubmitResult={(result) => {
                if (result.success) handleFormSuccess();
              }}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LocationOrganigram;
