import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui/kit/card";
import { Button } from "@/shared/ui/kit/button";
import { Plus } from "lucide-react";
import { DynamicModelTable } from "@/widgets/model-table";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/shared/ui/kit/drawer";
import { UIConfigForm } from "@/features/settings/configuration/UIConfigForm";

export function AdminUISettings() {
  const [editingConfig, setEditingConfig] = useState<Record<string, unknown> | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const handleEdit = (row: Record<string, unknown>) => {
    setEditingConfig(row);
    setIsEditOpen(true);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Administration UI</CardTitle>
            <CardDescription>
              Gerez les configurations globales de l'interface utilisateur.
            </CardDescription>
          </div>
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Ajouter
          </Button>
        </CardHeader>
        <CardContent>
          <DynamicModelTable
            app="core"
            model="UIComponentConfig"
            baseTable={{
              tableConfig: {
                title: "Configurations UI",
              },
              columnActions: [
                {
                  key: "edit-config",
                  label: "Modifier",
                  onClick: ({ row }) => handleEdit(row),
                },
              ],
            }}
          />
        </CardContent>
      </Card>

      <Drawer open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Modifier la configuration</DrawerTitle>
            <DrawerDescription>
              Modifiez les parametres du composant {String(editingConfig?.component_id ?? "")}. 
            </DrawerDescription>
          </DrawerHeader>
          <div className="p-4 pb-0 h-[80vh] overflow-y-auto">
            {editingConfig && (
              <UIConfigForm
                mode="update"
                initialData={editingConfig}
                onSuccess={() => setIsEditOpen(false)}
              />
            )}
          </div>
        </DrawerContent>
      </Drawer>

      <Drawer open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Nouvelle configuration</DrawerTitle>
            <DrawerDescription>
              Creez une nouvelle configuration d'interface.
            </DrawerDescription>
          </DrawerHeader>
          <div className="p-4 pb-0 h-[80vh] overflow-y-auto">
            <UIConfigForm
              mode="create"
              onSuccess={() => setIsCreateOpen(false)}
            />
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}


