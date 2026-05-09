import { useParams } from "react-router-dom";
import { AssetMovementForm } from "../../forms/AssetMovementForm";

export function AssetMovementFormPage() {
  const { id = "" } = useParams();
  const isUpdate = Boolean(id);

  return (
    <section className="space-y-4">
      <AssetMovementForm 
        mode={isUpdate ? "UPDATE" : "CREATE"} 
        objectId={isUpdate ? id : undefined} 
      />
    </section>
  );
}

export default AssetMovementFormPage;
