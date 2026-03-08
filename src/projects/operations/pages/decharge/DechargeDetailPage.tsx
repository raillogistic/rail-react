import { useParams } from "react-router-dom";
import { CustomMutationAction } from "@/widgets/components/CustomMutationAction";
import { Send } from "lucide-react";
import { CustomMutationsDropdown } from "@/widgets/components/CustomMutationsDropdown";

export function DechargeDetailPage() {
  const { id = "" } = useParams();

  return <></>;

  // <ModelDynamicDetail app="operations" model="Decharge" id={id} />;
}

export default DechargeDetailPage;
