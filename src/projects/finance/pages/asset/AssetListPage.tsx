import type { PatrimoineAsset } from "@/models";
import { ROUTES } from "@/projects/finance/config/routes";
import { DynamicModelTable } from "@/widgets/model-table";

export function AssetListPage() {
  return (
    <DynamicModelTable<any>
      app="patrimoine"
      model="Asset"
      create={{
        type: "link",
        hrefTemplate: ROUTES.ASSET_CREATE,
      }}
      update={{
        type: "link",
        hrefTemplate: ROUTES.ASSET_EDIT,
      }}
      detail={{
        type: "link",
        hrefTemplate: ROUTES.ASSET_DETAIL,
      }}
      baseTable={{
        fields: [
          "inventoryCode",
          "name",
          "assetType",
          "ownershipStatus",
          "acquisitionMethod",
          "acquisitionValue",
          "netBookValue",
          "administrativeStatus",
        ],
        quickFilters: ["inventoryCode", "name", "assetType", "ownershipStatus"],
        tableConfig: {
          title: "Suivi Financier des Biens",
        },
        customMutations: ({ row }) => {
          const status = row.administrativeStatus;
          return {
            overrides: {
              reactivate: {
                hidden: status !== "out_of_service",
              },
              set_out_of_service: {
                hidden: status === "out_of_service",
              },
            },
          };
        },
      }}
    />
  );
}

export default AssetListPage;
