import { useParams } from "react-router-dom";
import { ModelDynamicDetail } from "@/widgets/model-details";

export function OrdreMissionDetailPage() {
  const { id = "" } = useParams();
  return <ModelDynamicDetail app="mission" model="OrdreMission" id={id} />;
}

export default OrdreMissionDetailPage;
