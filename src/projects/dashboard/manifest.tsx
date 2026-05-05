import { lazy, Suspense, type ReactNode } from "react";
import { FileText, LayoutDashboard } from "lucide-react";
import type { AppManifest } from "@/app/router/contracts";
import {
  defineProjectManifest,
  navGroup,
  protectedRoute,
} from "@/app/router/manifestFactory";
import { ROUTES } from "@/projects/dashboard/config/routes";

const routeFallback = (
  <div className="rounded-md border p-3 text-sm text-muted-foreground">
    Chargement...
  </div>
);

const withRouteSuspense = (component: ReactNode) => (
  <Suspense fallback={routeFallback}>{component}</Suspense>
);

const DashboardOverviewPage = lazy(() =>
  import("./pages/DashboardOverviewPage").then((module) => ({
    default: module.DashboardOverviewPage,
  })),
);

export const DASHBOARD_MANIFEST: AppManifest = defineProjectManifest({
  projectId: "dashboard",
  moduleId: "reporting",
  order: 100,

  defaultRoute: ROUTES.OVERVIEW,
  routes: [
    protectedRoute("dashboard", {
      id: "dashboard:overview",
      path: ROUTES.OVERVIEW,
      title: "Dashboard Overview",
      description: "Overview for the dashboard project",
      icon: LayoutDashboard,
      element: withRouteSuspense(<DashboardOverviewPage />),
    }),
  ],
  navigation: [
    navGroup("dashboard", {
      id: "dashboard",
      label: "Dashboard",
      order: 0,
      entries: [
        {
          id: "dashboard:overview",
          routeId: "dashboard:overview",
          title: "Tableau de bord",
          path: ROUTES.OVERVIEW,
          guard: "protected",
          icon: LayoutDashboard,
          description: "Main workspace",
        },
      ],
    }),
  ],
});

export default DASHBOARD_MANIFEST;
