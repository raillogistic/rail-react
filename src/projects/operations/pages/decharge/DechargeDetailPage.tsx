import { useParams } from "react-router-dom";
import { ModelDynamicDetail } from "@/widgets/model-details";

export function DechargeDetailPage() {
  const { id = "" } = useParams();
  return <ModelDynamicDetail app="operations" model="Decharge" id={id} />;
}

export default DechargeDetailPage;
