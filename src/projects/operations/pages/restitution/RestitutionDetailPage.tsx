import { useParams } from "react-router-dom";
import type { OperationsRestitution } from "@/models";
import { ModelDynamicDetail } from "@/widgets/model-details";

export function RestitutionDetailPage() {
  const { id = "" } = useParams();
  return (
    <ModelDynamicDetail<OperationsRestitution>
      app="operations"
      model="Restitution"
      id={id}
    />
  );
}

export default RestitutionDetailPage;
