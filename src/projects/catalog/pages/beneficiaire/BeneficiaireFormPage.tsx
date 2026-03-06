import { useParams } from "react-router-dom";
import { ModelForm } from "@/widgets/model-form";

export function BeneficiaireFormPage() {
  const { id = "" } = useParams();
  const isUpdate = Boolean(id);

  return (
    <section className="space-y-4">
      <ModelForm
        title={isUpdate ? "Modifier Beneficiaire" : "Créer Beneficiaire"}
        app="catalog"
        model="Benificiaire"
        mode={isUpdate ? "UPDATE" : "CREATE"}
        objectId={isUpdate ? id : undefined}
      />
    </section>
  );
}

export default BeneficiaireFormPage;
