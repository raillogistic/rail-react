import { ROUTES } from "@/projects/operations/config/routes";
import type { OperationsDecharge } from "@/models";
import { DynamicModelTable } from "@/widgets/model-table";
import { calculateDatePreset } from "@/widgets/model-table/filtering/datePresets";
import type { ModelTableNavFiltersConfig } from "@/widgets/model-table";

const dechargeNavFilters: ModelTableNavFiltersConfig = {
  groups: [
    {
      key: "status",
      label: "status",
      defaultItemKey: "all",
      items: [
        { key: "all", label: "all", clear: true },
        {
          key: "brouillon",
          label: "Brouillon",
          variables: { where: { statut: { eq: "brouillon" } } },
          count: 10,
        },
        {
          key: "validated",
          label: "Validée",
          variables: { where: { statut: { eq: "validee" } } },
        },
        {
          key: "canceled",
          label: "Annulée",
          variables: { where: { statut: { eq: "annulee" } } },
        },
      ],
    },
    {
      key: "period",
      label: "period",
      defaultItemKey: "all",
      items: [
        { key: "all", label: "all", clear: true },
        {
          key: "today",
          label: "Aujourd'hui",
          resolveVariables: () => {
            const [date] = calculateDatePreset("today");
            return { where: { dateDecharge: { eq: date } } };
          },
        },
        {
          key: "this_week",
          label: "Cette semaine",
          resolveVariables: () => {
            const [start, end] = calculateDatePreset("thisWeek");
            return { where: { dateDecharge: { between: [start, end] } } };
          },
        },
        {
          key: "this_month",
          label: "Ce mois",
          resolveVariables: () => {
            const [start, end] = calculateDatePreset("thisMonth");
            return { where: { dateDecharge: { between: [start, end] } } };
          },
        },
        {
          key: "this_year",
          label: "Cette année",
          resolveVariables: () => {
            const [start, end] = calculateDatePreset("thisYear");
            return { where: { dateDecharge: { between: [start, end] } } };
          },
        },
      ],
    },
  ],
};

export function DechargeListPageTabs() {
  return (
    <DynamicModelTable<OperationsDecharge>
      app="operations"
      model="Decharge"
      navFilters={dechargeNavFilters}
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
