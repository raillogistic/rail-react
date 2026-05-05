import { lazy, Suspense, type ReactNode } from "react";
import { FileText, LayoutDashboard } from "lucide-react";
import type { AppManifest } from "@/app/router/contracts";
import {
  defineProjectManifest,
  navGroup,
  protectedRoute,
} from "@/app/router/manifestFactory";
import { ROUTES } from "@/projects/finance/config/routes";

const routeFallback = (
  <div className="rounded-md border p-3 text-sm text-muted-foreground">
    Chargement...
  </div>
);

const withRouteSuspense = (component: ReactNode) => (
  <Suspense fallback={routeFallback}>{component}</Suspense>
);

const FinanceOverviewPage = lazy(() =>
  import("./pages/FinanceOverviewPage").then((module) => ({
    default: module.FinanceOverviewPage,
  })),
);

const FinanceReportsPage = lazy(() =>
  import("./pages/FinanceReportsPage").then((module) => ({
    default: module.FinanceReportsPage,
  })),
);

export const FINANCE_MANIFEST: AppManifest = defineProjectManifest({
  projectId: "finance",
  moduleId: "finance",
  order: 100,
  defaultRoute: ROUTES.OVERVIEW,
  routes: [
    protectedRoute("finance", {
      id: "finance:overview",
      path: ROUTES.OVERVIEW,
      title: "Finance Overview",
      description: "Overview for the finance project",
      icon: LayoutDashboard,
      element: withRouteSuspense(<FinanceOverviewPage />),
    }),
    protectedRoute("finance", {
      id: "finance:reports",
      path: ROUTES.REPORTS,
      title: "Finance Reports",
      description: "Reporting views for the finance project",
      icon: FileText,
      element: withRouteSuspense(<FinanceReportsPage />),
    }),
  ],
  navigation: [
    navGroup("finance", {
      id: "finance",
      label: "Finance",
      order: 0,
      entries: [
        {
          id: "finance:overview",
          routeId: "finance:overview",
          title: "Overview",
          path: ROUTES.OVERVIEW,
          guard: "protected",
          icon: LayoutDashboard,
          description: "Main workspace",
        },
        {
          id: "finance:reports",
          routeId: "finance:reports",
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

export default FINANCE_MANIFEST;
