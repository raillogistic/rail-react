import { ROUTES } from "@/projects/operations/config/routes";
import { DynamicModelTable } from "@/widgets/model-table";

export function RestitutionListPage() {
  return (
    <DynamicModelTable
      app="operations"
      model="Restitution"
      create={{
        type: "link",
        hrefTemplate: ROUTES.RESTITUTION_CREATE,
      }}
      update={{
        type: "link",
        hrefTemplate: ROUTES.RESTITUTION_EDIT,
      }}
      detail={{
        type: "link",
        hrefTemplate: ROUTES.RESTITUTION_DETAIL,
      }}
      baseTable={{
        tableConfig: {
          title: "Restitutions",
        },
      }}
    />
  );
}

export default RestitutionListPage;
