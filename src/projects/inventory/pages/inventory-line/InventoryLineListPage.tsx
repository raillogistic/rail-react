import type { InventoryInventoryLine } from "@/models";
import { ROUTES } from "@/projects/inventory/config/routes";
import { DynamicModelTable } from "@/widgets/model-table";
import { useModelMethodMutation } from "@/shared/api/graphql/graphql/mutations/hooks/useModelMethodMutation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/kit/select";
import { toast } from "sonner";
import { Badge } from "@/shared/ui/kit/badge";

export function InventoryLineListPage() {
  const { execute: checkLine } = useModelMethodMutation({
    app: "inventory",
    model: "InventoryLine",
    methodName: "checkInventoryLine",
  });

  const handleCheck = async (id: number, result: string, refetch?: () => void) => {
    try {
      await checkLine({
        id: String(id),
        input: { result },
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
        fields: {
          include: [
            "campaign",
            "asset",
            "expectedLocation",
            "observedLocation",
            "result",
            "conditionComment",
            "checkedBy",
            "checkedAt",
          ],
          render: {
            result: (value, row, data, refetch) => {
              const val = value as string;
              return (
                <Select 
                  value={val || ""} 
                  onValueChange={(val) => handleCheck(row.id!, val, refetch)}
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
            asset: (value) => {
              const asset = value as any;
              return <span className="font-mono text-xs">{asset?.inventoryCode || ""}</span>;
            }
          }
        },
        tableConfig: {
          title: "Lignes d'inventaire",
        },
      }}
    />
  );
}

export default InventoryLineListPage;
