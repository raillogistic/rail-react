import { lazy, Suspense, type ReactNode } from "react";
import { FileText, LayoutDashboard } from "lucide-react";
import type { AppManifest } from "@/app/router/contracts";
import {
  defineProjectManifest,
  navGroup,
  protectedRoute,
} from "@/app/router/manifestFactory";
import { ROUTES } from "@/projects/operations/config/routes";

const routeFallback = (
  <div className="rounded-md border p-3 text-sm text-muted-foreground">
    Chargement...
  </div>
);

const withRouteSuspense = (component: ReactNode) => (
  <Suspense fallback={routeFallback}>{component}</Suspense>
);

const OperationsOverviewPage = lazy(() =>
  import("./pages/OperationsOverviewPage").then((module) => ({
    default: module.OperationsOverviewPage,
  })),
);

const OperationsReportsPage = lazy(() =>
  import("./pages/OperationsReportsPage").then((module) => ({
    default: module.OperationsReportsPage,
  })),
);

export const OPERATIONS_MANIFEST: AppManifest = defineProjectManifest({
  projectId: "operations",
  moduleId: "assignments",
  order: 100,
  defaultRoute: ROUTES.OVERVIEW,
  routes: [
    protectedRoute("operations", {
      id: "operations:overview",
      path: ROUTES.OVERVIEW,
      title: "Operations Overview",
      description: "Overview for the operations project",
      icon: LayoutDashboard,
      element: withRouteSuspense(<OperationsOverviewPage />),
    }),
    protectedRoute("operations", {
      id: "operations:reports",
      path: ROUTES.REPORTS,
      title: "Operations Reports",
      description: "Reporting views for the operations project",
      icon: FileText,
      element: withRouteSuspense(<OperationsReportsPage />),
    }),
  ],
  navigation: [
    navGroup("operations", {
      id: "operations",
      label: "Operations",
      order: 0,
      entries: [
        {
          id: "operations:overview",
          routeId: "operations:overview",
          title: "Overview",
          path: ROUTES.OVERVIEW,
          guard: "protected",
          icon: LayoutDashboard,
          description: "Main workspace",
        },
        {
          id: "operations:reports",
          routeId: "operations:reports",
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

export default OPERATIONS_MANIFEST;
