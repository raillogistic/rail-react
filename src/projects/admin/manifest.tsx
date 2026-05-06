import { lazy, Suspense, type ReactNode } from "react";
import { LayoutDashboard } from "lucide-react";
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

const AdminHomePage = lazy(() =>
  import("./pages/AdminHomePage").then((module) => ({
    default: module.AdminHomePage,
  })),
);

export const ADMIN_MANIFEST: AppManifest = defineProjectManifest({
  projectId: "admin",
  moduleId: "core",
  order: 100,
  defaultRoute: ROUTES.HOME,
  routes: [
    protectedRoute("admin", {
      id: "admin:home",
      path: ROUTES.HOME,
      title: "Administration",
      icon: LayoutDashboard,
      element: withRouteSuspense(<AdminHomePage />),
    }),
  ],
  navigation: [
    navGroup("admin", {
      id: "admin",
      label: "Admin",
      order: 0,
      entries: [
        {
          id: "admin:home",
          routeId: "admin:home",
          title: "Accueil",
          path: ROUTES.HOME,
          guard: "protected",
          icon: LayoutDashboard,
        },
      ],
    }),
  ],
});

export default ADMIN_MANIFEST;
