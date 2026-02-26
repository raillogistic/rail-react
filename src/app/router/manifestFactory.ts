import type { AppManifest, AppRouteConfig, NavigationGroup } from "./contracts";

type ProtectedRouteInput = Omit<AppRouteConfig, "guard" | "projectId">;
type NavigationGroupInput = Omit<NavigationGroup, "projectId">;

/**
 * Typed identity helper for project manifests.
 */
export const defineProjectManifest = (manifest: AppManifest): AppManifest =>
  manifest;

/**
 * Creates a protected route while enforcing consistent project ownership.
 */
export const protectedRoute = (
  projectId: string,
  route: ProtectedRouteInput,
): AppRouteConfig => ({
  ...route,
  guard: "protected",
  projectId,
});

/**
 * Creates a navigation group bound to a specific project.
 */
export const navGroup = (
  projectId: string,
  group: NavigationGroupInput,
): NavigationGroup => ({
  ...group,
  projectId,
});
