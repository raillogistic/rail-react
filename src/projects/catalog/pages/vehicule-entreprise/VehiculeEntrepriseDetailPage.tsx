import { useParams } from "react-router-dom";
import type { CatalogVehicule } from "@/models";
import { ModelDynamicDetail } from "@/widgets/model-details";

export function VehiculeDetailPage() {
  const { id = "" } = useParams();
  return (
    <ModelDynamicDetail<CatalogVehicule>
      app="catalog"
      model="Vehicule"
      id={id}
    />
  );
}

export default VehiculeDetailPage;
