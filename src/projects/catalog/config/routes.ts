export const ROUTES = {
  CATEGORIE_ARTICLE_LIST: "/catalog/categorie-article",
  CATEGORIE_ARTICLE_METADATA_CHAMP_LIST:
    "/catalog/categorie-article-metadata-champ",
  CATEGORIE_ARTICLE_METADATA_CHAMP_CREATE:
    "/catalog/categorie-article-metadata-champ/create",
  CATEGORIE_ARTICLE_METADATA_CHAMP_EDIT:
    "/catalog/categorie-article-metadata-champ/:id/edit",
  CATEGORIE_ARTICLE_METADATA_CHAMP_DETAIL:
    "/catalog/categorie-article-metadata-champ/:id",
  BENEFICIAIRE_LIST: "/catalog/beneficiaire",
  BENEFICIAIRE_CREATE: "/catalog/beneficiaire/create",
  BENEFICIAIRE_EDIT: "/catalog/beneficiaire/:id/edit",
  BENEFICIAIRE_DETAIL: "/catalog/beneficiaire/:id",
} as const;
