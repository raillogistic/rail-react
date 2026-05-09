import {
  lazy,
  Suspense,
  type ReactNode } from "react";
import { LayoutDashboard,
  FileText,
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
  
    protectedRoute("operations", {
      id: "operations:asset-assignment:list",
      path: ROUTES.ASSET_ASSIGNMENT_LIST,
      title: "Asset Assignment",
      description: "Manage Asset Assignment records",
      icon: FileText,
      element: withRouteSuspense(<AssetAssignmentListPage />),
    }),
    protectedRoute("operations", {
      id: "operations:asset-assignment:create",
      path: ROUTES.ASSET_ASSIGNMENT_CREATE,
      title: "Create Asset Assignment",
      hidden: true,
      icon: FileText,
      element: withRouteSuspense(<AssetAssignmentFormPage />),
    }),
    protectedRoute("operations", {
      id: "operations:asset-assignment:edit",
      path: ROUTES.ASSET_ASSIGNMENT_EDIT,
      title: "Edit Asset Assignment",
      hidden: true,
      icon: FileText,
      element: withRouteSuspense(<AssetAssignmentFormPage />),
    }),
    protectedRoute("operations", {
      id: "operations:asset-assignment:detail",
      path: ROUTES.ASSET_ASSIGNMENT_DETAIL,
      title: "Asset Assignment details",
      hidden: true,
      icon: FileText,
      element: withRouteSuspense(<AssetAssignmentDetailPage />),
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
      
        {
          id: "operations:asset-assignment:list",
          routeId: "operations:asset-assignment:list",
          title: "Asset Assignment",
          path: ROUTES.ASSET_ASSIGNMENT_LIST,
          guard: "protected",
          icon: FileText,
          description: "Manage Asset Assignment records",
          children: [
            {
              id: "operations:asset-assignment:create",
              routeId: "operations:asset-assignment:create",
              title: "Create Asset Assignment",
              path: ROUTES.ASSET_ASSIGNMENT_CREATE,
              guard: "protected",
              hidden: true,
            },
            {
              id: "operations:asset-assignment:edit",
              routeId: "operations:asset-assignment:edit",
              title: "Edit Asset Assignment",
              path: ROUTES.ASSET_ASSIGNMENT_EDIT,
              guard: "protected",
              hidden: true,
            },
            {
              id: "operations:asset-assignment:detail",
              routeId: "operations:asset-assignment:detail",
              title: "Asset Assignment details",
              path: ROUTES.ASSET_ASSIGNMENT_DETAIL,
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
