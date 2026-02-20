/**
 * Centralized route and navigation definitions shared by the core UI and app modules.
 *
 * Purpose: keep navigation, layout labels, and router targets in one place so the
 * sidebar, header, and routing table all share the same source of truth.
 */

import { lazy, Suspense, type ComponentType, type ReactNode } from "react";
import {
  LayoutDashboard,
  Settings,
  Shield,
  User,
  Smartphone,
  Lock,
} from "lucide-react";
import { getAppDefaultRoute, getAppNavigationLinks } from "@/apps/routes";
import ExampleDetailsPage from "@/lib/details/example/ExampleDetailsPage";
import DashboardPage from "@/views/dashboard/DashboardPage";

const routeFallback = (
  <div className="rounded-md border p-3 text-sm text-muted-foreground">
    Chargement...
  </div>
);

const withRouteSuspense = (component: ReactNode) => (
  <Suspense fallback={routeFallback}>{component}</Suspense>
);

const ModelImportPage = lazy(() =>
  import("@/lib/import/pages").then((module) => ({
    default: module.ModelImportPage,
  })),
);

const ModelTableV2 = lazy(() =>
  import("@/lib/table/components/ModelTableV2").then((module) => ({
    default: module.ModelTableV2,
  })),
);

const BaseModelTable = lazy(() =>
  import("@/lib/table/components/BaseModelTable").then((module) => ({
    default: module.BaseModelTable,
  })),
);

const SettingsForm = lazy(() =>
  import("@/lib/form/examples").then((module) => ({
    default: module.SettingsForm,
  })),
);

const ContactForm = lazy(() =>
  import("@/lib/form/examples").then((module) => ({
    default: module.ContactForm,
  })),
);

const OnboardingWizard = lazy(() =>
  import("@/lib/form/examples").then((module) => ({
    default: module.OnboardingWizard,
  })),
);

const InvoiceForm = lazy(() =>
  import("@/lib/form/examples").then((module) => ({
    default: module.InvoiceForm,
  })),
);

const ApplicationReviewForm = lazy(() =>
  import("@/lib/form/examples").then((module) => ({
    default: module.ApplicationReviewForm,
  })),
);

const StoreOrderUpdateModelFormExample = lazy(() =>
  import("@/lib/form/examples").then((module) => ({
    default: module.StoreOrderUpdateModelFormExample,
  })),
);

const AccountSettingsPage = lazy(() =>
  import("@/views/settings/AccountSettingsPage").then((module) => ({
    default: module.AccountSettingsPage,
  })),
);

const AdminUISettingsPage = lazy(() =>
  import("@/views/settings/AdminUISettingsPage").then((module) => ({
    default: module.AdminUISettingsPage,
  })),
);

const AppearanceSettingsPage = lazy(() =>
  import("@/views/settings/AppearanceSettingsPage").then((module) => ({
    default: module.AppearanceSettingsPage,
  })),
);

const LayoutSettingsPage = lazy(() =>
  import("@/views/settings/LayoutSettingsPage").then((module) => ({
    default: module.LayoutSettingsPage,
  })),
);

const SessionsPage = lazy(() =>
  import("@/auth/pages/SessionsPage").then((module) => ({
    default: module.SessionsPage,
  })),
);

const MFASetupPage = lazy(() =>
  import("@/auth/pages/MFASetupPage").then((module) => ({
    default: module.MFASetupPage,
  })),
);

export const ROUTES = {
  LOGIN: "/login",
  FORGOT_PASSWORD: "/forgot-password",
  RESET_PASSWORD: "/reset-password",

  DASHBOARD: "/dashboard",
  MODEL_IMPORT: "/model-import",
  NOT_FOUND: "/404",

  SETTINGS_ACCOUNT: "/settings/account",
  SETTINGS_APPEARANCE: "/settings/appearance",
  SETTINGS_LAYOUT: "/settings/layout",
  SETTINGS_ADMIN: "/settings/admin",
  SETTINGS_SESSIONS: "/settings/sessions",
  SETTINGS_MFA: "/settings/mfa",
} as const;

export type RouteKey = keyof typeof ROUTES;
export type RoutePath = (typeof ROUTES)[RouteKey];

export interface NavigationPage {
  title: string;
  path: string;
  component: ReactNode;
  icon?: ComponentType<{ className?: string }>;
  requiresAuth: boolean;
  description?: string;
  hidden?: boolean;
}

export interface NavigationItem {
  id: string;
  title: string;
  path: string;
  icon?: ComponentType<{ className?: string }>;
  requiresAuth: boolean;
  component?: ReactNode;
  description?: string;
  hidden?: boolean;
  children?: NavigationPage[];
}

export interface NavigationSection {
  id: string;
  label: string;
  items: NavigationItem[];
}

