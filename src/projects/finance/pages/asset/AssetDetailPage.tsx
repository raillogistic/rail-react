import { useParams } from "react-router-dom";
import type { PatrimoineAsset } from "@/models";
import { ModelDynamicDetail } from "@/widgets/model-details";

export function AssetDetailPage() {
  const { id = "" } = useParams();
  return <ModelDynamicDetail<PatrimoineAsset> app="patrimoine" model="Asset" id={id} />;
}

export default AssetDetailPage;
