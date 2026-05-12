import { useParams } from "react-router-dom";
import type { PatrimoineAssetFinancialProfile } from "@/models";
import { ModelForm } from "@/widgets/model-form";

export function AssetFinancialProfileFormPage() {
  const { id = "" } = useParams();
  const isUpdate = Boolean(id);

  return (
    <section className="space-y-4">
      <ModelForm<PatrimoineAssetFinancialProfile>
        title={isUpdate ? "Modifier le Profil Financier" : "Créer un Profil Financier"}
        description="Gérez les informations d'amortissement et les valeurs financières du bien."
        app="patrimoine"
        model="AssetFinancialProfile"
        mode={isUpdate ? "UPDATE" : "CREATE"}
        objectId={isUpdate ? id : undefined}
        generatedSections={[
          {
            id: "identification",
            title: "Identification",
            columns: 1,
            fields: ["asset"],
          },
          {
            id: "depreciation",
            title: "Amortissement",
            columns: 2,
            fields: [
              "depreciableBaseValue",
              "residualValue",
              "depreciationMethod",
              "depreciationDurationMonths",
              "depreciationStartDate"
            ],
          },
          {
            id: "exit",
            title: "Sortie",
            columns: 1,
            fields: ["exitValue"],
          },
        ]}
        fieldOverrides={{
          asset: { disabled: isUpdate },
        }}
      />
    </section>
  );
}

export default AssetFinancialProfileFormPage;
