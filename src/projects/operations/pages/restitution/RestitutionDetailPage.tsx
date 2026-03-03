import { useParams } from "react-router-dom";
import { ModelDynamicDetail } from "@/widgets/model-details";

export function RestitutionDetailPage() {
  const { id = "" } = useParams();
  return <ModelDynamicDetail app="operations" model="Restitution" id={id} />;
}

export default RestitutionDetailPage;
