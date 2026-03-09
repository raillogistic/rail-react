import { useParams } from "react-router-dom";
import { ModelForm } from "@/widgets/model-form";

export function VehiculeFormPage() {
  const { id = "" } = useParams();
  const isUpdate = Boolean(id);

  return (
    <section className="space-y-4">
      <ModelForm
        title={
          isUpdate
            ? "Modifier Vehicule Entreprise"
            : "Créer Vehicule Entreprise"
        }
        app="catalog"
        model="Vehicule"
        mode={isUpdate ? "UPDATE" : "CREATE"}
        objectId={isUpdate ? id : undefined}
      />
    </section>
  );
}

export default VehiculeFormPage;
