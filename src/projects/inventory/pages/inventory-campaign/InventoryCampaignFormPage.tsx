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
        generatedSections={[
          {
            id: "general",
            title: "Informations Générales",
            columns: 1,
            fields: ["name"],
          },
          {
            id: "scope",
            title: "Périmètre",
            columns: 2,
            fields: ["scopeType", "scopeReferenceId"],
          },
          {
            id: "planning",
            title: "Planification",
            columns: 2,
            fields: ["startDate", "endDate"],
          },
        ]}
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
