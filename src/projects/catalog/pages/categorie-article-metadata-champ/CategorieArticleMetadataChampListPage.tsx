import { useNavigate } from "react-router-dom";
import { DynamicModelTable } from "@/widgets/model-table";
import { ROUTES } from "@/projects/catalog/config/routes";

function replaceRouteId(pathTemplate: string, id: string): string {
  return pathTemplate.replace(":id", id);
}

export function CategorieArticleMetadataChampListPage() {
  const navigate = useNavigate();

  return (
    <DynamicModelTable
      app="catalog"
      model="CategorieArticleMetadataChamp"
      create={{
        type: "link",
        hrefTemplate: ROUTES.CATEGORIE_ARTICLE_METADATA_CHAMP_CREATE,
      }}
      update={{
        type: "link",
        hrefTemplate: ROUTES.CATEGORIE_ARTICLE_METADATA_CHAMP_EDIT,
      }}
      baseTable={{
        tableConfig: {
          title: "Champs de metadonnees",
        },
        columnActions: [
          {
            key: "details",
            label: "Details",
            onClick: ({ row }) => {
              const id = String(row.id ?? "");
              if (!id) return;
              navigate(replaceRouteId(ROUTES.CATEGORIE_ARTICLE_METADATA_CHAMP_DETAIL, id));
            },
          },
        ],
      }}
    />
  );
}

export default CategorieArticleMetadataChampListPage;
