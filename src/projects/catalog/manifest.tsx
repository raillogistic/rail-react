import { lazy, Suspense, type ReactNode } from "react";
import { BookOpen, Database, FileText, Tag } from "lucide-react";
import type { AppManifest } from "@/app/router/contracts";
import {
  defineProjectManifest,
  navGroup,
  protectedRoute,
} from "@/app/router/manifestFactory";
import { ROUTES } from "@/projects/catalog/config/routes";

const routeFallback = (
  <div className="rounded-md border p-3 text-sm text-muted-foreground">
    Chargement...
  </div>
);

const withRouteSuspense = (component: ReactNode) => (
  <Suspense fallback={routeFallback}>{component}</Suspense>
);

const CategorieArticleListPage = lazy(() =>
  import("./pages/categorie-article/CategorieArticleListPage").then(
    (module) => ({
      default: module.CategorieArticleListPage,
    }),
  ),
);

const ArticleMetadataValeurListPage = lazy(() =>
  import("./pages/article-metadata-valeur/ArticleMetadataValeurListPage").then(
    (module) => ({
      default: module.ArticleMetadataValeurListPage,
    }),
  ),
);

const ArticleListPage = lazy(() =>
  import("./pages/article/ArticleListPage").then((module) => ({
    default: module.ArticleListPage,
  })),
);

const ArticleCreatePage = lazy(() =>
  import("./pages/article/ArticleCreatePage").then((module) => ({
    default: module.ArticleCreatePage,
  })),
);

const ArticleEditPage = lazy(() =>
  import("./pages/article/ArticleEditPage").then((module) => ({
    default: module.ArticleEditPage,
  })),
);

const ArticleDetailPage = lazy(() =>
  import("./pages/article/ArticleDetailPage").then((module) => ({
    default: module.ArticleDetailPage,
  })),
);

const CategorieArticleMetadataChampListPage = lazy(() =>
  import("./pages/categorie-article-metadata-champ/CategorieArticleMetadataChampListPage").then(
    (module) => ({
      default: module.CategorieArticleMetadataChampListPage,
    }),
  ),
);

const CategorieArticleMetadataChampCreatePage = lazy(() =>
  import("./pages/categorie-article-metadata-champ/CategorieArticleMetadataChampCreatePage").then(
    (module) => ({
      default: module.CategorieArticleMetadataChampCreatePage,
    }),
  ),
);

const CategorieArticleMetadataChampEditPage = lazy(() =>
  import("./pages/categorie-article-metadata-champ/CategorieArticleMetadataChampEditPage").then(
    (module) => ({
      default: module.CategorieArticleMetadataChampEditPage,
    }),
  ),
);

const CategorieArticleMetadataChampDetailPage = lazy(() =>
  import("./pages/categorie-article-metadata-champ/CategorieArticleMetadataChampDetailPage").then(
    (module) => ({
      default: module.CategorieArticleMetadataChampDetailPage,
    }),
  ),
);

