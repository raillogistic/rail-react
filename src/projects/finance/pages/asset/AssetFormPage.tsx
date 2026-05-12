import { useParams } from "react-router-dom";
import { AssetForm } from "@/projects/patrimoine/forms/AssetForm";

export function AssetFormPage() {
  const { id = "" } = useParams();
  const isUpdate = Boolean(id);

  return (
    <section className="space-y-4">
      <AssetForm 
        mode={isUpdate ? "UPDATE" : "CREATE"} 
        objectId={isUpdate ? id : undefined} 
      />
    </section>
  );
}

export default AssetFormPage;
