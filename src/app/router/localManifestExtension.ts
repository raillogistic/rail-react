import type {
  AppManifest,
  NavigationEntry,
  NavigationGroup,
  RouteGuard,
} from "./contracts";

type LocalManifestModule = {
  APP_MANIFEST?: AppManifest;
  APP_MANIFEST_EXTENSION?: Partial<AppManifest>;
  APP_NAVIGATION_LINKS?: unknown;
  APP_DEFAULT_ROUTE?: unknown;
};

type LegacyLocalNavigationPage = {
  title: string;
  path: string;
  requiresAuth: boolean;
  description?: string;
  hidden?: boolean;
  icon?: NavigationEntry["icon"];
};

type LegacyLocalNavigationItem = LegacyLocalNavigationPage & {
  id: string;
  children?: LegacyLocalNavigationPage[];
};

type LegacyLocalNavigationSection = {
  id: string;
  label: string;
  items: LegacyLocalNavigationItem[];
};

const localModules = import.meta.glob<LocalManifestModule>(
  "@/apps/routes.local.ts",
  {
    eager: true,
  },
);

const getFirstLocalModule = (): LocalManifestModule | undefined =>
  Object.values(localModules)[0];

const toGuard = (requiresAuth: boolean): RouteGuard =>
  requiresAuth ? "protected" : "public";

const buildLegacyLocalManifest = (
  module: LocalManifestModule,
): AppManifest | null => {
  const rawLinks = module.APP_NAVIGATION_LINKS;
  if (!Array.isArray(rawLinks)) {
    return null;
  }

  const links = rawLinks as LegacyLocalNavigationSection[];
  const navigation: NavigationGroup[] = links.map((section) => ({
    id: section.id,
    label: section.label,
    projectId: "local",
    entries: section.items.map((item) => ({
      id: item.id,
      title: item.title,
      path: item.path,
      guard: toGuard(item.requiresAuth),
      hidden: item.hidden,
      description: item.description,
      icon: item.icon,
      children:
        item.children?.map((child) => ({
          id: `${item.id}:${child.path}`,
          title: child.title,
          path: child.path,
          guard: toGuard(child.requiresAuth),
          hidden: child.hidden,
          description: child.description,
          icon: child.icon ?? item.icon,
        })) ?? [],
    })),
  }));

  const routes = navigation.flatMap((group) =>
    group.entries.flatMap((entry) => [
      {
        id: `local:${entry.id}`,
        path: entry.path,
        guard: entry.guard,
        projectId: "local",
        title: entry.title,
        description: entry.description,
        hidden: entry.hidden,
        icon: entry.icon,
      },
      ...(entry.children ?? []).map((child) => ({
        id: `local:${child.id}`,
        path: child.path,
        guard: child.guard,
        projectId: "local",
        title: child.title,
        description: child.description,
        hidden: child.hidden,
        icon: child.icon,
      })),
    ]),
  );

  const defaultRoute =
    typeof module.APP_DEFAULT_ROUTE === "string"
      ? module.APP_DEFAULT_ROUTE
      : routes.find((route) => route.guard === "protected")?.path ?? "/";

  return {
    projectId: "local",
    defaultRoute,
    routes,
    navigation,
  };
};

export const getLocalManifestExtension = (): AppManifest | null => {
  const module = getFirstLocalModule();
  if (!module) {
    return null;
  }

  if (module.APP_MANIFEST) {
    return module.APP_MANIFEST;
  }

  if (module.APP_MANIFEST_EXTENSION?.routes && module.APP_MANIFEST_EXTENSION?.navigation) {
    return {
      projectId: module.APP_MANIFEST_EXTENSION.projectId ?? "local",
      defaultRoute: module.APP_MANIFEST_EXTENSION.defaultRoute ?? "/",
      routes: module.APP_MANIFEST_EXTENSION.routes,
      navigation: module.APP_MANIFEST_EXTENSION.navigation,
    };
  }

  return buildLegacyLocalManifest(module);
};

