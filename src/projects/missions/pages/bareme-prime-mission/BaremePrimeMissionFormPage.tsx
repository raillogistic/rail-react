import { useParams } from "react-router-dom";
import { ModelForm } from "@/widgets/model-form";

export function BaremePrimeMissionFormPage() {
  const { id = "" } = useParams();
  const isUpdate = Boolean(id);

  return (
    <section className="space-y-4">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">
          {isUpdate
            ? "Modifier le bareme de prime de mission"
            : "Creer le bareme de prime de mission"}
        </h1>
        <p className="text-sm text-muted-foreground">
          Configurez le bareme actif puis ajoutez une ligne par categorie
          socio-professionnelle.
        </p>
      </header>
      <ModelForm
        title={
          isUpdate
            ? "Modifier Bareme Prime Mission"
            : "Creer Bareme Prime Mission"
        }
        app="mission"
        model="BaremePrimeMission"
        mode={isUpdate ? "UPDATE" : "CREATE"}
        objectId={isUpdate ? id : undefined}
        description="Un seul bareme peut etre actif. Chaque categorie doit apparaitre une seule fois dans ce bareme."
        onlyFields={["libelle", "actif", "defaultBarem", "lignes"]}
        nested={{
          lignes: {
            title: "Lignes du bareme",
            description:
              "Renseignez les montants de repas et d'hebergement pour chaque categorie.",
            onlyFields: [
              "categorieSocioProfessionnelle",
              "montantRepas",
              "montantHebergement",
            ],
            columns: 3,
            itemLabel: "Ligne",
            minItems: 1,
            addButton: {
              enabled: true,
              label: "Ajouter une ligne",
            },
            removeOperation: "delete",
            fieldOverrides: {
              montantRepas: {
                helpText: "Montant journalier de repas.",
              },
              montantHebergement: {
                helpText: "Montant journalier d'hebergement.",
              },
            },
          },
        }}
        fieldOverrides={{
          libelle: {
            colSpan: 2,
            helpText: "Exemple : Bareme mission 2026.",
          },
          actif: {
            helpText: "Le bareme actif est utilise pour calculer les primes.",
          },
        }}
        layout={{
          columns: 2,
          ordering: {
            order: ["libelle", "actif", "defaultBarem"],
          },
        }}
        actions={{
          submitLabel: isUpdate
            ? "Enregistrer les modifications"
            : "Enregistrer le bareme",
          resetLabel: "Reinitialiser",
          position: "sticky-bottom",
          showDirtyIndicator: true,
        }}
      />
    </section>
  );
}

export default BaremePrimeMissionFormPage;
