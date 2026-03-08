import { lazy, Suspense, type ReactNode } from "react";
import { LayoutDashboard, FileText } from "lucide-react";
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
      ],
    }),
  ],
});

export default MISSIONS_MANIFEST;
