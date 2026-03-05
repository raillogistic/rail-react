import { useParams } from "react-router-dom";
import { ModelDynamicDetail } from "@/widgets/model-details";

export function AffectationHistoriqueDetailPage() {
  const { id = "" } = useParams();
  return <ModelDynamicDetail app="operations" model="AffectationHistorique" id={id} />;
}

export default AffectationHistoriqueDetailPage;
