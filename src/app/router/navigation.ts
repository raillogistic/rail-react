import {
  getAllRoutes,
  getDefaultRoute,
  getNavigationGroups,
} from "./manifestRegistry";
import { normalizePath, type NavigationGroup } from "./contracts";
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

const toNavigationSections = (
  groups: NavigationGroup[],
): NavigationSection[] => {
  const routeById = new Map(getAllRoutes().map((route) => [route.id, route]));

  return groups.map((group) => ({
    id: group.id,
    label: group.label,
    items: group.entries.map((entry) => ({
      id: entry.id,
      title: entry.title,
      path: entry.path,
      icon: entry.icon,
      requiresAuth: entry.guard === "protected",
      component: entry.routeId ? routeById.get(entry.routeId)?.element : undefined,
      description: entry.description,
      hidden: entry.hidden,
      children: entry.children?.map((child) => ({
        title: child.title,
        path: child.path,
        icon: child.icon,
        requiresAuth: child.guard === "protected",
        component: child.routeId ? routeById.get(child.routeId)?.element : undefined,
        description: child.description,
        hidden: child.hidden,
      })),
    })),
  }));
};

export const NAVIGATION_LINKS: NavigationSection[] = toNavigationSections(
  getNavigationGroups(),
);

export const DEFAULT_APP_ROUTE = getDefaultRoute();

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
  const normalized = normalizePath(pathname);

  for (const section of NAVIGATION_LINKS) {
    for (const item of section.items) {
      if (normalizePath(item.path) === normalized && item.component) {
        return { section, item, page: { ...item, component: item.component } };
      }

      const match = item.children?.find(
        (child) => normalizePath(child.path) === normalized,
      );
      if (match) {
        return { section, item, page: match };
      }
    }
  }

  return undefined;
};
