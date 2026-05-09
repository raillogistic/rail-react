import { useParams } from "react-router-dom";
import type { PatrimoineAssetFinancialProfile } from "@/models";
import { ModelForm } from "@/widgets/model-form";

export function AssetFinancialProfileFormPage() {
  const { id = "" } = useParams();
  const isUpdate = Boolean(id);

  return (
    <section className="space-y-4">
      <ModelForm<PatrimoineAssetFinancialProfile>
        title={isUpdate ? "Modifier Asset Financial Profile" : "Creer Asset Financial Profile"}
        app="patrimoine"
        model="AssetFinancialProfile"
        mode={isUpdate ? "UPDATE" : "CREATE"}
        objectId={isUpdate ? id : undefined}
      />
    </section>
  );
}

export default AssetFinancialProfileFormPage;
