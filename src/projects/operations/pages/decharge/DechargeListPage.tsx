import { useNavigate } from "react-router-dom";
import { ROUTES } from "@/projects/operations/config/routes";
import { DynamicModelTable } from "@/widgets/model-table";

function replaceRouteId(pathTemplate: string, id: string): string {
  return pathTemplate.replace(":id", id);
}

export function DechargeListPage() {
  const navigate = useNavigate();

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
      baseTable={{
        tableConfig: {
          title: "Decharges",
        },
        columnActions: [
          {
            key: "details",
            label: "Details",
            onClick: ({ row }) => {
              const id = String(row.id ?? "");
              if (!id) return;
              navigate(replaceRouteId(ROUTES.DECHARGE_DETAIL, id));
            },
          },
        ],
      }}
    />
  );
}

export default DechargeListPage;
