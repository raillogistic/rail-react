import { DynamicModelTable } from "@/widgets/model-table";
import { ROUTES } from "@/projects/catalog/config/routes";

export function CategorieArticleMetadataChampListPage() {
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
      detail={{
        type: "link",
        hrefTemplate: ROUTES.CATEGORIE_ARTICLE_METADATA_CHAMP_DETAIL,
      }}
      baseTable={{
        tableConfig: {
          title: "Champs de metadonnees",
        },
      }}
    />
  );
}

export default CategorieArticleMetadataChampListPage;
