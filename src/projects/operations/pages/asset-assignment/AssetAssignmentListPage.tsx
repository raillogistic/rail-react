import { Undo2 } from "lucide-react";
import type { AssignmentsAssetAssignment } from "@/models";
import { ROUTES } from "@/projects/operations/config/routes";
import { DynamicModelTable } from "@/widgets/model-table";

export function AssetAssignmentListPage() {
  return (
    <DynamicModelTable<AssignmentsAssetAssignment>
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
      rowActions={[
        {
          id: "restitute",
          label: "Restituer",
          icon: Undo2,
          type: "link",
          hrefTemplate: `${ROUTES.RESTITUTION_CREATE}?assetId={{record.asset.id}}`,
          // On ne peut restituer que si l'affectation est active (pas de date de fin)
          hidden: (record) => Boolean(record.endDate),
        },
      ]}
      baseTable={{
        tableConfig: {
          title: "Asset Assignment",
        },
        customMutations: ({ row }) => {
          return {
            overrides: {
              cancel: {
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
