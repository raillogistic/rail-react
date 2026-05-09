import { useParams } from "react-router-dom";
import type { InventoryInventoryLine } from "@/models";
import { ModelDynamicDetail } from "@/widgets/model-details";

export function InventoryLineDetailPage() {
  const { id = "" } = useParams();
  return <ModelDynamicDetail<InventoryInventoryLine> app="inventory" model="InventoryLine" id={id} />;
}

export default InventoryLineDetailPage;
