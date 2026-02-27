import { lazy, Suspense, type ReactNode } from "react";
import { FileText, LayoutDashboard } from "lucide-react";
import type { AppManifest } from "@/app/router/contracts";
import {
  defineProjectManifest,
  navGroup,
  protectedRoute,
} from "@/app/router/manifestFactory";
import { ROUTES } from "@/projects/billing/config/routes";

const routeFallback = (
  <div className="rounded-md border p-3 text-sm text-muted-foreground">
    Chargement...
  </div>
);

const withRouteSuspense = (component: ReactNode) => (
  <Suspense fallback={routeFallback}>{component}</Suspense>
);

const BillingOverviewPage = lazy(() =>
  import("./pages/BillingOverviewPage").then((module) => ({
    default: module.BillingOverviewPage,
  })),
);

const BillingReportsPage = lazy(() =>
  import("./pages/BillingReportsPage").then((module) => ({
    default: module.BillingReportsPage,
  })),
);

export const BILLING_MANIFEST: AppManifest = defineProjectManifest({
  projectId: "billing",
  defaultRoute: ROUTES.OVERVIEW,
  routes: [
    protectedRoute("billing", {
      id: "billing:overview",
      path: ROUTES.OVERVIEW,
      title: "Billing Overview",
      description: "Overview for the billing project",
      icon: LayoutDashboard,
      element: withRouteSuspense(<BillingOverviewPage />),
    }),
    protectedRoute("billing", {
      id: "billing:reports",
      path: ROUTES.REPORTS,
      title: "Billing Reports",
      description: "Reporting views for the billing project",
      icon: FileText,
      element: withRouteSuspense(<BillingReportsPage />),
    }),
  ],
  navigation: [
    navGroup("billing", {
      id: "billing",
      label: "Billing",
      entries: [
        {
          id: "billing:overview",
          routeId: "billing:overview",
          title: "Overview",
          path: ROUTES.OVERVIEW,
          guard: "protected",
          icon: LayoutDashboard,
          description: "Main workspace",
        },
        {
          id: "billing:reports",
          routeId: "billing:reports",
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

export default BILLING_MANIFEST;
