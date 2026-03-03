import { useNavigate } from "react-router-dom";
import { ROUTES } from "@/projects/operations/config/routes";
import { DynamicModelTable } from "@/widgets/model-table";

function replaceRouteId(pathTemplate: string, id: string): string {
  return pathTemplate.replace(":id", id);
}

export function RestitutionListPage() {
  const navigate = useNavigate();

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
      baseTable={{
        tableConfig: {
          title: "Restitutions",
        },
        columnActions: [
          {
            key: "details",
            label: "Details",
            onClick: ({ row }) => {
              const id = String(row.id ?? "");
              if (!id) return;
              navigate(replaceRouteId(ROUTES.RESTITUTION_DETAIL, id));
            },
          },
        ],
      }}
    />
  );
}

export default RestitutionListPage;
