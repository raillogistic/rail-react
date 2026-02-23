import { lazy, Suspense, type ReactNode } from "react";
import {
  LayoutDashboard,
  Lock,
  Settings,
  Shield,
  Smartphone,
  User,
} from "lucide-react";
import type { AppManifest } from "@/app/router/contracts";
import { ROUTES } from "@/shared/routing/paths";
import ExampleDetailsPage from "@/widgets/model-details/example/ExampleDetailsPage";
import DashboardPage from "@/pages/dashboard/DashboardPage";

const routeFallback = (
  <div className="rounded-md border p-3 text-sm text-muted-foreground">
    Chargement...
  </div>
);

const withRouteSuspense = (component: ReactNode) => (
  <Suspense fallback={routeFallback}>{component}</Suspense>
);

const ModelImportPage = lazy(() =>
  import("@/features/model-import/pages/ModelImportPage").then((module) => ({
    default: module.ModelImportPage,
  })),
);

const DynamicModelTable = lazy(() =>
  import("@/widgets/model-table/components/DynamicModelTable").then((module) => ({
    default: module.DynamicModelTable,
  })),
);

const StoreOrderUpdateModelFormExample = lazy(() =>
  import("@/widgets/model-form/examples").then((module) => ({
    default: module.StoreOrderUpdateModelFormExample,
  })),
);

const AccountSettingsPage = lazy(() =>
  import("@/pages/settings/AccountSettingsPage").then((module) => ({
    default: module.AccountSettingsPage,
  })),
);

const AdminUISettingsPage = lazy(() =>
  import("@/pages/settings/AdminUISettingsPage").then((module) => ({
    default: module.AdminUISettingsPage,
  })),
);

const AppearanceSettingsPage = lazy(() =>
  import("@/pages/settings/AppearanceSettingsPage").then((module) => ({
    default: module.AppearanceSettingsPage,
  })),
);

const LayoutSettingsPage = lazy(() =>
  import("@/pages/settings/LayoutSettingsPage").then((module) => ({
    default: module.LayoutSettingsPage,
  })),
);

const SessionsPage = lazy(() =>
  import("@/pages/auth/SessionsPage").then((module) => ({
    default: module.SessionsPage,
  })),
);

const MFASetupPage = lazy(() =>
  import("@/pages/auth/MFASetupPage").then((module) => ({
    default: module.MFASetupPage,
  })),
);

