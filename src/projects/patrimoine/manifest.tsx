import {
  lazy,
  Suspense,
  type ReactNode } from "react";
import {
  FileText,
  LayoutDashboard,
} from "lucide-react";
import type { AppManifest } from "@/app/router/contracts";
import {
  defineProjectManifest,
  navGroup,
  protectedRoute,
} from "@/app/router/manifestFactory";
import { ROUTES } from "@/projects/patrimoine/config/routes";

const routeFallback = (
  <div className="rounded-md border p-3 text-sm text-muted-foreground">
    Chargement...
  </div>
);

const withRouteSuspense = (component: ReactNode) => (
  <Suspense fallback={routeFallback}>{component}</Suspense>
);

const AssetListPage = lazy(() =>
  import("./pages/asset/AssetListPage").then((module) => ({
    default: module.AssetListPage,
  })),
);

const AssetFormPage = lazy(() =>
  import("./pages/asset/AssetFormPage").then((module) => ({
    default: module.AssetFormPage,
  })),
);

const AssetDetailPage = lazy(() =>
  import("./pages/asset/AssetDetailPage").then((module) => ({
    default: module.AssetDetailPage,
  })),
);
export const PATRIMOINE_MANIFEST: AppManifest = defineProjectManifest({
  projectId: "patrimoine",
  moduleId: "patrimoine",
  order: 100,
  defaultRoute: ROUTES.ASSET_LIST,
  routes: [
    protectedRoute("patrimoine", {
      id: "patrimoine:asset:list",
      path: ROUTES.ASSET_LIST,
      title: "Asset",
      description: "Manage Asset records",
      icon: FileText,
      element: withRouteSuspense(<AssetListPage />),
    }),
    protectedRoute("patrimoine", {
      id: "patrimoine:asset:create",
      path: ROUTES.ASSET_CREATE,
      title: "Create Asset",
      hidden: true,
      icon: FileText,
      element: withRouteSuspense(<AssetFormPage />),
    }),
    protectedRoute("patrimoine", {
      id: "patrimoine:asset:edit",
      path: ROUTES.ASSET_EDIT,
      title: "Edit Asset",
      hidden: true,
      icon: FileText,
      element: withRouteSuspense(<AssetFormPage />),
    }),
    protectedRoute("patrimoine", {
      id: "patrimoine:asset:detail",
      path: ROUTES.ASSET_DETAIL,
      title: "Asset details",
      hidden: true,
      icon: FileText,
      element: withRouteSuspense(<AssetDetailPage />),
    }),
],
  navigation: [
    navGroup("patrimoine", {
      id: "patrimoine",
      label: "Patrimoine",
      order: 0,
      entries: [
        {
          id: "patrimoine:asset:list",
          routeId: "patrimoine:asset:list",
          title: "Asset",
          path: ROUTES.ASSET_LIST,
          guard: "protected",
          icon: FileText,
          description: "Manage Asset records",          children: [
            {
              id: "patrimoine:asset:create",
              routeId: "patrimoine:asset:create",
              title: "Create Asset",
              path: ROUTES.ASSET_CREATE,
              guard: "protected",
              hidden: true,
            },
            {
              id: "patrimoine:asset:edit",
              routeId: "patrimoine:asset:edit",
              title: "Edit Asset",
              path: ROUTES.ASSET_EDIT,
              guard: "protected",
              hidden: true,
            },
            {
              id: "patrimoine:asset:detail",
              routeId: "patrimoine:asset:detail",
              title: "Asset details",
              path: ROUTES.ASSET_DETAIL,
              guard: "protected",
              hidden: true,
            },
          ],
        },
],
    }),
  ],
});

export default PATRIMOINE_MANIFEST;
