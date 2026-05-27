import type { LocationsLocation } from "@/models";
import { ROUTES } from "@/projects/patrimoine/config/routes";
import { DynamicModelTable } from "@/widgets/model-table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/kit/tabs";
import { LocationOrganigram } from "../../components/location/LocationOrganigram";

export function LocationListPage() {
  return (
    <div className="space-y-6">
      <Tabs defaultValue="list" className="w-full">
        <div className="flex justify-between items-center mb-4">
          <TabsList className="grid w-[400px] grid-cols-2">
            <TabsTrigger value="list">Vue Liste</TabsTrigger>
            <TabsTrigger value="organigram">Organigramme</TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="list" className="mt-0 border-none p-0 outline-none">
          <DynamicModelTable<any>
            app="locations"
            model="Location"
            create={{
              type: "link",
              hrefTemplate: ROUTES.LOCATION_CREATE,
            }}
            update={{
              type: "link",
              hrefTemplate: ROUTES.LOCATION_EDIT,
            }}
            detail={{
              type: "link",
              hrefTemplate: ROUTES.LOCATION_DETAIL,
            }}
            baseTable={{
              fields: ["code", "name", "level", "parent", "address", "isActive"],
              tableConfig: {
                title: "Localisations",
              },
            }}
          />
        </TabsContent>
        
        <TabsContent value="organigram" className="mt-0 border-none p-0 outline-none">
          <LocationOrganigram />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default LocationListPage;
