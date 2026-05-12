import {
  lazy,
  Suspense,
  type ReactNode } from "react";
import { Package,
  MapPin,
  ArrowRightLeft,
  FileText,
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
const AssetdisposalListPage = lazy(() =>
  import("./pages/assetdisposal/AssetdisposalListPage").then((module) => ({
    default: module.AssetdisposalListPage,
  })),
);

const AssetdisposalFormPage = lazy(() =>
  import("./pages/assetdisposal/AssetdisposalFormPage").then((module) => ({
    default: module.AssetdisposalFormPage,
  })),
);

const AssetdisposalDetailPage = lazy(() =>
  import("./pages/assetdisposal/AssetdisposalDetailPage").then((module) => ({
    default: module.AssetdisposalDetailPage,
  })),
);
export const PATRIMOINE_MANIFEST: AppManifest = defineProjectManifest({
  projectId: "patrimoine",
  moduleId: "patrimoine",
  order: 20,
  defaultRoute: ROUTES.ASSET_LIST,
  routes: [
    protectedRoute("patrimoine", {
      id: "patrimoine:asset:list",
      path: ROUTES.ASSET_LIST,
      title: "Biens",
      description: "Gestion des biens du patrimoine",
      icon: Package,
      element: withRouteSuspense(<AssetListPage />),
    }),
    protectedRoute("patrimoine", {
      id: "patrimoine:asset:create",
      path: ROUTES.ASSET_CREATE,
      title: "Créer un Bien",
      hidden: true,
      icon: Package,
      element: withRouteSuspense(<AssetFormPage />),
    }),
    protectedRoute("patrimoine", {
      id: "patrimoine:asset:edit",
      path: ROUTES.ASSET_EDIT,
      title: "Modifier un Bien",
      hidden: true,
      icon: Package,
      element: withRouteSuspense(<AssetFormPage />),
    }),
    protectedRoute("patrimoine", {
      id: "patrimoine:asset:detail",
      path: ROUTES.ASSET_DETAIL,
      title: "Détail du Bien",
      hidden: true,
      icon: Package,
      element: withRouteSuspense(<AssetDetailPage />),
    }),
    protectedRoute("patrimoine", {
      id: "patrimoine:location:list",
      path: ROUTES.LOCATION_LIST,
      title: "Localisations",
      description: "Gestion des emplacements",
      icon: MapPin,
      element: withRouteSuspense(<LocationListPage />),
    }),
    protectedRoute("patrimoine", {
      id: "patrimoine:location:create",
      path: ROUTES.LOCATION_CREATE,
      title: "Créer une Localisation",
      hidden: true,
      icon: MapPin,
      element: withRouteSuspense(<LocationFormPage />),
    }),
    protectedRoute("patrimoine", {
      id: "patrimoine:location:edit",
      path: ROUTES.LOCATION_EDIT,
      title: "Modifier une Localisation",
      hidden: true,
      icon: MapPin,
      element: withRouteSuspense(<LocationFormPage />),
    }),
    protectedRoute("patrimoine", {
      id: "patrimoine:location:detail",
      path: ROUTES.LOCATION_DETAIL,
      title: "Détail Localisation",
      hidden: true,
      icon: MapPin,
      element: withRouteSuspense(<LocationDetailPage />),
    }),
    protectedRoute("patrimoine", {
      id: "patrimoine:asset-movement:list",
      path: ROUTES.ASSET_MOVEMENT_LIST,
      title: "Mouvements",
      description: "Historique des mouvements de biens",
      icon: ArrowRightLeft,
      element: withRouteSuspense(<AssetMovementListPage />),
    }),
    protectedRoute("patrimoine", {
      id: "patrimoine:asset-movement:create",
      path: ROUTES.ASSET_MOVEMENT_CREATE,
      title: "Créer un Mouvement",
      hidden: true,
      icon: ArrowRightLeft,
      element: withRouteSuspense(<AssetMovementFormPage />),
    }),
    protectedRoute("patrimoine", {
      id: "patrimoine:asset-movement:edit",
      path: ROUTES.ASSET_MOVEMENT_EDIT,
      title: "Modifier un Mouvement",
      hidden: true,
      icon: ArrowRightLeft,
      element: withRouteSuspense(<AssetMovementFormPage />),
    }),
    protectedRoute("patrimoine", {
      id: "patrimoine:asset-movement:detail",
      path: ROUTES.ASSET_MOVEMENT_DETAIL,
      title: "Détail Mouvement",
      hidden: true,
      icon: ArrowRightLeft,
      element: withRouteSuspense(<AssetMovementDetailPage />),
    }),
  
    protectedRoute("patrimoine", {
      id: "patrimoine:assetdisposal:list",
      path: ROUTES.ASSETDISPOSAL_LIST,
      title: "Sorties de patrimoine",
      description: "Gestion des sorties de patrimoine",
      icon: FileText,
      element: withRouteSuspense(<AssetdisposalListPage />),
    }),
    protectedRoute("patrimoine", {
      id: "patrimoine:assetdisposal:create",
      path: ROUTES.ASSETDISPOSAL_CREATE,
      title: "Créer une Sortie",
      hidden: true,
      icon: FileText,
      element: withRouteSuspense(<AssetdisposalFormPage />),
    }),
    protectedRoute("patrimoine", {
      id: "patrimoine:assetdisposal:edit",
      path: ROUTES.ASSETDISPOSAL_EDIT,
      title: "Modifier une Sortie",
      hidden: true,
      icon: FileText,
      element: withRouteSuspense(<AssetdisposalFormPage />),
    }),
    protectedRoute("patrimoine", {
      id: "patrimoine:assetdisposal:detail",
      path: ROUTES.ASSETDISPOSAL_DETAIL,
      title: "Détail de la Sortie",
      hidden: true,
      icon: FileText,
      element: withRouteSuspense(<AssetdisposalDetailPage />),
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
          title: "Biens",
          path: ROUTES.ASSET_LIST,
          guard: "protected",
          icon: Package,
          description: "Gestion des biens du patrimoine",
          children: [
            {
              id: "patrimoine:asset:create",
              routeId: "patrimoine:asset:create",
              title: "Créer un Bien",
              path: ROUTES.ASSET_CREATE,
              guard: "protected",
              hidden: true,
            },
            {
              id: "patrimoine:asset:edit",
              routeId: "patrimoine:asset:edit",
              title: "Modifier un Bien",
              path: ROUTES.ASSET_EDIT,
              guard: "protected",
              hidden: true,
            },
            {
              id: "patrimoine:asset:detail",
              routeId: "patrimoine:asset:detail",
              title: "Détail du Bien",
              path: ROUTES.ASSET_DETAIL,
              guard: "protected",
              hidden: true,
            },
          ],
        },
        {
          id: "patrimoine:location:list",
          routeId: "patrimoine:location:list",
          title: "Localisations",
          path: ROUTES.LOCATION_LIST,
          guard: "protected",
          icon: MapPin,
          description: "Gestion des emplacements",
          children: [
            {
              id: "patrimoine:location:create",
              routeId: "patrimoine:location:create",
              title: "Créer une Localisation",
              path: ROUTES.LOCATION_CREATE,
              guard: "protected",
              hidden: true,
            },
            {
              id: "patrimoine:location:edit",
              routeId: "patrimoine:location:edit",
              title: "Modifier une Localisation",
              path: ROUTES.LOCATION_EDIT,
              guard: "protected",
              hidden: true,
            },
            {
              id: "patrimoine:location:detail",
              routeId: "patrimoine:location:detail",
              title: "Détail Localisation",
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
          icon: ArrowRightLeft,
          description: "Historique des mouvements de biens",
          children: [
            {
              id: "patrimoine:asset-movement:create",
              routeId: "patrimoine:asset-movement:create",
              title: "Créer un Mouvement",
              path: ROUTES.ASSET_MOVEMENT_CREATE,
              guard: "protected",
              hidden: true,
            },
            {
              id: "patrimoine:asset-movement:edit",
              routeId: "patrimoine:asset-movement:edit",
              title: "Modifier un Mouvement",
              path: ROUTES.ASSET_MOVEMENT_EDIT,
              guard: "protected",
              hidden: true,
            },
            {
              id: "patrimoine:asset-movement:detail",
              routeId: "patrimoine:asset-movement:detail",
              title: "Détail Mouvement",
              path: ROUTES.ASSET_MOVEMENT_DETAIL,
              guard: "protected",
              hidden: true,
            },
          ],
        },
      
        {
          id: "patrimoine:assetdisposal:list",
          routeId: "patrimoine:assetdisposal:list",
          title: "Sorties de patrimoine",
          path: ROUTES.ASSETDISPOSAL_LIST,
          guard: "protected",
          icon: FileText,
          description: "Gestion des sorties de patrimoine",
          children: [
            {
              id: "patrimoine:assetdisposal:create",
              routeId: "patrimoine:assetdisposal:create",
              title: "Créer une Sortie",
              path: ROUTES.ASSETDISPOSAL_CREATE,
              guard: "protected",
              hidden: true,
            },
            {
              id: "patrimoine:assetdisposal:edit",
              routeId: "patrimoine:assetdisposal:edit",
              title: "Modifier une Sortie",
              path: ROUTES.ASSETDISPOSAL_EDIT,
              guard: "protected",
              hidden: true,
            },
            {
              id: "patrimoine:assetdisposal:detail",
              routeId: "patrimoine:assetdisposal:detail",
              title: "Détail de la Sortie",
              path: ROUTES.ASSETDISPOSAL_DETAIL,
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
