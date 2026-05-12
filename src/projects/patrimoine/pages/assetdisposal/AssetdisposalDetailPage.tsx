import { useParams } from "react-router-dom";
import type { PatrimoineAssetDisposal } from "@/models";
import { ModelDynamicDetail } from "@/widgets/model-details";

export function AssetdisposalDetailPage() {
  const { id = "" } = useParams();
  return <ModelDynamicDetail<PatrimoineAssetDisposal> app="patrimoine" model="AssetDisposal" id={id} />;
}

export default AssetdisposalDetailPage;
