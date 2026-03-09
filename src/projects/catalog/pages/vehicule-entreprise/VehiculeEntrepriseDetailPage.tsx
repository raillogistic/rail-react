import { useParams } from "react-router-dom";
import { ModelDynamicDetail } from "@/widgets/model-details";

export function VehiculeDetailPage() {
  const { id = "" } = useParams();
  return <ModelDynamicDetail app="catalog" model="Vehicule" id={id} />;
}

export default VehiculeDetailPage;
