import { ROUTES } from "@/projects/operations/config/routes";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/shared/ui/kit/tabs";
import { DynamicModelTable } from "@/widgets/model-table";
import RestitutionLigneListPage from "../restitution-ligne/RestitutionLigneListPage";

export function RestitutionListPageTabs() {
  return (
    <Tabs defaultValue="restitutions" className="w-full">
      <div className="mb-4 overflow-x-auto">
        <TabsList className="w-full justify-start sm:w-auto">
          <TabsTrigger value="restitutions">Restitutions</TabsTrigger>
          <TabsTrigger value="details">Détails</TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="restitutions" className="mt-0">
        <RestitutionListPage />
      </TabsContent>

      <TabsContent value="details" className="mt-0">
        <RestitutionLigneListPage />
      </TabsContent>
    </Tabs>
  );
}

function RestitutionListPage() {
  return (
    <DynamicModelTable
      app="operations"
      model="Restitution"
      create={{
        type: "link",
        hrefTemplate: ROUTES.RESTITUTION_CREATE,
      }}
      update={{
        type: "link",
        hrefTemplate: ROUTES.RESTITUTION_EDIT,
      }}
      detail={{
        type: "link",
        hrefTemplate: ROUTES.RESTITUTION_DETAIL,
      }}
      baseTable={{
        tableConfig: {
          title: "Restitutions",
        },
      }}
    />
  );
}

export default RestitutionListPageTabs;
