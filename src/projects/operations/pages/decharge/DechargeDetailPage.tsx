import { useParams } from "react-router-dom";
import { CustomMutationAction } from "@/widgets/components/CustomMutationAction";
import { Send } from "lucide-react";
import { CustomMutationsDropdown } from "@/widgets/components/CustomMutationsDropdown";
import { ModelTemplateAction } from "@/widgets/components/ModelTemplateAction";
import { ModelTemplatesDropdown } from "@/widgets/components/ModelTemplatesDropdown";
import { ModelDynamicDetail } from "@/widgets/model-details";
import type { OperationsDecharge } from "@/models";
import {
  useModelPageQuery,
  useModelSingleQuery,
} from "@/shared/api/graphql/graphql";

export function DechargeDetailPage() {
  const { id = "" } = useParams();
  const { data } = useModelPageQuery<OperationsDecharge>({
    app: "operations",
    model: "Decharge",
  });

  return (
    <ModelDynamicDetail<OperationsDecharge>
      app="operations"
      model="Decharge"
      id={id}
    />
  );
}

export default DechargeDetailPage;
