import type { PatrimoineAsset } from "@/models";
import { ROUTES } from "@/projects/patrimoine/config/routes";
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
          "category",
          "family",
          "administrativeStatus",
          "physicalCondition",
          "location",
          "responsibleEmployee",
          "responsibleService",
        ],
        tableConfig: {
          title: "Biens",
        },
      }}
    />
  );
}

export default AssetListPage;
