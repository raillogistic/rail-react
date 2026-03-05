import { ROUTES } from "@/projects/operations/config/routes";
import { DynamicModelTable } from "@/widgets/model-table";

export function BeneficiaireListPage() {
  return (
    <DynamicModelTable
      app="operations"
      model="Beneficiaire"
      create={{
        type: "link",
        hrefTemplate: ROUTES.BENEFICIAIRE_CREATE,
      }}
      update={{
        type: "link",
        hrefTemplate: ROUTES.BENEFICIAIRE_DETAIL,
      }}
      detail={{
        type: "link",
        hrefTemplate: ROUTES.BENEFICIAIRE_DETAIL,
      }}
      baseTable={{
        tableConfig: {
          title: "Bénéficiaire",
        },
      }}
    />
  );
}

export default BeneficiaireListPage;
