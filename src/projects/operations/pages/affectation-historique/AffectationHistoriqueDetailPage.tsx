import { useParams } from "react-router-dom";
import type { OperationsAffectationHistorique } from "@/models";
import { ModelDynamicDetail } from "@/widgets/model-details";

export function AffectationHistoriqueDetailPage() {
  const { id = "" } = useParams();
  return (
    <ModelDynamicDetail<OperationsAffectationHistorique>
      app="operations"
      model="AffectationHistorique"
      id={id}
    />
  );
}

export default AffectationHistoriqueDetailPage;
