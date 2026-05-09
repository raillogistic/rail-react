import { useParams } from "react-router-dom";
import { AssetAssignmentForm } from "../../forms/AssetAssignmentForm";

export function AssetAssignmentFormPage() {
  const { id = "" } = useParams();
  const isUpdate = Boolean(id);

  return (
    <section className="space-y-4">
      <AssetAssignmentForm 
        mode={isUpdate ? "UPDATE" : "CREATE"} 
        objectId={isUpdate ? id : undefined} 
      />
    </section>
  );
}

export default AssetAssignmentFormPage;
