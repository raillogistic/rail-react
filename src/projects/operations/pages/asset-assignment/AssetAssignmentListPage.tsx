import { Undo2 } from "lucide-react";
import { Link } from "react-router-dom";
import type { AssignmentsAssetAssignment } from "@/models";
import { ROUTES } from "@/projects/operations/config/routes";
import { DynamicModelTable } from "@/widgets/model-table";

export function AssetAssignmentListPage() {
  return (
    <DynamicModelTable<any>
      app="assignments"
      model="AssetAssignment"
      create={{
        type: "link",
        hrefTemplate: ROUTES.ASSET_ASSIGNMENT_CREATE,
      }}
      update={{
        type: "link",
        hrefTemplate: ROUTES.ASSET_ASSIGNMENT_EDIT,
      }}
      detail={{
        type: "link",
        hrefTemplate: ROUTES.ASSET_ASSIGNMENT_DETAIL,
      }}
      baseTable={{
        columnActions: [
          {
            key: "restitute",
            render: ({ row }) => {
              if (row.endDate) return null;
              return (
                <Link
                  to={`${ROUTES.RESTITUTION_CREATE}?assetId=${row.asset?.id}`}
                  className="flex items-center gap-2 px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground rounded-sm w-full"
                >
                  <Undo2 className="h-4 w-4" />
                  <span>Restituer</span>
                </Link>
              );
            }
          },
        ],
        fields: [
          "asset",
          "assignedToEmployee",
          "assignedToService",
          "startDate",
          "endDate",
          "reason",
          "status",
        ],
        tableConfig: {
          title: "Asset Assignment",
        },
        customMutations: ({ row }) => {
          return {
            overrides: {
              cancelAssetAssignment: {
                hidden: row.status === "cancelled",
              },
            },
          };
        },
      }}
    />
  );
}

export default AssetAssignmentListPage;
