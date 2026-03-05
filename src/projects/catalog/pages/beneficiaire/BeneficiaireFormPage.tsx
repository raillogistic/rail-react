import { useParams } from "react-router-dom";
import { ModelForm } from "@/widgets/model-form";

export function BeneficiaireFormPage() {
  const { id = "" } = useParams();
  const isUpdate = Boolean(id);

  return (
    <section className="space-y-4">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">
          {isUpdate ? "Edit Beneficiaire" : "Create Beneficiaire"}
        </h1>
      </header>
      <ModelForm
        app="operations"
        model="Beneficiaire"
        mode={isUpdate ? "UPDATE" : "CREATE"}
        objectId={isUpdate ? id : undefined}
      />
    </section>
  );
}

export default BeneficiaireFormPage;
