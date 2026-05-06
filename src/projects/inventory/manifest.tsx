import { lazy, Suspense, type ReactNode } from "react";
import { LayoutDashboard } from "lucide-react";
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

const InventoryHomePage = lazy(() =>
  import("./pages/InventoryHomePage").then((module) => ({
    default: module.InventoryHomePage,
  })),
);

export const INVENTORY_MANIFEST: AppManifest = defineProjectManifest({
  projectId: "inventory",
  moduleId: "inventory",
  order: 100,
  defaultRoute: ROUTES.HOME,
  routes: [
    protectedRoute("inventory", {
      id: "inventory:home",
      path: ROUTES.HOME,
      title: "Inventaire",
      icon: LayoutDashboard,
      element: withRouteSuspense(<InventoryHomePage />),
    }),
  ],
  navigation: [
    navGroup("inventory", {
      id: "inventory",
      label: "Inventory",
      order: 0,
      entries: [
        {
          id: "inventory:home",
          routeId: "inventory:home",
          title: "Accueil",
          path: ROUTES.HOME,
          guard: "protected",
          icon: LayoutDashboard,
        },
      ],
    }),
  ],
});

export default INVENTORY_MANIFEST;
