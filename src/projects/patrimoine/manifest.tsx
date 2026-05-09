import { lazy, Suspense, type ReactNode } from "react";
import { LayoutDashboard, FileText } from "lucide-react";
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
const LocationListPage = lazy(() =>
  import("./pages/location/LocationListPage").then((module) => ({
    default: module.LocationListPage,
  })),
);

const LocationFormPage = lazy(() =>
  import("./pages/location/LocationFormPage").then((module) => ({
    default: module.LocationFormPage,
  })),
);

const LocationDetailPage = lazy(() =>
  import("./pages/location/LocationDetailPage").then((module) => ({
    default: module.LocationDetailPage,
  })),
);
const AssetMovementListPage = lazy(() =>
  import("./pages/asset-movement/AssetMovementListPage").then((module) => ({
    default: module.AssetMovementListPage,
  })),
);

const AssetMovementFormPage = lazy(() =>
  import("./pages/asset-movement/AssetMovementFormPage").then((module) => ({
    default: module.AssetMovementFormPage,
  })),
);

const AssetMovementDetailPage = lazy(() =>
  import("./pages/asset-movement/AssetMovementDetailPage").then((module) => ({
    default: module.AssetMovementDetailPage,
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
    protectedRoute("patrimoine", {
      id: "patrimoine:location:list",
      path: ROUTES.LOCATION_LIST,
      title: "Location",
      description: "Manage Location records",
      icon: FileText,
      element: withRouteSuspense(<LocationListPage />),
    }),
    protectedRoute("patrimoine", {
      id: "patrimoine:location:create",
      path: ROUTES.LOCATION_CREATE,
      title: "Create Location",
      hidden: true,
      icon: FileText,
      element: withRouteSuspense(<LocationFormPage />),
    }),
    protectedRoute("patrimoine", {
      id: "patrimoine:location:edit",
      path: ROUTES.LOCATION_EDIT,
      title: "Edit Location",
      hidden: true,
      icon: FileText,
      element: withRouteSuspense(<LocationFormPage />),
    }),
    protectedRoute("patrimoine", {
      id: "patrimoine:location:detail",
      path: ROUTES.LOCATION_DETAIL,
      title: "Location details",
      hidden: true,
      icon: FileText,
      element: withRouteSuspense(<LocationDetailPage />),
    }),
    protectedRoute("patrimoine", {
      id: "patrimoine:asset-movement:list",
      path: ROUTES.ASSET_MOVEMENT_LIST,
      title: "Mouvements",
      description: "Manage Asset Movement records",
      icon: FileText,
      element: withRouteSuspense(<AssetMovementListPage />),
    }),
    protectedRoute("patrimoine", {
      id: "patrimoine:asset-movement:create",
      path: ROUTES.ASSET_MOVEMENT_CREATE,
      title: "Create Asset Movement",
      hidden: true,
      icon: FileText,
      element: withRouteSuspense(<AssetMovementFormPage />),
    }),
    protectedRoute("patrimoine", {
      id: "patrimoine:asset-movement:edit",
      path: ROUTES.ASSET_MOVEMENT_EDIT,
      title: "Edit Asset Movement",
      hidden: true,
      icon: FileText,
      element: withRouteSuspense(<AssetMovementFormPage />),
    }),
    protectedRoute("patrimoine", {
      id: "patrimoine:asset-movement:detail",
      path: ROUTES.ASSET_MOVEMENT_DETAIL,
      title: "Asset Movement details",
      hidden: true,
      icon: FileText,
      element: withRouteSuspense(<AssetMovementDetailPage />),
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
          description: "Manage Asset records",
          children: [
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
        {
          id: "patrimoine:location:list",
          routeId: "patrimoine:location:list",
          title: "Location",
          path: ROUTES.LOCATION_LIST,
          guard: "protected",
          icon: FileText,
          description: "Manage Location records",
          children: [
            {
              id: "patrimoine:location:create",
              routeId: "patrimoine:location:create",
              title: "Create Location",
              path: ROUTES.LOCATION_CREATE,
              guard: "protected",
              hidden: true,
            },
            {
              id: "patrimoine:location:edit",
              routeId: "patrimoine:location:edit",
              title: "Edit Location",
              path: ROUTES.LOCATION_EDIT,
              guard: "protected",
              hidden: true,
            },
            {
              id: "patrimoine:location:detail",
              routeId: "patrimoine:location:detail",
              title: "Location details",
              path: ROUTES.LOCATION_DETAIL,
              guard: "protected",
              hidden: true,
            },
          ],
        },
        {
          id: "patrimoine:asset-movement:list",
          routeId: "patrimoine:asset-movement:list",
          title: "Mouvements",
          path: ROUTES.ASSET_MOVEMENT_LIST,
          guard: "protected",
          icon: FileText,
          description: "Manage Asset Movement records",
          children: [
            {
              id: "patrimoine:asset-movement:create",
              routeId: "patrimoine:asset-movement:create",
              title: "Create Asset Movement",
              path: ROUTES.ASSET_MOVEMENT_CREATE,
              guard: "protected",
              hidden: true,
            },
            {
              id: "patrimoine:asset-movement:edit",
              routeId: "patrimoine:asset-movement:edit",
              title: "Edit Asset Movement",
              path: ROUTES.ASSET_MOVEMENT_EDIT,
              guard: "protected",
              hidden: true,
            },
            {
              id: "patrimoine:asset-movement:detail",
              routeId: "patrimoine:asset-movement:detail",
              title: "Asset Movement details",
              path: ROUTES.ASSET_MOVEMENT_DETAIL,
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
