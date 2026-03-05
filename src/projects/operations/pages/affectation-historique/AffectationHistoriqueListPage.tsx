import { ROUTES } from "@/projects/operations/config/routes";
import { DynamicModelTable } from "@/widgets/model-table";

export function AffectationHistoriqueListPage() {
  return (
    <DynamicModelTable
      app="operations"
      model="AffectationHistorique"
      create={{
        type: "link",
        hrefTemplate: ROUTES.AFFECTATION_HISTORIQUE_CREATE,
      }}
      update={{
        type: "link",
        hrefTemplate: ROUTES.AFFECTATION_HISTORIQUE_EDIT,
      }}
      detail={{
        type: "link",
        hrefTemplate: ROUTES.AFFECTATION_HISTORIQUE_DETAIL,
      }}
      baseTable={{
        tableConfig: {
          title: "Historique",
        },
      }}
    />
  );
}

export default AffectationHistoriqueListPage;
