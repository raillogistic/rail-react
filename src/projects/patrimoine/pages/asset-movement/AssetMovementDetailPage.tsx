import { useParams } from "react-router-dom";
import type { LocationsAssetMovement } from "@/models";
import { ModelDynamicDetail } from "@/widgets/model-details";

export function AssetMovementDetailPage() {
  const { id = "" } = useParams();
  return <ModelDynamicDetail<LocationsAssetMovement> app="locations" model="AssetMovement" id={id} />;
}

export default AssetMovementDetailPage;
