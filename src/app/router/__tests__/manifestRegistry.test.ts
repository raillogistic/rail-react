import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  __resetManifestRegistryForTests,
  getAllRoutes,
  getDefaultRoute,
  getNavigationGroups,
  isProtectedRoute,
} from "../manifestRegistry";
import { NAVIGATION_LINKS, flattenNavigationPages } from "../navigation";
import { normalizePath } from "../contracts";

const toRouteFingerprint = (
  routes: ReturnType<typeof getAllRoutes>,
): string[] =>
  routes
    .map((route) => `${normalizePath(route.path)}|${route.guard}`)
    .sort((a, b) => a.localeCompare(b));

describe("manifestRegistry", () => {
  beforeEach(() => {
    __resetManifestRegistryForTests();
    vi.unstubAllEnvs();
  });

  it("exposes manifest routes", () => {
    const routes = getAllRoutes();
    expect(routes.length).toBeGreaterThan(0);
    expect(
      routes.some(
        (route) => normalizePath(route.path) === normalizePath(getDefaultRoute()),
      ),
    ).toBe(true);
  });

  it("returns default routes and route protection metadata", () => {
    const defaultRoute = getDefaultRoute();
    expect(defaultRoute).toBeTruthy();
    expect(isProtectedRoute("/login")).toBe(false);
    expect(isProtectedRoute("/dashboard")).toBe(true);
    expect(getNavigationGroups().length).toBeGreaterThan(0);
  });

  it("loads project manifests and keeps the core default route", () => {
    const routes = getAllRoutes();
    const projectIds = new Set(routes.map((route) => route.projectId));

    expect(projectIds.has("core")).toBe(true);
    expect(getDefaultRoute()).toBe("/dashboard");

    const navigationProjectIds = new Set(
      getNavigationGroups().map((group) => group.projectId),
    );
    for (const projectId of navigationProjectIds) {
      expect(projectIds.has(projectId)).toBe(true);
    }
  });

  it("orders projects and navigation groups using manifest order", () => {
    const routes = getAllRoutes();
    const navigationGroups = getNavigationGroups();

    const firstCoreRouteIndex = routes.findIndex(
      (route) => route.projectId === "core",
    );
    const firstBillingRouteIndex = routes.findIndex(
      (route) => route.projectId === "billing",
    );
    expect(firstCoreRouteIndex).toBeGreaterThanOrEqual(0);
    expect(firstBillingRouteIndex).toBeGreaterThanOrEqual(0);
    expect(firstCoreRouteIndex).toBeLessThan(firstBillingRouteIndex);

    const firstCoreGroupIndex = navigationGroups.findIndex(
      (group) => group.projectId === "core",
    );
    const firstBillingGroupIndex = navigationGroups.findIndex(
      (group) => group.projectId === "billing",
    );
    expect(firstCoreGroupIndex).toBeGreaterThanOrEqual(0);
    expect(firstBillingGroupIndex).toBeGreaterThanOrEqual(0);
    expect(firstCoreGroupIndex).toBeLessThan(firstBillingGroupIndex);
  });

  it("maps navigation links to protected pages", () => {
    const protectedPaths = new Set(
      getAllRoutes()
        .filter((route) => route.guard === "protected" && !!route.element)
        .map((route) => normalizePath(route.path)),
    );

    const flattenedPaths = new Set(
      flattenNavigationPages()
        .filter((page) => !page.hidden)
        .map((page) => normalizePath(page.path)),
    );

    for (const path of flattenedPaths) {
      expect(protectedPaths.has(path)).toBe(true);
    }

    expect(NAVIGATION_LINKS.length).toBe(getNavigationGroups().length);
  });

  it("keeps path and guard fingerprints stable", () => {
    const first = toRouteFingerprint(getAllRoutes());
    __resetManifestRegistryForTests();
    const second = toRouteFingerprint(getAllRoutes());
    expect(first).toEqual(second);
  });
});
