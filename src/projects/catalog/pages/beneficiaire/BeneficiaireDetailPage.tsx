import { useParams } from "react-router-dom";
import { ModelDynamicDetail } from "@/widgets/model-details";

export function BeneficiaireDetailPage() {
  const { id = "" } = useParams();
  return <ModelDynamicDetail app="catalog" model="Benificiaire" id={id} />;
}

export default BeneficiaireDetailPage;
