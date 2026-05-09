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
        ],
        quickFilters: ["inventoryCode", "name", "assetType", "ownershipStatus"],
        tableConfig: {
          title: "Suivi Financier des Biens",
        },
      }}
    />
  );
}

export default AssetListPage;
