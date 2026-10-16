import {
  getAllRoutes,
  getDefaultRoute,
  getNavigationGroups,
} from "./manifestRegistry";
import { normalizePath, type NavigationGroup } from "./contracts";
import { matchPath } from "react-router-dom";
import type {
  NavigationItem,
  NavigationPage,
  NavigationSection,
} from "@/shared/routing/navigation";

export type {
  NavigationItem,
  NavigationPage,
  NavigationSection,
} from "@/shared/routing/navigation";

export const toNavigationSections = (
  groups: NavigationGroup[],
): NavigationSection[] => {
  const routeById = new Map(getAllRoutes().map((route) => [route.id, route]));

  return groups.map((group) => ({
    id: group.id,
    label: group.label,
    projectId: group.projectId,
    items: group.entries.map((entry) => {
      const route = entry.routeId ? routeById.get(entry.routeId) : undefined;
      const entryPermission =
        entry.requiredPermission ?? route?.requiredPermission;

      return {
        id: entry.id,
        title: entry.title,
        path: entry.path,
        icon: entry.icon,
        requiresAuth: entry.guard === "protected",
        requiredPermission: entryPermission,
        component: route?.element,
        description: entry.description,
        hidden: entry.hidden,
        badge: entry.badge,
        children: entry.children?.map((child) => {
          const childRoute = child.routeId ? routeById.get(child.routeId) : undefined;
          const childPermission =
            child.requiredPermission ?? childRoute?.requiredPermission;

          return {
            title: child.title,
            path: child.path,
            icon: child.icon,
            requiresAuth: child.guard === "protected",
            requiredPermission: childPermission,
            component: childRoute?.element,
            description: child.description,
            hidden: child.hidden,
          };
        }),
      };
    }),
  }));
};

export const getNavigationLinks = (): NavigationSection[] => toNavigationSections(getNavigationGroups());

export const getDefaultAppRoute = getDefaultRoute;

export const flattenNavigationPages = (
  navigationLinks: NavigationSection[] = getNavigationLinks(),
): NavigationPage[] =>
  navigationLinks.flatMap((section) =>
    section.items.flatMap((item) => [
      ...(item.component
        ? [
            {
              title: item.title,
              path: item.path,
              component: item.component,
              icon: item.icon,
              requiresAuth: item.requiresAuth,
              requiredPermission: item.requiredPermission,
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
  navigationLinks: NavigationSection[] = getNavigationLinks(),
):
  | {
      section: NavigationSection;
      item: NavigationItem;
      page: NavigationPage;
    }
  | undefined => {
  const normalized = normalizePath(pathname);

  const matchesPath = (targetPath: string, exact: boolean): boolean =>
    exact
      ? normalizePath(targetPath) === normalized
      : Boolean(matchPath({ path: normalizePath(targetPath), end: true }, normalized));

  // Static destinations take precedence over earlier parameterized entries.
  for (const exact of [true, false]) {
    for (const section of navigationLinks) {
      for (const item of section.items) {
        if (matchesPath(item.path, exact) && item.component) {
          return { section, item, page: { ...item, component: item.component } };
        }

        const match = item.children?.find(
          (child) => matchesPath(child.path, exact),
        );
        if (match) {
          return { section, item, page: match };
        }
      }
    }
  }

  return undefined;
};
