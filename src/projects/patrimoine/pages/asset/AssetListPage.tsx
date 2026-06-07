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
            label: "Statut",
            key: "status",
            defaultItemKey: "all",
            items: [
              {
                key: "all",
                label: "Tous",
                clear: true,
              },
              {
                key: "active",
                label: "Actifs",
                variables: {
                  where: { administrativeStatus: { eq: "active" } },
                },
              },
              {
                key: "assigned",
                label: "Affectés",
                variables: {
                  where: { administrativeStatus: { eq: "assigned" } },
                },
              },
              {
                key: "out_of_service",
                label: "Hors Service",
                variables: {
                  where: { administrativeStatus: { eq: "out_of_service" } },
                },
              },
              {
                key: "reformed",
                label: "Réformés",
                variables: {
                  where: { administrativeStatus: { eq: "reformed" } },
                },
              },
              {
                key: "lost",
                label: "Perdus",
                variables: {
                  where: { administrativeStatus: { eq: "lost" } },
                },
              },
              {
                key: "disposed",
                label: "Sortis",
                variables: {
                  where: { administrativeStatus: { eq: "disposed" } },
                },
              },
              {
                key: "archived",
                label: "Archivés",
                variables: {
                  where: { administrativeStatus: { eq: "archived" } },
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
