import { useParams } from "react-router-dom";
import type { PatrimoineAsset } from "@/models";
import { ModelForm } from "@/widgets/model-form";

export function AssetFormPage() {
  const { id = "" } = useParams();
  const isUpdate = Boolean(id);

  return (
    <section className="space-y-4">
      <ModelForm<PatrimoineAsset>
        title={isUpdate ? "Modifier Asset" : "Creer Asset"}
        app="patrimoine"
        model="Asset"
        mode={isUpdate ? "UPDATE" : "CREATE"}
        objectId={isUpdate ? id : undefined}
      />
    </section>
  );
}

export default AssetFormPage;
