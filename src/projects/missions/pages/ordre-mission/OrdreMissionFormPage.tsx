import { useParams } from "react-router-dom";
import { ModelForm } from "@/widgets/model-form";

export function OrdreMissionFormPage() {
  const { id = "" } = useParams();
  const isUpdate = Boolean(id);

  return (
    <section className="space-y-4">
      <ModelForm
        title={isUpdate ? "Modifier Ordre Mission" : "Créer Ordre Mission"}
        app="mission"
        model="OrdreMission"
        mode={isUpdate ? "UPDATE" : "CREATE"}
        objectId={isUpdate ? id : undefined}
      />
    </section>
  );
}

export default OrdreMissionFormPage;
