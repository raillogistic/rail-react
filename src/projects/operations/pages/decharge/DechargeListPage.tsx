import { ROUTES } from "@/projects/operations/config/routes";
import type { OperationsDecharge } from "@/models";
import { DynamicModelTable } from "@/widgets/model-table";

export function DechargeListPageTabs() {
  return (
    <DynamicModelTable<OperationsDecharge>
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
        fields: { exclude: ["numeroAnnee", "numeroSequence"] },
        tableConfig: {
          title: "Decharges",
          pdfPreview: {
            enabled: true,
          },
        },
      }}
    />
  );
}

export default DechargeListPageTabs;
