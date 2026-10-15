/**
 * @file manifest.tsx
 * @description Manifeste du projet 'core' définissant ses routes et ses menus de navigation.
 * JSDoc: Ce fichier configure les routes d'authentification, de profil, de configuration globale,
 * ainsi que le menu de navigation principal dans lequel l'option "Paramètres" a été simplifiée sous forme
 * d'un onglet unique redirigeant vers les différentes sections.
 */

import { lazy, Suspense, type ReactNode } from "react";
import { Navigate } from "react-router-dom";
import {
  LayoutDashboard,
  Lock,
  Settings,
  Shield,
  Smartphone,
  Sparkles,
  User,
} from "lucide-react";
import type { AppManifest } from "@/app/router/contracts";
import { defineProjectManifest, navGroup } from "@/app/router/manifestFactory";
import { ROUTES } from "@/shared/routing/routes";
import ExampleDetailsPage from "@/widgets/model-details/example/ExampleDetailsPage";
import DashboardPage from "./pages/dashboard/DashboardPage";

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
  moduleId: "core",
  order: 101,
  label: "Paramètres",
  shortLabel: "Param.",
  icon: Settings,
  defaultRoute: ROUTES.SETTINGS_ACCOUNT,
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
      id: "core:settings-root",
      path: "/settings",
      guard: "protected",
      projectId: "core",
      title: "Paramètres",
      element: <Navigate to={ROUTES.SETTINGS_ACCOUNT} replace />,
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
      element: <Navigate to={ROUTES.SETTINGS_APPEARANCE} replace />,
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
    // navGroup("core", {
    //   id: "home",
    //   label: "Table",
    //   order: 4,
    //   entries: [
    //     // {
    //     //   id: "core:dashboard",
    //     //   routeId: "core:dashboard",
    //     //   title: "Tableau de bord",
    //     //   path: ROUTES.DASHBOARD,
    //     //   icon: LayoutDashboard,
    //     //   guard: "protected",
    //     //   description: "Vue synthese des indicateurs",
    //     // },

    //   ],
    // }),
    navGroup("core", {
      id: "parametre",
      label: "Paramètres",
      order: 90,
      entries: [
        {
          id: "core:model-import",
          routeId: "core:model-import",
          title: "Import",
          path: ROUTES.MODEL_IMPORT,
          guard: "protected",
          hidden: true,
        },
        {
          id: "core:settings",
          routeId: "core:settings-account",
          title: "Paramètres",
          path: "/settings",
          icon: Settings,
          guard: "protected",
          description: "Accéder aux paramètres",
        },
      ],
    }),
  ],
});

export default CORE_MANIFEST;
