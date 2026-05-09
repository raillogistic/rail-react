import { useParams } from "react-router-dom";
import type { InventoryInventoryCampaign, InventoryInventoryLine } from "@/models";
import { DynamicDetail } from "@/widgets/model-details/DynamicDetail";
import { DynamicModelTable } from "@/widgets/model-table";
import { Card } from "@/shared/ui/kit/card";

export function InventoryCampaignDetailPage() {
  const { id = "" } = useParams();
  
  return (
    <div className="space-y-6">
      <DynamicDetail<InventoryInventoryCampaign> 
        app="inventory" 
        model="InventoryCampaign" 
        id={id} 
      />
      
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Lignes d'inventaire</h3>
        <DynamicModelTable<InventoryInventoryLine>
          app="inventory"
          model="InventoryLine"
          baseTable={{
            filter: { 
              campaign: { id: { eq: id } } 
            },
            tableConfig: {
              title: "Inventaire terrain",
            }
          }}
        />
      </Card>
    </div>
  );
}

export default InventoryCampaignDetailPage;
