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
      baseTable={{
        tableConfig: {
          title: "Asset Assignment",
        },
      }}
    />
  );
}

export default AssetAssignmentListPage;
