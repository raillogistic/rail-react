import type { AppManifest, AppRouteConfig, NavigationGroup } from "./contracts";
import { normalizePath } from "./contracts";
import { getLocalManifestExtension } from "./localManifestExtension";
import { assertValidManifestSet } from "./manifestValidation";

type ManifestModule = {
  default?: AppManifest;
  manifest?: AppManifest;
  PROJECT_MANIFEST?: AppManifest;
};

type RegistrySnapshot = {
  manifests: AppManifest[];
  routes: AppRouteConfig[];
  navigation: NavigationGroup[];
  defaultRouteByProject: Record<string, string>;
};

const projectManifestModules = import.meta.glob<ManifestModule>(
  "@/projects/*/manifest.ts",
  {
    eager: true,
  },
);

const normalizeManifestModule = (module: ManifestModule): AppManifest | null =>
  module.default ?? module.manifest ?? module.PROJECT_MANIFEST ?? null;

const loadProjectManifests = (): AppManifest[] =>
  Object.values(projectManifestModules)
    .map(normalizeManifestModule)
    .filter((manifest): manifest is AppManifest => !!manifest);

const normalizeOrder = (order: number | undefined): number =>
  Number.isFinite(order) ? Number(order) : Number.MAX_SAFE_INTEGER;

const compareProjectOrder = (a: AppManifest, b: AppManifest): number =>
  normalizeOrder(a.order) - normalizeOrder(b.order) ||
  a.projectId.localeCompare(b.projectId);

const mergeManifests = (manifests: AppManifest[]): RegistrySnapshot => {
  const sortedManifests = [...manifests].sort(compareProjectOrder);
  const projectOrderById = new Map(
    sortedManifests.map((manifest) => [
      manifest.projectId,
      normalizeOrder(manifest.order),
    ]),
  );

  const routes = sortedManifests
    .flatMap((manifest) => manifest.routes)
    .sort(
      (a, b) =>
        (projectOrderById.get(a.projectId) ?? Number.MAX_SAFE_INTEGER) -
          (projectOrderById.get(b.projectId) ?? Number.MAX_SAFE_INTEGER) ||
        a.projectId.localeCompare(b.projectId) ||
        a.id.localeCompare(b.id),
    );

  const navigation = sortedManifests
    .flatMap((manifest) => manifest.navigation)
    .sort(
      (a, b) =>
        (projectOrderById.get(a.projectId) ?? Number.MAX_SAFE_INTEGER) -
          (projectOrderById.get(b.projectId) ?? Number.MAX_SAFE_INTEGER) ||
        normalizeOrder(a.order) - normalizeOrder(b.order) ||
        a.projectId.localeCompare(b.projectId) ||
        a.id.localeCompare(b.id),
    );

  const defaultRouteByProject = Object.fromEntries(
    sortedManifests.map((manifest) => [manifest.projectId, manifest.defaultRoute]),
  );

  return {
    manifests: sortedManifests,
    routes,
    navigation,
    defaultRouteByProject,
  };
};

const loadManifests = (): AppManifest[] => {
  const projectManifests = loadProjectManifests();
  const localManifest = getLocalManifestExtension();
  const manifests = [...projectManifests, ...(localManifest ? [localManifest] : [])];
  return manifests;
};

let cachedSnapshot: RegistrySnapshot | null = null;

const getSnapshot = (): RegistrySnapshot => {
  if (cachedSnapshot) {
    return cachedSnapshot;
  }

  const manifests = loadManifests();
  assertValidManifestSet(manifests);

  const snapshot = mergeManifests(manifests);
  cachedSnapshot = snapshot;
  return snapshot;
};

export const __resetManifestRegistryForTests = (): void => {
  cachedSnapshot = null;
};

export const getAllRoutes = (): AppRouteConfig[] => getSnapshot().routes;

export const getNavigationGroups = (): NavigationGroup[] => getSnapshot().navigation;

export const getDefaultRouteByProject = (projectId: string): string | undefined =>
  getSnapshot().defaultRouteByProject[projectId];

export const getDefaultRoute = (): string => {
  const defaults = getSnapshot().defaultRouteByProject;
  return defaults.core ?? Object.values(defaults)[0] ?? "/";
};

export const findRouteByPath = (pathname: string): AppRouteConfig | undefined => {
  const normalized = normalizePath(pathname);
  return getSnapshot().routes.find(
    (route) => normalizePath(route.path) === normalized,
  );
};

export const isProtectedRoute = (pathname: string): boolean => {
  const route = findRouteByPath(pathname);
  if (!route) {
    return true;
  }
  return route.guard === "protected";
};
