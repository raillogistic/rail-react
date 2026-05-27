import { useParams } from "react-router-dom";
import type { LocationsLocation } from "@/models";
import { ModelDynamicDetail } from "@/widgets/model-details";
import { MapPin, Box, GitBranch } from "lucide-react";

export function LocationDetailPage() {
  const { id = "" } = useParams();
  return (
    <ModelDynamicDetail<LocationsLocation> 
      app="locations" 
      model="Location" 
      id={id} 
      baseDetail={{
        layout: {
          tabs: [
            { id: "general", title: "Général", order: 10, icon: <MapPin className="h-4 w-4" /> },
            { id: "assets", title: "Biens présents", order: 20, icon: <Box className="h-4 w-4" /> },
            { id: "sublocations", title: "Sous-emplacements", order: 30, icon: <GitBranch className="h-4 w-4" /> }
          ],
          sections: [
            {
              id: "general-info",
              title: "Informations générales",
              tabId: "general",
              order: 1,
              fields: ["code", "name", "level", "parent", "address"]
            }
          ]
        },
        nestedFields: {
          "assets": {
            tabId: "assets",
            title: "Biens dans cet emplacement",
            mode: "table"
          },
          "children": {
            tabId: "sublocations",
            title: "Sous-emplacements",
            mode: "table"
          }
        }
      }}
    />
  );
}

export default LocationDetailPage;
