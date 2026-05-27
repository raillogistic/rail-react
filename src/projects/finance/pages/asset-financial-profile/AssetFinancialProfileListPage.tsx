import type { PatrimoineAssetFinancialProfile } from "@/models";
import { ROUTES } from "@/projects/finance/config/routes";
import { DynamicModelTable } from "@/widgets/model-table";

export function AssetFinancialProfileListPage() {
  return (
    <DynamicModelTable<PatrimoineAssetFinancialProfile>
      app="patrimoine"
      model="AssetFinancialProfile"
      create={{
        type: "link",
        hrefTemplate: ROUTES.ASSET_FINANCIAL_PROFILE_CREATE,
      }}
      update={{
        type: "link",
        hrefTemplate: ROUTES.ASSET_FINANCIAL_PROFILE_EDIT,
      }}
      detail={{
        type: "link",
        hrefTemplate: ROUTES.ASSET_FINANCIAL_PROFILE_DETAIL,
      }}
      baseTable={{
        fields: [
          "asset",
          "depreciableBaseValue",
          "depreciationMethod",
          "depreciationDurationMonths",
          "depreciationStartDate",
          "residualValue",
          "cachedNetBookValue",
        ],
        tableConfig: {
          title: "Asset Financial Profile",
        },
      }}
    />
  );
}

export default AssetFinancialProfileListPage;
