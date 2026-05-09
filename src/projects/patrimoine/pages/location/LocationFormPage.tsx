import { useParams } from "react-router-dom";
import { LocationForm } from "../../forms/LocationForm";

export function LocationFormPage() {
  const { id = "" } = useParams();
  const isUpdate = Boolean(id);

  return (
    <section className="space-y-4">
      <LocationForm 
        mode={isUpdate ? "UPDATE" : "CREATE"} 
        objectId={isUpdate ? id : undefined} 
      />
    </section>
  );
}

export default LocationFormPage;
