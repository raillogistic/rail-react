import { useParams } from "react-router-dom";
import type { AssignmentsAssetAssignment } from "@/models";
import { ModelDynamicDetail } from "@/widgets/model-details";

export function AssetAssignmentDetailPage() {
  const { id = "" } = useParams();
  return (
    <ModelDynamicDetail<AssignmentsAssetAssignment> 
      app="assignments" 
      model="AssetAssignment" 
      id={id} 
      baseDetail={{
        actions: {
          customMutations: ({ data }) => {
            return {
              overrides: {
                cancel: {
                  hidden: data?.status === "cancelled",
                },
              },
            };
          },
        },
      }}
    />
  );
}

export default AssetAssignmentDetailPage;
