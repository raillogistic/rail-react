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
        fieldOverrides={{
          campaign: { readOnly: true },
          asset: { readOnly: true },
          expectedLocation: { readOnly: true },
          checkedBy: { hidden: true },
          checkedAt: { hidden: true },
        }}
      />
    </section>
  );
}

export default InventoryLineFormPage;
