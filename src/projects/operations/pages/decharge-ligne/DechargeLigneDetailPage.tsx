import { useParams } from "react-router-dom";
import { ModelDynamicDetail } from "@/widgets/model-details";

export function DechargeLigneDetailPage() {
  const { id = "" } = useParams();
  return <ModelDynamicDetail app="operations" model="DechargeLigne" id={id} />;
}

export default DechargeLigneDetailPage;
