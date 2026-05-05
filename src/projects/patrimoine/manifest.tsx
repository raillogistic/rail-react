import { lazy, Suspense, type ReactNode } from "react";
import { FileText, LayoutDashboard } from "lucide-react";
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

const PatrimoineOverviewPage = lazy(() =>
  import("./pages/PatrimoineOverviewPage").then((module) => ({
    default: module.PatrimoineOverviewPage,
  })),
);

const PatrimoineReportsPage = lazy(() =>
  import("./pages/PatrimoineReportsPage").then((module) => ({
    default: module.PatrimoineReportsPage,
  })),
);

export const PATRIMOINE_MANIFEST: AppManifest = defineProjectManifest({
  projectId: "patrimoine",
  moduleId: "patrimoine",
  order: 100,
  defaultRoute: ROUTES.OVERVIEW,
  routes: [
    protectedRoute("patrimoine", {
      id: "patrimoine:overview",
      path: ROUTES.OVERVIEW,
      title: "Patrimoine Overview",
      description: "Overview for the patrimoine project",
      icon: LayoutDashboard,
      element: withRouteSuspense(<PatrimoineOverviewPage />),
    }),
    protectedRoute("patrimoine", {
      id: "patrimoine:reports",
      path: ROUTES.REPORTS,
      title: "Patrimoine Reports",
      description: "Reporting views for the patrimoine project",
      icon: FileText,
      element: withRouteSuspense(<PatrimoineReportsPage />),
    }),
  ],
  navigation: [
    navGroup("patrimoine", {
      id: "patrimoine",
      label: "Patrimoine",
      order: 0,
      entries: [
        {
          id: "patrimoine:overview",
          routeId: "patrimoine:overview",
          title: "Overview",
          path: ROUTES.OVERVIEW,
          guard: "protected",
          icon: LayoutDashboard,
          description: "Main workspace",
        },
        {
          id: "patrimoine:reports",
          routeId: "patrimoine:reports",
          title: "Reports",
          path: ROUTES.REPORTS,
          guard: "protected",
          icon: FileText,
          description: "Reports and analytics",
        },
      ],
    }),
  ],
});

export default PATRIMOINE_MANIFEST;