export const CATALOG_MANIFEST: AppManifest = defineProjectManifest({
  projectId: "catalog",
  order: 20,
  defaultRoute: ROUTES.ARTICLE_LIST,
  routes: [
    protectedRoute("catalog", {
      id: "catalog:categorie-article:list",
      path: ROUTES.CATEGORIE_ARTICLE_LIST,
      title: "Categories d'article",
      description: "Liste et edition rapide des categories d'article",
      icon: Tag,
      element: withRouteSuspense(<CategorieArticleListPage />),
    }),
    protectedRoute("catalog", {
      id: "catalog:article-metadata-valeur:list",
      path: ROUTES.ARTICLE_METADATA_VALEUR_LIST,
      title: "Valeurs de metadonnees",
      description: "Liste et edition rapide des valeurs de metadonnees",
      icon: FileText,
      element: withRouteSuspense(<ArticleMetadataValeurListPage />),
    }),
    protectedRoute("catalog", {
      id: "catalog:article:list",
      path: ROUTES.ARTICLE_LIST,
      title: "Articles",
      description: "Gestion des articles du catalogue",
      icon: BookOpen,
      element: withRouteSuspense(<ArticleListPage />),
    }),
    protectedRoute("catalog", {
      id: "catalog:article:create",
      path: ROUTES.ARTICLE_CREATE,
      title: "Creer un article",
      hidden: true,
      icon: BookOpen,
      element: withRouteSuspense(<ArticleCreatePage />),
    }),
    protectedRoute("catalog", {
      id: "catalog:article:edit",
      path: ROUTES.ARTICLE_EDIT,
      title: "Modifier un article",
      hidden: true,
      icon: BookOpen,
      element: withRouteSuspense(<ArticleEditPage />),
    }),
    protectedRoute("catalog", {
      id: "catalog:article:detail",
      path: ROUTES.ARTICLE_DETAIL,
      title: "Detail article",
      hidden: true,
      icon: BookOpen,
      element: withRouteSuspense(<ArticleDetailPage />),
    }),
    protectedRoute("catalog", {
      id: "catalog:categorie-article-metadata-champ:list",
      path: ROUTES.CATEGORIE_ARTICLE_METADATA_CHAMP_LIST,
      title: "Champs de metadonnees",
      description: "Gestion des champs de metadonnees par categorie",
      icon: Database,
      element: withRouteSuspense(<CategorieArticleMetadataChampListPage />),
    }),
    protectedRoute("catalog", {
      id: "catalog:categorie-article-metadata-champ:create",
      path: ROUTES.CATEGORIE_ARTICLE_METADATA_CHAMP_CREATE,
      title: "Creer un champ de metadonnee",
      hidden: true,
      icon: Database,
      element: withRouteSuspense(<CategorieArticleMetadataChampCreatePage />),
    }),
    protectedRoute("catalog", {
      id: "catalog:categorie-article-metadata-champ:edit",
      path: ROUTES.CATEGORIE_ARTICLE_METADATA_CHAMP_EDIT,
      title: "Modifier un champ de metadonnee",
      hidden: true,
      icon: Database,
      element: withRouteSuspense(<CategorieArticleMetadataChampEditPage />),
    }),
    protectedRoute("catalog", {
      id: "catalog:categorie-article-metadata-champ:detail",
      path: ROUTES.CATEGORIE_ARTICLE_METADATA_CHAMP_DETAIL,
      title: "Detail champ de metadonnee",
      hidden: true,
      icon: Database,
      element: withRouteSuspense(<CategorieArticleMetadataChampDetailPage />),
    }),
  ],
  navigation: [
    navGroup("catalog", {
      id: "catalog",
      label: "Catalog",
      order: 0,
      entries: [
        {
          id: "catalog:article:list",
          routeId: "catalog:article:list",
          title: "Articles",
          path: ROUTES.ARTICLE_LIST,
          guard: "protected",
          icon: BookOpen,
          description: "Gestion des articles",
        },
        {
          id: "catalog:categorie-article:list",
          routeId: "catalog:categorie-article:list",
          title: "Categories d'article",
          path: ROUTES.CATEGORIE_ARTICLE_LIST,
          guard: "protected",
          icon: Tag,
          description: "Gestion des categories",
        },
        {
          id: "catalog:categorie-article-metadata-champ:list",
          routeId: "catalog:categorie-article-metadata-champ:list",
          title: "Champs de metadonnees",
          path: ROUTES.CATEGORIE_ARTICLE_METADATA_CHAMP_LIST,
          guard: "protected",
          icon: Database,
          description: "Definition des champs de metadonnees",
        },
        {
          id: "catalog:article-metadata-valeur:list",
          routeId: "catalog:article-metadata-valeur:list",
          title: "Valeurs de metadonnees",
          path: ROUTES.ARTICLE_METADATA_VALEUR_LIST,
          guard: "protected",
          icon: FileText,
          description: "Valeurs de metadonnees des articles",
        },
      ],
    }),
  ],
});

export default CATALOG_MANIFEST;
