import { useParams } from "react-router-dom";
import { ModelDynamicDetail } from "@/widgets/model-details";
import { CustomMutationAction } from "@/widgets/components/CustomMutationAction";
import { Send } from "lucide-react";

export function DechargeDetailPage() {
  const { id = "" } = useParams();

  return (
    <>
      <CustomMutationAction
        data={{
          app: "operations",
          model: "Decharge",
          funcName: "annuler",
          objectId: id,
        }}
        button={{
          label: "Annuler decharge",
          icon: <Send className="size-4" />,
          variant: "default",
          size: "sm",
        }}
        popup={{
          type: "drawer",
          title: "Publish order",
          description: "Fill the publish reason, then confirm.",
          width: "520px",
          drawerDirection: "right",
          closeOnSuccess: true,
        }}
        form={{
          fieldOverrides: {
            reason: {
              colSpan: 2,
              label: "Publish reason",
              placeholder: "Why are you publishing this order?",
              type: "textarea",
            },
          },
          actions: {
            submitLabel: "Publish now",
            resetLabel: "Cancel",
          },
        }}
        onSuccess={({ mutation, payload }) => {
          console.log("Custom mutation succeeded:", mutation.name, payload);
          // refetch table/detail data here if needed
        }}
        onError={(error) => {
          console.error("Custom mutation failed:", error.message);
        }}
      />
    </>
  );

  // <ModelDynamicDetail app="operations" model="Decharge" id={id} />;
}

export default DechargeDetailPage;
