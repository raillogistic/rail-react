import { lazy, Suspense, type ReactNode } from "react";
import { BookOpen, Tag } from "lucide-react";
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

export const CATALOG_MANIFEST: AppManifest = defineProjectManifest({
  projectId: "catalog",
  order: 2,
  defaultRoute: ROUTES.ARTICLE_LIST,
  routes: [
    protectedRoute("catalog", {
      id: "catalog:categorie-article:list",
      path: ROUTES.CATEGORIE_ARTICLE_LIST,
      title: "Categories d'article",
      hidden: true,
      description: "Liste et edition rapide des categories d'article",
      icon: Tag,
      element: withRouteSuspense(<CategorieArticleListPage />),
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
  ],
  navigation: [
    navGroup("catalog", {
      id: "catalog",
      label: "Catalog",
      order: 1,
      entries: [
        {
          id: "catalog:article:list",
          routeId: "catalog:article:list",
          title: "Articles",
          path: ROUTES.ARTICLE_LIST,
          guard: "protected",
          icon: BookOpen,
          description: "Gestion des articles",
          children: [
            {
              id: "catalog:article:create",
              routeId: "catalog:article:create",
              title: "Creer un article",
              path: ROUTES.ARTICLE_CREATE,
              guard: "protected",
              hidden: true,
            },
            {
              id: "catalog:article:edit",
              routeId: "catalog:article:edit",
              title: "Modifier un article",
              path: ROUTES.ARTICLE_EDIT,
              guard: "protected",
              hidden: true,
            },
            {
              id: "catalog:article:detail",
              routeId: "catalog:article:detail",
              title: "Detail article",
              path: ROUTES.ARTICLE_DETAIL,
              guard: "protected",
              hidden: true,
            },
          ],
        },
      ],
    }),
  ],
});

export default CATALOG_MANIFEST;
