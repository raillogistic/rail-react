import { lazy, Suspense, type ReactNode } from "react";
import { LayoutDashboard, FileSpreadsheet, Activity, Download, List } from "lucide-react";
import type { AppManifest } from "@/app/router/contracts";
import {
  defineProjectManifest,
  navGroup,
  protectedRoute,
} from "@/app/router/manifestFactory";
import { ROUTES } from "@/projects/reporting/config/routes";

const routeFallback = (
  <div className="rounded-md border p-3 text-sm text-muted-foreground">
    Chargement...
  </div>
);

const withRouteSuspense = (component: ReactNode) => (
  <Suspense fallback={routeFallback}>{component}</Suspense>
);

const DashboardPatrimoine = lazy(() =>
  import("./pages/DashboardPatrimoine").then((module) => ({
    default: module.DashboardPatrimoine,
  })),
);

const DashboardFinance = lazy(() =>
  import("./pages/DashboardFinance").then((module) => ({
    default: module.DashboardFinance,
  })),
);

const DashboardInventaire = lazy(() =>
  import("./pages/DashboardInventaire").then((module) => ({
    default: module.DashboardInventaire,
  })),
);

const Exports = lazy(() =>
  import("./pages/Exports").then((module) => ({
    default: module.Exports,
  })),
);

const AuditLog = lazy(() =>
  import("./pages/AuditLog").then((module) => ({
    default: module.AuditLog,
  })),
);

export const REPORTING_MANIFEST: AppManifest = defineProjectManifest({
  projectId: "reporting",
  order: 60,
  defaultRoute: ROUTES.DASHBOARD_PATRIMOINE,
  routes: [
    protectedRoute("reporting", {
      id: "reporting:patrimoine",
      path: ROUTES.DASHBOARD_PATRIMOINE,
      title: "Tableau de bord Patrimoine",
      description: "Statistiques globales du patrimoine",
      icon: LayoutDashboard,
      element: withRouteSuspense(<DashboardPatrimoine />),
    }),
    protectedRoute("reporting", {
      id: "reporting:finance",
      path: ROUTES.DASHBOARD_FINANCE,
      title: "Tableau de bord Finance",
      description: "Statistiques financières",
      icon: FileSpreadsheet,
      element: withRouteSuspense(<DashboardFinance />),
    }),
    protectedRoute("reporting", {
      id: "reporting:inventaire",
      path: ROUTES.DASHBOARD_INVENTAIRE,
      title: "Tableau de bord Inventaire",
      description: "Statistiques des campagnes d'inventaire",
      icon: Activity,
      element: withRouteSuspense(<DashboardInventaire />),
    }),
    protectedRoute("reporting", {
      id: "reporting:exports",
      path: ROUTES.EXPORTS,
      title: "Exports",
      description: "Interface d'export CSV",
      icon: Download,
      element: withRouteSuspense(<Exports />),
    }),
    protectedRoute("reporting", {
      id: "reporting:audit",
      path: ROUTES.AUDIT,
      title: "Journal d'Audit",
      description: "Trace de toutes les actions",
      icon: List,
      element: withRouteSuspense(<AuditLog />),
    }),
  ],
  navigation: [
    navGroup("reporting", {
      id: "reporting",
      label: "Reporting",
      order: 60,
      entries: [
        {
          id: "reporting:patrimoine",
          routeId: "reporting:patrimoine",
          title: "Patrimoine",
          path: ROUTES.DASHBOARD_PATRIMOINE,
          guard: "protected",
          icon: LayoutDashboard,
          description: "Statistiques globales",
        },
        {
          id: "reporting:finance",
          routeId: "reporting:finance",
          title: "Finance",
          path: ROUTES.DASHBOARD_FINANCE,
          guard: "protected",
          icon: FileSpreadsheet,
          description: "Statistiques financières",
        },
        {
          id: "reporting:inventaire",
          routeId: "reporting:inventaire",
          title: "Inventaire",
          path: ROUTES.DASHBOARD_INVENTAIRE,
          guard: "protected",
          icon: Activity,
          description: "Campagnes",
        },
        {
          id: "reporting:exports",
          routeId: "reporting:exports",
          title: "Exports",
          path: ROUTES.EXPORTS,
          guard: "protected",
          icon: Download,
          description: "Générer des exports",
        },
        {
          id: "reporting:audit",
          routeId: "reporting:audit",
          title: "Audit",
          path: ROUTES.AUDIT,
          guard: "protected",
          icon: List,
          description: "Journal système",
        },
      ],
    }),
  ],
});

export default REPORTING_MANIFEST;
