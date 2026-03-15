import { ModelForm } from "@/widgets/model-form";
import type { OperationsDecharge } from "@/models";
import { today } from "@/widgets/model-form/inputs/date";
import { useParams } from "react-router-dom";

export function DechargeFormPage() {
  const { id = "" } = useParams();
  const isUpdate = Boolean(id);
  return (
    <ModelForm<OperationsDecharge>
      app="operations"
      model="Decharge"
      objectId={isUpdate ? id : undefined}
      title={isUpdate ? "Modification de la decharge" : "Creation de decharge"}
      mode={isUpdate ? "UPDATE" : "CREATE"}
      description="Saisissez les informations de la decharge pour l'article remis."
      onlyFields={[
        "beneficiaire",
        "dateDecharge",
        "site",
        "libelle",
        "codeInventaire",
        "serial",
        "etatSortie",
        "garder",
        "commentaire",
      ]}
      fieldOverrides={{
        libelle: { colSpan: 3 },
        commentaire: { colSpan: 3 },
      }}
      layout={{
        columns: 3,
        // ordering: { tailing: [ "codeInventaire"] },
      }}
      state={{
        defaultValues: {
          garder: false,
          dateDecharge: today(),
          site: "Rouiba",
        },
      }}
      actions={{
        submitLabel: "Enregistrer la decharge",
        resetLabel: "Reinitialiser",
        position: "sticky-bottom",
        showDirtyIndicator: true,
        confirmSubmit: {
          enabled: true,
          title: "Confirmer la creation",
          message: "Voulez-vous enregistrer cette decharge ?",
        },
      }}
    />
  );
}

export default DechargeFormPage;
