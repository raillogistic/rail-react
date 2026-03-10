import { ROUTES } from "@/projects/missions/config/routes";
import { DynamicModelTable } from "@/widgets/model-table";

export function OrdreMissionListPage() {
  return (
    <DynamicModelTable
      app="mission"
      model="OrdreMission"
      create={{
        type: "link",
        hrefTemplate: ROUTES.ORDRE_MISSION_CREATE,
      }}
      update={{
        type: "link",
        hrefTemplate: ROUTES.ORDRE_MISSION_EDIT,
      }}
      detail={{
        type: "link",
        hrefTemplate: ROUTES.ORDRE_MISSION_DETAIL,
      }}
      baseTable={{
        fields: {
          include: [
            "numero",
            "statut",
            "beneficiaire",
            "objet",
            "destination",
            "dateDepart",
            "dateRetour",
            "moyenTransport",
            "vehicule",
            "valableEtranger",
            "repas",
            "hebergement",
            "primeRepas",
            "primeHebergement",
            "primeTotale",
          ],
        },
        columnOrdering: {
          mode: "config",
          order: [
            "numero",
            "statut",
            "beneficiaire",
            "objet",
            "destination",
            "dateDepart",
            "dateRetour",
            "moyenTransport",
            "vehicule",
            "valableEtranger",
            "repas",
            "hebergement",
            "primeRepas",
            "primeHebergement",
            "primeTotale",
          ],
        },
        tableConfig: {
          title: "Ordre",
          pdfPreview: {
            enabled: true,
          },
        },
      }}
    />
  );
}

export default OrdreMissionListPage;
