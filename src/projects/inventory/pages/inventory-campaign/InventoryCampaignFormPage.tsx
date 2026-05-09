import { useParams } from "react-router-dom";
import type { InventoryInventoryCampaign } from "@/models";
import { ModelForm } from "@/widgets/model-form";

export function InventoryCampaignFormPage() {
  const { id = "" } = useParams();
  const isUpdate = Boolean(id);

  return (
    <section className="container mx-auto py-6">
      <ModelForm<InventoryInventoryCampaign>
        title={isUpdate ? "Modifier la campagne d'inventaire" : "Créer une campagne d'inventaire"}
        app="inventory"
        model="InventoryCampaign"
        mode={isUpdate ? "UPDATE" : "CREATE"}
        objectId={isUpdate ? id : undefined}
        fieldOverrides={{
          campaignCode: { hidden: true },
          status: { hidden: true },
          progression: { hidden: true },
          endDate: { hidden: true },
        }}
      />
    </section>
  );
}

export default InventoryCampaignFormPage;
