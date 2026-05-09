import { useParams } from "react-router-dom";
import type { LocationsLocation } from "@/models";
import { ModelDynamicDetail } from "@/widgets/model-details";

export function LocationDetailPage() {
  const { id = "" } = useParams();
  return <ModelDynamicDetail<LocationsLocation> app="locations" model="Location" id={id} />;
}

export default LocationDetailPage;
