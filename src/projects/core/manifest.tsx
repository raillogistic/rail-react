import { lazy, Suspense, type ReactNode } from "react";
import { Navigate } from "react-router-dom";
import {
  LayoutDashboard,
  Lock,
  Settings,
  Shield,
  Smartphone,
  User,
} from "lucide-react";
import type { AppManifest } from "@/app/router/contracts";
import { defineProjectManifest, navGroup } from "@/app/router/manifestFactory";
import { ROUTES } from "@/shared/routing/routes";
import ExampleDetailsPage from "@/widgets/model-details/example/ExampleDetailsPage";
import DashboardPage from "@/projects/core/pages/dashboard/DashboardPage";

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

const LoginPage = lazy(() =>
  import("@/projects/core/pages/auth/LoginPage").then((module) => ({
    default: module.LoginPage,
  })),
);

const AuthEndpointConfigPage = lazy(() =>
  import("@/projects/core/auth/AuthEndpointConfigPage").then((module) => ({
    default: module.AuthEndpointConfigPage,
  })),
);

const ForgotPasswordPage = lazy(() =>
  import("@/projects/core/pages/auth/ForgotPasswordPage").then((module) => ({
    default: module.ForgotPasswordPage,
  })),
);

const ResetPasswordPage = lazy(() =>
  import("@/projects/core/pages/auth/ResetPasswordPage").then((module) => ({
    default: module.ResetPasswordPage,
  })),
);

const DynamicModelTable = lazy(() =>
  import("@/widgets/model-table/components/DynamicModelTable").then(
    (module) => ({
      default: module.DynamicModelTable,
    }),
  ),
);

const StoreOrderUpdateModelFormExample = lazy(() =>
  import("@/widgets/model-form/examples").then((module) => ({
    default: module.StoreOrderUpdateModelFormExample,
  })),
);

const AccountSettingsPage = lazy(() =>
  import("@/projects/core/pages/settings/AccountSettingsPage").then(
    (module) => ({
      default: module.AccountSettingsPage,
    }),
  ),
);

const AdminUISettingsPage = lazy(() =>
  import("@/projects/core/pages/settings/AdminUISettingsPage").then(
    (module) => ({
      default: module.AdminUISettingsPage,
    }),
  ),
);

const AppearanceSettingsPage = lazy(() =>
  import("@/projects/core/pages/settings/AppearanceSettingsPage").then(
    (module) => ({
      default: module.AppearanceSettingsPage,
    }),
  ),
);

const LayoutSettingsPage = lazy(() =>
  import("@/projects/core/pages/settings/LayoutSettingsPage").then(
    (module) => ({
      default: module.LayoutSettingsPage,
    }),
  ),
);

const SessionsPage = lazy(() =>
  import("@/projects/core/pages/auth/SessionsPage").then((module) => ({
    default: module.SessionsPage,
  })),
);

const MFASetupPage = lazy(() =>
  import("@/projects/core/pages/auth/MFASetupPage").then((module) => ({
    default: module.MFASetupPage,
  })),
);

export const CORE_MANIFEST: AppManifest = defineProjectManifest({
  projectId: "core",
  order: 0,
  defaultRoute: "/dashboard",
  routes: [
    {
      id: "core:login",
      path: ROUTES.LOGIN,
      guard: "public",
      projectId: "core",
      title: "Login",
      element: withRouteSuspense(<LoginPage />),
    },
    {
      id: "core:forgot-password",
      path: ROUTES.FORGOT_PASSWORD,
      guard: "public",
      projectId: "core",
      title: "Forgot password",
      element: withRouteSuspense(<ForgotPasswordPage />),
    },
    {
      id: "core:auth-endpoint-config",
      path: ROUTES.AUTH_ENDPOINT_CONFIG,
      guard: "public",
      projectId: "core",
      title: "Backend endpoint config",
      element: withRouteSuspense(<AuthEndpointConfigPage />),
    },
    {
      id: "core:reset-password",
      path: ROUTES.RESET_PASSWORD,
      guard: "public",
      projectId: "core",
      title: "Reset password",
      element: withRouteSuspense(<ResetPasswordPage />),
    },
    {
      id: "core:not-found",
      path: ROUTES.NOT_FOUND,
      guard: "public",
      projectId: "core",
      title: "Not found",
      element: <Navigate to={ROUTES.LOGIN} replace />,
    },
    {
      id: "core:root",
      path: "/",
      guard: "public",
      projectId: "core",
      title: "Root",
      element: <Navigate to={ROUTES.LOGIN} replace />,
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
      requiredPermission: "auth.view_user",
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
    navGroup("core", {
      id: "home",
      label: "Table",
      order: 0,
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
      ],
    }),
    navGroup("core", {
      id: "parametre",
      label: "parametre",
      order: 10,
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
    }),
  ],
});

export default CORE_MANIFEST;
