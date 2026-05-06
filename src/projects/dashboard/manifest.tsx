import { lazy, Suspense, type ReactNode } from "react";
import { LayoutDashboard } from "lucide-react";
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

const DashboardHomePage = lazy(() =>
  import("./pages/DashboardHomePage").then((module) => ({
    default: module.DashboardHomePage,
  })),
);

export const DASHBOARD_MANIFEST: AppManifest = defineProjectManifest({
  projectId: "dashboard",
  moduleId: "reporting",
  order: 100,
  defaultRoute: ROUTES.HOME,
  routes: [
    protectedRoute("dashboard", {
      id: "dashboard:home",
      path: ROUTES.HOME,
      title: "Tableau de bord",
      icon: LayoutDashboard,
      element: withRouteSuspense(<DashboardHomePage />),
    }),
  ],
  navigation: [
    navGroup("dashboard", {
      id: "dashboard",
      label: "Dashboard",
      order: 0,
      entries: [
        {
          id: "dashboard:home",
          routeId: "dashboard:home",
          title: "Accueil",
          path: ROUTES.HOME,
          guard: "protected",
          icon: LayoutDashboard,
        },
      ],
    }),
  ],
});

export default DASHBOARD_MANIFEST;
