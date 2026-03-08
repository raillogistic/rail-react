import { ROUTES } from "@/projects/operations/config/routes";
import { DynamicModelTable } from "@/widgets/model-table";

export function DechargeListPageTabs() {
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
        fields: { exclude: ["numero_annee", "numero_sequence"] },
        tableConfig: {
          title: "Decharges",
          pdfPreview: {
            enabled: true,
            title: "PDF preview",
            description: "Preview the PDF without leaving the current page.",
            openInNewTabLabel: "Open in a new tab",
          },
        },
      }}
    />
  );
}

export default DechargeListPageTabs;
