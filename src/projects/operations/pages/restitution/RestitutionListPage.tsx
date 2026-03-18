import { ROUTES } from "@/projects/operations/config/routes";
import { Badge } from "@/shared/ui/kit/badge";
import type { OperationsRestitution } from "@/models";
import { DynamicModelTable } from "@/widgets/model-table";

const STATUS_LABELS: Record<string, string> = {
  brouillon: "Brouillon",
  validee: "Validee",
  annulee: "Annulee",
};

export function RestitutionListPageTabs() {
  return (
    <DynamicModelTable<OperationsRestitution>
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
        fields: {
          include: [
            { accessor: "numero", title: "Numero" },
            {
              accessor: "origine",
              title: "Origine",
              render: (value) => (
                <Badge variant="outline">
                  {value === "legacy" ? "Legacy" : "Decharge"}
                </Badge>
              ),
            },
            {
              accessor: "desc",
              title: "Article",
            },
            {
              accessor: "decharge",
              title: "Source",
              render: (_value, row) =>
                row.decharge?.numero ||
                row.legacySource?.referenceDechargeLegacy ||
                row.legacySource?.libelle ||
                "-",
            },
            { accessor: "dateRestitution", title: "Date de restitution" },
            { accessor: "recuPar", title: "Recu par" },
            {
              accessor: "etatRetour",
              title: "Etat au retour",
              render: (_value, row) => row.etatRetour?.libelle || "-",
            },
            {
              accessor: "statut",
              title: "Statut",
              render: (value) => (
                <Badge variant={value === "annulee" ? "destructive" : "secondary"}>
                  {STATUS_LABELS[String(value || "")] || String(value || "-")}
                </Badge>
              ),
            },
          ],
        },
        tableConfig: {
          title: "Restitutions",
        },
      }}
    />
  );
}

export default RestitutionListPageTabs;
