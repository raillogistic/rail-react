import { useParams } from "react-router-dom";
import { CustomMutationAction } from "@/widgets/components/CustomMutationAction";
import { Send } from "lucide-react";
import { CustomMutationsDropdown } from "@/widgets/components/CustomMutationsDropdown";
import { ModelTemplateAction } from "@/widgets/components/ModelTemplateAction";
import { ModelTemplatesDropdown } from "@/widgets/components/ModelTemplatesDropdown";
import { ModelDynamicDetail } from "@/widgets/model-details";
import { OperationsDecharge } from "@/models";

export function DechargeDetailPage() {
  const { id = "" } = useParams();

  return (
    <ModelDynamicDetail<OperationsDecharge>
      app="operations"
      model="Decharge"
      id={id}
    />
  );
}

export default DechargeDetailPage;
