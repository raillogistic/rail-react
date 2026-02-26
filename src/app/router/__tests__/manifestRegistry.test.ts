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

  it("loads multiple project manifests and keeps the core default route", () => {
    const routes = getAllRoutes();
    const projectIds = new Set(routes.map((route) => route.projectId));

    expect(projectIds.has("core")).toBe(true);
    expect(projectIds.has("starter")).toBe(true);
    expect(getDefaultRoute()).toBe("/dashboard");
    expect(
      routes.some(
        (route) =>
          normalizePath(route.path) === "/starter/overview" &&
          route.guard === "protected",
      ),
    ).toBe(true);
    expect(
      getNavigationGroups().some((group) => group.projectId === "starter"),
    ).toBe(true);
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
