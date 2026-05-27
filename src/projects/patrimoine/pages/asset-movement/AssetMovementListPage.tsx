import type { LocationsAssetMovement } from "@/models";
import { ROUTES } from "@/projects/patrimoine/config/routes";
import { DynamicModelTable } from "@/widgets/model-table";

export function AssetMovementListPage() {
  return (
    <DynamicModelTable<LocationsAssetMovement>
      app="locations"
      model="AssetMovement"
      create={{
        type: "link",
        hrefTemplate: ROUTES.ASSET_MOVEMENT_CREATE,
      }}
      update={{
        type: "link",
        hrefTemplate: ROUTES.ASSET_MOVEMENT_EDIT,
      }}
      detail={{
        type: "link",
        hrefTemplate: ROUTES.ASSET_MOVEMENT_DETAIL,
      }}
      baseTable={{
        tableConfig: {
          title: "Mouvements",
        },

        customMutations: ({ row }) => {
          return {
            overrides: {
              cancelAssetMovement: {
                hidden: row.status === "cancelled",
              },
            },
          };
        },
      }}
    />
  );
}

export default AssetMovementListPage;
