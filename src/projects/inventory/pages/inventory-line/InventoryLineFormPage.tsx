import { useParams } from "react-router-dom";
import type { InventoryInventoryLine } from "@/models";
import { ModelForm } from "@/widgets/model-form";

export function InventoryLineFormPage() {
  const { id = "" } = useParams();
  const isUpdate = Boolean(id);

  return (
    <section className="container mx-auto py-6">
      <ModelForm<InventoryInventoryLine>
        title={isUpdate ? "Saisir le résultat d'inventaire" : "Créer une ligne d'inventaire"}
        app="inventory"
        model="InventoryLine"
        mode={isUpdate ? "UPDATE" : "CREATE"}
        objectId={isUpdate ? id : undefined}
        generatedSections={[
          {
            id: "context",
            title: "Contexte",
            columns: 2,
            fields: ["campaign", "asset"],
          },
          {
            id: "location",
            title: "Localisation",
            columns: 2,
            fields: ["expectedLocation", "observedLocation"],
          },
          {
            id: "result",
            title: "Résultat",
            columns: 2,
            fields: ["result", "conditionComment"],
          },
        ]}
        fieldOverrides={{
          campaign: { readOnly: true },
          asset: { readOnly: true },
          expectedLocation: { readOnly: true },
          checkedBy: { hidden: true },
          checkedAt: { hidden: true },
          conditionComment: { type: "textarea", colSpan: 2 },
        }}
      />
    </section>
  );
}

export default InventoryLineFormPage;
