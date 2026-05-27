import type { PatrimoineAssetDisposal } from "@/models";
import { ROUTES } from "@/projects/patrimoine/config/routes";
import { DynamicModelTable } from "@/widgets/model-table";

export function AssetdisposalListPage() {
  return (
    <DynamicModelTable<PatrimoineAssetDisposal>
      app="patrimoine"
      model="AssetDisposal"
      create={{
        type: "link",
        hrefTemplate: ROUTES.ASSETDISPOSAL_CREATE,
      }}
      update={{
        type: "link",
        hrefTemplate: ROUTES.ASSETDISPOSAL_EDIT,
      }}
      detail={{
        type: "link",
        hrefTemplate: ROUTES.ASSETDISPOSAL_DETAIL,
      }}
      baseTable={{
        tableConfig: {
          title: "Sorties de patrimoine",
          description: "Historique et gestion des sorties de patrimoine.",
          columns: [
            { field: "reference", title: "Référence" },
            { field: "exitMethod", title: "Type de sortie" },
            { field: "date", title: "Date" },
            { field: "status", title: "Statut" },
          ],
        },
        customMutations: ({ row }) => {
          return {
            overrides: {
              cancel: {
                hidden: row.status === "cancelled",
              },
            },
          };
        },
      }}
    />
  );
}

export default AssetdisposalListPage;
