import { useParams } from "react-router-dom";
import type { MissionBaremePrimeMission } from "@/models";
import { ModelDynamicDetail } from "@/widgets/model-details";

export function BaremePrimeMissionDetailPage() {
  const { id = "" } = useParams();
  return (
    <ModelDynamicDetail<MissionBaremePrimeMission>
      app="mission"
      model="BaremePrimeMission"
      id={id}
    />
  );
}

export default BaremePrimeMissionDetailPage;
