import { ROUTES } from "@/projects/catalog/config/routes";
import { DynamicModelTable } from "@/widgets/model-table";

export function BeneficiaireListPage() {
  return (
    <DynamicModelTable
      app="catalog"
      model="Benificiaire"
      create={{
        type: "link",
        hrefTemplate: ROUTES.BENEFICIAIRE_CREATE,
      }}
      update={{
        type: "link",
        hrefTemplate: ROUTES.BENEFICIAIRE_EDIT,
      }}
      detail={{
        type: "link",
        hrefTemplate: ROUTES.BENEFICIAIRE_DETAIL,
      }}
      baseTable={{
        tableConfig: {
          title: "Entités",
        },
      }}
    />
  );
}

export default BeneficiaireListPage;