export const CORE_MANIFEST: AppManifest = {
  projectId: "core",
  defaultRoute: "/dashboard",
  routes: [
    {
      id: "core:login",
      path: ROUTES.LOGIN,
      guard: "public",
      projectId: "core",
      title: "Login",
    },
    {
      id: "core:forgot-password",
      path: ROUTES.FORGOT_PASSWORD,
      guard: "public",
      projectId: "core",
      title: "Forgot password",
    },
    {
      id: "core:reset-password",
      path: ROUTES.RESET_PASSWORD,
      guard: "public",
      projectId: "core",
      title: "Reset password",
    },
    {
      id: "core:not-found",
      path: ROUTES.NOT_FOUND,
      guard: "public",
      projectId: "core",
      title: "Not found",
    },
    {
      id: "core:root",
      path: "/",
      guard: "public",
      projectId: "core",
      title: "Root",
    },
    {
      id: "core:dashboard",
      path: ROUTES.DASHBOARD,
      guard: "protected",
      projectId: "core",
      title: "Tableau de bord",
      description: "Vue synthese des indicateurs",
      icon: LayoutDashboard,
      element: <DashboardPage />,
    },
    {
      id: "core:model-import",
      path: ROUTES.MODEL_IMPORT,
      guard: "protected",
      projectId: "core",
      title: "Import",
      hidden: true,
      element: withRouteSuspense(<ModelImportPage />),
    },
    {
      id: "core:orders-table-v2",
      path: "/orders-table-v2",
      guard: "protected",
      projectId: "core",
      title: "Factures",
      description: "Progress view for DynamicModelTable (store.Order)",
      icon: LayoutDashboard,
      element: withRouteSuspense(
        <DynamicModelTable
          app="billing"
          model="Invoice"
          baseTable={{
            tableConfig: { title: "Liste des factures" },
            fields: ["id", "createdAt", "updatedAt", "status"],
          }}
        />,
      ),
    },
    {
      id: "core:orders-table-v",
      path: "/orders-table-",
      guard: "protected",
      projectId: "core",
      title: "Base Table",
      description: "Progress view for DynamicModelTable (store.Order)",
      icon: LayoutDashboard,
      element: withRouteSuspense(
        <DynamicModelTable
          app="store"
          model="Product"
          baseTable={{ tableConfig: { title: "Liste des produits" } }}
        />,
      ),
    },
    {
      id: "core:form-test",
      path: "/form",
      guard: "protected",
      projectId: "core",
      title: "Details",
      description: "dd",
      element: withRouteSuspense(
        <div>
          <ExampleDetailsPage />
        </div>,
      ),
    },
    {
      id: "core:old-form-test",
      path: "/formold",
      guard: "protected",
      projectId: "core",
      title: "Old Form",
      description: "old form",
      element: withRouteSuspense(
        <StoreOrderUpdateModelFormExample objectId={"10"} />,
      ),
    },
    {
      id: "core:settings-account",
      path: ROUTES.SETTINGS_ACCOUNT,
      guard: "protected",
      projectId: "core",
      title: "Compte",
      description: "Gerer votre profil",
      icon: User,
      element: withRouteSuspense(<AccountSettingsPage />),
    },
    {
      id: "core:settings-appearance",
      path: ROUTES.SETTINGS_APPEARANCE,
      guard: "protected",
      projectId: "core",
      title: "Apparence",
      description: "Theme et affichage",
      icon: Settings,
      element: withRouteSuspense(<AppearanceSettingsPage />),
    },
    {
      id: "core:settings-layout",
      path: ROUTES.SETTINGS_LAYOUT,
      guard: "protected",
      projectId: "core",
      title: "Disposition",
      description: "Disposition de l'interface",
      icon: LayoutDashboard,
      element: withRouteSuspense(<LayoutSettingsPage />),
    },
    {
      id: "core:settings-admin",
      path: ROUTES.SETTINGS_ADMIN,
      guard: "protected",
      projectId: "core",
      title: "Administration UI",
      description: "Configuration globale UI",
      icon: Shield,
      element: withRouteSuspense(<AdminUISettingsPage />),
    },
    {
      id: "core:settings-sessions",
      path: ROUTES.SETTINGS_SESSIONS,
      guard: "protected",
      projectId: "core",
      title: "Sessions",
      description: "Gerer vos sessions actives",
      icon: Smartphone,
      element: withRouteSuspense(<SessionsPage />),
    },
    {
      id: "core:settings-mfa",
      path: ROUTES.SETTINGS_MFA,
      guard: "protected",
      projectId: "core",
      title: "Authentification a deux facteurs",
      description: "Securiser votre compte",
      icon: Lock,
      element: withRouteSuspense(<MFASetupPage />),
    },
  ],
  navigation: [
    {
      id: "home",
      label: "Table",
      projectId: "core",
      entries: [
        {
          id: "core:dashboard",
          routeId: "core:dashboard",
          title: "Tableau de bord",
          path: ROUTES.DASHBOARD,
          icon: LayoutDashboard,
          guard: "protected",
          description: "Vue synthese des indicateurs",
        },
        {
          id: "core:model-import",
          routeId: "core:model-import",
          title: "Import",
          path: ROUTES.MODEL_IMPORT,
          guard: "protected",
          hidden: true,
        },
        {
          id: "core:orders-table-v2",
          routeId: "core:orders-table-v2",
          title: "Factures",
          path: "/orders-table-v2",
          icon: LayoutDashboard,
          guard: "protected",
          description: "Progress view for DynamicModelTable (store.Order)",
        },
        {
          id: "core:orders-table-v",
          routeId: "core:orders-table-v",
          title: "Base Table",
          path: "/orders-table-",
          icon: LayoutDashboard,
          guard: "protected",
          description: "Progress view for DynamicModelTable (store.Order)",
        },
        {
          id: "core:form-test",
          routeId: "core:form-test",
          title: "Details",
          path: "/form",
          guard: "protected",
          description: "dd",
        },
        {
          id: "core:old-form-test",
          routeId: "core:old-form-test",
          title: "Old Form",
          path: "/formold",
          guard: "protected",
          description: "old form",
        },
      ],
    },
    {
      id: "parametre",
      label: "parametre",
      projectId: "core",
      entries: [
        {
          id: "core:settings",
          title: "parametre",
          path: ROUTES.SETTINGS_ACCOUNT,
          icon: Settings,
          guard: "protected",
          description: "Acceder aux parametres",
          children: [
            {
              id: "core:settings-account",
              routeId: "core:settings-account",
              title: "Compte",
              path: ROUTES.SETTINGS_ACCOUNT,
              icon: User,
              guard: "protected",
              description: "Gerer votre profil",
            },
            {
              id: "core:settings-appearance",
              routeId: "core:settings-appearance",
              title: "Apparence",
              path: ROUTES.SETTINGS_APPEARANCE,
              icon: Settings,
              guard: "protected",
              description: "Theme et affichage",
            },
            {
              id: "core:settings-layout",
              routeId: "core:settings-layout",
              title: "Disposition",
              path: ROUTES.SETTINGS_LAYOUT,
              icon: LayoutDashboard,
              guard: "protected",
              description: "Disposition de l'interface",
            },
            {
              id: "core:settings-admin",
              routeId: "core:settings-admin",
              title: "Administration UI",
              path: ROUTES.SETTINGS_ADMIN,
              icon: Shield,
              guard: "protected",
              description: "Configuration globale UI",
            },
            {
              id: "core:settings-sessions",
              routeId: "core:settings-sessions",
              title: "Sessions",
              path: ROUTES.SETTINGS_SESSIONS,
              icon: Smartphone,
              guard: "protected",
              description: "Gerer vos sessions actives",
            },
            {
              id: "core:settings-mfa",
              routeId: "core:settings-mfa",
              title: "Authentification a deux facteurs",
              path: ROUTES.SETTINGS_MFA,
              icon: Lock,
              guard: "protected",
              description: "Securiser votre compte",
            },
          ],
        },
      ],
    },
  ],
};

export default CORE_MANIFEST;

