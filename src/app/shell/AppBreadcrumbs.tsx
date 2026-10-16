/**
 * @file AppBreadcrumbs.tsx
 * @description Fil d'Ariane dérivé des métadonnées de navigation et de routes.
 * Masqué sur la page d'accueil/landing, déduplique les niveaux consécutifs,
 * rend cliquables uniquement les ancêtres avec une destination valide,
 * et utilise le titre des routes pour les pages absentes de la navigation.
 *
 * @module app/shell/AppBreadcrumbs
 */

import React from "react";
import { Link, useLocation, matchPath } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/shared/ui/kit/breadcrumb";
import { useRouteAccess } from "@/app/router/routeAccess";
import { getAllRoutes } from "@/app/router/manifestRegistry";
import { findNavigationByPath } from "@/app/router/navigation";
import { normalizePath } from "@/app/router/contracts";
import type { NavigationSection } from "@/shared/routing/navigation";
import type { AppRouteConfig } from "@/app/router/contracts";

export interface BreadcrumbEntry {
  title: string;
  path?: string;
  isClickable?: boolean;
}

/**
 * Dérive la liste des éléments du fil d'Ariane à partir de l'URL courante,
 * des sections de navigation et des routes enregistrées.
 *
 * @param pathname Le chemin d'accès courant.
 * @param navigationLinks Les sections de navigation de l'application.
 * @param defaultRoute La route d'atterrissage / accueil par défaut.
 * @param routes La liste des routes configurées.
 * @param canAccessRoute Vérification d'accès des destinations des ancêtres.
 * @returns La liste des éléments du fil d'Ariane, ou une liste vide si masqué.
 */
export function deriveBreadcrumbItems(
  pathname: string,
  navigationLinks: NavigationSection[],
  defaultRoute: string,
  routes: AppRouteConfig[] = [],
  canAccessRoute: (route: AppRouteConfig) => boolean = () => true,
): BreadcrumbEntry[] {
  const normCurrent = normalizePath(pathname);
  const normDefault = normalizePath(defaultRoute);

  // Masquer le fil d'Ariane sur la route d'atterrissage
  if (!normCurrent || normCurrent === "/" || normCurrent === normDefault) {
    return [];
  }

  const rawEntries: BreadcrumbEntry[] = [];

  const findRoute = (path: string) =>
    routes.find((route) => normalizePath(route.path) === normalizePath(path)) ??
    routes.find((route) => matchPath({ path: route.path, end: true }, path));

  // Match against the current URL to resolve parameters without exposing templates as links.
  const ancestor = (title: string, pattern: string): BreadcrumbEntry => {
    const path = /(^|\/):|\*/.test(pattern)
      ? matchPath({ path: pattern, end: false }, normCurrent)?.pathname
      : pattern;
    const route = path ? findRoute(path) : undefined;
    return {
      title,
      path,
      isClickable: Boolean(
        path && !/(^|\/):[^/]+/.test(path) && normalizePath(path) !== normCurrent &&
        route && canAccessRoute(route),
      ),
    };
  };

  // Niveau racine (Accueil / Tableau de bord)
  const defaultRouteConfig = routes.find(
    (r) => normalizePath(r.path) === normDefault,
  );
  const rootTitle = defaultRouteConfig?.title ?? "Accueil";
  rawEntries.push(ancestor(rootTitle, defaultRoute));

  // Recherche dans la navigation
  const matchedRoute = findRoute(normCurrent);
  const navigationMatch = findNavigationByPath(pathname, navigationLinks);
  const navMatch =
    matchedRoute && normalizePath(matchedRoute.path) === normCurrent &&
    navigationMatch && normalizePath(navigationMatch.page.path) !== normCurrent
      ? undefined
      : navigationMatch;

  if (navMatch) {
    // Ancêtre section si présent
    if (navMatch.section?.label) {
      rawEntries.push({
        title: navMatch.section.label,
        path: undefined,
        isClickable: false,
      });
    }

    // Ancêtre item si différent de la page fille
    if (
      navMatch.item?.title &&
      navMatch.item.path &&
      normalizePath(navMatch.item.path) !== normalizePath(navMatch.page.path)
    ) {
      rawEntries.push(ancestor(navMatch.item.title, navMatch.item.path));
    }

    // Page courante
    rawEntries.push({
      title: navMatch.page.title,
      path: pathname,
      isClickable: false,
    });
  } else {
    // Page absente de la navigation : dériver depuis les routes
    // Découvrir d'éventuels ancêtres via les préfixes du chemin
    const segments = normCurrent.split("/").filter(Boolean);
    for (let i = 1; i < segments.length; i++) {
      const parentPath = "/" + segments.slice(0, i).join("/");
      if (normalizePath(parentPath) === normDefault) {
        continue;
      }
      const parentNav = findNavigationByPath(parentPath, navigationLinks);
      if (parentNav) {
        if (parentNav.section?.label) {
          rawEntries.push({
            title: parentNav.section.label,
            path: undefined,
            isClickable: false,
          });
        }
        rawEntries.push(ancestor(parentNav.page.title, parentNav.page.path));
      } else {
        const parentRoute = findRoute(parentPath);
        if (parentRoute) {
          rawEntries.push(ancestor(parentRoute.title ?? "Page", parentRoute.path));
        }
      }
    }

    const fallbackTitle =
      matchedRoute?.title ??
      (segments.length > 0
        ? segments[segments.length - 1].charAt(0).toUpperCase() +
          segments[segments.length - 1].slice(1)
        : "Page");

    rawEntries.push({
      title: fallbackTitle,
      path: pathname,
      isClickable: false,
    });
  }

  // Éliminer les doublons consécutifs
  const deduplicated: BreadcrumbEntry[] = [];
  for (const [index, entry] of rawEntries.entries()) {
    if (!entry.title?.trim()) continue;
    const last = deduplicated[deduplicated.length - 1];
    if (last && last.title.trim().toLowerCase() === entry.title.trim().toLowerCase()) {
      // The current page must replace an identically named ancestor, including its link state.
      if (index === rawEntries.length - 1) {
        deduplicated[deduplicated.length - 1] = entry;
      } else if (entry.isClickable && entry.path && !last.isClickable) {
        last.path = entry.path;
        last.isClickable = true;
      }
      continue;
    }
    deduplicated.push(entry);
  }

  return deduplicated;
}

