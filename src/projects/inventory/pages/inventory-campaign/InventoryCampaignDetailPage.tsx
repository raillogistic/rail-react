import { useState } from "react";
import { useParams } from "react-router-dom";
import type { InventoryInventoryCampaign, InventoryInventoryLine } from "@/models";
import { DynamicDetail } from "@/widgets/model-details/DynamicDetail";
import { DynamicModelTable } from "@/widgets/model-table";
import { Card } from "@/shared/ui/kit/card";
import { InventoryScanner } from "./InventoryScanner";
import { CheckInventoryLineModal } from "./CheckInventoryLineModal";

export function InventoryCampaignDetailPage() {
  const { id = "" } = useParams();
  const [selectedLineId, setSelectedLineId] = useState<string | null>(null);
  
  return (
    <div className="space-y-6">
      <DynamicDetail<InventoryInventoryCampaign> 
        app="inventory" 
        model="InventoryCampaign" 
        id={id} 
      />
      
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Lignes d'inventaire</h3>
        
        <InventoryScanner campaignId={id} />

        <DynamicModelTable<InventoryInventoryLine>
          app="inventory"
          model="InventoryLine"
          baseTable={{
            filter: { 
              campaign: { id: { eq: id } } 
            },
            tableConfig: {
              title: "Inventaire terrain",
              rowActions: [
                {
                  label: "Saisir Résultat",
                  onClick: (row) => setSelectedLineId(row.id),
                }
              ]
            }
          }}
        />

        {selectedLineId && (
          <CheckInventoryLineModal
            lineId={selectedLineId}
            open={!!selectedLineId}
            onOpenChange={(open) => {
              if (!open) setSelectedLineId(null);
            }}
          />
        )}
      </Card>
    </div>
  );
}

export default InventoryCampaignDetailPage;
