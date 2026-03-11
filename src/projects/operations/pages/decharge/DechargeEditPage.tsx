import { useParams } from "react-router-dom";
import { ModelForm } from "@/widgets/model-form";
import type { OperationsDecharge } from "@/models";

export function DechargeEditPage() {
  const { id = "" } = useParams();

  return (
    <section className="space-y-4">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">
          Modifier une decharge
        </h1>
      </header>
      <ModelForm<OperationsDecharge>
        app="operations"
        model="Decharge"
        mode="UPDATE"
        objectId={id}
        onlyFields={[
          "beneficiaire",
          "dateDecharge",
          "site",
          "libelle",
          "etatSortie",
          "serial",
          "codeInventaire",
          "commentaire",
          "garder",
        ]}
        fieldOverrides={{
          libelle: { colSpan: 2 },
          commentaire: { colSpan: 2 },
        }}
        layout={{ columns: 2 }}
      />
    </section>
  );
}

export default DechargeEditPage;
