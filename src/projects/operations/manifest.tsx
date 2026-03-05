import { lazy, Suspense, type ReactNode } from "react";
import { BookOpen, FileText } from "lucide-react";
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

const DechargeListPage = lazy(() =>
  import("./pages/decharge/DechargeListPage").then((module) => ({
    default: module.DechargeListPage,
  })),
);

const DechargeCreatePage = lazy(() =>
  import("./pages/decharge/DechargeCreatePage").then((module) => ({
    default: module.DechargeCreatePage,
  })),
);

const DechargeEditPage = lazy(() =>
  import("./pages/decharge/DechargeEditPage").then((module) => ({
    default: module.DechargeEditPage,
  })),
);

const DechargeDetailPage = lazy(() =>
  import("./pages/decharge/DechargeDetailPage").then((module) => ({
    default: module.DechargeDetailPage,
  })),
);

const RestitutionListPage = lazy(() =>
  import("./pages/restitution/RestitutionListPage").then((module) => ({
    default: module.RestitutionListPage,
  })),
);

const RestitutionCreatePage = lazy(() =>
  import("./pages/restitution/RestitutionCreatePage").then((module) => ({
    default: module.RestitutionCreatePage,
  })),
);

const RestitutionEditPage = lazy(() =>
  import("./pages/restitution/RestitutionEditPage").then((module) => ({
    default: module.RestitutionEditPage,
  })),
);

const RestitutionDetailPage = lazy(() =>
  import("./pages/restitution/RestitutionDetailPage").then((module) => ({
    default: module.RestitutionDetailPage,
  })),
);

export const OPERATIONS_MANIFEST: AppManifest = defineProjectManifest({
  projectId: "operations",
  order: 2,
  defaultRoute: ROUTES.DECHARGE_LIST,
  routes: [
    protectedRoute("operations", {
      id: "operations:decharge:list",
      path: ROUTES.DECHARGE_LIST,
      title: "Decharges",
      description: "Liste des decharges",
      icon: BookOpen,
      element: withRouteSuspense(<DechargeListPage />),
    }),
    protectedRoute("operations", {
      id: "operations:decharge:create",
      path: ROUTES.DECHARGE_CREATE,
      title: "Creer une decharge",
      hidden: true,
      icon: BookOpen,
      element: withRouteSuspense(<DechargeCreatePage />),
    }),
    protectedRoute("operations", {
      id: "operations:decharge:edit",
      path: ROUTES.DECHARGE_EDIT,
      title: "Modifier une decharge",
      hidden: true,
      icon: BookOpen,
      element: withRouteSuspense(<DechargeEditPage />),
    }),
    protectedRoute("operations", {
      id: "operations:decharge:detail",
      path: ROUTES.DECHARGE_DETAIL,
      title: "Detail decharge",
      hidden: true,
      icon: BookOpen,
      element: withRouteSuspense(<DechargeDetailPage />),
    }),
    protectedRoute("operations", {
      id: "operations:restitution:list",
      path: ROUTES.RESTITUTION_LIST,
      title: "Restitutions",
      description: "Liste des restitutions",
      icon: FileText,
      element: withRouteSuspense(<RestitutionListPage />),
    }),
    protectedRoute("operations", {
      id: "operations:restitution:create",
      path: ROUTES.RESTITUTION_CREATE,
      title: "Creer une restitution",
      hidden: true,
      icon: FileText,
      element: withRouteSuspense(<RestitutionCreatePage />),
    }),
    protectedRoute("operations", {
      id: "operations:restitution:edit",
      path: ROUTES.RESTITUTION_EDIT,
      title: "Modifier une restitution",
      hidden: true,
      icon: FileText,
      element: withRouteSuspense(<RestitutionEditPage />),
    }),
    protectedRoute("operations", {
      id: "operations:restitution:detail",
      path: ROUTES.RESTITUTION_DETAIL,
      title: "Detail restitution",
      hidden: true,
      icon: FileText,
      element: withRouteSuspense(<RestitutionDetailPage />),
    }),
  ],
  navigation: [
    navGroup("operations", {
      id: "operations",
      label: "Operations",
      order: 2,
      entries: [
        {
          id: "operations:decharge:list",
          routeId: "operations:decharge:list",
          title: "Decharges",
          path: ROUTES.DECHARGE_LIST,
          guard: "protected",
          icon: BookOpen,
          description: "Gestion des decharges",
          children: [
            {
              id: "operations:decharge:create",
              routeId: "operations:decharge:create",
              title: "Creer une decharge",
              path: ROUTES.DECHARGE_CREATE,
              guard: "protected",
              hidden: true,
            },
            {
              id: "operations:decharge:edit",
              routeId: "operations:decharge:edit",
              title: "Modifier une decharge",
              path: ROUTES.DECHARGE_EDIT,
              guard: "protected",
              hidden: true,
            },
            {
              id: "operations:decharge:detail",
              routeId: "operations:decharge:detail",
              title: "Detail decharge",
              path: ROUTES.DECHARGE_DETAIL,
              guard: "protected",
              hidden: true,
            },
          ],
        },
        {
          id: "operations:restitution:list",
          routeId: "operations:restitution:list",
          title: "Restitutions",
          path: ROUTES.RESTITUTION_LIST,
          guard: "protected",
          icon: FileText,
          description: "Gestion des restitutions",
          children: [
            {
              id: "operations:restitution:create",
              routeId: "operations:restitution:create",
              title: "Creer une restitution",
              path: ROUTES.RESTITUTION_CREATE,
              guard: "protected",
              hidden: true,
            },
            {
              id: "operations:restitution:edit",
              routeId: "operations:restitution:edit",
              title: "Modifier une restitution",
              path: ROUTES.RESTITUTION_EDIT,
              guard: "protected",
              hidden: true,
            },
            {
              id: "operations:restitution:detail",
              routeId: "operations:restitution:detail",
              title: "Detail restitution",
              path: ROUTES.RESTITUTION_DETAIL,
              guard: "protected",
              hidden: true,
            },
          ],
        },
      ],
    }),
  ],
});

export default OPERATIONS_MANIFEST;