/**
 * Composant de fil d'Ariane affiché dans l'en-tête de l'espace de travail.
 *
 * @returns {React.ReactElement | null} Le fil d'Ariane ou null si sur la page d'accueil.
 */
export function AppBreadcrumbs(): React.ReactElement | null {
  const location = useLocation();
  const { defaultRoute, navigationLinks, canAccessRoute } = useRouteAccess();
  const routes = getAllRoutes();

  const items = deriveBreadcrumbItems(
    location.pathname,
    navigationLinks,
    defaultRoute,
    routes,
    canAccessRoute,
  );

  if (items.length <= 1) {
    return null;
  }

  return (
    <Breadcrumb aria-label="Fil d'Ariane" className="min-w-0 overflow-hidden">
      <BreadcrumbList className="flex-nowrap gap-1 sm:gap-1.5 text-xs overflow-hidden">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <React.Fragment key={`${item.title}-${index}`}>
              {index > 0 && (
                <BreadcrumbSeparator className="shrink-0">
                  <ChevronRight className="size-3.5 opacity-40" />
                </BreadcrumbSeparator>
              )}
              <BreadcrumbItem className="min-w-0 overflow-hidden">
                {isLast ? (
                  <BreadcrumbPage title={item.title} className="truncate font-semibold text-foreground tracking-tight">
                    {item.title}
                  </BreadcrumbPage>
                ) : item.isClickable && item.path ? (
                  <BreadcrumbLink asChild>
                    <Link
                      to={item.path}
                      title={item.title}
                      className="truncate font-medium text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {item.title}
                    </Link>
                  </BreadcrumbLink>
                ) : (
                  <span title={item.title} className="truncate font-medium text-muted-foreground">
                    {item.title}
                  </span>
                )}
              </BreadcrumbItem>
            </React.Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

export default AppBreadcrumbs;
