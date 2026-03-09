import { useParams } from "react-router-dom";
import { ModelForm } from "@/widgets/model-form";

export function OrdreMissionFormPage() {
  const { id = "" } = useParams();
  const isUpdate = Boolean(id);

  return (
    <section className="space-y-4">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">
          {isUpdate ? "Modifier un ordre de mission" : "Creer un ordre de mission"}
        </h1>
        <p className="text-sm text-muted-foreground">
          Le formulaire affiche les champs utiles selon le moyen de transport
          choisi.
        </p>
      </header>
      <ModelForm
        title={isUpdate ? "Modifier Ordre Mission" : "Creer Ordre Mission"}
        app="mission"
        model="OrdreMission"
        mode={isUpdate ? "UPDATE" : "CREATE"}
        objectId={isUpdate ? id : undefined}
        description="Selectionnez un vehicule ou un avion pour adapter la saisie."
        onlyFields={[
          "beneficiaire",
          "objet",
          "destination",
          "lieuDepart",
          "dateDepart",
          "dateRetour",
          "nombreJours",
          "moyenTransport",
          "vehicule",
          "commentaire",
        ]}
        fieldOverrides={{
          beneficiaire: { colSpan: 2 },
          objet: { colSpan: 2 },
          destination: { colSpan: 2 },
          lieuDepart: { colSpan: 2 },
          nombreJours: {
            helpText: "Saisie par tranche de 0.5 : 0.5, 1.0, 1.5, 2.0...",
          },
          vehicule: {
            colSpan: 2,
            placeholder: "Choisir un vehicule de l'entreprise",
            helpText: "Champ visible et obligatoire uniquement pour un vehicule.",
            visible: (values) => values.moyenTransport === "vehicule",
          },
          commentaire: { colSpan: 2 },
        }}
        layout={{
          columns: 2,
          ordering: {
            order: [
              "beneficiaire",
              "objet",
              "destination",
              "lieuDepart",
              "dateDepart",
              "dateRetour",
              "nombreJours",
              "moyenTransport",
              "vehicule",
            ],
            tailing: ["commentaire"],
          },
        }}
        behavior={{
          conditions: {
            vehicule: (values) => values.moyenTransport === "vehicule",
          },
          dependencies: {
            vehicule: {
              watch: ["moyenTransport"],
              effect: "clear",
            },
          },
        }}
        actions={{
          submitLabel: isUpdate
            ? "Enregistrer les modifications"
            : "Enregistrer l'ordre de mission",
          resetLabel: "Reinitialiser",
          position: "sticky-bottom",
          showDirtyIndicator: true,
        }}
      />
    </section>
  );
}

export default OrdreMissionFormPage;
