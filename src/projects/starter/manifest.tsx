import { lazy, Suspense, type ReactNode } from "react";
import { FileText, LayoutDashboard } from "lucide-react";
import type { AppManifest } from "@/app/router/contracts";
import {
  defineProjectManifest,
  navGroup,
  protectedRoute,
} from "@/app/router/manifestFactory";

const STARTER_ROUTES = {
  OVERVIEW: "/starter/overview",
  REPORTS: "/starter/reports",
} as const;

const routeFallback = (
  <div className="rounded-md border p-3 text-sm text-muted-foreground">
    Chargement...
  </div>
);

const withRouteSuspense = (component: ReactNode) => (
  <Suspense fallback={routeFallback}>{component}</Suspense>
);

const StarterOverviewPage = lazy(() =>
  import("./pages/StarterOverviewPage").then((module) => ({
    default: module.StarterOverviewPage,
  })),
);

const StarterReportsPage = lazy(() =>
  import("./pages/StarterReportsPage").then((module) => ({
    default: module.StarterReportsPage,
  })),
);

export const STARTER_MANIFEST: AppManifest = defineProjectManifest({
  projectId: "starter",
  defaultRoute: STARTER_ROUTES.OVERVIEW,
  routes: [
    protectedRoute("starter", {
      id: "starter:overview",
      path: STARTER_ROUTES.OVERVIEW,
      title: "Starter Overview",
      description: "Landing page for the starter project",
      icon: LayoutDashboard,
      element: withRouteSuspense(<StarterOverviewPage />),
    }),
    protectedRoute("starter", {
      id: "starter:reports",
      path: STARTER_ROUTES.REPORTS,
      title: "Starter Reports",
      description: "Reporting workspace for the starter project",
      icon: FileText,
      element: withRouteSuspense(<StarterReportsPage />),
    }),
  ],
  navigation: [
    navGroup("starter", {
      id: "starter",
      label: "Starter",
      entries: [
        {
          id: "starter:overview",
          routeId: "starter:overview",
          title: "Overview",
          path: STARTER_ROUTES.OVERVIEW,
          guard: "protected",
          icon: LayoutDashboard,
          description: "Starter workspace home",
        },
        {
          id: "starter:reports",
          routeId: "starter:reports",
          title: "Reports",
          path: STARTER_ROUTES.REPORTS,
          guard: "protected",
          icon: FileText,
          description: "Starter reporting views",
        },
      ],
    }),
  ],
});

export default STARTER_MANIFEST;
