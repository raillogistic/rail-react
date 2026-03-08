import { useParams } from "react-router-dom";
import { CustomMutationAction } from "@/widgets/components/CustomMutationAction";
import { Send } from "lucide-react";
import { CustomMutationsDropdown } from "@/widgets/components/CustomMutationsDropdown";
import { ModelTemplateAction } from "@/widgets/components/ModelTemplateAction";
import { ModelTemplatesDropdown } from "@/widgets/components/ModelTemplatesDropdown";

export function DechargeDetailPage() {
  const { id = "" } = useParams();

  return (
    <>
      <ModelTemplatesDropdown
        data={{
          app: "operations",
          model: "Decharge",
          objectId: id,
        }}
      />
      <ModelTemplateAction
        data={{
          app: "operations",
          model: "Decharge",
          funcName: "print_decharge",
          objectId: id,
        }}
        button={{
          label: "impression",
        }}
      />
    </>
  );

  // <ModelDynamicDetail app="operations" model="Decharge" id={id} />;
}

export default DechargeDetailPage;
