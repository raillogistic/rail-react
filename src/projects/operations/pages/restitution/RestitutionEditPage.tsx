import { useParams } from "react-router-dom";
import { ModelForm } from "@/widgets/model-form";

export function RestitutionEditPage() {
  const { id = "" } = useParams();

  return (
    <section className="space-y-4">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">
          Modifier une restitution
        </h1>
      </header>
      <ModelForm
        app="operations"
        model="Restitution"
        mode="UPDATE"
        objectId={id}
        onlyFields={[
          "origine",
          "decharge",
          "legacySource",
          "dateRestitution",
          "recuPar",
          "etatRetour",
          "serialRetour",
          "observation",
          "commentaire",
        ]}
        fieldOverrides={{
          observation: { colSpan: 3 },
          commentaire: { colSpan: 3 },
        }}
        layout={{ columns: 3 }}
      />
    </section>
  );
}

export default RestitutionEditPage;
