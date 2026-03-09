import { ROUTES } from "@/projects/catalog/config/routes";
import { DynamicModelTable } from "@/widgets/model-table";

export function VehiculeListPage() {
  return (
    <DynamicModelTable
      app="catalog"
      model="Vehicule"
      create={{
        type: "link",
        hrefTemplate: ROUTES.VEHICULE_ENTREPRISE_CREATE,
      }}
      update={{
        type: "link",
        hrefTemplate: ROUTES.VEHICULE_ENTREPRISE_EDIT,
      }}
      detail={{
        type: "link",
        hrefTemplate: ROUTES.VEHICULE_ENTREPRISE_DETAIL,
      }}
      baseTable={{
        tableConfig: {
          title: "Véhicules",
        },
      }}
    />
  );
}

export default VehiculeListPage;
