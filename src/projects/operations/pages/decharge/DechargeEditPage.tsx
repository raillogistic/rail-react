import { useParams } from "react-router-dom";
import { ModelForm } from "@/widgets/model-form";
import { DECHARGE_NESTED_CONFIG } from "./DechargeCreatePage";

export function DechargeEditPage() {
  const { id = "" } = useParams();

  return (
    <section className="space-y-4">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">
          Modifier une decharge
        </h1>
      </header>
      <ModelForm
        app="operations"
        model="Decharge"
        mode="UPDATE"
        objectId={id}
        onlyFields={[
          "beneficiaire",
          "dateDecharge",
          "site",
          "garder",
          "commentaire",
          // "pieceJointeUrl",
          "lignes",
        ]}
        devtools={{ enabled: true }}
        layout={{
          columns: 2,
          ordering: {
            enabled: true,
            tailing: ["lignes"],
          },
        }}
        // nested={["lignes"]}
        nested={DECHARGE_NESTED_CONFIG}
      />
    </section>
  );
}

export default DechargeEditPage;
