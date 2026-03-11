import { ModelForm } from "@/widgets/model-form";
import { today } from "@/widgets/model-form/inputs/date";

export function DechargeCreatePage() {
  return (
    <ModelForm
      app="operations"
      model="Decharge"
      title="Creation de decharge"
      mode="CREATE"
      description="Saisissez les informations de la decharge pour l'article remis."
      onlyFields={[
        "beneficiaire",
        "dateDecharge",
        "site",
        "libelle",
        "etatSortie",
        "serial",
        "codeInventaire",
        "etat",
        "garder",
        "commentaire",
      ]}
      layout={{
        columns: 3,
        ordering: { tailing: ["commentaire"] },
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

export default DechargeCreatePage;
