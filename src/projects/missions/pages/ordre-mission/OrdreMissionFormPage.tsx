import { useParams } from "react-router-dom";
import { ModelForm } from "@/widgets/model-form";
import { today } from "@/widgets/model-form/inputs/date";

type OrdreMissionFormValues = {
  beneficiaire?: string;
  objet?: string;
  valableEtranger?: boolean;
  destination?: string;
  dateDepart?: string;
  dateRetour?: string;
  repas?: number;
  hebergement?: number;
  primeRepas?: number | string;
  avancePrime?: number | string;
  moyenTransport?: string;
  vehicule?: string;
  commentaire?: string;
  adresseAdministrative?: string;
};

export function OrdreMissionFormPage() {
  const { id = "" } = useParams();
  const isUpdate = Boolean(id);

  return (
    <section className="space-y-4">
      {/* <header>
        <h1 className="text-2xl font-semibold tracking-tight">
          {isUpdate
            ? "Modifier un ordre de mission"
            : "Creer un ordre de mission"}
        </h1>
        <p className="text-sm text-muted-foreground">
          Le formulaire affiche les champs utiles selon le moyen de transport
          choisi.
        </p>
      </header> */}
      <ModelForm<OrdreMissionFormValues>
        title={isUpdate ? "Modifier Ordre Mission" : "Creer Ordre Mission"}
        app="mission"
        model="OrdreMission"
        mode={isUpdate ? "UPDATE" : "CREATE"}
        objectId={isUpdate ? id : undefined}
        description="Selectionnez un vehicule ou un avion pour adapter la saisie."
        // onlyFields={[
        //   "beneficiaire",
        //   "objet",
        //   "valableEtranger",
        //   "destination",
        //   "dateDepart",
        //   "dateRetour",
        //   "repas",
        //   "hebergement",
        //   "primeRepas",
        //   "avancePrime",
        //   "moyenTransport",
        //   "vehicule",
        //   "commentaire",
        //   "adresseAdministrative",
        // ]}
        generatedSections={[
          {
            id: "general",
            title: "Informations generales",
            fields: [
              "objet",
              "beneficiaire",
              "adresseAdministrative",
              "destination",
              "valableEtranger",
            ],
            columns: 6,
          },
          {
            id: "dates",
            title: "Dates de mission",
            description: "Precisez la periode couverte par l'ordre de mission.",
            fields: ["dateDepart", "dateRetour"],
            columns: 6,
          },
          {
            id: "primes",
            title: "Primes et prise en charge",
            fields: ["repas", "hebergement", "avancePrime"],
            columns: 6,
          },
          {
            id: "transport",
            title: "Transport",
            description:
              "Selectionnez le moyen de transport et le vehicule si necessaire.",
            fields: ["moyenTransport", "vehicule"],
            columns: 6,
          },
          {
            id: "notes",
            title: "Commentaire",
            fields: ["commentaire"],
            columns: 6,
          },
        ]}
        state={{
          defaultValues: { dateDepart: today(), dateRetour: today() },
        }}
        fieldOverrides={{
          avancePrime: {},
          repas: {
            helpText:
              "Nombre de repas pris en charge pour le calcul de la prime.",
          },
          dateDepart: { colSpan: 3 },
          commentaire: { colSpan: 6 },
          dateRetour: { colSpan: 3 },
          destination: {
            colSpan: 6,
          },
          hebergement: {
            helpText:
              "Nombre d'hebergements pris en charge pour le calcul de la prime.",
          },
          primeRepas: {
            readOnly: true,
            helpText:
              "Calcule automatiquement a partir du bareme et du nombre de repas.",
          },
          adresseAdministrative: {
            type: "text",
          },
          vehicule: {
            placeholder: "Choisir un vehicule de l'entreprise",
            helpText:
              "Champ visible et obligatoire uniquement pour un vehicule.",
            visible: (values) => values.moyenTransport === "vehicule",
          },
        }}
        layout={{
          variant: "compact",
          // mode: { type: "wizard" },
          columns: 6,
          defaultColSpan: 2,
          showSectionHeaders: true,
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
