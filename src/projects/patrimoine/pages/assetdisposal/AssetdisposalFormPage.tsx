import { useParams, useNavigate } from "react-router-dom";
import type { PatrimoineAssetDisposal } from "@/models";
import { ModelForm } from "@/widgets/model-form";
import { AssetSelectionField } from "./components/AssetSelectionField";

export function AssetdisposalFormPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const isUpdate = Boolean(id);

  return (
    <section className="space-y-4">
      <ModelForm<PatrimoineAssetDisposal>
        title={
          isUpdate
            ? "Modifier la Sortie"
            : "Enregistrer une Sortie de Patrimoine"
        }
        description="Gérez les sorties en masse (réforme, vente, don...) et sélectionnez les biens concernés."
        app="patrimoine"
        model="AssetDisposal"
        mode={isUpdate ? "UPDATE" : "CREATE"}
        objectId={isUpdate ? id : undefined}
        onSubmitResult={(result) => {
          if (result.ok) navigate("/patrimoine/assetdisposal");
        }}
        onlyRelationships={["documents", "assets"]}
        generatedSections={[
          {
            id: "general",
            title: "Informations Générales",
            columns: 2,
            fields: ["exitMethod", "date"],
          },
          {
            id: "details",
            title: "Détails",
            columns: 1,
            fields: ["reason", "notes", "assets"],
          },
        ]}
        fieldOverrides={{
          reason: {
            type: "textarea",
          },
          notes: {
            type: "textarea",
          },
          assets: {
            // M2M field with custom table selector
            type: "custom",
            label: "Biens concernés",
            helpText: "Sélectionnez les biens qui vont sortir du patrimoine.",
            render: (ctx) => <AssetSelectionField ctx={ctx} />,
          },
        }}
        nested={{
          documents: {
            title: "Pièces jointes (ex: PV de réforme)",
            itemLabel: "Document",
            columns: 1,
            addButton: { label: "Ajouter un document" },
          },
        }}
      />
    </section>
  );
}

export default AssetdisposalFormPage;
