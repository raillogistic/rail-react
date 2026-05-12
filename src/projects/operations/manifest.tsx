import {
  lazy,
  Suspense,
  type ReactNode } from "react";
import { LayoutDashboard,
  UserCheck,
  Undo2,
} from "lucide-react";
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

const AssetAssignmentListPage = lazy(() =>
  import("./pages/asset-assignment/AssetAssignmentListPage").then((module) => ({
    default: module.AssetAssignmentListPage,
  })),
);

const AssetAssignmentFormPage = lazy(() =>
  import("./pages/asset-assignment/AssetAssignmentFormPage").then((module) => ({
    default: module.AssetAssignmentFormPage,
  })),
);

const AssetAssignmentDetailPage = lazy(() =>
  import("./pages/asset-assignment/AssetAssignmentDetailPage").then((module) => ({
    default: module.AssetAssignmentDetailPage,
  })),
);

const RestitutionListPage = lazy(() =>
  import("./pages/restitution/RestitutionListPage").then((module) => ({
    default: module.RestitutionListPage,
  })),
);

const RestitutionFormPage = lazy(() =>
  import("./pages/restitution/RestitutionFormPage").then((module) => ({
    default: module.RestitutionFormPage,
  })),
);

const RestitutionDetailPage = lazy(() =>
  import("./pages/restitution/RestitutionDetailPage").then((module) => ({
    default: module.RestitutionDetailPage,
  })),
);

export const OPERATIONS_MANIFEST: AppManifest = defineProjectManifest({
  projectId: "operations",
  moduleId: "assignments",
  order: 30,
  defaultRoute: ROUTES.HOME,
  routes: [
    protectedRoute("operations", {
      id: "operations:home",
      path: ROUTES.HOME,
      title: "Opérations",
      icon: LayoutDashboard,
      element: withRouteSuspense(<OperationsHomePage />),
    }),
  
    protectedRoute("operations", {
      id: "operations:asset-assignment:list",
      path: ROUTES.ASSET_ASSIGNMENT_LIST,
      title: "Affectations",
      description: "Gestion des affectations de biens",
      icon: UserCheck,
      element: withRouteSuspense(<AssetAssignmentListPage />),
    }),
    protectedRoute("operations", {
      id: "operations:asset-assignment:create",
      path: ROUTES.ASSET_ASSIGNMENT_CREATE,
      title: "Créer une Affectation",
      hidden: true,
      icon: UserCheck,
      element: withRouteSuspense(<AssetAssignmentFormPage />),
    }),
    protectedRoute("operations", {
      id: "operations:asset-assignment:edit",
      path: ROUTES.ASSET_ASSIGNMENT_EDIT,
      title: "Modifier une Affectation",
      hidden: true,
      icon: UserCheck,
      element: withRouteSuspense(<AssetAssignmentFormPage />),
    }),
    protectedRoute("operations", {
      id: "operations:asset-assignment:detail",
      path: ROUTES.ASSET_ASSIGNMENT_DETAIL,
      title: "Détail Affectation",
      hidden: true,
      icon: UserCheck,
      element: withRouteSuspense(<AssetAssignmentDetailPage />),
    }),

    protectedRoute("operations", {
      id: "operations:restitution:list",
      path: ROUTES.RESTITUTION_LIST,
      title: "Restitutions",
      description: "Historique des retours de biens",
      icon: Undo2,
      element: withRouteSuspense(<RestitutionListPage />),
    }),
    protectedRoute("operations", {
      id: "operations:restitution:create",
      path: ROUTES.RESTITUTION_CREATE,
      title: "Enregistrer une Restitution",
      hidden: true,
      icon: Undo2,
      element: withRouteSuspense(<RestitutionFormPage />),
    }),
    protectedRoute("operations", {
      id: "operations:restitution:edit",
      path: ROUTES.RESTITUTION_EDIT,
      title: "Modifier une Restitution",
      hidden: true,
      icon: Undo2,
      element: withRouteSuspense(<RestitutionFormPage />),
    }),
    protectedRoute("operations", {
      id: "operations:restitution:detail",
      path: ROUTES.RESTITUTION_DETAIL,
      title: "Détail Restitution",
      hidden: true,
      icon: Undo2,
      element: withRouteSuspense(<RestitutionDetailPage />),
    }),
],
  navigation: [
    navGroup("operations", {
      id: "operations",
      label: "Opérations",
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
      
        {
          id: "operations:asset-assignment:list",
          routeId: "operations:asset-assignment:list",
          title: "Affectations",
          path: ROUTES.ASSET_ASSIGNMENT_LIST,
          guard: "protected",
          icon: UserCheck,
          description: "Gestion des affectations de biens",
          children: [
            {
              id: "operations:asset-assignment:create",
              routeId: "operations:asset-assignment:create",
              title: "Créer une Affectation",
              path: ROUTES.ASSET_ASSIGNMENT_CREATE,
              guard: "protected",
              hidden: true,
            },
            {
              id: "operations:asset-assignment:edit",
              routeId: "operations:asset-assignment:edit",
              title: "Modifier une Affectation",
              path: ROUTES.ASSET_ASSIGNMENT_EDIT,
              guard: "protected",
              hidden: true,
            },
            {
              id: "operations:asset-assignment:detail",
              routeId: "operations:asset-assignment:detail",
              title: "Détail Affectation",
              path: ROUTES.ASSET_ASSIGNMENT_DETAIL,
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
          icon: Undo2,
          description: "Historique des retours de biens",
          children: [
            {
              id: "operations:restitution:create",
              routeId: "operations:restitution:create",
              title: "Enregistrer une Restitution",
              path: ROUTES.RESTITUTION_CREATE,
              guard: "protected",
              hidden: true,
            },
            {
              id: "operations:restitution:edit",
              routeId: "operations:restitution:edit",
              title: "Modifier une Restitution",
              path: ROUTES.RESTITUTION_EDIT,
              guard: "protected",
              hidden: true,
            },
            {
              id: "operations:restitution:detail",
              routeId: "operations:restitution:detail",
              title: "Détail Restitution",
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
