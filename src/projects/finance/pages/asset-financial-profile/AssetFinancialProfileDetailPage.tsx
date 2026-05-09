import { useParams } from "react-router-dom";
import type { PatrimoineAssetFinancialProfile } from "@/models";
import { ModelDynamicDetail } from "@/widgets/model-details";

export function AssetFinancialProfileDetailPage() {
  const { id = "" } = useParams();
  return <ModelDynamicDetail<PatrimoineAssetFinancialProfile> app="patrimoine" model="AssetFinancialProfile" id={id} />;
}

export default AssetFinancialProfileDetailPage;
