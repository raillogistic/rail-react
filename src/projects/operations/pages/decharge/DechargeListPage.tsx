import { ROUTES } from "@/projects/operations/config/routes";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/kit/tabs";
import { DynamicModelTable } from "@/widgets/model-table";
import DechargeLigneListPage from "../decharge-ligne/DechargeLigneListPage";
import { useContext } from "react";
import { ConnectedAuthProvider, usePermissions } from "@/features/auth";

export function DechargeListPageTabs() {
  return (
    <Tabs defaultValue="decharges" className="w-full">
      <div className="mb-4 overflow-x-auto">
        <TabsList className="w-full justify-start sm:w-auto">
          <TabsTrigger value="decharges">Décharges</TabsTrigger>
          <TabsTrigger value="details">Détails</TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="decharges" className="mt-0">
        <DechargeListPage />
      </TabsContent>

      <TabsContent value="details" className="mt-0">
        <DechargeLigneListPage />
      </TabsContent>
    </Tabs>
  );
}

function DechargeListPage() {
  const c = usePermissions();
  console.log(c);

  return (
    <DynamicModelTable
      app="operations"
      model="Decharge"
      create={{
        type: "link",
        hrefTemplate: ROUTES.DECHARGE_CREATE,
      }}
      update={{
        type: "link",
        hrefTemplate: ROUTES.DECHARGE_EDIT,
      }}
      detail={{
        type: "link",
        hrefTemplate: ROUTES.DECHARGE_DETAIL,
      }}
      devtools={{
        enabled: true,
      }}
      baseTable={{
        fields: { exclude: ["numero_annee", "numero_sequence"] },
        // fields: [
        //   "numero",
        //   "beneficiaire",
        //   "date_decharge",
        //   "site",
        //   "commentaire",
        //   "statut",
        // ],
        tableConfig: {
          title: "Decharges",
          pdfPreview: {
            enabled: true,
            title: "PDF preview",
            description: "Preview the PDF without leaving the current page.",
            openInNewTabLabel: "Open in a new tab",
          },
        },
      }}
    />
  );
}

export default DechargeListPageTabs;
