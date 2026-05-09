import { lazy, Suspense, type ReactNode } from "react";
import { LayoutDashboard, ClipboardList, AlertCircle } from "lucide-react";
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

const InventoryCampaignListPage = lazy(() => import("./pages/inventory-campaign/InventoryCampaignListPage"));
const InventoryCampaignDetailPage = lazy(() => import("./pages/inventory-campaign/InventoryCampaignDetailPage"));
const InventoryCampaignFormPage = lazy(() => import("./pages/inventory-campaign/InventoryCampaignFormPage"));
const InventoryLineListPage = lazy(() => import("./pages/inventory-line/InventoryLineListPage"));
const InventoryGapReportPage = lazy(() => import("./pages/InventoryGapReportPage"));

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
    protectedRoute("inventory", {
      id: "inventory:campaign-list",
      path: ROUTES.INVENTORY_CAMPAIGN_LIST,
      title: "Campagnes",
      icon: ClipboardList,
      element: withRouteSuspense(<InventoryCampaignListPage />),
    }),
    protectedRoute("inventory", {
      id: "inventory:campaign-detail",
      path: ROUTES.INVENTORY_CAMPAIGN_DETAIL,
      title: "Détail Campagne",
      hidden: true,
      element: withRouteSuspense(<InventoryCampaignDetailPage />),
    }),
    protectedRoute("inventory", {
      id: "inventory:campaign-create",
      path: ROUTES.INVENTORY_CAMPAIGN_CREATE,
      title: "Nouvelle Campagne",
      hidden: true,
      element: withRouteSuspense(<InventoryCampaignFormPage />),
    }),
    protectedRoute("inventory", {
      id: "inventory:campaign-edit",
      path: ROUTES.INVENTORY_CAMPAIGN_EDIT,
      title: "Modifier Campagne",
      hidden: true,
      element: withRouteSuspense(<InventoryCampaignFormPage />),
    }),
    protectedRoute("inventory", {
      id: "inventory:gap-report",
      path: ROUTES.GAP_REPORT,
      title: "Rapport d'écarts",
      icon: AlertCircle,
      element: withRouteSuspense(<InventoryGapReportPage />),
    }),
    protectedRoute("inventory", {
      id: "inventory:line-list",
      path: ROUTES.INVENTORY_LINE_LIST,
      title: "Lignes d'inventaire",
      hidden: true,
      element: withRouteSuspense(<InventoryLineListPage />),
    }),
  ],
  navigation: [
    navGroup("inventory", {
      id: "inventory",
      label: "Inventaire",
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
        {
          id: "inventory:campaigns",
          routeId: "inventory:campaign-list",
          title: "Campagnes",
          path: ROUTES.INVENTORY_CAMPAIGN_LIST,
          guard: "protected",
          icon: ClipboardList,
        },
        {
          id: "inventory:gaps",
          routeId: "inventory:gap-report",
          title: "Rapport d'écarts",
          path: ROUTES.GAP_REPORT,
          guard: "protected",
          icon: AlertCircle,
        },
      ],
    }),
  ],
});

export default INVENTORY_MANIFEST;
