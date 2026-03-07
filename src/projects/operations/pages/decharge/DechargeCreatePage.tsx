import { ModelForm, type ModelFormProps } from "@/widgets/model-form";

type DechargeCreateValues = {
  lignes?: Array<{
    article?: string;
    qteSortie?: number | string;
    etatSortie?: string;
    serial?: string;
  }>;
};

export const DECHARGE_NESTED_CONFIG: NonNullable<
  ModelFormProps<DechargeCreateValues>["nested"]
> = {
  lignes: {
    title: "Lignes de decharge",
    description: "Ajoutez au moins une ligne article + quantite + etat.",
    itemLabel: "Ligne",
    onlyFields: [
      // "article",
      "libelle",
      "qteSortie",
      "etatSortie",
      "serial",
      // "metadata_snapshot",
    ],
    customOrder: [
      // "article",
      "qteSortie",
      "etatSortie",
      "serial",
      "metadataSnapshot",
    ],
    fieldsOrder: "custom",
    columns: 4,

    collapsible: true,

    addButton: {
      enabled: true,
      label: "Ajouter une ligne",
    },
    sortable: {
      enabled: true,
      mode: "buttons",
    },
  },
};

export function DechargeCreatePage() {
  return (
    <>
      <ModelForm<any>
        app="operations"
        model="Decharge"
        mode="CREATE"
        description="Saisissez les informations de la decharge puis ajoutez les lignes d'articles."
        onlyFields={[
          "beneficiaire",
          "dateDecharge",
          "site",
          "garder",
          "commentaire",
          // "pieceJointeUrl",
          "lignes",
        ]}
        nested={DECHARGE_NESTED_CONFIG}
        fieldOverrides={{
          commentaire: {
            colSpan: 2,
          },
        }}
        state={{
          defaultValues: {
            site: "dmlskqdqs",
            lignes: [{ qteSortie: 1, serial: "dsmlkdqmslk", article: "2" }],
          },
          // persistKey: "operations.decharge.create.draft",
        }}
        behavior={{
          validate: (values) => {
            const lines = values.lignes;
            if (Array.isArray(lines) && lines.length > 0) return undefined;
            return { lignes: "Ajoutez au moins une ligne de decharge." };
          },
        }}
        layout={{
          columns: 2,
          ordering: {
            enabled: true,
            tailing: ["lignes"],
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
            message: "Voulez-vous enregistrer cette decharge et ses lignes ?",
          },
        }}
        // loadingFallback={
        //   <div className="rounded-md border p-3 text-sm text-muted-foreground">
        //     Chargement du formulaire de creation de decharge...
        //   </div>
        // }
      />
    </>
  );
}

export default DechargeCreatePage;
