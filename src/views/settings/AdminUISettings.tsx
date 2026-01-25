import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/lib/components/ui/card";
import { Button } from "@/lib/components/ui/button";
import { Plus } from "lucide-react";
import ModelTable from "@/lib/tables/ModelTable";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/lib/components/ui/drawer";
import { UIConfigForm } from "@/lib/configuration/UIConfigForm";

export function AdminUISettings() {
  const [editingConfig, setEditingConfig] = useState<any>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const handleEdit = (row: any) => {
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
              Gérez les configurations globales de l'interface utilisateur.
            </CardDescription>
          </div>
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Ajouter
          </Button>
        </CardHeader>
        <CardContent>
          <ModelTable
            appName="core"
            modelName="UIComponentConfig"
            title="Configurations UI"
            enableQuickSearch={true}
            rowActions={{
              on_edit: handleEdit,
            }}
          />
        </CardContent>
      </Card>

      <Drawer open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Modifier la configuration</DrawerTitle>
            <DrawerDescription>
              Modifiez les paramètres du composant {editingConfig?.component_id}.
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
              Créez une nouvelle configuration d'interface.
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
