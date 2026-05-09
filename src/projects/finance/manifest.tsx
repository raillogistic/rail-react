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

const AssetListPage = lazy(() =>
  import("./pages/asset/AssetListPage").then((module) => ({
    default: module.AssetListPage,
  })),
);

const AssetFormPage = lazy(() =>
  import("./pages/asset/AssetFormPage").then((module) => ({
    default: module.AssetFormPage,
  })),
);

const AssetDetailPage = lazy(() =>
  import("./pages/asset/AssetDetailPage").then((module) => ({
    default: module.AssetDetailPage,
  })),
);
const AssetFinancialProfileListPage = lazy(() =>
  import("./pages/asset-financial-profile/AssetFinancialProfileListPage").then((module) => ({
    default: module.AssetFinancialProfileListPage,
  })),
);

const AssetFinancialProfileFormPage = lazy(() =>
  import("./pages/asset-financial-profile/AssetFinancialProfileFormPage").then((module) => ({
    default: module.AssetFinancialProfileFormPage,
  })),
);

const AssetFinancialProfileDetailPage = lazy(() =>
  import("./pages/asset-financial-profile/AssetFinancialProfileDetailPage").then((module) => ({
    default: module.AssetFinancialProfileDetailPage,
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
  
    protectedRoute("finance", {
      id: "finance:asset:list",
      path: ROUTES.ASSET_LIST,
      title: "Asset",
      description: "Manage Asset records",
      icon: FileText,
      element: withRouteSuspense(<AssetListPage />),
    }),
    protectedRoute("finance", {
      id: "finance:asset:create",
      path: ROUTES.ASSET_CREATE,
      title: "Create Asset",
      hidden: true,
      icon: FileText,
      element: withRouteSuspense(<AssetFormPage />),
    }),
    protectedRoute("finance", {
      id: "finance:asset:edit",
      path: ROUTES.ASSET_EDIT,
      title: "Edit Asset",
      hidden: true,
      icon: FileText,
      element: withRouteSuspense(<AssetFormPage />),
    }),
    protectedRoute("finance", {
      id: "finance:asset:detail",
      path: ROUTES.ASSET_DETAIL,
      title: "Asset details",
      hidden: true,
      icon: FileText,
      element: withRouteSuspense(<AssetDetailPage />),
    }),
    protectedRoute("finance", {
      id: "finance:asset-financial-profile:list",
      path: ROUTES.ASSET_FINANCIAL_PROFILE_LIST,
      title: "Asset Financial Profile",
      description: "Manage Asset Financial Profile records",
      icon: FileText,
      element: withRouteSuspense(<AssetFinancialProfileListPage />),
    }),
    protectedRoute("finance", {
      id: "finance:asset-financial-profile:create",
      path: ROUTES.ASSET_FINANCIAL_PROFILE_CREATE,
      title: "Create Asset Financial Profile",
      hidden: true,
      icon: FileText,
      element: withRouteSuspense(<AssetFinancialProfileFormPage />),
    }),
    protectedRoute("finance", {
      id: "finance:asset-financial-profile:edit",
      path: ROUTES.ASSET_FINANCIAL_PROFILE_EDIT,
      title: "Edit Asset Financial Profile",
      hidden: true,
      icon: FileText,
      element: withRouteSuspense(<AssetFinancialProfileFormPage />),
    }),
    protectedRoute("finance", {
      id: "finance:asset-financial-profile:detail",
      path: ROUTES.ASSET_FINANCIAL_PROFILE_DETAIL,
      title: "Asset Financial Profile details",
      hidden: true,
      icon: FileText,
      element: withRouteSuspense(<AssetFinancialProfileDetailPage />),
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
      
        {
          id: "finance:asset:list",
          routeId: "finance:asset:list",
          title: "Asset",
          path: ROUTES.ASSET_LIST,
          guard: "protected",
          icon: FileText,
          description: "Manage Asset records",
          children: [
            {
              id: "finance:asset:create",
              routeId: "finance:asset:create",
              title: "Create Asset",
              path: ROUTES.ASSET_CREATE,
              guard: "protected",
              hidden: true,
            },
            {
              id: "finance:asset:edit",
              routeId: "finance:asset:edit",
              title: "Edit Asset",
              path: ROUTES.ASSET_EDIT,
              guard: "protected",
              hidden: true,
            },
            {
              id: "finance:asset:detail",
              routeId: "finance:asset:detail",
              title: "Asset details",
              path: ROUTES.ASSET_DETAIL,
              guard: "protected",
              hidden: true,
            },
          ],
        },
        {
          id: "finance:asset-financial-profile:list",
          routeId: "finance:asset-financial-profile:list",
          title: "Asset Financial Profile",
          path: ROUTES.ASSET_FINANCIAL_PROFILE_LIST,
          guard: "protected",
          icon: FileText,
          description: "Manage Asset Financial Profile records",
          children: [
            {
              id: "finance:asset-financial-profile:create",
              routeId: "finance:asset-financial-profile:create",
              title: "Create Asset Financial Profile",
              path: ROUTES.ASSET_FINANCIAL_PROFILE_CREATE,
              guard: "protected",
              hidden: true,
            },
            {
              id: "finance:asset-financial-profile:edit",
              routeId: "finance:asset-financial-profile:edit",
              title: "Edit Asset Financial Profile",
              path: ROUTES.ASSET_FINANCIAL_PROFILE_EDIT,
              guard: "protected",
              hidden: true,
            },
            {
              id: "finance:asset-financial-profile:detail",
              routeId: "finance:asset-financial-profile:detail",
              title: "Asset Financial Profile details",
              path: ROUTES.ASSET_FINANCIAL_PROFILE_DETAIL,
              guard: "protected",
              hidden: true,
            },
          ],
        },
],
    }),
  ],
});

export default FINANCE_MANIFEST;
