import { useParams } from "react-router-dom";
import { ModelForm } from "@/widgets/model-form";

export function DechargeLigneFormPage() {
  const { id = "" } = useParams();
  const isUpdate = Boolean(id);

  return (
    <section className="space-y-4">
      <ModelForm
        title={isUpdate ? "Modifier Decharge Ligne" : "Créer Decharge Ligne"}
        app="operations"
        model="DechargeLigne"
        mode={isUpdate ? "UPDATE" : "CREATE"}
        objectId={isUpdate ? id : undefined}
      />
    </section>
  );
}

export default DechargeLigneFormPage;
