import { ROUTES } from "@/projects/missions/config/routes";
import { DynamicModelTable } from "@/widgets/model-table";

export function BaremePrimeMissionListPage() {
  return (
    <DynamicModelTable
      app="mission"
      model="BaremePrimeMission"
      create={{
        type: "link",
        hrefTemplate: ROUTES.BAREME_PRIME_MISSION_CREATE,
      }}
      update={{
        type: "link",
        hrefTemplate: ROUTES.BAREME_PRIME_MISSION_EDIT,
      }}
      detail={{
        type: "link",
        hrefTemplate: ROUTES.BAREME_PRIME_MISSION_DETAIL,
      }}
      baseTable={{
        tableConfig: {
          title: "Barèmes",
        },
      }}
    />
  );
}

export default BaremePrimeMissionListPage;
