import type { InventoryInventoryLine } from "@/models";
import { DynamicModelTable } from "@/widgets/model-table";
import { Card } from "@/shared/ui/kit/card";

export function InventoryGapReportPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Rapport d'écarts</h2>
      </div>
      
      <Card className="p-6">
        <DynamicModelTable<InventoryInventoryLine>
          app="inventory"
          model="InventoryLine"
          initVariables={{
            where: {
              isGap: { eq: true }
            }
          }}
          baseTable={{
            fields: [
              "campaign",
              "asset",
              "expectedLocation",
              "observedLocation",
              "result",
              "conditionComment",
            ],
            tableConfig: {
              title: "Écarts constatés (Terrain vs Référentiel)",
            },
          }}
        />
      </Card>
    </div>
  );
}

export default InventoryGapReportPage;
