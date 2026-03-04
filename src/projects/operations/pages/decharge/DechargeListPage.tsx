import { ROUTES } from "@/projects/operations/config/routes";
import { DynamicModelTable } from "@/widgets/model-table";

export function DechargeListPage() {
  return (
    <DynamicModelTable
      app="operations"
      model="Decharge"
      create={{
        type: "link",
        hrefTemplate: ROUTES.DECHARGE_CREATE,
      }}
      update={{
        type: "link",
        hrefTemplate: ROUTES.DECHARGE_EDIT,
      }}
      detail={{
        type: "link",
        hrefTemplate: ROUTES.DECHARGE_DETAIL,
      }}
      devtools={{
        enabled: true,
      }}
      baseTable={{
        fields: [
          "numero",
          "beneficiaire",
          "date_decharge",
          "site",
          "commentaire",
          "statut",
        ],
        tableConfig: {
          title: "Decharges",
        },
      }}
    />
  );
}

export default DechargeListPage;
