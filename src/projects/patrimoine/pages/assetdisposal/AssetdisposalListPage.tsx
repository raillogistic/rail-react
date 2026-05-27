import type { PatrimoineAssetDisposal } from "@/models";
import { ROUTES } from "@/projects/patrimoine/config/routes";
import { DynamicModelTable } from "@/widgets/model-table";

export function AssetdisposalListPage() {
  return (
    <DynamicModelTable<any>
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
        fields: ["reference", "exitMethod", "date", "reason", "status", "notes"],
        tableConfig: {
          title: "Sorties de patrimoine",
        },
        customMutations: ({ row }) => {
          return {
            overrides: {
              cancelAssetDisposal: {
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
