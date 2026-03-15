import { lazy, Suspense, type ReactNode } from "react";
import { FileText } from "lucide-react";
import type { AppManifest } from "@/app/router/contracts";
import {
  defineProjectManifest,
  navGroup,
  protectedRoute,
} from "@/app/router/manifestFactory";
import { ROUTES } from "@/projects/missions/config/routes";

const routeFallback = (
  <div className="rounded-md border p-3 text-sm text-muted-foreground">
    Chargement...
  </div>
);

const withRouteSuspense = (component: ReactNode) => (
  <Suspense fallback={routeFallback}>{component}</Suspense>
);

const OrdreMissionListPage = lazy(() =>
  import("./pages/ordre-mission/OrdreMissionListPage").then((module) => ({
    default: module.OrdreMissionListPage,
  })),
);

const OrdreMissionFormPage = lazy(() =>
  import("./pages/ordre-mission/OrdreMissionFormPage").then((module) => ({
    default: module.OrdreMissionFormPage,
  })),
);

const OrdreMissionDetailPage = lazy(() =>
  import("./pages/ordre-mission/OrdreMissionDetailPage").then((module) => ({
    default: module.OrdreMissionDetailPage,
  })),
);
const BaremePrimeMissionListPage = lazy(() =>
  import("./pages/bareme-prime-mission/BaremePrimeMissionListPage").then(
    (module) => ({
      default: module.BaremePrimeMissionListPage,
    }),
  ),
);

const BaremePrimeMissionFormPage = lazy(() =>
  import("./pages/bareme-prime-mission/BaremePrimeMissionFormPage").then(
    (module) => ({
      default: module.BaremePrimeMissionFormPage,
    }),
  ),
);

const BaremePrimeMissionDetailPage = lazy(() =>
  import("./pages/bareme-prime-mission/BaremePrimeMissionDetailPage").then(
    (module) => ({
      default: module.BaremePrimeMissionDetailPage,
    }),
  ),
);
export const MISSIONS_MANIFEST: AppManifest = defineProjectManifest({
  projectId: "missions",
  order: 4,
  defaultRoute: ROUTES.ORDRE_MISSION_LIST,
  routes: [
    protectedRoute("missions", {
      id: "missions:ordre-mission:list",
      path: ROUTES.ORDRE_MISSION_LIST,
      title: "Ordre de mission",
      description: "Manage Ordre Mission records",
      icon: FileText,
      element: withRouteSuspense(<OrdreMissionListPage />),
    }),
    protectedRoute("missions", {
      id: "missions:ordre-mission:create",
      path: ROUTES.ORDRE_MISSION_CREATE,
      title: "Create Ordre Mission",
      hidden: true,
      icon: FileText,
      element: withRouteSuspense(<OrdreMissionFormPage />),
    }),
    protectedRoute("missions", {
      id: "missions:ordre-mission:edit",
      path: ROUTES.ORDRE_MISSION_EDIT,
      title: "Edit Ordre Mission",
      hidden: true,
      icon: FileText,
      element: withRouteSuspense(<OrdreMissionFormPage />),
    }),
    protectedRoute("missions", {
      id: "missions:ordre-mission:detail",
      path: ROUTES.ORDRE_MISSION_DETAIL,
      title: "Ordre Mission details",
      hidden: true,
      icon: FileText,
      element: withRouteSuspense(<OrdreMissionDetailPage />),
    }),

    protectedRoute("missions", {
      id: "missions:bareme-prime-mission:list",
      path: ROUTES.BAREME_PRIME_MISSION_LIST,
      title: "Barèmes",
      description: "Manage Bareme Prime Mission records",
      icon: FileText,
      element: withRouteSuspense(<BaremePrimeMissionListPage />),
    }),
    protectedRoute("missions", {
      id: "missions:bareme-prime-mission:create",
      path: ROUTES.BAREME_PRIME_MISSION_CREATE,
      title: "Create Bareme Prime Mission",
      hidden: true,
      icon: FileText,
      element: withRouteSuspense(<BaremePrimeMissionFormPage />),
    }),
    protectedRoute("missions", {
      id: "missions:bareme-prime-mission:edit",
      path: ROUTES.BAREME_PRIME_MISSION_EDIT,
      title: "Edit Bareme Prime Mission",
      hidden: true,
      icon: FileText,
      element: withRouteSuspense(<BaremePrimeMissionFormPage />),
    }),
    protectedRoute("missions", {
      id: "missions:bareme-prime-mission:detail",
      path: ROUTES.BAREME_PRIME_MISSION_DETAIL,
      title: "Bareme Prime Mission details",
      hidden: true,
      icon: FileText,
      element: withRouteSuspense(<BaremePrimeMissionDetailPage />),
    }),
  ],
  navigation: [
    navGroup("missions", {
      id: "missions",
      label: "Missions",
      order: 0,
      entries: [
        {
          id: "missions:ordre-mission:list",
          routeId: "missions:ordre-mission:list",
          title: "Ordres mission",
          path: ROUTES.ORDRE_MISSION_LIST,
          guard: "protected",
          icon: FileText,
          description: "Manage Ordre Mission records",
          children: [
            {
              id: "missions:ordre-mission:create",
              routeId: "missions:ordre-mission:create",
              title: "Create Ordre Mission",
              path: ROUTES.ORDRE_MISSION_CREATE,
              guard: "protected",
              hidden: true,
            },
            {
              id: "missions:ordre-mission:edit",
              routeId: "missions:ordre-mission:edit",
              title: "Edit Ordre Mission",
              path: ROUTES.ORDRE_MISSION_EDIT,
              guard: "protected",
              hidden: true,
            },
            {
              id: "missions:ordre-mission:detail",
              routeId: "missions:ordre-mission:detail",
              title: "Ordre Mission details",
              path: ROUTES.ORDRE_MISSION_DETAIL,
              guard: "protected",
              hidden: true,
            },
          ],
        },

        {
          id: "missions:bareme-prime-mission:list",
          routeId: "missions:bareme-prime-mission:list",
          title: "Barèmes",
          path: ROUTES.BAREME_PRIME_MISSION_LIST,
          guard: "protected",
          icon: FileText,
          description: "Manage Bareme Prime Mission records",
          children: [
            {
              id: "missions:bareme-prime-mission:create",
              routeId: "missions:bareme-prime-mission:create",
              title: "Create Bareme Prime Mission",
              path: ROUTES.BAREME_PRIME_MISSION_CREATE,
              guard: "protected",
              hidden: true,
            },
            {
              id: "missions:bareme-prime-mission:edit",
              routeId: "missions:bareme-prime-mission:edit",
              title: "Edit Bareme Prime Mission",
              path: ROUTES.BAREME_PRIME_MISSION_EDIT,
              guard: "protected",
              hidden: true,
            },
            {
              id: "missions:bareme-prime-mission:detail",
              routeId: "missions:bareme-prime-mission:detail",
              title: "Bareme Prime Mission details",
              path: ROUTES.BAREME_PRIME_MISSION_DETAIL,
              guard: "protected",
              hidden: true,
            },
          ],
        },
      ],
    }),
  ],
});

export default MISSIONS_MANIFEST;
