import type { InventoryInventoryLine } from "@/models";
import { ROUTES } from "@/projects/inventory/config/routes";
import { DynamicModelTable } from "@/widgets/model-table";
import { useModelMethodMutation } from "@/shared/api/graphql/graphql/mutations/hooks/useModelMethodMutation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/kit/select";
import { toast } from "sonner";
import { Badge } from "@/shared/ui/kit/badge";

export function InventoryLineListPage() {
  const [checkLine] = useModelMethodMutation({
    app: "inventory",
    model: "InventoryLine",
    method: "checkInventoryLine",
  });

  const handleCheck = async (id: number, result: string, refetch?: () => void) => {
    try {
      await checkLine({
        id: String(id),
        args: { result },
      });
      toast.success("Résultat enregistré");
      if (refetch) refetch();
    } catch (e) {
      toast.error("Erreur lors de l'enregistrement");
    }
  };

  return (
    <DynamicModelTable<InventoryInventoryLine>
      app="inventory"
      model="InventoryLine"
      create={{
        type: "link",
        hrefTemplate: ROUTES.INVENTORY_LINE_CREATE,
      }}
      update={{
        type: "link",
        hrefTemplate: ROUTES.INVENTORY_LINE_EDIT,
      }}
      detail={{
        type: "link",
        hrefTemplate: ROUTES.INVENTORY_LINE_DETAIL,
      }}
      baseTable={{
        tableConfig: {
          title: "Lignes d'inventaire",
        },
        columnOverrides: {
          result: {
            header: "Résultat terrain",
            cell: ({ row, getValue, column }) => {
              const value = getValue() as string;
              // On récupère le refetch via le contexte de la table si possible ou on passe une prop.
              // DynamicModelTable passe refetch dans les arguments de render si on utilise fields.render
              // Mais ici on est dans columnOverrides. 
              // En fait, DynamicModelTable n'expose pas facilement refetch dans columnOverrides.
              // Je vais utiliser fields.render à la place si besoin, ou juste faire confiance à Apollo cache.
              return (
                <Select 
                  value={value || ""} 
                  onValueChange={(val) => handleCheck(row.original.id!, val)}
                >
                  <SelectTrigger className="h-8 w-[140px]">
                    <SelectValue placeholder="Saisir..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="present">Présent</SelectItem>
                    <SelectItem value="absent">Absent</SelectItem>
                    <SelectItem value="moved">Déplacé</SelectItem>
                    <SelectItem value="damaged">Détérioré</SelectItem>
                    <SelectItem value="to_reform">À réformer</SelectItem>
                  </SelectContent>
                </Select>
              );
            },
          },
          "asset.inventoryCode": {
            header: "Code",
            cell: ({ getValue }) => <span className="font-mono text-xs">{getValue() as string}</span>,
          }
        },
      }}
    />
  );
}

export default InventoryLineListPage;
