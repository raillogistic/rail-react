import { useParams } from "react-router-dom";
import { ModelDynamicDetail } from "@/widgets/model-details";

export function BaremePrimeMissionDetailPage() {
  const { id = "" } = useParams();
  return <ModelDynamicDetail app="mission" model="BaremePrimeMission" id={id} />;
}

export default BaremePrimeMissionDetailPage;
