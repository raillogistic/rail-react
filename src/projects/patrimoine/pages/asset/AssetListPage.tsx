import type { PatrimoineAsset } from "@/models";
import { ROUTES } from "@/projects/patrimoine/config/routes";
import { DynamicModelTable } from "@/widgets/model-table";

export function AssetListPage() {
  return (
    <DynamicModelTable<PatrimoineAsset>
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
      navFilters={{
        groups: [
          {
            label: "Etat",
            key: "etat",
            items: [
              {
                key: "active",
                label: "active",
                clear: true,
                variables: {
                  where: { administrativeStatus: { eq: "active" } },
                },
              },
            ],
          },
          {
            label: "assigned",
            key: "assigned",
            items: [
              {
                key: "assigned",
                label: "assigned",
                clear: true,
                variables: {
                  where: { administrativeStatus: { eq: "assigned" } },
                },
              },
            ],
          },
          {
            label: "out_of_service",
            key: "out_of_service",
            items: [
              {
                key: "out_of_service",
                label: "out_of_service",
                clear: true,
                variables: {
                  where: { administrativeStatus: { eq: "out_of_service" } },
                },
              },
            ],
          },
        ],
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
