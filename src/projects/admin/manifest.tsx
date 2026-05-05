import { lazy, Suspense, type ReactNode } from "react";
import { FileText, LayoutDashboard } from "lucide-react";
import type { AppManifest } from "@/app/router/contracts";
import {
  defineProjectManifest,
  navGroup,
  protectedRoute,
} from "@/app/router/manifestFactory";
import { ROUTES } from "@/projects/admin/config/routes";

const routeFallback = (
  <div className="rounded-md border p-3 text-sm text-muted-foreground">
    Chargement...
  </div>
);

const withRouteSuspense = (component: ReactNode) => (
  <Suspense fallback={routeFallback}>{component}</Suspense>
);

const AdminOverviewPage = lazy(() =>
  import("./pages/AdminOverviewPage").then((module) => ({
    default: module.AdminOverviewPage,
  })),
);

const AdminReportsPage = lazy(() =>
  import("./pages/AdminReportsPage").then((module) => ({
    default: module.AdminReportsPage,
  })),
);

export const ADMIN_MANIFEST: AppManifest = defineProjectManifest({
  projectId: "admin",
  moduleId: "core",
  order: 100,
  defaultRoute: ROUTES.OVERVIEW,
  routes: [
    protectedRoute("admin", {
      id: "admin:overview",
      path: ROUTES.OVERVIEW,
      title: "Admin Overview",
      description: "Overview for the admin project",
      icon: LayoutDashboard,
      element: withRouteSuspense(<AdminOverviewPage />),
    }),
    protectedRoute("admin", {
      id: "admin:reports",
      path: ROUTES.REPORTS,
      title: "Admin Reports",
      description: "Reporting views for the admin project",
      icon: FileText,
      element: withRouteSuspense(<AdminReportsPage />),
    }),
  ],
  navigation: [
    navGroup("admin", {
      id: "admin",
      label: "Admin",
      order: 0,
      entries: [
        {
          id: "admin:overview",
          routeId: "admin:overview",
          title: "Overview",
          path: ROUTES.OVERVIEW,
          guard: "protected",
          icon: LayoutDashboard,
          description: "Main workspace",
        },
        {
          id: "admin:reports",
          routeId: "admin:reports",
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

export default ADMIN_MANIFEST;
