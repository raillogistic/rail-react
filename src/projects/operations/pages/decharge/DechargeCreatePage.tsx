import { ModelForm } from "@/widgets/model-form";

export function DechargeCreatePage() {
  return (
    <ModelForm
      app="operations"
      model="Decharge"
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
        "garder",
        "commentaire",
      ]}
      fieldOverrides={{
        libelle: { colSpan: 2 },
        commentaire: { colSpan: 2 },
      }}
      layout={{ columns: 2 }}
      state={{
        defaultValues: {
          garder: false,
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
