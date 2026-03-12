import { useParams } from "react-router-dom";
import type { MissionOrdreMission } from "@/models";
import { ModelDynamicDetail } from "@/widgets/model-details";

export function OrdreMissionDetailPage() {
  const { id = "" } = useParams();
  return (
    <ModelDynamicDetail<MissionOrdreMission>
      app="mission"
      model="OrdreMission"
      id={id}
    />
  );
}

export default OrdreMissionDetailPage;
