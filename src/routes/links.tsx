/**
 * Centralized route and navigation definitions shared by the core UI and app modules.
 *
 * Purpose: keep navigation, layout labels, and router targets in one place so the
 * sidebar, header, and routing table all share the same source of truth.
 */

import { MFASetupPage } from "@/auth/pages/MFASetupPage";
import { SessionsPage } from "@/auth/pages/SessionsPage";
import {
  LayoutDashboard,
  Settings,
  Shield,
  User,
  Smartphone,
  Lock,
} from "lucide-react";
import { AccountSettingsPage } from "@/views/settings/AccountSettingsPage";
import { AdminUISettingsPage } from "@/views/settings/AdminUISettingsPage";
import { AppearanceSettingsPage } from "@/views/settings/AppearanceSettingsPage";
import { LayoutSettingsPage } from "@/views/settings/LayoutSettingsPage";

import { getAppDefaultRoute, getAppNavigationLinks } from "@/apps/routes";
// import ModelForm from "@/lib/form/backend/ModelForm";
import { BaseModelTable } from "@/lib/tablev2";
import { ModelForm } from "@/lib/form2";
// import ModelForm    from "@/lib/form2";

export const ROUTES = {
  LOGIN: "/login",
  FORGOT_PASSWORD: "/forgot-password",
  RESET_PASSWORD: "/reset-password",

  DASHBOARD: "/dashboard",
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
        description: "Vue synthèse des indicateurs",
        component: (
          <>
            <div className="grid grid-cols-1 gap-2 min-w-0">
              <BaseModelTable
                app="store"
                model="Product"
                fields={[
                  "sku",
                  "name",
                  "price",
                  { accessor: "createdAt", title: "Created At" },
                ]}
              />
            </div>
          </>
        ),
      },
      {
        id: "form-test",
        path: "/form",
        component: (
          <>
            <ModelForm
              appName="store"
              modelName="Order"
              mutationMode={"create"}
              onChange={(values) => {
                console.log(values);
              }}
              // objectId={orderId}
              nestedFields={["customer", "items"]}
              initialValues={{
                customer: {
                  id: "c1",
                  firstName: "Ada",
                  lastName: "Ada",
                  email: "ada@example.com",
                },
                items: [
                  { id: "li1", product: "1", quantity: 2 },
                  { product: "2", quantity: 1 }, // no id => create
                ],
              }}
              // nestedFieldsControl={{
              //   defaultMode: "auto",
              //   defaultPruneEmpty: true,
              //   defaultIdKeys: ["id", "uuid"],
              //   defaultKeepRelationshipField: false,
              //   fields: {
              //     customer: {
              //       mode: "auto",
              //       // keepRelationshipField: false,
              //       objectProps: { columns: 2, collapsible: true },
              //       fieldOverrides: {
              //         id: { hidden: true },
              //         email: { required: true },
              //       },
              //     },
              //     items: {
              //       mode: "auto",
              //       operations: {
              //         connect: true,
              //         create: true,
              //         update: true,
              //         disconnect: true,
              //         set: true,
              //       },
              //       listProps: {
              //         addLabel: "Add line item",
              //         itemLabel: "Line",
              //         columns: 3,
              //       },
              //       fieldOverrides: {
              //         id: { hidden: true },
              //         quantity: { type: "number", min: 1 },
              //         product: { placeholder: "Select product" },
              //       },
              //     },
              //   },
              // }}
            />
            {/* <ModelForm appName="store" modelName="Product" />{" "} */}
          </>
        ),
        description: "dd",
        requiresAuth: true,
        title: "Test Form",
      },
      {
        id: "old-form-test",
        path: "/formold",
        component: (
          <>
            {/* <ModelForm
              appName="store"
              modelName="Order"
              nestedFields={["items"]}
              ordering={{ trailingFields: ["items"] }}
            /> */}
          </>
        ),
        description: "old form",
        requiresAuth: true,
        title: "Old Form",
      },
    ],
  },
  {
    id: "form",
    label: "Form",
    items: [],
  },
  {
    id: "settings",
    label: "Paramètres",
    items: [
      {
        id: "settings-account",
        title: "Compte",
        path: ROUTES.SETTINGS_ACCOUNT,
        icon: User,
        requiresAuth: true,
        component: <AccountSettingsPage />,
        description: "Gérer votre profil",
      },
      {
        id: "settings-appearance",
        title: "Apparence",
        path: ROUTES.SETTINGS_APPEARANCE,
        icon: Settings,
        requiresAuth: true,
        component: <AppearanceSettingsPage />,
        description: "Thème et affichage",
      },
      {
        id: "settings-layout",
        title: "Disposition",
        path: ROUTES.SETTINGS_LAYOUT,
        icon: LayoutDashboard,
        requiresAuth: true,
        component: <LayoutSettingsPage />,
        description: "Disposition de l'interface",
      },
      {
        id: "settings-admin",
        title: "Administration UI",
        path: ROUTES.SETTINGS_ADMIN,
        icon: Shield,
        requiresAuth: true,
        component: <AdminUISettingsPage />,
        description: "Configuration globale UI",
      },
      {
        id: "settings-sessions",
        title: "Sessions",
        path: ROUTES.SETTINGS_SESSIONS,
        icon: Smartphone, // Using Smartphone as proxy for devices/sessions
        requiresAuth: true,
        component: <SessionsPage />,
        description: "Gérer vos sessions actives",
      },
      {
        id: "settings-mfa",
        title: "Authentification à deux facteurs",
        path: ROUTES.SETTINGS_MFA,
        icon: Lock,
        requiresAuth: true,
        component: <MFASetupPage />,
        description: "Sécuriser votre compte",
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
