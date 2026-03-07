import { lazy, Suspense, type ReactNode } from "react";
import { Tag, FileText } from "lucide-react";
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

const BeneficiaireListPage = lazy(() =>
  import("./pages/beneficiaire/BeneficiaireListPage").then((module) => ({
    default: module.BeneficiaireListPage,
  })),
);

const BeneficiaireFormPage = lazy(() =>
  import("./pages/beneficiaire/BeneficiaireFormPage").then((module) => ({
    default: module.BeneficiaireFormPage,
  })),
);

const BeneficiaireDetailPage = lazy(() =>
  import("./pages/beneficiaire/BeneficiaireDetailPage").then((module) => ({
    default: module.BeneficiaireDetailPage,
  })),
);
export const CATALOG_MANIFEST: AppManifest = defineProjectManifest({
  projectId: "catalog",
  order: 2,
  defaultRoute: ROUTES.BENEFICIAIRE_LIST,

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
      id: "catalog:beneficiaire:list",
      path: ROUTES.BENEFICIAIRE_LIST,
      title: "Entités",
      description: "Manage Beneficiaire records",
      icon: FileText,
      element: withRouteSuspense(<BeneficiaireListPage />),
    }),
    protectedRoute("catalog", {
      id: "catalog:beneficiaire:create",
      path: ROUTES.BENEFICIAIRE_CREATE,
      title: "Create Beneficiaire",
      hidden: true,
      icon: FileText,
      element: withRouteSuspense(<BeneficiaireFormPage />),
    }),
    protectedRoute("catalog", {
      id: "catalog:beneficiaire:edit",
      path: ROUTES.BENEFICIAIRE_EDIT,
      title: "Edit Beneficiaire",
      hidden: true,
      icon: FileText,
      element: withRouteSuspense(<BeneficiaireFormPage />),
    }),
    protectedRoute("catalog", {
      id: "catalog:beneficiaire:detail",
      path: ROUTES.BENEFICIAIRE_DETAIL,
      title: "Beneficiaire details",
      hidden: true,
      icon: FileText,
      element: withRouteSuspense(<BeneficiaireDetailPage />),
    }),
  ],
  navigation: [
    navGroup("catalog", {
      id: "catalog",
      label: "Catalog",
      order: 1,
      entries: [
        {
          id: "catalog:beneficiaire:list",
          routeId: "catalog:beneficiaire:list",
          title: "Entités",
          path: ROUTES.BENEFICIAIRE_LIST,
          guard: "protected",
          icon: FileText,
          description: "Manage Beneficiaire records",
          children: [
            {
              id: "catalog:beneficiaire:create",
              routeId: "catalog:beneficiaire:create",
              title: "Create Beneficiaire",
              path: ROUTES.BENEFICIAIRE_CREATE,
              guard: "protected",
              hidden: true,
            },
            {
              id: "catalog:beneficiaire:edit",
              routeId: "catalog:beneficiaire:edit",
              title: "Edit Beneficiaire",
              path: ROUTES.BENEFICIAIRE_EDIT,
              guard: "protected",
              hidden: true,
            },
            {
              id: "catalog:beneficiaire:detail",
              routeId: "catalog:beneficiaire:detail",
              title: "Beneficiaire details",
              path: ROUTES.BENEFICIAIRE_DETAIL,
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
