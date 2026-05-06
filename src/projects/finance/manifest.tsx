import { lazy, Suspense, type ReactNode } from "react";
import { LayoutDashboard } from "lucide-react";
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

const FinanceHomePage = lazy(() =>
  import("./pages/FinanceHomePage").then((module) => ({
    default: module.FinanceHomePage,
  })),
);

export const FINANCE_MANIFEST: AppManifest = defineProjectManifest({
  projectId: "finance",
  moduleId: "finance",
  order: 100,
  defaultRoute: ROUTES.HOME,
  routes: [
    protectedRoute("finance", {
      id: "finance:home",
      path: ROUTES.HOME,
      title: "Finance",
      icon: LayoutDashboard,
      element: withRouteSuspense(<FinanceHomePage />),
    }),
  ],
  navigation: [
    navGroup("finance", {
      id: "finance",
      label: "Finance",
      order: 0,
      entries: [
        {
          id: "finance:home",
          routeId: "finance:home",
          title: "Accueil",
          path: ROUTES.HOME,
          guard: "protected",
          icon: LayoutDashboard,
        },
      ],
    }),
  ],
});

export default FINANCE_MANIFEST;