const CORE_NAVIGATION_LINKS: NavigationSection[] = [
  {
    id: "home",
    label: "Table",
    items: [
      {
        id: "dashboard",
        title: "Tableau de bord",
        path: ROUTES.DASHBOARD,
        icon: LayoutDashboard,
        requiresAuth: true,
        description: "Vue synthese des indicateurs",
        component: <DashboardPage />,
      },
      {
        id: "model-import",
        title: "Import",
        path: ROUTES.MODEL_IMPORT,
        requiresAuth: true,
        hidden: true,
        component: withRouteSuspense(<ModelImportPage />),
      },
      {
        id: "orders-table-v2",
        title: "Factures",
        path: "/orders-table-v2",
        icon: LayoutDashboard,
        requiresAuth: true,
        description: "Progress view for ModelTableV2 (store.Order)",
        component: withRouteSuspense(
          <ModelTableV2
            app="billing"
            model="Invoice"
            baseTable={{
              topActions: () => [<></>],
              tableConfig: { title: "Liste des factures" },
              fields: ["id", "createdAt", "updatedAt", "status"],
            }}
          />,
        ),
      },
      {
        id: "orders-table-v",
        title: "Base Table",
        path: "/orders-table-",
        icon: LayoutDashboard,
        requiresAuth: true,
        description: "Progress view for ModelTableV2 (store.Order)",
        component: withRouteSuspense(
          <BaseModelTable
            app="store"
            model="Product"
            tableConfig={{ title: "Liste des produits" }}
          />,
        ),
      },
      {
        id: "form-test",
        path: "/form",
        component: withRouteSuspense(
          <div>
            <ExampleDetailsPage />
          </div>,
        ),
        description: "dd",
        requiresAuth: true,
        title: "Details",
      },
      {
        id: "old-form-test",
        path: "/formold",
        component: withRouteSuspense(
          <StoreOrderUpdateModelFormExample objectId={"10"} />,
        ),
        description: "old form",
        requiresAuth: true,
        title: "Old Form",
      },
    ],
  },
  {
    id: "parametre",
    label: "parametre",
    items: [
      {
        id: "parametre",
        title: "parametre",
        path: ROUTES.SETTINGS_ACCOUNT,
        icon: Settings,
        requiresAuth: true,
        description: "Acceder aux parametres",
        children: [
          {
            title: "Compte",
            path: ROUTES.SETTINGS_ACCOUNT,
            icon: User,
            requiresAuth: true,
            component: withRouteSuspense(<AccountSettingsPage />),
            description: "Gerer votre profil",
          },
          {
            title: "Apparence",
            path: ROUTES.SETTINGS_APPEARANCE,
            icon: Settings,
            requiresAuth: true,
            component: withRouteSuspense(<AppearanceSettingsPage />),
            description: "Theme et affichage",
          },
          {
            title: "Disposition",
            path: ROUTES.SETTINGS_LAYOUT,
            icon: LayoutDashboard,
            requiresAuth: true,
            component: withRouteSuspense(<LayoutSettingsPage />),
            description: "Disposition de l'interface",
          },
          {
            title: "Administration UI",
            path: ROUTES.SETTINGS_ADMIN,
            icon: Shield,
            requiresAuth: true,
            component: withRouteSuspense(<AdminUISettingsPage />),
            description: "Configuration globale UI",
          },
          {
            title: "Sessions",
            path: ROUTES.SETTINGS_SESSIONS,
            icon: Smartphone,
            requiresAuth: true,
            component: withRouteSuspense(<SessionsPage />),
            description: "Gerer vos sessions actives",
          },
          {
            title: "Authentification a deux facteurs",
            path: ROUTES.SETTINGS_MFA,
            icon: Lock,
            requiresAuth: true,
            component: withRouteSuspense(<MFASetupPage />),
            description: "Securiser votre compte",
          },
        ],
      },
    ],
  },
];

const appNavigationLinks = getAppNavigationLinks() as NavigationSection[];

export const NAVIGATION_LINKS: NavigationSection[] = [
  ...CORE_NAVIGATION_LINKS,
  ...appNavigationLinks,
];

export const DEFAULT_APP_ROUTE = getAppDefaultRoute() ?? ROUTES.DASHBOARD;

export const flattenNavigationPages = (): NavigationPage[] =>
  NAVIGATION_LINKS.flatMap((section) =>
    section.items.flatMap((item) => [
      ...(item.component
        ? [
            {
              title: item.title,
              path: item.path,
              component: item.component,
              icon: item.icon,
              requiresAuth: item.requiresAuth,
              description: item.description,
              hidden: item.hidden,
            } satisfies NavigationPage,
          ]
        : []),
      ...(item.children ?? []),
    ]),
  );

export const findNavigationByPath = (
  pathname: string,
):
  | {
      section: NavigationSection;
      item: NavigationItem;
      page: NavigationPage;
    }
  | undefined => {
  const normalized = pathname.endsWith("/")
    ? pathname.slice(0, -1) || "/"
    : pathname;

  for (const section of NAVIGATION_LINKS) {
    for (const item of section.items) {
      if (item.path === normalized && item.component) {
        return { section, item, page: { ...item, component: item.component } };
      }

      const match = item.children?.find((child) => child.path === normalized);
      if (match) {
        return { section, item, page: match };
      }
    }
  }

  return undefined;
};

const PUBLIC_ROUTES = new Set<string>([
  ROUTES.LOGIN,
  ROUTES.FORGOT_PASSWORD,
  ROUTES.RESET_PASSWORD,
  ROUTES.NOT_FOUND,
  "/",
]);

const normalizePath = (pathname: string): string =>
  pathname.endsWith("/") ? pathname.slice(0, -1) || "/" : pathname;

export const isProtectedRoute = (pathname: string): boolean => {
  const normalized = normalizePath(pathname);
  if (PUBLIC_ROUTES.has(normalized)) {
    return false;
  }

  const match = findNavigationByPath(normalized);
  if (match) {
    return !!match.page.requiresAuth;
  }

  return true;
};
