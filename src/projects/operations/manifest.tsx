import { lazy, Suspense, type ReactNode } from "react";
import { LayoutDashboard } from "lucide-react";
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

const OperationsHomePage = lazy(() =>
  import("./pages/OperationsHomePage").then((module) => ({
    default: module.OperationsHomePage,
  })),
);

export const OPERATIONS_MANIFEST: AppManifest = defineProjectManifest({
  projectId: "operations",
  moduleId: "assignments",
  order: 100,
  defaultRoute: ROUTES.HOME,
  routes: [
    protectedRoute("operations", {
      id: "operations:home",
      path: ROUTES.HOME,
      title: "Opérations",
      icon: LayoutDashboard,
      element: withRouteSuspense(<OperationsHomePage />),
    }),
  ],
  navigation: [
    navGroup("operations", {
      id: "operations",
      label: "Operations",
      order: 0,
      entries: [
        {
          id: "operations:home",
          routeId: "operations:home",
          title: "Accueil",
          path: ROUTES.HOME,
          guard: "protected",
          icon: LayoutDashboard,
        },
      ],
    }),
  ],
});

export default OPERATIONS_MANIFEST;
