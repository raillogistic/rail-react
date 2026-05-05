import { lazy, Suspense, type ReactNode } from "react";
import { FileText, LayoutDashboard } from "lucide-react";
import type { AppManifest } from "@/app/router/contracts";
import {
  defineProjectManifest,
  navGroup,
  protectedRoute,
} from "@/app/router/manifestFactory";
import { ROUTES } from "@/projects/inventory/config/routes";

const routeFallback = (
  <div className="rounded-md border p-3 text-sm text-muted-foreground">
    Chargement...
  </div>
);

const withRouteSuspense = (component: ReactNode) => (
  <Suspense fallback={routeFallback}>{component}</Suspense>
);

const InventoryOverviewPage = lazy(() =>
  import("./pages/InventoryOverviewPage").then((module) => ({
    default: module.InventoryOverviewPage,
  })),
);

const InventoryReportsPage = lazy(() =>
  import("./pages/InventoryReportsPage").then((module) => ({
    default: module.InventoryReportsPage,
  })),
);

export const INVENTORY_MANIFEST: AppManifest = defineProjectManifest({
  projectId: "inventory",
  moduleId: "inventory",
  order: 100,
  defaultRoute: ROUTES.OVERVIEW,
  routes: [
    protectedRoute("inventory", {
      id: "inventory:overview",
      path: ROUTES.OVERVIEW,
      title: "Inventory Overview",
      description: "Overview for the inventory project",
      icon: LayoutDashboard,
      element: withRouteSuspense(<InventoryOverviewPage />),
    }),
    protectedRoute("inventory", {
      id: "inventory:reports",
      path: ROUTES.REPORTS,
      title: "Inventory Reports",
      description: "Reporting views for the inventory project",
      icon: FileText,
      element: withRouteSuspense(<InventoryReportsPage />),
    }),
  ],
  navigation: [
    navGroup("inventory", {
      id: "inventory",
      label: "Inventory",
      order: 0,
      entries: [
        {
          id: "inventory:overview",
          routeId: "inventory:overview",
          title: "Overview",
          path: ROUTES.OVERVIEW,
          guard: "protected",
          icon: LayoutDashboard,
          description: "Main workspace",
        },
        {
          id: "inventory:reports",
          routeId: "inventory:reports",
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

export default INVENTORY_MANIFEST;
